// backend/controllers/admin/adminPaiementsController.js
const db = require("../../config/db");
const logger = require("../../utils/logger");
const paymentService = require("../../services/paymentService");
const mobileMoneyService = require("../../services/mobileMoneyService");
const paypalService = require("../../services/paypalService");
const emailService = require("../../services/emailService");

/* ============================================================
   💳 LISTE / STATS PAIEMENTS
============================================================ */
exports.getAllPayments = async (req, res) => {
  try {
    const { page = 1, limit = 50, etat, methode, date_debut, date_fin } =
      req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        p.*,
        r.code_reservation,
        r.montant_total,
        u.nom AS client_nom,
        u.prenom AS client_prenom,
        u.email AS client_email,
        t.ville_depart,
        t.ville_arrivee,
        t.date_depart
      FROM Paiements p
      LEFT JOIN Reservations r ON p.reservation_id = r.id
      LEFT JOIN signup u ON r.utilisateur_id = u.id
      LEFT JOIN Trajets t ON r.trajet_id = t.id
      WHERE 1=1
    `;
    const params = [];

    if (etat) {
      query += " AND p.etat_paiement = ?";
      params.push(etat);
    }

    if (methode) {
      query += " AND p.methode = ?";
      params.push(methode);
    }

    if (date_debut && date_fin) {
      query += " AND DATE(p.date_paiement) BETWEEN ? AND ?";
      params.push(date_debut, date_fin);
    }

    query += " ORDER BY p.date_paiement DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit, 10), offset);

    const [paiements] = await db.query(query, params);
    const [total] = await db.query("SELECT COUNT(*) as total FROM Paiements");

    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN etat_paiement = 'reussi' THEN 1 ELSE 0 END) as reussis,
        SUM(CASE WHEN etat_paiement = 'echoue' THEN 1 ELSE 0 END) as echecs,
        SUM(CASE WHEN etat_paiement = 'en_attente' THEN 1 ELSE 0 END) as en_attente,
        SUM(CASE WHEN etat_paiement = 'reussi' THEN montant ELSE 0 END) as chiffre_affaires
      FROM Paiements
    `);

    res.json({
      success: true,
      data: paiements,
      stats: stats[0],
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total: total[0].total
      }
    });
  } catch (error) {
    logger.error("Erreur getAllPayments: " + error.message);
    res
      .status(500)
      .json({ success: false, message: "Erreur serveur", error: error.message });
  }
};

/* ============================================================
   💸 REMBOURSEMENT
============================================================ */
exports.processRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { motif_remboursement, montant_rembourse } = req.body;

    const [paiementRows] = await db.query(
      `
      SELECT 
        p.*,
        r.utilisateur_id,
        u.email,
        u.prenom
      FROM Paiements p
      JOIN Reservations r ON p.reservation_id = r.id
      JOIN signup u ON r.utilisateur_id = u.id
      WHERE p.id = ?
    `,
      [id]
    );

    if (paiementRows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Paiement introuvable" });
    }

    const paiement = paiementRows[0];

    let resultat = { success: true, reference: null };

    switch (paiement.methode) {
      case "mobile_money":
        // Ici on suppose un remboursement manuel côté opérateur
        resultat = {
          success: true,
          reference: `MM-REFUND-${Date.now()}`
        };
        break;

      case "paypal":
        resultat = await paypalService.refundPayment(
          paiement.reference_transaction,
          montant_rembourse
        );
        break;

      case "carte":
        // Stripe ou autre via paymentService
        resultat = await paymentService.processRefund(
          paiement.reference_transaction,
          montant_rembourse
        );
        break;

      case "especes":
        resultat = {
          success: true,
          reference: `CASH-REFUND-${Date.now()}`
        };
        break;

      default:
        resultat = {
          success: false,
          error: "Méthode de remboursement non supportée"
        };
        break;
    }

    if (!resultat.success) {
      throw new Error(resultat.error || "Échec du remboursement");
    }

    await db.query(
      `
      UPDATE Paiements 
      SET etat_paiement = 'rembourse',
          date_remboursement = NOW(),
          motif_remboursement = ?,
          details_transaction = JSON_SET(
            COALESCE(details_transaction, '{}'),
            '$.refund_reference', ?
          )
      WHERE id = ?
    `,
      [motif_remboursement, resultat.reference, id]
    );

    await emailService.sendEmail({
      to: paiement.email,
      subject: "Remboursement effectué",
      html: `<p>Bonjour ${paiement.prenom},</p>
             <p>Votre remboursement de ${montant_rembourse}€ a été effectué.</p>
             <p>Motif: ${motif_remboursement}</p>`
    });

    logger.success(`Remboursement traité pour le paiement ${id}`);

    res.json({
      success: true,
      message: "Remboursement effectué avec succès"
    });
  } catch (error) {
    logger.error("Erreur processRefund: " + error.message);
    res.status(500).json({
      success: false,
      message: "Erreur lors du remboursement",
      error: error.message
    });
  }
};

/* ============================================================
   🛠️ CORRECTION MANUELLE D'UN PAIEMENT
============================================================ */
exports.correctPaymentError = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, nouvelle_reference, motif_correction } = req.body;

    const [paiementRows] = await db.query(
      `
      SELECT 
        p.*,
        r.utilisateur_id,
        u.email,
        u.prenom
      FROM Paiements p
      JOIN Reservations r ON p.reservation_id = r.id
      JOIN signup u ON r.utilisateur_id = u.id
      WHERE p.id = ?
    `,
      [id]
    );

    if (paiementRows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Paiement introuvable" });
    }

    const paiement = paiementRows[0];

    let updateData = {};
    let message = "";

    switch (action) {
      case "mark_as_paid":
        updateData = {
          etat_paiement: "reussi",
          reference_transaction:
            nouvelle_reference || paiement.reference_transaction
        };
        message = "Paiement marqué comme réussi";

        await emailService.sendEmail({
          to: paiement.email,
          subject: "Paiement confirmé",
          html: `<p>Bonjour ${paiement.prenom},</p>
                 <p>Votre paiement a été confirmé manuellement par notre équipe.</p>
                 <p>Référence: ${updateData.reference_transaction}</p>`
        });
        break;

      case "retry_payment": {
        const result = await paymentService.retryPayment(paiement);
        updateData = {
          etat_paiement: result.success ? "reussi" : "echoue"
        };
        message = result.success
          ? "Paiement réessayé avec succès"
          : "Échec du nouveau paiement";
        break;
      }

      case "update_reference":
        updateData = {
          reference_transaction: nouvelle_reference
        };
        message = "Référence de paiement mise à jour";
        break;

      default:
        return res
          .status(400)
          .json({ success: false, message: "Action invalide" });
    }

    const prevDetails =
      paiement.details_transaction &&
      typeof paiement.details_transaction === "string"
        ? JSON.parse(paiement.details_transaction)
        : paiement.details_transaction || {};

    await db.query(
      "UPDATE Paiements SET ? WHERE id = ?",
      [
        {
          ...updateData,
          details_transaction: JSON.stringify({
            ...prevDetails,
            correction: {
              action,
              motif: motif_correction,
              date: new Date()
            }
          })
        },
        id
      ]
    );

    logger.success(`Paiement ${id} corrigé: ${action}`);

    res.json({
      success: true,
      message,
      data: updateData
    });
  } catch (error) {
    logger.error("Erreur correctPaymentError: " + error.message);
    res.status(500).json({
      success: false,
      message: "Erreur correction paiement",
      error: error.message
    });
  }
};

/* ============================================================
   💵 CRÉER PAIEMENT CASH (ADMIN)
============================================================ */
exports.createCashPayment = async (req, res) => {
  try {
    const { reservation_id, montant, reference_manuel } = req.body;

    const [reservationRows] = await db.query(
      `
      SELECT r.*, u.email, u.prenom 
      FROM Reservations r
      JOIN signup u ON r.utilisateur_id = u.id
      WHERE r.id = ?
    `,
      [reservation_id]
    );

    if (reservationRows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Réservation introuvable" });
    }

    const reservation = reservationRows[0];

    const [result] = await db.query(
      `
      INSERT INTO Paiements 
      (reservation_id, montant, methode, etat_paiement, reference_transaction)
      VALUES (?, ?, 'especes', 'reussi', ?)
    `,
      [reservation_id, montant, reference_manuel || `CASH-${Date.now()}`]
    );

    await db.query(
      "UPDATE Reservations SET etat_reservation = 'confirmee' WHERE id = ?",
      [reservation_id]
    );

    await emailService.sendEmail({
      to: reservation.email,
      subject: "Paiement en espèce confirmé",
      html: `<p>Bonjour ${reservation.prenom},</p>
             <p>Votre paiement en espèce de ${montant}€ a été enregistré.</p>
             <p>Votre réservation est maintenant confirmée.</p>`
    });

    logger.success(
      `Paiement cash créé pour réservation ${reservation_id} (paiement ${result.insertId})`
    );

    res.json({
      success: true,
      message: "Paiement en espèce enregistré avec succès",
      data: { payment_id: result.insertId }
    });
  } catch (error) {
    logger.error("Erreur createCashPayment: " + error.message);
    res.status(500).json({
      success: false,
      message: "Erreur création paiement cash",
      error: error.message
    });
  }
};

/* ============================================================
   🔍 DÉTAIL / UPDATE / DELETE (inchangé en logique)
============================================================ */
exports.getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const [paiements] = await db.query(
      `
      SELECT 
        p.*,
        r.code_reservation,
        r.montant_total,
        u.nom AS client_nom,
        u.prenom AS client_prenom,
        u.email AS client_email,
        t.ville_depart,
        t.ville_arrivee,
        t.date_depart
      FROM Paiements p
      LEFT JOIN Reservations r ON p.reservation_id = r.id
      LEFT JOIN signup u ON r.utilisateur_id = u.id
      LEFT JOIN Trajets t ON r.trajet_id = t.id
      WHERE p.id = ?
    `,
      [id]
    );

    if (paiements.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Paiement non trouvé" });
    }

    res.json({
      success: true,
      data: paiements[0]
    });
  } catch (error) {
    logger.error("Erreur getPaymentById: " + error.message);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message
    });
  }
};

exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { etat_paiement } = req.body;

    const etatsValides = [
      "en_attente",
      "reussi",
      "echoue",
      "annule",
      "rembourse"
    ];
    if (!etatsValides.includes(etat_paiement)) {
      return res.status(400).json({
        success: false,
        message: "Statut de paiement invalide"
      });
    }

    const [result] = await db.query(
      "UPDATE Paiements SET etat_paiement = ? WHERE id = ?",
      [etat_paiement, id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Paiement non trouvé" });
    }

    logger.success(`Statut paiement ${id} mis à jour: ${etat_paiement}`);

    res.json({
      success: true,
      message: "Statut du paiement mis à jour"
    });
  } catch (error) {
    logger.error("Erreur updatePaymentStatus: " + error.message);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message
    });
  }
};

exports.deletePayment = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query("DELETE FROM Paiements WHERE id = ?", [
      id
    ]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Paiement non trouvé" });
    }

    logger.success(`Paiement ${id} supprimé`);

    res.json({
      success: true,
      message: "Paiement supprimé avec succès"
    });
  } catch (error) {
    logger.error("Erreur deletePayment: " + error.message);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message
    });
  }
};
