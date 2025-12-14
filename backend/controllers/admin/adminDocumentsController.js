// backend/controllers/admin/adminDocumentsController.js
const db = require("../../config/db");
const  logger  = require("../../utils/logger");
const pdfService = require("../../services/pdfService");
const qrCodeService = require("../../services/generateCode");

/* ============================================================
   🎫 ADMIN — GÉNÉRATION DE DOCUMENTS (BILLETS & REÇUS)
============================================================ */

exports.generateTicket = async (req, res) => {
  try {
    const { reservation_id } = req.params;

    logger.info(`Génération billet pour réservation: ${reservation_id}`);

    // Récupérer données complètes de la réservation
    const [reservations] = await db.query(`
      SELECT 
        r.*,
        u.nom AS client_nom,
        u.prenom AS client_prenom,
        u.email AS client_email,
        u.telephone AS client_telephone,
        t.ville_depart,
        t.ville_arrivee,
        t.date_depart,
        t.heure_depart,
        t.duree,
        b.numero_immatriculation,
        b.type_bus,
        c.nom AS chauffeur_nom,
        c.prenom AS chauffeur_prenom,
        s.nom AS societe_nom
      FROM Reservations r
      JOIN signup u ON r.utilisateur_id = u.id
      JOIN Trajets t ON r.trajet_id = t.id
      LEFT JOIN Bus b ON t.bus_id = b.id
      LEFT JOIN Chauffeurs c ON b.chauffeur_id = c.id
      LEFT JOIN Societes s ON b.societe_id = s.id
      WHERE r.id = ?
    `, [reservation_id]);

    if (reservations.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Réservation introuvable"
      });
    }

    const reservation = reservations[0];

    // Générer QR Code pour le billet
    const qrCodeData = await qrCodeService.generateTicketQR({
      reservation_id: reservation.id,
      code_reservation: reservation.code_reservation,
      client_nom: reservation.client_nom,
      client_prenom: reservation.client_prenom,
      trajet: `${reservation.ville_depart} → ${reservation.ville_arrivee}`,
      date_depart: reservation.date_depart,
      heure_depart: reservation.heure_depart,
      siege: reservation.siege_numero
    });

    // Générer le PDF du billet
    const pdfBuffer = await pdfService.generateTicket(reservation, qrCodeData);

    // Marquer le billet comme téléchargé
    await db.query(
      "UPDATE Reservations SET ticket_downloaded = 1, ticket_downloaded_at = NOW() WHERE id = ?",
      [reservation_id]
    );

    logger.success(`Billet généré pour réservation: ${reservation.code_reservation}`);

    // Retourner le PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="billet-${reservation.code_reservation}.pdf"`);
    res.send(pdfBuffer);

  } catch (error) {
    logger.error("Erreur generateTicket: " + error.message);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la génération du billet",
      error: error.message
    });
  }
};

exports.generateReceipt = async (req, res) => {
  try {
    const { payment_id } = req.params;

    logger.info(`Génération reçu pour paiement: ${payment_id}`);

    // Récupérer données complètes du paiement
    const [paiements] = await db.query(`
      SELECT 
        p.*,
        r.code_reservation,
        r.montant_total,
        r.date_reservation,
        u.nom AS client_nom,
        u.prenom AS client_prenom,
        u.email AS client_email,
        t.ville_depart,
        t.ville_arrivee,
        t.date_depart,
        s.nom AS societe_nom,
        s.adresse AS societe_adresse,
        s.contact AS societe_contact
      FROM Paiements p
      JOIN Reservations r ON p.reservation_id = r.id
      JOIN signup u ON r.utilisateur_id = u.id
      JOIN Trajets t ON r.trajet_id = t.id
      LEFT JOIN Bus b ON t.bus_id = b.id
      LEFT JOIN Societes s ON b.societe_id = s.id
      WHERE p.id = ?
    `, [payment_id]);

    if (paiements.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Paiement introuvable"
      });
    }

    const paiement = paiements[0];

    // Générer le PDF du reçu
    const pdfBuffer = await pdfService.generateReceipt(paiement);

    logger.success(`Reçu généré pour paiement: ${paiement.reference_transaction}`);

    // Retourner le PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="recu-${paiement.reference_transaction}.pdf"`);
    res.send(pdfBuffer);

  } catch (error) {
    logger.error("Erreur generateReceipt: " + error.message);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la génération du reçu",
      error: error.message
    });
  }
};

exports.generateFinancialReport = async (req, res) => {
  try {
    const { date_debut, date_fin } = req.query;

    logger.info(`Génération rapport financier: ${date_debut} à ${date_fin}`);

    // Récupérer données financières
    const [revenus] = await db.query(`
      SELECT 
        DATE(r.date_reservation) as date,
        COUNT(*) as reservations,
        SUM(r.montant_total) as chiffre_affaires,
        AVG(r.montant_total) as panier_moyen
      FROM Reservations r
      WHERE r.etat_reservation = 'confirmee'
        AND r.date_reservation BETWEEN ? AND ?
      GROUP BY DATE(r.date_reservation)
      ORDER BY date
    `, [date_debut, date_fin]);

    const [paiements] = await db.query(`
      SELECT 
        methode,
        COUNT(*) as transactions,
        SUM(montant) as total
      FROM Paiements
      WHERE etat_paiement = 'reussi'
        AND date_paiement BETWEEN ? AND ?
      GROUP BY methode
    `, [date_debut, date_fin]);

    const reportData = {
      periode: { date_debut, date_fin },
      revenus,
      paiements,
      generated_at: new Date().toISOString()
    };

    // Générer le PDF du rapport
    const pdfBuffer = await pdfService.generateFinancialReport(reportData);

    logger.success(`Rapport financier généré pour ${date_debut} à ${date_fin}`);

    // Retourner le PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="rapport-financier-${date_debut}-${date_fin}.pdf"`);
    res.send(pdfBuffer);

  } catch (error) {
    logger.error("Erreur generateFinancialReport: " + error.message);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la génération du rapport",
      error: error.message
    });
  }
};