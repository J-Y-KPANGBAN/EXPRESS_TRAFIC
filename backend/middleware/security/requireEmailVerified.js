// backend/middleware/security/requireEmailVerified.js
const { logger } = require("../../utils/logger");

const requireEmailVerified = (options = {}) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentification requise"
        });
      }

      // Vérifier si l'email est vérifié
      const db = require('../../config/db');
      const [users] = await db.query(
        "SELECT email_verified, email_verified_at FROM signup WHERE id = ?",
        [req.user.id]
      );

      if (users.length === 0 || !users[0].email_verified) {
        logger.warning(`🚫 Tentative accès sans email vérifié: ${req.user.email}`);
        
        // Envoyer un nouvel email de vérification si nécessaire
        if (options.resendOnFail !== false) {
          const EmailVerificationService = require('../../services/auth/EmailVerificationService');
          await EmailVerificationService.resendVerification(req.user.email, req.ip, req.get('User-Agent'));
        }
        
        return res.status(403).json({
          success: false,
          code: 'EMAIL_NOT_VERIFIED',
          message: "Veuillez vérifier votre adresse email pour accéder à cette fonctionnalité",
          requires_verification: true,
          can_resend: true,
          resend_endpoint: '/api/auth/resend-verification'
        });
      }

      next();
    } catch (error) {
      logger.error('❌ Erreur vérification email:', error);
      next(error);
    }
  };
};

module.exports = requireEmailVerified;