// backend/routes/public/publicReductionsRoutes.js
const express = require('express');
const router = express.Router();
const publicReductionsController = require('../../controllers/public/publicReductionsController');
const { auth, requireClient } = require('../../middleware/auth');
const { apiLimiter } = require('../../middleware/rateLimiter');
// ============================================
// 🎫 ROUTES RÉDUCTIONS
// ============================================

// ✅ Liste des réductions disponibles (public)
router.get('/', apiLimiter, publicReductionsController.getAvailableReductions);

// ✅ Valider un code de réduction (authentifié)
router.post('/validate', auth, requireClient, publicReductionsController.validateReductionCode);

// ✅ Appliquer une réduction à un panier
router.post('/apply-to-cart', auth, requireClient, publicReductionsController.applyReductionToCart);

module.exports = router;