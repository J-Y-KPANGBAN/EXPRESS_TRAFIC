// backend/services/emailChangeService.js
const crypto = require('crypto');
const db = require('../config/db');
const emailService = require('./emailService');
const { logger } = require("../utils/logger");

class EmailChangeService {
  // Demander un changement d'email
  async requestEmailChange(userId, currentEmail, newEmail) {
    try {
      // Vérifier que le nouvel email n'est pas déjà utilisé
      const [existing] = await db.query(
        "SELECT id FROM signup WHERE email = ? AND id != ?",
        [newEmail, userId]
      );

      if (existing.length > 0) {
        return { success: false, message: "Cet email est déjà utilisé" };
      }

      // Générer token
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 heure

      // Sauvegarder la demande
      await db.query(
        "INSERT INTO email_change_requests (user_id, old_email, new_email, token, expires_at) VALUES (?, ?, ?, ?, ?)",
        [userId, currentEmail, newEmail, tokenHash, expiresAt]
      );

      // Envoyer email de confirmation à l'ancienne adresse
      const confirmationLink = `${process.env.FRONTEND_URL}/confirm-email-change?token=${token}`;
      
      await emailService.sendMail(
        currentEmail,
        "Confirmation de changement d'email - ExpressTrafic",
        `
          <h2>🔄 Changement d'email demandé</h2>
          <p>Une demande de changement d'email a été effectuée pour votre compte.</p>
          <p><strong>Nouvel email :</strong> ${newEmail}</p>
          <p>Si vous êtes à l'origine de cette demande, cliquez sur le lien ci-dessous :</p>
          <a href="${confirmationLink}">Confirmer le changement d'email</a>
          <p>Ce lien expire dans 1 heure.</p>
          <p><strong>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email et contactez immédiatement le support.</strong></p>
        `
      );

      logger.info(`📧 Demande changement email envoyée à ${currentEmail} -> ${newEmail}`);
      return { success: true, message: "Email de confirmation envoyé" };

    } catch (error) {
      logger.error('❌ Erreur demande changement email:', error);
      return { success: false, error: error.message };
    }
  }

  // Confirmer le changement d'email
  async confirmEmailChange(token) {
    try {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      const [requests] = await db.query(
        "SELECT * FROM email_change_requests WHERE token = ? AND confirmed = 0 AND expires_at > NOW()",
        [tokenHash]
      );

      if (requests.length === 0) {
        return { success: false, message: "Lien invalide ou expiré" };
      }

      const request = requests[0];

      // Mettre à jour l'email
      await db.query(
        "UPDATE signup SET email = ?, email_verified = 0 WHERE id = ?",
        [request.new_email, request.user_id]
      );

      // Marquer comme confirmé
      await db.query(
        "UPDATE email_change_requests SET confirmed = 1, confirmed_at = NOW() WHERE id = ?",
        [request.id]
      );

      // Envoyer notification au nouvel email
      await emailService.sendMail(
        request.new_email,
        "Votre email a été mis à jour - ExpressTrafic",
        `
          <h2>✅ Email mis à jour</h2>
          <p>L'adresse email associée à votre compte ExpressTrafic a été modifiée avec succès.</p>
          <p><strong>Nouvel email :</strong> ${request.new_email}</p>
          <p>Vous devez maintenant vérifier cette nouvelle adresse email.</p>
        `
      );

      logger.success(`✅ Email changé pour user ${request.user_id}: ${request.old_email} -> ${request.new_email}`);
      return { 
        success: true, 
        message: "Email mis à jour avec succès",
        oldEmail: request.old_email,
        newEmail: request.new_email
      };

    } catch (error) {
      logger.error('❌ Erreur confirmation changement email:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailChangeService();