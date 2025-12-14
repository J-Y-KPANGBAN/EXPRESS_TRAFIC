// backend/middleware/security/antiBruteForce.js
const db = require('../../config/db');
const { logger } = require("../../utils/logger");

const antiBruteForce = (options = {}) => {
  return async (req, res, next) => {
    try {
      const { email, phone } = req.body;
      const identifier = email || phone;
      const ip = req.ip;
      
      if (!identifier) return next();

      // Vérifier les tentatives récentes
      const [attempts] = await db.query(
        `SELECT COUNT(*) as count, MAX(created_at) as last_attempt
         FROM security_logs 
         WHERE (identifier = ? OR ip_address = ?)
         AND action = 'failed_login'
         AND created_at > DATE_SUB(NOW(), INTERVAL 15 MINUTE)`,
        [identifier, ip]
      );

      const failedAttempts = attempts[0].count;

      // Niveaux de sécurité
      if (failedAttempts >= 10) {
        // Blocage total
        logger.warning(`🔒 Blocage complet pour ${identifier} (IP: ${ip})`);
        return res.status(429).json({
          success: false,
          code: 'ACCOUNT_LOCKED',
          message: "Compte temporairement bloqué pour sécurité. Réessayez dans 30 minutes ou contactez le support.",
          lock_duration: "30 minutes",
          support_contact: "support@expresstrafic.com"
        });
      } else if (failedAttempts >= 5) {
        // CAPTCHA requis
        logger.info(`🛡️ CAPTCHA requis pour ${identifier}`);
        return res.status(429).json({
          success: false,
          code: 'CAPTCHA_REQUIRED',
          message: "Veuillez compléter le CAPTCHA pour continuer",
          requires_captcha: true,
          captcha_site_key: process.env.RECAPTCHA_SITE_KEY
        });
      } else if (failedAttempts >= 3) {
        // Délai imposé
        const delay = Math.min(5000, failedAttempts * 1000); // Max 5 secondes
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      next();
    } catch (error) {
      logger.error('❌ Erreur anti-brute-force:', error);
      next();
    }
  };
};

module.exports = antiBruteForce;