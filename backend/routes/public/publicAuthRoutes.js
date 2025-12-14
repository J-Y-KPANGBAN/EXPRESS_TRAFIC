// backend/routes/public/publicAuthRoutes.js
const express = require('express');
const router = express.Router();
const publicAuthController = require('../../controllers/public/publicAuthController'); // VOTRE contrôleur
const { validateSignupInput, validateLoginInput } = require('../../middleware/validateInput');
const { authLimiter, apiLimiter } = require('../../middleware/rateLimiter');
const { antiBruteForce } = require('../../middleware/security');

// 🔐 APPLICATION DU RATE LIMITING GLOBAL
router.use(apiLimiter);

// ============================================
// 🔐 ROUTES UNIQUEMENT CLIENTS (PUBLIC)
// ============================================

// ✅ Inscription client avec double opt-in
router.post('/signup', 
  authLimiter,
  validateSignupInput,
  antiBruteForce(),
  publicAuthController.signup
);

// ✅ Connexion client avec sécurité
router.post('/login',
  authLimiter,
  validateLoginInput,
  antiBruteForce(),
  publicAuthController.login
);

// ✅ Vérification email (nouveau)
router.get('/verify-email/:token', publicAuthController.verifyEmail);
router.post('/resend-verification', authLimiter, publicAuthController.resendVerification);

// ✅ 2FA (nouveau - en développement)
router.post('/enable-2fa', authLimiter, publicAuthController.enable2FA);
router.post('/verify-2fa', authLimiter, publicAuthController.verify2FA);
router.post('/disable-2fa', authLimiter, publicAuthController.disable2FA);

// ✅ Changement email (nouveau - en développement)
router.post('/request-email-change', authLimiter, publicAuthController.requestEmailChange);
router.post('/confirm-email-change/:token', publicAuthController.confirmEmailChange);

// ✅ Suppression compte (nouveau - en développement)
router.post('/request-account-deletion', authLimiter, publicAuthController.requestAccountDeletion);
router.post('/confirm-account-deletion/:token', publicAuthController.confirmAccountDeletion);
router.get('/export-data', authLimiter, publicAuthController.exportUserData);

// ✅ Récupération mot de passe existante
router.post('/forgot-password', authLimiter, publicAuthController.requestPasswordReset);
router.post('/reset-password', authLimiter, publicAuthController.resetPassword);
router.post('/forgot-password-sms', authLimiter, publicAuthController.requestPasswordResetSMS);
router.post('/reset-password-otp', authLimiter, publicAuthController.resetPasswordWithOTP);

// ✅ Vérification token existant
router.get('/verify', publicAuthController.verifyToken);

// ✅ Déconnexion existante
router.post('/logout', publicAuthController.logout);

module.exports = router;