const express = require("express");
const router = express.Router();
const adminAuthController = require("../../controllers/admin/adminAuthController");
const { validateLoginInput } = require("../../middleware/validateInput");
const { authLimiter, apiLimiter } = require("../../middleware/rateLimiter");
const { auth, requireAdmin } = require("../../middleware/auth");
const otpService = require('../../services/otpService');

// 🔐 APPLICATION DU RATE LIMITING GLOBAL
router.use(apiLimiter);

// ============================================
// 🔐 ROUTES AUTHENTIFICATION ADMIN
// ============================================

// ✅ Connexion admin (avec code admin sécurisé)
router.post('/login',
  authLimiter,
  validateLoginInput,
  adminAuthController.adminLogin
);

// 🚪 Déconnexion admin
router.post('/logout',
  auth,
  requireAdmin,
  adminAuthController.adminLogout
);

// 🔐 Demande réinitialisation mot de passe admin
router.post('/forgot-password',
  authLimiter,
  adminAuthController.requestPasswordReset
);

// 🔐 Réinitialisation mot de passe admin
router.post('/reset-password',
  authLimiter,
  adminAuthController.resetPassword
);

// 🔐 Envoi réinitialisation MDP utilisateur par admin
router.post('/send-user-reset',
  auth,
  requireAdmin,
  adminAuthController.sendUserPasswordReset
);

// ✅ Vérification token admin
router.get('/verify',
  auth,
  requireAdmin,
  (req, res) => {
    res.json({
      success: true,
      message: "Token administrateur valide",
      user: {
        id: req.user.id,
        nom: req.user.nom,
        prenom: req.user.prenom,
        email: req.user.email,
        type_utilisateur: req.user.type_utilisateur
      }
    });
  }
);
// Dans backend/routes/public/publicAuthRoutes.js - AJOUTER :
router.post('/test-sms', authLimiter, async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Numéro de téléphone requis"
      });
    }

    // Format: 612345678 (sans +33)
    const smsService = require('../../services/smsService');
    
    const message = `Test SMS ExpressTrafic - ${new Date().toLocaleTimeString()}`;
    const result = await smsService.sendSMS(phone, message);

    res.json({
      success: true,
      message: "SMS envoyé (ou simulé)",
      result
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
module.exports = router;