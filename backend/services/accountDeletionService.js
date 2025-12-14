// backend/services/accountDeletionService.js
const db = require('../config/db');
const { logger } = require("../utils/logger");

class AccountDeletionService {
  // Demander la suppression de compte
  async requestAccountDeletion(userId, reason = "") {
    try {
      const deletionToken = require('crypto').randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

      await db.query(
        `INSERT INTO account_deletion_requests 
         (user_id, deletion_token, reason, expires_at) 
         VALUES (?, ?, ?, ?)`,
        [userId, deletionToken, reason.substring(0, 500), expiresAt]
      );

      // Envoyer email de confirmation
      const emailService = require('./emailService');
      const [user] = await db.query(
        "SELECT email, nom, prenom FROM signup WHERE id = ?",
        [userId]
      );

      if (user.length > 0) {
        const confirmationLink = `${process.env.FRONTEND_URL}/confirm-account-deletion?token=${deletionToken}`;
        
        await emailService.sendMail(
          user[0].email,
          "Confirmation de suppression de compte - ExpressTrafic",
          `
            <h2>🗑️ Demande de suppression de compte</h2>
            <p>Bonjour ${user[0].prenom},</p>
            <p>Une demande de suppression de votre compte ExpressTrafic a été effectuée.</p>
            ${reason ? `<p><strong>Raison :</strong> ${reason}</p>` : ''}
            <p><strong>⚠️ ATTENTION :</strong> Cette action est irréversible. Toutes vos données seront définitivement supprimées.</p>
            <p>Pour confirmer la suppression, cliquez sur le lien ci-dessous :</p>
            <a href="${confirmationLink}" style="color: #dc3545; font-weight: bold;">
              Confirmer la suppression définitive
            </a>
            <p>Ce lien expire dans 24 heures.</p>
            <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email et contactez immédiatement le support.</p>
          `
        );
      }

      logger.info(`🗑️ Demande suppression compte pour user ${userId}`);
      return { 
        success: true, 
        message: "Email de confirmation envoyé",
        note: "La suppression sera effective après confirmation"
      };

    } catch (error) {
      logger.error('❌ Erreur demande suppression compte:', error);
      return { success: false, error: error.message };
    }
  }

  // Confirmer et exécuter la suppression
  async confirmAccountDeletion(token) {
    try {
      const [requests] = await db.query(
        "SELECT * FROM account_deletion_requests WHERE deletion_token = ? AND executed = 0 AND expires_at > NOW()",
        [token]
      );

      if (requests.length === 0) {
        return { success: false, message: "Lien invalide ou expiré" };
      }

      const request = requests[0];

      // 1. Anonymiser les données (GDPR compliant)
      await db.query(
        `UPDATE signup SET 
          nom = 'Utilisateur supprimé',
          prenom = 'Compte',
          email = CONCAT('deleted_', UNIX_TIMESTAMP(), '@deleted.expresstrafic.com'),
          telephone = NULL,
          adresse_postale = NULL,
          ville = NULL,
          code_postal = NULL,
          statut = 'deleted',
          deleted_at = NOW()
         WHERE id = ?`,
        [request.user_id]
      );

      // 2. Marquer la suppression comme exécutée
      await db.query(
        "UPDATE account_deletion_requests SET executed = 1, executed_at = NOW() WHERE id = ?",
        [request.id]
      );

      // 3. Journaliser pour audit
      logger.warning(`🗑️ Compte ${request.user_id} supprimé (GDPR compliant)`);

      return { 
        success: true, 
        message: "Compte supprimé avec succès",
        note: "Vos données ont été anonymisées conformément au RGPD"
      };

    } catch (error) {
      logger.error('❌ Erreur suppression compte:', error);
      return { success: false, error: error.message };
    }
  }

  // Exporter les données utilisateur (droit à la portabilité)
  async exportUserData(userId) {
    try {
      const [userData] = await db.query(
        `SELECT * FROM signup WHERE id = ?`,
        [userId]
      );

      const [reservations] = await db.query(
        `SELECT * FROM reservations WHERE user_id = ?`,
        [userId]
      );

      const [profile] = await db.query(
        `SELECT * FROM profile WHERE user_id = ?`,
        [userId]
      );

      const exportData = {
        exported_at: new Date().toISOString(),
        user: userData[0] || {},
        reservations: reservations || [],
        profile: profile[0] || {},
        metadata: {
          format: 'JSON',
          gdpr_compliant: true
        }
      };

      return {
        success: true,
        data: exportData,
        format: 'json',
        download_url: `/api/users/export/${userId}/data.json`
      };

    } catch (error) {
      logger.error('❌ Erreur export données:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new AccountDeletionService();