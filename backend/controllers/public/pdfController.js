// controllers/public/pdfController.js - VERSION AVEC SÉCURITÉ
const PDFDocument = require("pdfkit");
const db = require("../../config/db");
const mailer = require("../../config/mailer");
const  logger  = require("../../utils/logger");

// ========================================
// 🛡️ FONCTION DE SÉCURITÉ ESSENTIELLE
// ========================================
const sanitizeFileName = (name) => {
  return name.replace(/[^a-zA-Z0-9-_]/g, '_');
};

// ========================================
// 📌 GÉNÉRER UN TICKET PDF (STREAM DIRECT)
// ========================================
exports.generateTicketPDF = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const userId = req.user?.id;
    
    // VALIDATION SÉCURITÉ
    if (userId) {
      const [userReservation] = await db.query(
        "SELECT id FROM Reservations WHERE id = ? AND utilisateur_id = ?",
        [reservationId, userId]
      );
      if (userReservation.length === 0) {
        return res.status(403).json({
          success: false,
          message: "Accès non autorisé à cette réservation"
        });
      }
    }

    // RÉCUPÉRATION DES DONNÉES
    const [rows] = await db.query(
      `SELECT r.*, 
              t.ville_depart, t.ville_arrivee, t.date_depart, t.heure_depart, t.prix,
              s.nom, s.prenom, s.email, s.telephone,
              b.numero_immatriculation, b.type_bus
       FROM Reservations r
       LEFT JOIN signup s ON r.utilisateur_id = s.id
       JOIN Trajets t ON r.trajet_id = t.id
       LEFT JOIN Bus b ON t.bus_id = b.id
       WHERE r.id = ?`,
      [reservationId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Réservation introuvable" 
      });
    }

    const reservation = rows[0];
    
    // 🛡️ APPLICATION DE LA SÉCURITÉ
    const safeFileName = sanitizeFileName(`ticket_${reservation.code_reservation}`);
    const fileName = `${safeFileName}.pdf`;

    // CRÉATION DU PDF
    const pdf = new PDFDocument({ 
      margin: 30,
      size: 'A4',
      info: {
        Title: `Ticket ${reservation.code_reservation}`,
        Author: 'ExpressTrafic',
        Subject: 'Ticket de réservation'
      }
    });

    // CONFIGURATION DE LA RÉPONSE
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    pdf.pipe(res);

    // ===== CONTENU DU PDF =====
    
    // EN-TÊTE
    pdf.fillColor('#2c5aa0')
       .fontSize(24)
       .text('🎟️  TICKET DE BUS', { align: 'center' });
    
    pdf.moveDown(0.5);
    pdf.fillColor('#e74c3c')
       .fontSize(16)
       .text(reservation.code_reservation, { align: 'center' });
    
    pdf.moveDown(1);

    // INFORMATIONS CLIENT
    pdf.fillColor('#2c3e50')
       .fontSize(14)
       .text('INFORMATIONS PASSAGER', { underline: true });
    
    pdf.moveDown(0.5);
    pdf.fillColor('#34495e')
       .fontSize(11)
       .text(`Nom : ${reservation.nom || 'N/A'} ${reservation.prenom || ''}`);
    pdf.text(`Email : ${reservation.email || 'N/A'}`);
    pdf.text(`Téléphone : ${reservation.telephone || 'N/A'}`);
    pdf.moveDown(1);

    // INFORMATIONS TRAJET
    pdf.fillColor('#2c3e50')
       .fontSize(14)
       .text('DÉTAILS DU TRAJET', { underline: true });
    
    pdf.moveDown(0.5);
    pdf.fillColor('#34495e')
       .fontSize(11)
       .text(`📍 Départ : ${reservation.ville_depart}`);
    pdf.text(`🎯 Arrivée : ${reservation.ville_arrivee}`);
    pdf.text(`📅 Date : ${new Date(reservation.date_depart).toLocaleDateString('fr-FR')}`);
    pdf.text(`⏰ Heure : ${reservation.heure_depart}`);
    pdf.text(`💺 Siège : ${reservation.siege_numero}`);
    pdf.text(`💰 Montant : ${reservation.montant_total || reservation.prix || 0} €`);
    
    pdf.moveDown(1);

    // INFORMATIONS VÉHICULE
    if (reservation.numero_immatriculation) {
      pdf.fillColor('#2c3e50')
         .fontSize(14)
         .text('INFORMATIONS VÉHICULE', { underline: true });
      
      pdf.moveDown(0.5);
      pdf.fillColor('#34495e')
         .fontSize(11)
         .text(`🚗 Type : ${reservation.type_bus}`);
      pdf.text(`🔢 Immatriculation : ${reservation.numero_immatriculation}`);
      pdf.moveDown(1);
    }

    // CODE QR (placeholder)
    pdf.moveDown(1);
    pdf.fillColor('#7f8c8d')
       .fontSize(10)
       .text('Présentez ce ticket au conducteur - Code: ' + reservation.code_reservation, { align: 'center' });

    // FOOTER
    pdf.moveDown(2);
    pdf.fillColor('#95a5a6')
       .fontSize(8)
       .text(`Généré le ${new Date().toLocaleDateString('fr-FR')} • Service Client: contact@expresstrafic.com`, { align: 'center' });

    // FINALISATION
    pdf.end();

    // MISE À JOUR BD - Marquer comme généré
    await db.query(
      `UPDATE Reservations 
       SET ticket_downloaded = 1,
           email_sent_at = NOW()
       WHERE id = ?`,
      [reservationId]
    );

    logger.success(`✅ Ticket PDF généré: ${fileName}`);

  } catch (error) {
    console.error('❌ Erreur generateTicketPDF:', error);
    logger.error("Erreur generateTicketPDF : " + error.message);
    res.status(500).json({ 
      success: false, 
      message: "Erreur lors de la génération du ticket",
      error: error.message 
    });
  }
};

// ========================================
// 📌 TÉLÉCHARGER UN TICKET PAR CODE
// ========================================
exports.downloadTicket = async (req, res) => {
  try {
    const { ticketCode } = req.params;

    // RECHERCHE DE LA RÉSERVATION PAR CODE
    const [rows] = await db.query(
      `SELECT r.*, 
              t.ville_depart, t.ville_arrivee, t.date_depart, t.heure_depart,
              s.nom, s.prenom, s.email, s.telephone,
              b.numero_immatriculation, b.type_bus
       FROM Reservations r
       LEFT JOIN signup s ON r.utilisateur_id = s.id
       JOIN Trajets t ON r.trajet_id = t.id
       LEFT JOIN Bus b ON t.bus_id = b.id
       WHERE r.code_reservation = ?`,
      [ticketCode]
    );

    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Ticket non trouvé" 
      });
    }

    const reservation = rows[0];
    
    // 🛡️ APPLICATION DE LA SÉCURITÉ
    const safeFileName = sanitizeFileName(`ticket_${reservation.code_reservation}`);
    const fileName = `${safeFileName}.pdf`;

    // GÉNÉRATION DIRECTE DU PDF
    const pdf = new PDFDocument({ margin: 30, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    pdf.pipe(res);

    // CONTENU SIMPLIFIÉ POUR TÉLÉCHARGEMENT
    pdf.fillColor('#2c5aa0')
       .fontSize(20)
       .text('TICKET DE BUS', { align: 'center' });
    
    pdf.moveDown(0.5);
    pdf.fillColor('#e74c3c')
       .fontSize(14)
       .text(reservation.code_reservation, { align: 'center' });
    
    pdf.moveDown(1);
    pdf.fillColor('#2c3e50')
       .fontSize(12)
       .text(`Trajet: ${reservation.ville_depart} To ${reservation.ville_arrivee}`);
    pdf.text(`Date: ${new Date(reservation.date_depart).toLocaleDateString('fr-FR')}`);
    pdf.text(`Heure: ${reservation.heure_depart}`);
    pdf.text(`Siège: ${reservation.siege_numero}`);
    pdf.text(`Passager: ${reservation.nom} ${reservation.prenom}`);

    pdf.end();

    logger.success(`✅ Ticket téléchargé via code: ${ticketCode}`);

  } catch (error) {
    console.error('❌ Erreur downloadTicket:', error);
    logger.error("Erreur downloadTicket : " + error.message);
    res.status(500).json({ 
      success: false, 
      message: "Erreur lors du téléchargement" 
    });
  }
};

// ========================================
// 📌 VÉRIFIER SI UN TICKET EXISTE
// ========================================
exports.checkTicketExists = async (req, res) => {
  try {
    const { ticketCode } = req.params;

    const [rows] = await db.query(
      "SELECT id, code_reservation FROM Reservations WHERE code_reservation = ?",
      [ticketCode]
    );

    const exists = rows.length > 0;
    
    res.json({ 
      success: true, 
      exists,
      reservation: exists ? {
        id: rows[0].id,
        code: rows[0].code_reservation
      } : null
    });

  } catch (error) {
    console.error('❌ Erreur checkTicketExists:', error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur lors de la vérification" 
    });
  }
};

// ========================================
// 📌 ENVOYER LE TICKET PAR EMAIL
// ========================================
exports.sendTicketByEmail = async (req, res) => {
  try {
    const { reservationId } = req.params;

    const [rows] = await db.query(
      `SELECT r.*, 
              s.email, s.nom, s.prenom
       FROM Reservations r
       LEFT JOIN signup s ON r.utilisateur_id = s.id
       WHERE r.id = ?`,
      [reservationId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Réservation introuvable" });
    }

    const reservation = rows[0];

    // NOTE: Pour l'envoi email avec PDF, il faudrait générer le PDF en buffer
    // Pour l'instant, on envoie juste un email d'information
    await mailer.sendEmail({
      to: reservation.email,
      subject: `Votre Ticket – ${reservation.code_reservation}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c5aa0;">🎟️ Votre ticket est disponible !</h2>
          <p>Bonjour <strong>${reservation.prenom} ${reservation.nom}</strong>,</p>
          <p>Votre réservation <strong>${reservation.code_reservation}</strong> a été confirmée.</p>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Code réservation :</strong> ${reservation.code_reservation}</p>
            <p><strong>Siège :</strong> ${reservation.siege_numero}</p>
            <p><strong>Trajet :</strong> ${reservation.ville_depart} TO ${reservation.ville_arrivee}</p>
            <p><strong>Date :</strong> ${new Date(reservation.date_depart).toLocaleDateString('fr-FR')}</p>
            <p><strong>Heure :</strong> ${reservation.heure_depart}</p>
          </div>
          <p>Téléchargez votre ticket depuis votre espace client ou via ce lien :</p>
          <p><a href="${process.env.FRONTEND_URL}/ticket/${reservation.code_reservation}" style="background: #2c5aa0; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Télécharger mon ticket</a></p>
        </div>
      `
    });

    // Mettre à jour le statut d'envoi
    await db.query(
      "UPDATE Reservations SET email_sent = 1, email_sent_at = NOW() WHERE id = ?",
      [reservationId]
    );

    logger.success(`✅ Email envoyé pour la réservation: ${reservationId}`);

    res.json({ 
      success: true, 
      message: "Email envoyé avec succès" 
    });

  } catch (error) {
    logger.error("Erreur sendTicketByEmail : " + error.message);
    res.status(500).json({ 
      success: false, 
      message: "Erreur lors de l'envoi de l'email" 
    });
  }
};

// ========================================
// 📌 GÉNÉRER UNE FACTURE PDF
// ========================================
exports.generateInvoicePDF = async (req, res) => {
  try {
    const { reservationId } = req.params;

    const [rows] = await db.query(
      `SELECT r.*, t.ville_depart, t.ville_arrivee, t.date_depart, t.prix,
              s.nom, s.prenom, s.email, s.adresse_postale
       FROM Reservations r
       LEFT JOIN signup s ON r.utilisateur_id = s.id
       JOIN Trajets t ON r.trajet_id = t.id
       WHERE r.id = ?`,
      [reservationId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Réservation introuvable" });
    }

    const reservation = rows[0];
    
    // 🛡️ APPLICATION DE LA SÉCURITÉ
    const safeFileName = sanitizeFileName(`facture_${reservation.code_reservation}`);
    const fileName = `${safeFileName}.pdf`;

    const pdf = new PDFDocument({ margin: 25 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    pdf.pipe(res);

    // CONTENU FACTURE
    pdf.fillColor('#2c5aa0')
       .fontSize(22)
       .text("🧾 FACTURE", { align: "center" });
    pdf.moveDown();

    // INFORMATIONS CLIENT
    pdf.fillColor('#2c3e50')
       .fontSize(14)
       .text("INFORMATIONS CLIENT", { underline: true });
    
    pdf.moveDown(0.5);
    pdf.fillColor('#34495e')
       .fontSize(11)
       .text(`Client : ${reservation.prenom} ${reservation.nom}`);
    pdf.text(`Email : ${reservation.email}`);
    if (reservation.adresse_postale) {
      pdf.text(`Adresse : ${reservation.adresse_postale}`);
    }
    pdf.moveDown();

    // DÉTAILS FACTURE
    pdf.fillColor('#2c3e50')
       .fontSize(14)
       .text("DÉTAILS DE LA FACTURE", { underline: true });
    
    pdf.moveDown(0.5);
    pdf.fillColor('#34495e')
       .fontSize(11)
       .text(`Numéro : ${reservation.code_reservation}`);
    pdf.text(`Date d'émission : ${new Date().toLocaleDateString('fr-FR')}`);
    pdf.text(`Trajet : ${reservation.ville_depart} TO ${reservation.ville_arrivee}`);
    pdf.text(`Date du trajet : ${reservation.date_depart}`);
    pdf.text(`Montant TTC : ${reservation.montant_total || reservation.prix || 0} €`);
    pdf.moveDown();

    pdf.fillColor('#95a5a6')
       .fontSize(10)
       .text("Merci pour votre confiance.", { align: "center" });

    pdf.end();

    logger.success(`✅ Facture PDF générée : ${fileName}`);

  } catch (error) {
    logger.error("Erreur generateInvoicePDF : " + error.message);
    res.status(500).json({ 
      success: false, 
      message: "Erreur génération facture" 
    });
  }
};