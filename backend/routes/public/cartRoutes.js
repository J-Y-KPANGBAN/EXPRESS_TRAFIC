// backend/routes/public/cartRoutes.js (MISE À JOUR)
const express = require("express");
const router = express.Router();
const cartController = require("../../controllers/public/cartController");
const { auth, requireClient } = require("../../middleware/auth");
const { reservationLimiter, apiLimiter } = require("../../middleware/rateLimiter");

// 🔐 Toutes les routes nécessitent une authentification CLIENT
router.use(auth);
router.use(requireClient);
router.use(apiLimiter);

// 🛒 AJOUTER AU PANIER
router.post("/add", reservationLimiter, cartController.addToCart);

// 👀 VOIR LE PANIER
router.get("/", cartController.getCart);

// ❌ SUPPRIMER UN ÉLÉMENT
router.delete("/item/:item_id", cartController.removeFromCart);

// 🗑️ VIDER LE PANIER
router.delete("/clear", cartController.clearCart);

// 💳 PASSER AU PAIEMENT
router.post("/checkout", reservationLimiter, cartController.checkoutCart);

module.exports = router;