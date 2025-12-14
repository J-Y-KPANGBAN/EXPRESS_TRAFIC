const db = require("../../config/db");
const logger = require("../../utils/logger");
const { v4: uuidv4 } = require('uuid');
const validator = require('validator');

/* ============================================================
   🛡️ FONCTIONS DE SÉCURITÉ RENFORCÉES
============================================================ */
const sanitizeLimit = (limit, max = 100) => {
  const parsed = parseInt(limit) || 10;
  return Math.min(Math.max(parsed, 1), max);
};

const sanitizePage = (page) => {
  const parsed = parseInt(page) || 1;
  return Math.max(parsed, 1);
};

const validateTrajetData = (data, isUpdate = false) => {
  const errors = [];
  
  // Validation ville départ
  if (!isUpdate || data.ville_depart !== undefined) {
    if (!data.ville_depart || !validator.isLength(data.ville_depart, { min: 1, max: 100 }) || !validator.isAlpha(data.ville_depart.replace(/[- ]/g, ''))) {
      errors.push("Ville de départ invalide (1-100 caractères alphabétiques)");
    }
  }
  
  // Validation ville arrivée
  if (!isUpdate || data.ville_arrivee !== undefined) {
    if (!data.ville_arrivee || !validator.isLength(data.ville_arrivee, { min: 1, max: 100 }) || !validator.isAlpha(data.ville_arrivee.replace(/[- ]/g, ''))) {
      errors.push("Ville d'arrivée invalide (1-100 caractères alphabétiques)");
    }
  }
  
  // Validation date
  if (!isUpdate || data.date_depart !== undefined) {
    if (!data.date_depart || !validator.isDate(data.date_depart)) {
      errors.push("Date de départ invalide (format YYYY-MM-DD)");
    } else {
      const trajetDate = new Date(data.date_depart);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (trajetDate < today) {
        errors.push("La date de départ ne peut pas être dans le passé");
      }
      
      // Limite à 1 an maximum
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 1);
      if (trajetDate > maxDate) {
        errors.push("La date de départ ne peut pas dépasser 1 an");
      }
    }
  }
  
  // Validation heure
  if (!isUpdate || data.heure_depart !== undefined) {
    if (!data.heure_depart || !validator.matches(data.heure_depart, /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
      errors.push("Heure de départ invalide (format HH:MM)");
    }
  }
  
  // Validation prix
  if (!isUpdate || data.prix !== undefined) {
    const prix = parseFloat(data.prix);
    if (isNaN(prix) || prix < 0 || prix > 1000) {
      errors.push("Prix invalide (0-1000€)");
    }
  }
  
  // Validation places
  if (!isUpdate || data.places_total !== undefined) {
    if (data.places_total && (!validator.isInt(data.places_total.toString(), { min: 1, max: 100 }) || data.places_total > 100)) {
      errors.push("Nombre de places invalide (1-100)");
    }
  }

  // Validation durée
  if (!isUpdate || data.duree !== undefined) {
    if (data.duree && !validator.matches(data.duree, /^([0-9]+):[0-5][0-9]:[0-5][0-9]$/)) {
      errors.push("Durée invalide (format HH:MM:SS)");
    }
  }
  
  if (errors.length > 0) {
    throw new Error(errors.join(', '));
  }
  
  return data;
};

const allowedUpdateFields = [
  'ville_depart', 'ville_arrivee', 'date_depart', 'heure_depart',
  'duree', 'prix', 'bus_id', 'places_total', 'description', 
  'conditions_annulation', 'etat_trajet'
];

// 🆕 Fonction d'audit sécurisée
const auditAction = async (userId, action, details, connection = db) => {
  try {
    await connection.query(
      `INSERT INTO logs_actions (user_id, role, action, target_type, details, ip_address, created_at) 
       VALUES (?, 'admin', ?, 'Trajets', ?, ?, NOW())`,
      [userId, action, JSON.stringify(details), 'req.ip' || 'N/A']
    );
    logger.info(`🔒 Audit - Admin ${userId}: ${action}`, details);
  } catch (error) {
    logger.error("❌ Erreur audit action:", error);
  }
};

/* ============================================================
   🚌 ADMIN — GESTION SÉCURISÉE DES TRAJETS (VERSION COMPLÈTE)
============================================================ */

/* ------------------------------------------------------------
   📌 1. LISTER TOUS LES TRAJETS (SÉCURISÉ)
------------------------------------------------------------- */
exports.getAllTrajets = async (req, res) => {
  try {
    const { page = 1, limit = 10, date_debut, date_fin, ville_depart, ville_arrivee, etat } = req.query;
    
    // 🛡️ VALIDATION RENFORCÉE DES PARAMÈTRES
    const safePage = sanitizePage(page);
    const safeLimit = sanitizeLimit(limit, 50);
    const offset = (safePage - 1) * safeLimit;

    let whereConditions = ["1=1"];
    let queryParams = [];

    // 🛡️ FILTRES SÉCURISÉS AVEC VALIDATION
    if (date_debut && validator.isDate(date_debut)) {
      whereConditions.push("t.date_depart >= ?");
      queryParams.push(date_debut);
    }

    if (date_fin && validator.isDate(date_fin)) {
      whereConditions.push("t.date_depart <= ?");
      queryParams.push(date_fin);
    }

    if (ville_depart && validator.isLength(ville_depart, { min: 1, max: 100 }) && validator.isAlpha(ville_depart.replace(/[- ]/g, ''))) {
      whereConditions.push("t.ville_depart LIKE ?");
      queryParams.push(`%${ville_depart}%`);
    }

    if (ville_arrivee && validator.isLength(ville_arrivee, { min: 1, max: 100 }) && validator.isAlpha(ville_arrivee.replace(/[- ]/g, ''))) {
      whereConditions.push("t.ville_arrivee LIKE ?");
      queryParams.push(`%${ville_arrivee}%`);
    }

    if (etat && ['actif', 'annule', 'termine', 'complet'].includes(etat)) {
      whereConditions.push("t.etat_trajet = ?");
      queryParams.push(etat);
    }

    const whereClause = whereConditions.join(" AND ");

    // 🛡️ REQUÊTE SÉCURISÉE AVEC JOINTS
    const [trajets] = await db.query(`
      SELECT 
        t.*,
        b.numero_immatriculation, 
        b.type_bus, 
        b.capacite,
        b.statut as bus_statut,
        c.nom AS chauffeur_nom, 
        c.prenom AS chauffeur_prenom,
        c.statut as chauffeur_statut,
        s.nom AS societe_nom,
        s.id AS societe_id,
        (SELECT COUNT(*) FROM Reservations r WHERE r.trajet_id = t.id AND r.etat_reservation IN ('confirmee', 'en_attente')) as reservations_actives,
        (t.places_total - (SELECT COUNT(*) FROM Reservations r WHERE r.trajet_id = t.id AND r.etat_reservation IN ('confirmee', 'en_attente'))) as places_restantes
      FROM Trajets t
      LEFT JOIN Bus b ON t.bus_id = b.id
      LEFT JOIN Chauffeurs c ON b.chauffeur_id = c.id
      LEFT JOIN Societes s ON b.societe_id = s.id
      WHERE ${whereClause}
      ORDER BY t.date_depart DESC, t.heure_depart DESC
      LIMIT ? OFFSET ?
    `, [...queryParams, safeLimit, offset]);

    // 🛡️ COMPTAGE TOTAL SÉCURISÉ
    const [totalResult] = await db.query(
      `SELECT COUNT(*) as total FROM Trajets t WHERE ${whereClause}`,
      queryParams
    );

    const total = totalResult[0]?.total || 0;

    // 🔒 AUDIT DE LA CONSULTATION
    await auditAction(req.user.id, 'VIEW_ALL_TRAJETS', {
      page: safePage,
      limit: safeLimit,
      filters: { date_debut, date_fin, ville_depart, ville_arrivee, etat },
      results_count: trajets.length,
      total_count: total
    });

    logger.info(`🔍 Admin ${req.user.id} - Consultation de ${trajets.length} trajets`);

    return res.json({ 
      success: true, 
      data: {
        trajets: trajets,
        pagination: {
          page: safePage,
          limit: safeLimit,
          total: total,
          totalPages: Math.ceil(total / safeLimit)
        },
        filters: {
          date_debut: date_debut || null,
          date_fin: date_fin || null,
          ville_depart: ville_depart || null,
          ville_arrivee: ville_arrivee || null,
          etat: etat || null
        }
      }
    });

  } catch (error) {
    logger.error("❌ Erreur getAllTrajets:", { 
      userId: req.user?.id,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    
    return res.status(500).json({
      success: false,
      message: "Erreur lors du chargement des trajets",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/* ------------------------------------------------------------
   📌 2. OBTENIR UN TRAJET PAR ID (SÉCURISÉ)
------------------------------------------------------------- */
exports.getTrajetByIdAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 🛡️ VALIDATION ID RENFORCÉE
    if (!id || !validator.isLength(id, { min: 3, max: 10 }) || !id.startsWith('TR') || !validator.isAlphanumeric(id)) {
      return res.status(400).json({ 
        success: false, 
        message: "ID de trajet invalide" 
      });
    }

    const [rows] = await db.query(`
      SELECT 
        t.*,
        b.numero_immatriculation, 
        b.type_bus, 
        b.capacite,
        b.statut as bus_statut,
        b.equipements,
        c.nom AS chauffeur_nom, 
        c.prenom AS chauffeur_prenom,
        c.statut as chauffeur_statut,
        c.numero_permis,
        s.nom AS societe_nom,
        s.contact AS societe_contact,
        (SELECT COUNT(*) FROM Reservations r WHERE r.trajet_id = t.id AND r.etat_reservation IN ('confirmee', 'en_attente')) as reservations_actives,
        (SELECT COUNT(*) FROM Arrets a WHERE a.trajet_id = t.id) as nombre_arrets,
        (SELECT JSON_ARRAYAGG(JSON_OBJECT('nom_arret', nom_arret, 'ordre', ordre, 'prix_arret', prix_arret)) 
         FROM Arrets WHERE trajet_id = t.id ORDER BY ordre) as arrets
      FROM Trajets t
      LEFT JOIN Bus b ON t.bus_id = b.id
      LEFT JOIN Chauffeurs c ON b.chauffeur_id = c.id
      LEFT JOIN Societes s ON b.societe_id = s.id
      WHERE t.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Trajet non trouvé" 
      });
    }

    // 🔒 AUDIT DE LA CONSULTATION
    await auditAction(req.user.id, 'VIEW_TRAJET_DETAILS', {
      trajet_id: id,
      trajet_nom: `${rows[0].ville_depart} → ${rows[0].ville_arrivee}`
    });

    logger.info(`🔍 Admin ${req.user.id} - Consultation détaillée trajet ID: ${id}`);
    
    return res.json({ 
      success: true, 
      data: rows[0] 
    });

  } catch (error) {
    logger.error("❌ Erreur getTrajetByIdAdmin:", { 
      userId: req.user?.id,
      trajetId: req.params.id,
      error: error.message 
    });
    
    return res.status(500).json({
      success: false,
      message: "Erreur lors du chargement du trajet",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/* ------------------------------------------------------------
   📌 3. CRÉER UN TRAJET (SÉCURISÉ AVEC TRANSACTION)
------------------------------------------------------------- */
exports.createTrajet = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const {
      ville_depart,
      ville_arrivee,
      date_depart,
      heure_depart,
      duree = "02:00:00",
      prix,
      bus_id,
      places_total = 50,
      description = "",
      conditions_annulation = ""
    } = req.body;

    // 🛡️ VALIDATION COMPLÈTE ET RENFORCÉE
    const trajetData = validateTrajetData({
      ville_depart: ville_depart?.trim(),
      ville_arrivee: ville_arrivee?.trim(),
      date_depart,
      heure_depart,
      duree,
      prix,
      bus_id,
      places_total,
      description: description?.substring(0, 1000),
      conditions_annulation: conditions_annulation?.substring(0, 1000)
    }, false);

    // 🛡️ VÉRIFICATION APPROFONDIE DU BUS
    if (bus_id) {
      const [busExists] = await connection.query(
        `SELECT id, capacite, statut, societe_id, chauffeur_id 
         FROM Bus 
         WHERE id = ? AND statut = 'actif'`,
        [bus_id]
      );
      
      if (busExists.length === 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: "Bus non trouvé ou non actif"
        });
      }

      const bus = busExists[0];

      // Vérification cohérence capacité
      if (places_total > bus.capacite) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Le nombre de places (${places_total}) dépasse la capacité du bus (${bus.capacite})`
        });
      }

      // Vérification disponibilité chauffeur
      if (bus.chauffeur_id) {
        const [chauffeur] = await connection.query(
          "SELECT statut FROM Chauffeurs WHERE id = ?",
          [bus.chauffeur_id]
        );
        
        if (chauffeur.length === 0 || chauffeur[0].statut !== 'actif') {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: "Chauffeur non disponible pour ce bus"
          });
        }
      }
    }

    // 🛡️ VÉRIFICATION CONFLIT DE DATE/HEURE POUR LE BUS
    if (bus_id) {
      const [conflictingTrajets] = await connection.query(
        `SELECT id FROM Trajets 
         WHERE bus_id = ? AND date_depart = ? AND etat_trajet = 'actif'
         AND ((heure_depart BETWEEN ? AND DATE_ADD(?, INTERVAL ? HOUR)) 
              OR (DATE_ADD(heure_depart, INTERVAL ? HOUR) BETWEEN ? AND ?))`,
        [
          bus_id, 
          date_depart, 
          heure_depart, 
          heure_depart, 
          duree.split(':')[0],
          duree.split(':')[0],
          heure_depart,
          heure_depart
        ]
      );

      if (conflictingTrajets.length > 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: "Conflit d'horaire : le bus est déjà utilisé sur cette plage horaire"
        });
      }
    }

    // 🛡️ GÉNÉRATION D'ID SÉCURISÉE
    const trajetId = "TR" + uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase();

    // 🛡️ INSERTION SÉCURISÉE
    await connection.query(
      `INSERT INTO Trajets 
        (id, ville_depart, ville_arrivee, date_depart, heure_depart, duree, prix,
         bus_id, places_total, places_disponibles, description, conditions_annulation, etat_trajet)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'actif')`,
      [
        trajetId,
        trajetData.ville_depart,
        trajetData.ville_arrivee,
        trajetData.date_depart,
        trajetData.heure_depart + ':00',
        trajetData.duree,
        parseFloat(trajetData.prix),
        trajetData.bus_id || null,
        trajetData.places_total,
        trajetData.places_total, // places_disponibles initial = places_total
        trajetData.description,
        trajetData.conditions_annulation
      ]
    );

    await connection.commit();

    // 🔒 AUDIT DE LA CRÉATION
    await auditAction(req.user.id, 'CREATE_TRAJET', {
      trajet_id: trajetId,
      ville_depart: trajetData.ville_depart,
      ville_arrivee: trajetData.ville_arrivee,
      date_depart: trajetData.date_depart,
      prix: trajetData.prix,
      bus_id: trajetData.bus_id,
      places_total: trajetData.places_total
    });

    logger.success(`✅ Admin ${req.user.id} - Trajet créé: ${trajetId} (${trajetData.ville_depart} → ${trajetData.ville_arrivee})`);
    
    return res.json({ 
      success: true, 
      message: "Trajet créé avec succès", 
      data: { 
        id: trajetId,
        trajet: {
          id: trajetId,
          ville_depart: trajetData.ville_depart,
          ville_arrivee: trajetData.ville_arrivee,
          date_depart: trajetData.date_depart,
          heure_depart: trajetData.heure_depart,
          prix: trajetData.prix,
          places_total: trajetData.places_total
        }
      } 
    });

  } catch (error) {
    await connection.rollback();
    
    // Gestion spécifique des erreurs de validation
    if (error.message.includes('invalide') || error.message.includes('ne peut pas')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    // Gestion des contraintes d'unicité
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: "Un trajet avec cet ID existe déjà"
      });
    }

    logger.error("❌ Erreur createTrajet:", { 
      userId: req.user?.id,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création du trajet",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    connection.release();
  }
};

/* ------------------------------------------------------------
   📌 4. METTRE À JOUR UN TRAJET (SÉCURISÉ)
------------------------------------------------------------- */
exports.updateTrajet = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const updates = req.body;

    // 🛡️ VALIDATION ID
    if (!id || !validator.isLength(id, { min: 3, max: 10 }) || !id.startsWith('TR') || !validator.isAlphanumeric(id)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "ID de trajet invalide"
      });
    }

    // 🛡️ VÉRIFICATION QUE LE TRAJET EXISTE
    const [trajetExists] = await connection.query(
      "SELECT id, etat_trajet, date_depart FROM Trajets WHERE id = ?",
      [id]
    );

    if (trajetExists.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Trajet non trouvé"
      });
    }

    const trajet = trajetExists[0];

    // 🛡️ EMPÊCHER LA MODIFICATION DE TRAJETS PASSÉS (sauf pour annulation)
    const trajetDate = new Date(trajet.date_depart);
    const today = new Date();
    if (trajetDate < today && !['annule', 'termine'].includes(updates.etat_trajet)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Impossible de modifier un trajet déjà passé (seule l'annulation est autorisée)"
      });
    }

    // 🛡️ FILTRAGE DES CHAMPS AUTORISÉS
    const filteredUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedUpdateFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    if (Object.keys(filteredUpdates).length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Aucun champ valide à mettre à jour"
      });
    }

    // 🛡️ VALIDATION DES DONNÉES DE MISE À JOUR
    validateTrajetData(filteredUpdates, true);

    // 🛡️ VÉRIFICATION BUS SI MIS À JOUR
    if (filteredUpdates.bus_id) {
      const [busExists] = await connection.query(
        "SELECT id, capacite, statut FROM Bus WHERE id = ?",
        [filteredUpdates.bus_id]
      );
      
      if (busExists.length === 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: "Bus non trouvé"
        });
      }

      if (busExists[0].statut !== 'actif') {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: "Bus non actif"
        });
      }
    }

    // 🛡️ CONSTRUCTION SÉCURISÉE DE LA REQUÊTE
    const fields = [];
    const values = [];

    Object.keys(filteredUpdates).forEach((key) => {
      fields.push(`${key} = ?`);
      
      // Formatage spécial pour l'heure
      if (key === 'heure_depart' && filteredUpdates[key] && !filteredUpdates[key].includes(':')) {
        values.push(filteredUpdates[key] + ':00');
      } else {
        values.push(filteredUpdates[key]);
      }
    });

    fields.push('updated_at = NOW()');
    values.push(id);

    const [result] = await connection.query(
      `UPDATE Trajets SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Trajet non trouvé ou aucune modification nécessaire"
      });
    }

    await connection.commit();

    // 🔒 AUDIT DE LA MODIFICATION
    await auditAction(req.user.id, 'UPDATE_TRAJET', {
      trajet_id: id,
      modifications: filteredUpdates
    }, connection);

    logger.success(`✏️ Admin ${req.user.id} - Trajet ${id} mis à jour`);
    
    return res.json({ 
      success: true, 
      message: "Trajet mis à jour avec succès",
      data: {
        trajet_id: id,
        modifications: Object.keys(filteredUpdates)
      }
    });

  } catch (error) {
    await connection.rollback();
    
    if (error.message.includes('invalide') || error.message.includes('ne peut pas')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    logger.error("❌ Erreur updateTrajet:", { 
      userId: req.user?.id,
      trajetId: req.params.id,
      error: error.message 
    });
    
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du trajet",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    connection.release();
  }
};

/* ------------------------------------------------------------
   📌 5. SUPPRIMER UN TRAJET (SÉCURISÉ)
------------------------------------------------------------- */
exports.deleteTrajet = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const { id } = req.params;

    // 🛡️ VALIDATION ID
    if (!id || !validator.isLength(id, { min: 3, max: 10 }) || !id.startsWith('TR') || !validator.isAlphanumeric(id)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "ID de trajet invalide"
      });
    }

    // 🛡️ VÉRIFICATION EXISTENCE TRAJET
    const [trajetExists] = await connection.query(
      "SELECT id, date_depart, etat_trajet FROM Trajets WHERE id = ?",
      [id]
    );

    if (trajetExists.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Trajet non trouvé"
      });
    }

    // 🛡️ VÉRIFICATION RÉSERVATIONS ACTIVES
    const [reservations] = await connection.query(
      `SELECT COUNT(*) as count 
       FROM Reservations 
       WHERE trajet_id = ? AND etat_reservation IN ('confirmee', 'en_attente')`,
      [id]
    );

    if (reservations[0].count > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Impossible de supprimer un trajet avec des réservations actives"
      });
    }

    // 🛡️ MARQUAGE COMME SUPPRIMÉ PLUTÔT QUE SUPPRESSION RÉELLE
    const [result] = await connection.query(
      "UPDATE Trajets SET etat_trajet = 'supprime', updated_at = NOW() WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Trajet non trouvé"
      });
    }

    await connection.commit();

    // 🔒 AUDIT DE LA SUPPRESSION
    await auditAction(req.user.id, 'DELETE_TRAJET', {
      trajet_id: id
    }, connection);

    logger.warn(`🗑️ Admin ${req.user.id} - Trajet ${id} marqué comme supprimé`);
    
    return res.json({ 
      success: true, 
      message: "Trajet supprimé avec succès" 
    });

  } catch (error) {
    await connection.rollback();
    logger.error("❌ Erreur deleteTrajet:", { 
      userId: req.user?.id,
      trajetId: req.params.id,
      error: error.message 
    });
    
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression du trajet",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    connection.release();
  }
};

/* ------------------------------------------------------------
   📌 6. STATISTIQUES DES TRAJETS (SÉCURISÉ)
------------------------------------------------------------- */
exports.getTrajetsStats = async (req, res) => {
  try {
    const { periode = '30' } = req.query;

    // 🛡️ VALIDATION PÉRIODE
    if (!['7', '30', '90', '365'].includes(periode)) {
      return res.status(400).json({
        success: false,
        message: "Période invalide. Valeurs acceptées: 7, 30, 90, 365"
      });
    }

    // Statistiques générales
    const [statsGeneral] = await db.query(`
      SELECT 
        COUNT(*) as total_trajets,
        SUM(CASE WHEN etat_trajet = 'actif' THEN 1 ELSE 0 END) as trajets_actifs,
        SUM(CASE WHEN etat_trajet = 'annule' THEN 1 ELSE 0 END) as trajets_annules,
        SUM(CASE WHEN etat_trajet = 'termine' THEN 1 ELSE 0 END) as trajets_termines,
        SUM(CASE WHEN etat_trajet = 'complet' THEN 1 ELSE 0 END) as trajets_complets,
        AVG(prix) as prix_moyen,
        SUM(places_total) as capacite_totale,
        SUM(places_disponibles) as places_restantes
      FROM Trajets
      WHERE date_depart >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    `, [periode]);

    // Trajets par mois
    const [parMois] = await db.query(`
      SELECT 
        DATE_FORMAT(date_depart, '%Y-%m') as mois,
        COUNT(*) as nombre_trajets,
        AVG(prix) as prix_moyen
      FROM Trajets
      WHERE date_depart >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE_FORMAT(date_depart, '%Y-%m')
      ORDER BY mois DESC
      LIMIT 12
    `, [periode]);

    // Top destinations
    const [topDestinations] = await db.query(`
      SELECT 
        ville_depart,
        ville_arrivee,
        COUNT(*) as nombre_trajets,
        AVG(prix) as prix_moyen
      FROM Trajets
      WHERE date_depart >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY ville_depart, ville_arrivee
      ORDER BY nombre_trajets DESC
      LIMIT 10
    `, [periode]);

    // 🔒 AUDIT DE LA CONSULTATION DES STATS
    await auditAction(req.user.id, 'VIEW_TRAJETS_STATS', {
      periode: periode
    });

    res.json({
      success: true,
      data: {
        periode: `${periode} jours`,
        general: statsGeneral[0],
        par_mois: parMois,
        top_destinations: topDestinations
      }
    });

  } catch (error) {
    logger.error("❌ Erreur getTrajetsStats:", { 
      userId: req.user?.id,
      error: error.message 
    });
    
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques"
    });
  }
};