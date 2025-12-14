// backend/services/emailService.js - VERSION CORRIGÉE
const transporter = require("../config/mailer");
const path = require("path");
const fs = require("fs");
const { logger } = require("../utils/logger");

class EmailService {
  async sendMail(to, subject, html, attachments = []) {
    try {
      logger.info(`📧 Tentative d'envoi email à: ${to}`);

      const mailOptions = {
        from: process.env.MAIL_FROM || process.env.EMAIL_FROM || 'contact@expresstrafic.com',
        to,
        subject,
        html,
        attachments,
      };

      logger.info("Options email:", { 
        to, 
        subject,
        from: mailOptions.from
      });

      const info = await transporter.sendMail(mailOptions);
      
      logger.success(`✅ Email envoyé avec succès: ${info.messageId}`);
      
      return info;
    } catch (error) {
      logger.error("❌ Erreur envoi email:", error.message);
      // Ne pas bloquer l'application en cas d'erreur d'email
      logger.info("💡 Continuer sans email...");
      return { messageId: 'error-' + Date.now() };
    }
  }

  async sendContactEmail(data) {
    return this.sendMail(
      process.env.MAIL_SUPPORT || process.env.EMAIL_FROM || 'contact@expresstrafic.com',
      "Nouveau message de contact",
      `
        <h3>Message reçu de ${data.firstName} ${data.lastName}</h3>
        <p>Email : ${data.email}</p>
        <p>Sujet : ${data.sujet}</p>
        <p>Message :</p>
        <p>${data.message}</p>
      `
    );
  }

  async sendTicketEmail(email, pdfPath) {
    logger.info(`📧 Envoi du billet à ${email} avec pièce jointe ${pdfPath}`);

    let actualPdfPath = pdfPath;
    
    // Si le chemin est une URL relative, le convertir en chemin absolu
    if (pdfPath.startsWith('/tickets/')) {
      const filename = path.basename(pdfPath);
      actualPdfPath = path.join(__dirname, '../tickets', filename);
    }

    // Vérifier si le fichier existe
    if (!fs.existsSync(actualPdfPath)) {
      logger.error(`❌ Fichier PDF introuvable: ${actualPdfPath}`);
      
      // Essayer de trouver le fichier dans le dossier tickets
      const ticketsDir = path.join(__dirname, '../tickets');
      const filename = path.basename(pdfPath);
      const alternativePath = path.join(ticketsDir, filename);
      
      if (fs.existsSync(alternativePath)) {
        actualPdfPath = alternativePath;
        logger.info(`✅ Fichier trouvé via chemin alternatif: ${actualPdfPath}`);
      } else {
        // Envoyer l'email sans pièce jointe plutôt que d'échouer
        logger.warn("⚠️ Envoi email sans pièce jointe - fichier manquant");
        return this.sendMail(
          email,
          "Votre billet de réservation - ExpressTrafic",
          `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2c5aa0;">🎫 Votre billet ExpressTrafic</h2>
              <p>Bonjour,</p>
              <p>Votre réservation a été confirmée.</p>
              <p><strong>Note :</strong> Le billet PDF n'a pas pu être généré. Veuillez contacter le support.</p>
              <p>Merci pour votre confiance,<br><strong>L'équipe ExpressTrafic</strong></p>
            </div>
          `
        );
      }
    }

    return this.sendMail(
      email,
      "Votre billet de réservation - ExpressTrafic",
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c5aa0;">🎫 Votre billet ExpressTrafic</h2>
          <p>Bonjour,</p>
          <p>Votre réservation a été confirmée. Votre billet est attaché à cet email.</p>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Conseil :</strong> Sauvegardez ce billet sur votre téléphone ou imprimez-le.</p>
            <p><strong>Embarquement :</strong> Présentez ce billet et une pièce d'identité.</p>
          </div>
          
          <p>Merci pour votre confiance,<br><strong>L'équipe ExpressTrafic</strong></p>
        </div>
      `,
      [
        {
          filename: `billet-${path.basename(actualPdfPath).replace('ticket_', '')}`,
          path: actualPdfPath,
          contentType: 'application/pdf'
        },
      ]
    );
  }
}

module.exports = new EmailService();