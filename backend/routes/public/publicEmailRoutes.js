// backend/routes/public/publicEmailRoutes.js
const express = require('express');
const router = express.Router();
const emailVerificationService = require('../../services/emailVerificationService');
const { auth, requireClient } = require('../../middleware/auth');

// Vérifier email avec token
router.get('/verify-email/:token', async (req, res) => {
  try {
    const result = await emailVerificationService.verifyEmailToken(req.params.token);
    
    if (result.success) {
      res.json({
        success: true,
        message: "✅ Email vérifié avec succès !",
        redirect: "/login?verified=true"
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message || "Lien invalide"
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});

// Renvoyer l'email de vérification
router.post('/resend-verification', auth, requireClient, async (req, res) => {
  try {
    const result = await emailVerificationService.resendVerificationEmail(req.user.email);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});

module.exports = router;