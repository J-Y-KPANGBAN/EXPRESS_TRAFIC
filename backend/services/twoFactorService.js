// backend/services/twoFactorService.js
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const db = require('../config/db');
const { logger } = require("../utils/logger");

class TwoFactorService {
  // Générer un secret 2FA pour un utilisateur
  async generate2FASecret(userId, email) {
    try {
      const secret = speakeasy.generateSecret({
        name: `ExpressTrafic:${email}`,
        issuer: 'ExpressTrafic'
      });

      await db.query(
        "UPDATE signup SET two_factor_secret = ?, two_factor_enabled = 0 WHERE id = ?",
        [secret.base32, userId]
      );

      // Générer QR code
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

      return {
        success: true,
        secret: secret.base32,
        qrCodeUrl,
        otpauth_url: secret.otpauth_url
      };

    } catch (error) {
      logger.error('❌ Erreur génération 2FA:', error);
      return { success: false, error: error.message };
    }
  }

  // Vérifier un code 2FA
  async verify2FACode(userId, token) {
    try {
      const [users] = await db.query(
        "SELECT two_factor_secret FROM signup WHERE id = ?",
        [userId]
      );

      if (users.length === 0 || !users[0].two_factor_secret) {
        return { success: false, message: "2FA non configuré" };
      }

      const secret = users[0].two_factor_secret;
      const verified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token,
        window: 1 // Tolérance de 1 période (30s)
      });

      return {
        success: verified,
        message: verified ? "Code 2FA valide" : "Code 2FA invalide"
      };

    } catch (error) {
      logger.error('❌ Erreur vérification 2FA:', error);
      return { success: false, error: error.message };
    }
  }

  // Activer/désactiver 2FA
  async toggle2FA(userId, enable) {
    try {
      await db.query(
        "UPDATE signup SET two_factor_enabled = ? WHERE id = ?",
        [enable ? 1 : 0, userId]
      );

      logger.info(`✅ 2FA ${enable ? 'activé' : 'désactivé'} pour user ${userId}`);
      return { success: true, enabled: enable };

    } catch (error) {
      logger.error('❌ Erreur toggle 2FA:', error);
      return { success: false, error: error.message };
    }
  }

  // Générer des codes de secours
  async generateBackupCodes(userId) {
    try {
      const codes = Array.from({ length: 10 }, () => 
        Math.random().toString(36).substring(2, 8).toUpperCase()
      );

      await db.query(
        "UPDATE signup SET two_factor_backup_codes = ? WHERE id = ?",
        [JSON.stringify(codes), userId]
      );

      return { success: true, codes };

    } catch (error) {
      logger.error('❌ Erreur génération codes secours:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new TwoFactorService();
