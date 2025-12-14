// backend/controllers/public/publicReservationsController.js (CORRIGÉ)
const db = require("../../config/db");
const { generateReservationCode } = require("../../services/generateCode");
const { isValidEmail, isValidPhone } = require("../../utils/validators");
const mailer = require("../../config/mailer");
const logger = require("../../utils/logger");

/* ======================================================
   🔎 RECHERCHE DE TRAJETS (PUBLIC)
====================================================== */
exports.searchPublicTrajets = async (req, res) => {
  try {
    const { ville_depart, ville_arrivee, date_depart } = req.query;

    let query = `
      SELECT t.*, 
             b.numero_immatriculation, b.type_bus, 
             c.nom AS chauffeur_nom, c.prenom AS chauffeur_prenom
      FROM Trajets t
      LEFT JOIN Bus b ON t.bus_id = b.id
      LEFT JOIN Chauffeurs c ON b.chauffeur_id = c.id
      WHERE t.date_depart >= CURDATE()
    `;

    const params = [];

    if (ville_depart) {
      query += " AND t.ville_depart LIKE ?";
      params.push(`%${ville_depart}%`);
    }

    if (ville_arrivee) {
      query += " AND t.ville_arrivee LIKE ?";
      params.push(`%${ville_arrivee}%`);
    }

    if (date_depart) {
      query += " AND t.date_depart = ?";
      params.push(date_depart);
    }

    query += " ORDER BY t.date_depart, t.heure_depart";

    const [trajets] = await db.query(query, params);

    res.json({
      success: true,
      count: trajets.length,
      data: trajets,
    });
  } catch (error) {
    logger.error("Erreur searchPublicTrajets : " + error.message);
    res.status(500).json({ success: false, message: "Erreur lors de la recherche" });
  }
};

/* ======================================================
   🧾 RÉSERVATION SANS COMPTE (INVITÉ) — DÉSACTIVÉ
====================================================== */
exports.reserverSansCompte = (req, res) => {
  logger.warning("Tentative de réservation sans compte bloquée");
  return res.status(403).json({
    success: false,
    message: "La réservation sans compte n'est plus autorisée. Veuillez créer un compte et vous connecter pour réserver.",
  });
};

/* ======================================================
   🔐 UTILISATEUR CONNECTÉ — CRÉER RÉSERVATION
====================================================== */
exports.createReservationForUser = async (req, res) => {
  try {
    const userId = req.user.id; // ✅ STANDARDISÉ: req.user.id
    const { trajet_id, siege_numero, moyen_paiement } = req.body;

    console.log("🔐 Création réservation pour utilisateur:", {
      userId,
      trajet_id,
      siege_numero,
    });

    if (!trajet_id || !siege_numero) {
      return res.status(400).json({
        success: false,
        message: "Trajet et siège sont obligatoires",
      });
    }

    // Vérifier que le trajet existe
    const [trajets] = await db.query("SELECT * FROM Trajets WHERE id = ?", [
      trajet_id,
    ]);
    if (trajets.length === 0) {
      return res.status(404).json({ success: false, message: "Trajet introuvable" });
    }

    const trajet = trajets[0];

    // Vérifier si le siège est déjà réservé
    /*const [existing] = await db.query(
      'SELECT * FROM Reservations WHERE trajet_id = ? AND siege_numero = ? AND etat_reservation IN ("confirmee", "en_attente")',
      [trajet_id, siege_numero]
    );*/
    // Vérifier si le siège est déjà réservé (en excluant les expirées)
const [existing] = await db.query(
  `SELECT * FROM Reservations 
   WHERE trajet_id = ? AND siege_numero = ? 
   AND etat_reservation IN ("confirmee", "en_attente")
   AND (expires_at IS NULL OR expires_at > NOW())`,
  [trajet_id, siege_numero]
);

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: "Ce siège est déjà réservé" });
    }

    const code_reservation = generateReservationCode();

    // Créer la réservation pour l'utilisateur connecté
    /*const [result] = await db.query(
      `INSERT INTO Reservations 
       (utilisateur_id, trajet_id, siege_numero, etat_reservation,
        moyen_paiement, montant_total, code_reservation)
       VALUES (?, ?, ?, "en_attente", ?, ?, ?)`,
      [userId, trajet_id, siege_numero, moyen_paiement, trajet.prix, code_reservation]
    );*/

    // Ajouter 10 minutes d'expiration pour les réservations non confirmées
const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

const [result] = await db.query(
  `INSERT INTO Reservations 
   (utilisateur_id, trajet_id, siege_numero, etat_reservation,
    moyen_paiement, montant_total, code_reservation, expires_at)
   VALUES (?, ?, ?, "en_attente", ?, ?, ?, ?)`,
  [userId, trajet_id, siege_numero, moyen_paiement, trajet.prix, code_reservation, expiresAt]
);
    // Récupérer les infos de l'utilisateur pour l'email
    const [users] = await db.query(
      "SELECT nom, prenom, email FROM signup WHERE id = ?",
      [userId]
    );
    const user = users[0];

    // Envoyer email seulement si mailer est configuré
    if (mailer && typeof mailer.sendEmail === "function" && user && user.email) {
      mailer.sendEmail({
        to: user.email,
        subject: "Votre réservation - " + code_reservation,
        html: `
          <h2>Merci pour votre réservation</h2>
          <p><strong>Nom :</strong> ${user.nom} ${user.prenom}</p>
          <p><strong>Trajet :</strong> ${trajet.ville_depart} → ${trajet.ville_arrivee}</p>
          <p><strong>Date :</strong> ${trajet.date_depart}</p>
          <p><strong>Heure :</strong> ${trajet.heure_depart}</p>
          <p><strong>Siège :</strong> ${siege_numero}</p>
          <p><strong>Montant :</strong> ${trajet.prix} €</p>
          <p><strong>Code réservation :</strong> ${code_reservation}</p>
          <p><strong>Statut :</strong> En attente de paiement</p>
        `,
      });
    }

    logger.success("Réservation utilisateur créée: " + code_reservation);

    res.json({
      success: true,
      message: "Réservation créée avec succès",
      reservation_id: result.insertId,
      code: code_reservation,
      data: {
        id: result.insertId,
        code_reservation,
        trajet: {
          depart: trajet.ville_depart,
          arrivee: trajet.ville_arrivee,
          date: trajet.date_depart,
          heure: trajet.heure_depart,
          prix: trajet.prix,
        },
        siege: siege_numero,
        statut: "en_attente",
      },
    });
  } catch (error) {
    logger.error("Erreur createReservationForUser : " + error.message);
    res.status(500).json({ success: false, message: "Erreur lors de la réservation" });
  }
};

/* ======================================================
   🎫 CONSULTER UNE RÉSERVATION PAR CODE (PUBLIC)
====================================================== */
exports.getPublicReservationByCode = async (req, res) => {
  try {
    const { code } = req.params;

    const [rows] = await db.query(
      `SELECT r.*, t.ville_depart, t.ville_arrivee, t.date_depart, t.heure_depart
       FROM Reservations r
       JOIN Trajets t ON r.trajet_id = t.id
       WHERE r.code_reservation = ?`,
      [code]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Aucune réservation trouvée avec ce code",
      });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    logger.error("Erreur getPublicReservationByCode: " + error.message);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

/* ======================================================
   🔐 UTILISATEUR CONNECTÉ — RÉSERVATIONS
====================================================== */
exports.getUserReservations = async (req, res) => {
  try {
    const userId = req.user.id; // ✅ STANDARDISÉ: req.user.id

    const [rows] = await db.query(
      `SELECT r.*, t.ville_depart, t.ville_arrivee, t.date_depart, t.heure_depart
       FROM Reservations r
       JOIN Trajets t ON r.trajet_id = t.id
       WHERE r.utilisateur_id = ? AND r.etat_reservation != 'supprimee'
       ORDER BY r.date_reservation DESC`,
      [userId]
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    logger.error("Erreur getUserReservations:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

/* ======================================================
   🔐 DÉTAIL RÉSERVATION UTILISATEUR
====================================================== */
exports.getReservationById = async (req, res) => {
  try {
    const reservationId = req.params.reservationId;
    const userId = req.user.id; // ✅ STANDARDISÉ: req.user.id

    const [rows] = await db.query(
      `SELECT r.*, t.ville_depart, t.ville_arrivee, t.date_depart, t.heure_depart
       FROM Reservations r
       JOIN Trajets t ON r.trajet_id = t.id
       WHERE r.id = ? AND r.utilisateur_id = ?`,
      [reservationId, userId]
    );

    if (rows.length === 0)
      return res.status(404).json({ success: false, message: "Réservation introuvable" });

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    logger.error("Erreur getReservationById:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

/* ======================================================
   🔐 ANNULER UNE RÉSERVATION
====================================================== */
exports.cancelReservation = async (req, res) => {
  try {
    const reservationId = req.params.reservationId;
    const userId = req.user.id; // ✅ STANDARDISÉ: req.user.id

    const [result] = await db.query(
      `UPDATE Reservations 
       SET etat_reservation = "annulee"
       WHERE id = ? AND utilisateur_id = ?`,
      [reservationId, userId]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: "Réservation non trouvée" });

    res.json({ success: true, message: "Réservation annulée" });
  } catch (error) {
    logger.error("Erreur cancelReservation:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

/* ======================================================
   🔐 RÉSERVATIONS EN COURS
====================================================== */
exports.getReservationsEncours = async (req, res) => {
  try {
    const userId = req.user.id; // ✅ STANDARDISÉ: req.user.id

    const [rows] = await db.query(
      `SELECT r.*, t.ville_depart, t.ville_arrivee, t.date_depart, t.heure_depart
       FROM Reservations r
       JOIN Trajets t ON r.trajet_id = t.id
       WHERE r.utilisateur_id = ? 
         AND r.etat_reservation = 'confirmee'
         AND t.date_depart >= CURDATE()
       ORDER BY t.date_depart, t.heure_depart`,
      [userId]
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    logger.error("Erreur getReservationsEncours:", error);
    res.status(500).json({ success: false, message: "Erreur lors du chargement des réservations en cours" });
  }
};

/* ======================================================
   🔐 HISTORIQUE DES RÉSERVATIONS
====================================================== */
exports.getHistorique = async (req, res) => {
  try {
    const userId = req.user.id; // ✅ STANDARDISÉ: req.user.id

    const [rows] = await db.query(
      `SELECT r.*, t.ville_depart, t.ville_arrivee, t.date_depart, t.heure_depart
       FROM Reservations r
       JOIN Trajets t ON r.trajet_id = t.id
       WHERE r.utilisateur_id = ? 
         AND (r.etat_reservation = 'termine' OR t.date_depart < CURDATE())
       ORDER BY t.date_depart DESC, t.heure_depart DESC`,
      [userId]
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    logger.error("Erreur getHistorique:", error);
    res.status(500).json({ success: false, message: "Erreur lors du chargement de l'historique" });
  }
};

/* ======================================================
   🔐 ARCHIVES DES RÉSERVATIONS
====================================================== */
exports.getArchives = async (req, res) => {
  try {
    const userId = req.user.id; // ✅ STANDARDISÉ: req.user.id

    const [rows] = await db.query(
      `SELECT r.*, t.ville_depart, t.ville_arrivee, t.date_depart, t.heure_depart
       FROM Reservations r
       JOIN Trajets t ON r.trajet_id = t.id
       WHERE r.utilisateur_id = ? 
         AND r.etat_reservation = 'annulee'
       ORDER BY r.date_reservation DESC`,
      [userId]
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    logger.error("Erreur getArchives:", error);
    res.status(500).json({ success: false, message: "Erreur lors du chargement des archives" });
  }
};

/* ======================================================
   🔐 METTRE À JOUR L'URL DU TICKET
====================================================== */
exports.updateTicketUrl = async (req, res) => {
  try {
    const reservationId = req.params.reservationId;
    const userId = req.user.id; // ✅ STANDARDISÉ: req.user.id
    const { ticket_url } = req.body;

    if (!ticket_url) {
      return res.status(400).json({ success: false, message: "URL du ticket manquante" });
    }

    const [result] = await db.query(
      `UPDATE Reservations 
       SET ticket_url = ?
       WHERE id = ? AND utilisateur_id = ?`,
      [ticket_url, reservationId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Réservation non trouvée" });
    }

    res.json({ success: true, message: "Ticket mis à jour avec succès" });
  } catch (error) {
    logger.error("Erreur updateTicketUrl:", error);
    res.status(500).json({ success: false, message: "Erreur lors de la mise à jour du ticket" });
  }
};