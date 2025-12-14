const db = require("../../config/db");
const logger = require("../../utils/logger");
const { v4: uuidv4 } = require('uuid');
const validator = require('validator');

/* ============================================================
   🛡️ FONCTIONS DE SÉCURITÉ RENFORCÉES
============================================================ */

/**
 * Valide les données de réservation de manière sécurisée
 */
const validateReservationData = (data, isUpdate = false) => {
  const errors = [];

  // Validation email
  if (!isUpdate || data.client_email !== undefined) {
    if (data.client_email && !validator.isEmail(data.client_email)) {
      errors.push("Format d'email invalide");
    }
  }

  // Validation trajet_id
  if (!isUpdate || data.trajet_id !== undefined) {
    if (data.trajet_id && (!validator.isLength(data.trajet_id, { min: 3, max: 10 }) || !data.trajet_id.startsWith('TR'))) {
      errors.push("ID de trajet invalide");
    }
  }

  // Validation siège
  if (!isUpdate || data.siege_numero !== undefined) {
    if (data.siege_numero && (!validator.isInt(data.siege_numero.toString(), { min: 1, max: 100 }) || data.siege_numero > 100)) {
      errors.push("Numéro de siège invalide (1-100)");
    }
  }

  // Validation montant
  if (!isUpdate || data.prix_calcule !== undefined) {
    if (data.prix_calcule && (!validator.isFloat(data.prix_calcule.toString(), { min: 0, max: 1000 }) || data.prix_calcule > 1000)) {
      errors.push("Montant invalide (0-1000€)");
    }
  }

  // Validation noms
  if (!isUpdate || data.client_nom !== undefined) {
    if (data.client_nom && (!validator.isLength(data.client_nom, { min: 2, max: 100 }) || !validator.isAlpha(data.client_nom.replace(/[- ']/g, '')))) {
      errors.push("Nom invalide (2-100 caractères alphabétiques)");
    }
  }

  if (!isUpdate || data.client_prenom !== undefined) {
    if (data.client_prenom && (!validator.isLength(data.client_prenom, { min: 2, max: 100 }) || !validator.isAlpha(data.client_prenom.replace(/[- ']/g, '')))) {
      errors.push("Prénom invalide (2-100 caractères alphabétiques)");
    }
  }

  return errors;
};

/**
 * Audit sécurisé des actions administrateur
 */
const auditAction = async (userId, action, details, connection = db) => {
  try {
    await connection.query(
      `INSERT INTO logs_actions (user_id, role, action, target_type, details, ip_address, created_at) 
       VALUES (?, 'admin', ?, 'Reservations', ?, ?, NOW())`,
      [userId, action, JSON.stringify(details), 'req.ip' || 'N/A']
    );
    logger.info(`🔒 Audit Reservation - Admin ${userId}: ${action}`, details);
  } catch (error) {
    logger.error("❌ Erreur audit action reservation:", error);
  }
};

/**
 * Génère un code de réservation sécurisé
 */
const generateSecureReservationCode = () => {
  return 'RES-' + uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase();
};

/* ============================================================
   🔹 CRÉER UNE RÉSERVATION POUR UN CLIENT (ADMIN) - VERSION SÉCURISÉE
============================================================ */
exports.createReservationForClient = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const { 
      client_email, 
      client_nom, 
      client_prenom, 
      trajet_id, 
      siege_numero, 
      moyen_paiement = "especes",
      arret_depart,
      arret_arrivee,
      prix_calcule
    } = req.body;

    logger.info("👨‍💼 Création réservation admin:", {
      client_email: client_email ? `${client_email.substring(0, 3)}***` : 'N/A',
      trajet_id,
      siege_numero,
      admin_id: req.user.id
    });

    // 🔒 Validation des champs obligatoires renforcée
    if (!client_email || !trajet_id || !siege_numero) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Email, trajet et siège sont obligatoires",
        code: "MISSING_REQUIRED_FIELDS"
      });
    }

    // 🔒 Validation approfondie des données
    const validationErrors = validateReservationData(req.body);
    if (validationErrors.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Données invalides",
        errors: validationErrors,
        code: "VALIDATION_ERROR"
      });
    }

    // 🔒 Vérification existance et capacité du trajet
    const [trajetStats] = await connection.query(
      `SELECT 
        t.*, 
        b.capacite,
        b.statut as bus_statut,
        (SELECT COUNT(*) FROM Reservations r 
         WHERE r.trajet_id = t.id AND r.etat_reservation IN ('confirmee', 'en_attente')) as reservations_count
       FROM Trajets t
       JOIN Bus b ON t.bus_id = b.id
       WHERE t.id = ? AND t.etat_trajet = 'actif'`,
      [trajet_id]
    );

    if (trajetStats.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Trajet introuvable ou non actif",
        code: "TRAJET_NOT_FOUND"
      });
    }

    const trajet = trajetStats[0];

    // Vérification statut du bus
    if (trajet.bus_statut !== 'actif') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Bus non actif pour ce trajet",
        code: "BUS_INACTIVE"
      });
    }

    // Vérification capacité
    if (trajet.reservations_count >= trajet.capacite) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Trajet complet - plus de places disponibles",
        code: "TRAJET_FULL"
      });
    }

    // 🔒 Validation du siège
    const siegeNum = parseInt(siege_numero);
    if (siegeNum > trajet.capacite || siegeNum < 1) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Siège invalide. Capacité du bus: ${trajet.capacite} sièges`,
        code: "INVALID_SEAT"
      });
    }

    // 🔒 Vérification disponibilité du siège
    const [existingReservation] = await connection.query(
      `SELECT id, etat_reservation, code_reservation 
       FROM Reservations 
       WHERE trajet_id = ? AND siege_numero = ? 
       AND etat_reservation IN ("confirmee", "en_attente")`,
      [trajet_id, siege_numero]
    );

    if (existingReservation.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Ce siège est déjà réservé (Réservation: ${existingReservation[0].code_reservation})`,
        code: "SEAT_ALREADY_RESERVED",
        existing_reservation: existingReservation[0].code_reservation
      });
    }

    // 🔒 Génération de code sécurisé
    const code_reservation = generateSecureReservationCode();
    
    // 🔒 Calcul et validation du montant
    let montant = prix_calcule || trajet.prix;
    const MAX_AMOUNT = 1000;
    if (montant > MAX_AMOUNT) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Montant trop élevé",
        code: "AMOUNT_TOO_HIGH"
      });
    }

    // 🔒 Recherche ou création d'utilisateur invité
    let utilisateur_id = null;
    const [users] = await connection.query(
      "SELECT id FROM signup WHERE email = ? AND type_utilisateur = 'client' AND statut = 'actif'",
      [client_email]
    );

    if (users.length > 0) {
      utilisateur_id = users[0].id;
    }

    // 🔒 Création de la réservation
  // 🔒 Création de la réservation (LIGNE CORRIGÉE)
const [result] = await connection.query(
  `INSERT INTO Reservations 
   (utilisateur_id, trajet_id, siege_numero, etat_reservation, moyen_paiement, 
    montant_total, code_reservation, nom_invite, prenom_invite, email_invite,
    arret_depart, arret_arrivee, prix_calcule, created_by_admin, date_reservation)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
  [
    utilisateur_id,
    trajet_id, 
    siege_numero, // Ce paramètre était manquant
    "confirmee", 
    moyen_paiement, 
    parseFloat(montant), 
    code_reservation,
    client_nom, 
    client_prenom, 
    client_email,
    arret_depart, 
    arret_arrivee, 
    prix_calcule, 
    req.user.id
  ]
);
    // 🔒 Mise à jour des places disponibles
    await connection.query(
      `UPDATE Trajets 
       SET places_disponibles = GREATEST(0, places_disponibles - 1) 
       WHERE id = ?`,
      [trajet_id]
    );

    await connection.commit();

    // 🔒 Audit de l'action
    await auditAction(req.user.id, 'CREATE_RESERVATION_FOR_CLIENT', {
      reservation_id: result.insertId,
      code_reservation: code_reservation,
      client_email: `${client_email.substring(0, 3)}***`,
      trajet_id: trajet_id,
      siege_numero: siege_numero,
      montant: montant,
      created_for_existing_user: !!utilisateur_id
    });

    logger.success(`✅ Réservation admin créée: ${code_reservation} pour ${client_email.substring(0, 3)}***`);

    res.json({
      success: true,
      message: "Réservation créée avec succès",
      reservation_id: result.insertId,
      code: code_reservation,
      data: {
        id: result.insertId,
        code_reservation,
        trajet: {
          id: trajet.id,
          depart: trajet.ville_depart,
          arrivee: trajet.ville_arrivee,
          date: trajet.date_depart,
          heure: trajet.heure_depart,
          prix: trajet.prix,
        },
        siege: siege_numero,
        client: {
          nom: client_nom,
          prenom: client_prenom,
          email: client_email,
          existing_account: !!utilisateur_id
        },
        montant: montant,
        statut: "confirmee"
      }
    });

  } catch (error) {
    await connection.rollback();
    
    logger.error("❌ Erreur création réservation admin", { 
      userId: req.user?.id, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur lors de la création de la réservation",
      code: "INTERNAL_SERVER_ERROR",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    connection.release();
  }
};

/* ============================================================
   🔹 LISTER TOUTES LES RÉSERVATIONS (ADMIN) - VERSION SÉCURISÉE
============================================================ */
exports.getAllReservations = async (req, res) => {
  try {
    const { page = 1, limit = 20, statut, date_debut, date_fin, trajet_id, client_email } = req.query;
    const offset = (page - 1) * limit;

    // 🔒 Validation des paramètres
    const safePage = sanitizePage(page);
    const safeLimit = sanitizeLimit(limit, 100);
    const offsetSafe = (safePage - 1) * safeLimit;

    let query = `
      SELECT r.*, 
             t.ville_depart, t.ville_arrivee, t.date_depart, t.heure_depart,
             s.nom as user_nom, s.prenom as user_prenom, s.email as user_email,
             b.numero_immatriculation,
             soc.nom as societe_nom
      FROM Reservations r
      LEFT JOIN Trajets t ON r.trajet_id = t.id
      LEFT JOIN signup s ON r.utilisateur_id = s.id
      LEFT JOIN Bus b ON t.bus_id = b.id
      LEFT JOIN Societes soc ON b.societe_id = soc.id
      WHERE 1=1
    `;

    const params = [];

    // Filtres sécurisés
    if (statut && ['confirmee', 'en_attente', 'annulee', 'termine'].includes(statut)) {
      query += " AND r.etat_reservation = ?";
      params.push(statut);
    }

    if (date_debut && validator.isDate(date_debut)) {
      query += " AND DATE(r.date_reservation) >= ?";
      params.push(date_debut);
    }

    if (date_fin && validator.isDate(date_fin)) {
      query += " AND DATE(r.date_reservation) <= ?";
      params.push(date_fin);
    }

    if (trajet_id && validator.isLength(trajet_id, { min: 3, max: 10 }) && trajet_id.startsWith('TR')) {
      query += " AND r.trajet_id = ?";
      params.push(trajet_id);
    }

    if (client_email && validator.isEmail(client_email)) {
      query += " AND (r.email_invite = ? OR s.email = ?)";
      params.push(client_email, client_email);
    }

    query += " ORDER BY r.date_reservation DESC LIMIT ? OFFSET ?";
    params.push(safeLimit, offsetSafe);

    const [reservations] = await db.query(query, params);

    // 🔒 Masquer les données sensibles selon le rôle
    const sanitizedReservations = reservations.map(reservation => {
      const sanitized = { ...reservation };
      
      // Seuls les super_admin voient les emails complets
      if (req.user.role !== 'super_admin') {
        if (sanitized.user_email) {
          const [name, domain] = sanitized.user_email.split('@');
          sanitized.user_email = `${name[0]}***@${domain}`;
        }
        if (sanitized.email_invite) {
          const [name, domain] = sanitized.email_invite.split('@');
          sanitized.email_invite = `${name[0]}***@${domain}`;
        }
      }

      return sanitized;
    });

    // Compter le total pour la pagination
    const countQuery = query.replace(
      /SELECT r\.\*,.*?FROM Reservations r/, 
      'SELECT COUNT(*) as total FROM Reservations r'
    ).replace(/LIMIT \? OFFSET \?$/, '');
    
    const [countResult] = await db.query(countQuery, params.slice(0, -2));
    const total = countResult[0]?.total || 0;
    const totalPages = Math.ceil(total / safeLimit);

    // 🔒 Audit de la consultation
    await auditAction(req.user.id, 'VIEW_ALL_RESERVATIONS', {
      page: safePage,
      limit: safeLimit,
      filters: { statut, date_debut, date_fin, trajet_id, client_email: client_email ? `${client_email.substring(0, 3)}***` : null }
    });

    res.json({
      success: true,
      data: sanitizedReservations,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages
      }
    });

  } catch (error) {
    logger.error("❌ Erreur récupération réservations", { 
      userId: req.user?.id,
      error: error.message 
    });
    
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/* ============================================================
   🔹 MODIFIER UNE RÉSERVATION (ADMIN) - VERSION SÉCURISÉE
============================================================ */
exports.updateReservation = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const { reservationId } = req.params;
    const { etat_reservation, siege_numero, montant_total, notes } = req.body;

    // 🔒 Validation ID réservation
    if (!reservationId || !validator.isInt(reservationId.toString(), { min: 1, max: 999999 })) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "ID de réservation invalide"
      });
    }

    // 🔒 Validation données
    if (etat_reservation && !['confirmee', 'en_attente', 'annulee', 'termine'].includes(etat_reservation)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Statut de réservation invalide"
      });
    }

    if (montant_total && (!validator.isFloat(montant_total.toString(), { min: 0, max: 1000 }) || montant_total > 1000)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Montant invalide (0-1000€)"
      });
    }

    // Vérifier que la réservation existe
    const [reservations] = await connection.query(
      `SELECT r.*, t.ville_depart, t.ville_arrivee, t.bus_id, t.date_depart
       FROM Reservations r 
       JOIN Trajets t ON r.trajet_id = t.id 
       WHERE r.id = ?`,
      [reservationId]
    );

    if (reservations.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Réservation introuvable"
      });
    }

    const reservation = reservations[0];

    // 🔒 Empêcher la modification de réservations pour des trajets passés
    const trajetDate = new Date(reservation.date_depart);
    const today = new Date();
    if (trajetDate < today && req.user.role !== 'super_admin') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Impossible de modifier une réservation pour un trajet déjà passé"
      });
    }

    // 🔒 Vérifier la disponibilité du siège si changement
    if (siege_numero && siege_numero !== reservation.siege_numero) {
      // Validation format siège
      if (!validator.isInt(siege_numero.toString(), { min: 1, max: 100 })) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: "Numéro de siège invalide"
        });
      }

      const [existing] = await connection.query(
        `SELECT * FROM Reservations 
         WHERE trajet_id = ? AND siege_numero = ? 
         AND etat_reservation IN ("confirmee", "en_attente")
         AND id != ?`,
        [reservation.trajet_id, siege_numero, reservationId]
      );

      if (existing.length > 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: "Ce siège est déjà réservé pour ce trajet"
        });
      }
    }

    // Mettre à jour la réservation
    const updateFields = [];
    const updateValues = [];

    if (etat_reservation) {
      updateFields.push('etat_reservation = ?');
      updateValues.push(etat_reservation);
    }

    if (siege_numero) {
      updateFields.push('siege_numero = ?');
      updateValues.push(siege_numero);
    }

    if (montant_total) {
      updateFields.push('montant_total = ?');
      updateValues.push(parseFloat(montant_total));
    }

    if (notes !== undefined) {
      updateFields.push('notes_admin = ?');
      updateValues.push(notes.substring(0, 500)); // Limiter la longueur
    }

    updateFields.push('updated_at = NOW()');
    updateValues.push(reservationId);

    if (updateFields.length === 1) { // Seul updated_at
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Aucune donnée valide à mettre à jour"
      });
    }

    const [result] = await connection.query(
      `UPDATE Reservations SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Aucune modification effectuée"
      });
    }

    await connection.commit();

    // 🔒 Audit de la modification
    await auditAction(req.user.id, 'UPDATE_RESERVATION', {
      reservation_id: reservationId,
      modifications: {
        etat_reservation,
        siege_numero: siege_numero ? 'modifié' : undefined,
        montant_total: montant_total ? 'modifié' : undefined,
        notes: notes ? '***' : undefined
      }
    }, connection);

    logger.success(`📝 Réservation ${reservationId} modifiée par admin ${req.user.id}`);

    res.json({
      success: true,
      message: "Réservation mise à jour avec succès",
      data: {
        id: reservationId,
        etat_reservation: etat_reservation || reservation.etat_reservation,
        siege_numero: siege_numero || reservation.siege_numero,
        montant_total: montant_total || reservation.montant_total
      }
    });

  } catch (error) {
    await connection.rollback();
    
    logger.error("❌ Erreur modification réservation", { 
      userId: req.user?.id,
      reservationId: req.params.reservationId,
      error: error.message 
    });
    
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    connection.release();
  }
};

/* ============================================================
   🔹 ANNULER UNE RÉSERVATION (ADMIN) - VERSION SÉCURISÉE
============================================================ */
exports.cancelReservation = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const { reservationId } = req.params;
    const { raison_annulation } = req.body;

    // 🔒 Validation ID
    if (!reservationId || !validator.isInt(reservationId.toString(), { min: 1, max: 999999 })) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "ID de réservation invalide"
      });
    }

    // Vérifier que la réservation existe
    const [reservations] = await connection.query(
      `SELECT r.*, t.date_depart 
       FROM Reservations r 
       JOIN Trajets t ON r.trajet_id = t.id 
       WHERE r.id = ? AND r.etat_reservation != 'annulee'`,
      [reservationId]
    );

    if (reservations.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Réservation introuvable ou déjà annulée"
      });
    }

    const reservation = reservations[0];

    // 🔒 Empêcher l'annulation de réservations pour des trajets déjà passés
    const trajetDate = new Date(reservation.date_depart);
    const today = new Date();
    if (trajetDate < today && req.user.role !== 'super_admin') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Impossible d'annuler une réservation pour un trajet déjà passé"
      });
    }

    const [result] = await connection.query(
      `UPDATE Reservations 
       SET etat_reservation = "annulee",
           raison_annulation = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [raison_annulation?.substring(0, 500) || "Annulée par l'administrateur", reservationId]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Réservation introuvable"
      });
    }

    // 🔒 Mettre à jour les places disponibles du trajet
    await connection.query(
      `UPDATE Trajets 
       SET places_disponibles = LEAST(places_total, places_disponibles + 1) 
       WHERE id = ?`,
      [reservation.trajet_id]
    );

    await connection.commit();

    // 🔒 Audit de l'annulation
    await auditAction(req.user.id, 'CANCEL_RESERVATION', {
      reservation_id: reservationId,
      trajet_id: reservation.trajet_id,
      raison: raison_annulation ? '***' : "Annulée par l'administrateur"
    }, connection);

    logger.success(`❌ Réservation ${reservationId} annulée par admin ${req.user.id}`);

    res.json({
      success: true,
      message: "Réservation annulée avec succès",
      data: {
        reservation_id: reservationId,
        places_restituées: 1
      }
    });

  } catch (error) {
    await connection.rollback();
    
    logger.error("❌ Erreur annulation réservation", { 
      userId: req.user?.id,
      reservationId: req.params.reservationId,
      error: error.message 
    });
    
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    connection.release();
  }
};

/* ============================================================
   🔹 OBTENIR UNE RÉSERVATION PAR ID (ADMIN) - VERSION SÉCURISÉE
============================================================ */
exports.getReservationById = async (req, res) => {
  try {
    const { reservationId } = req.params;

    // 🔒 Validation ID
    if (!reservationId || !validator.isInt(reservationId.toString(), { min: 1, max: 999999 })) {
      return res.status(400).json({
        success: false,
        message: "ID de réservation invalide"
      });
    }

    const [rows] = await db.query(
      `SELECT r.*, 
              t.ville_depart, t.ville_arrivee, t.date_depart, t.heure_depart, t.bus_id, t.prix as prix_trajet,
              s.nom as user_nom, s.prenom as user_prenom, s.email as user_email, s.telephone as user_telephone,
              b.numero_immatriculation, b.type_bus,
              soc.nom as societe_nom, soc.contact as societe_contact,
              (SELECT COUNT(*) FROM Paiements p WHERE p.reservation_id = r.id) as paiements_count
       FROM Reservations r
       LEFT JOIN Trajets t ON r.trajet_id = t.id
       LEFT JOIN signup s ON r.utilisateur_id = s.id
       LEFT JOIN Bus b ON t.bus_id = b.id
       LEFT JOIN Societes soc ON b.societe_id = soc.id
       WHERE r.id = ?`,
      [reservationId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Réservation non trouvée"
      });
    }

    let reservation = rows[0];

    // 🔒 Masquer les données sensibles selon le rôle
    if (req.user.role !== 'super_admin') {
      if (reservation.user_email) {
        const [name, domain] = reservation.user_email.split('@');
        reservation.user_email = `${name[0]}***@${domain}`;
      }
      if (reservation.email_invite) {
        const [name, domain] = reservation.email_invite.split('@');
        reservation.email_invite = `${name[0]}***@${domain}`;
      }
      if (reservation.user_telephone) {
        reservation.user_telephone = reservation.user_telephone.substring(0, 4) + '***';
      }
    }

    // 🔒 Audit de la consultation
    await auditAction(req.user.id, 'VIEW_RESERVATION_DETAILS', {
      reservation_id: reservationId
    });

    res.json({
      success: true,
      data: reservation
    });

  } catch (error) {
    logger.error("❌ Erreur récupération détail réservation", { 
      userId: req.user?.id,
      reservationId: req.params.reservationId,
      error: error.message 
    });
    
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/* ============================================================
   🔹 STATISTIQUES DES RÉSERVATIONS (ADMIN) - VERSION SÉCURISÉE
============================================================ */
exports.getReservationsStats = async (req, res) => {
  try {
    const { periode = '30' } = req.query;

    // 🔒 Validation période
    if (!['7', '30', '90', '365'].includes(periode)) {
      return res.status(400).json({
        success: false,
        message: "Période invalide. Valeurs acceptées: 7, 30, 90, 365"
      });
    }

    // Statistiques générales
    const [statsGeneral] = await db.query(`
      SELECT 
        COUNT(*) as total_reservations,
        SUM(CASE WHEN etat_reservation = 'confirmee' THEN 1 ELSE 0 END) as confirmees,
        SUM(CASE WHEN etat_reservation = 'en_attente' THEN 1 ELSE 0 END) as en_attente,
        SUM(CASE WHEN etat_reservation = 'annulee' THEN 1 ELSE 0 END) as annulees,
        SUM(CASE WHEN etat_reservation = 'termine' THEN 1 ELSE 0 END) as terminees,
        SUM(montant_total) as chiffre_affaires,
        AVG(montant_total) as panier_moyen,
        COUNT(DISTINCT utilisateur_id) as clients_uniques
      FROM Reservations
      WHERE date_reservation >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    `, [periode]);

    // Réservations par statut sur la période
    const [parStatut] = await db.query(`
      SELECT etat_reservation, COUNT(*) as count, SUM(montant_total) as revenu
      FROM Reservations
      WHERE date_reservation >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY etat_reservation
    `, [periode]);

    // Top trajets
    const [topTrajets] = await db.query(`
      SELECT t.id, t.ville_depart, t.ville_arrivee, 
             COUNT(r.id) as reservations_count,
             SUM(r.montant_total) as revenu_total,
             AVG(r.montant_total) as revenu_moyen
      FROM Reservations r
      JOIN Trajets t ON r.trajet_id = t.id
      WHERE r.date_reservation >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        AND r.etat_reservation = 'confirmee'
      GROUP BY t.id, t.ville_depart, t.ville_arrivee
      ORDER BY reservations_count DESC
      LIMIT 10
    `, [periode]);

    // Évolution quotidienne
    const [evolution] = await db.query(`
      SELECT DATE(date_reservation) as date, 
             COUNT(*) as reservations,
             SUM(montant_total) as revenus,
             AVG(montant_total) as panier_moyen
      FROM Reservations
      WHERE date_reservation >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        AND etat_reservation = 'confirmee'
      GROUP BY DATE(date_reservation)
      ORDER BY date DESC
      LIMIT 30
    `, [periode]);

    // 🔒 Audit de la consultation des stats
    await auditAction(req.user.id, 'VIEW_RESERVATIONS_STATS', {
      periode: periode
    });

    res.json({
      success: true,
      data: {
        periode: `${periode} jours`,
        general: statsGeneral[0],
        par_statut: parStatut,
        top_trajets: topTrajets,
        evolution: evolution
      }
    });

  } catch (error) {
    logger.error("❌ Erreur récupération statistiques", { 
      userId: req.user?.id,
      error: error.message 
    });
    
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 🛡️ FONCTIONS UTILITAIRES POUR LA SÉCURITÉ
const sanitizeLimit = (limit, max = 100) => {
  const parsed = parseInt(limit) || 10;
  return Math.min(Math.max(parsed, 1), max);
};

const sanitizePage = (page) => {
  const parsed = parseInt(page) || 1;
  return Math.max(parsed, 1);
};