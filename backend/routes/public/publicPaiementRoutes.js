// backend/routes/public/publicPaiementRoutes.js

// ***  nouveau fichier  avec lequels j'ai des erreur []

// backend/routes/public/publicPaiementRoutes.js

const express = require("express");
const router = express.Router();
const publicPaiementController = require("../../controllers/public/publicPaiementController");
const { auth, requireClient } = require("../../middleware/auth");
const { apiLimiter, reservationLimiter } = require("../../middleware/rateLimiter");

// 💳 ROUTES PUBLIQUES (sans authentification)
router.get("/moyens", apiLimiter, publicPaiementController.getMoyensPaiementActifs);
router.get("/:paymentId/status", apiLimiter, publicPaiementController.getPaymentStatus);
router.get("/:paymentId/ticket", apiLimiter, publicPaiementController.downloadTicket);
router.post("/:paymentId/stripe/checkout", apiLimiter, publicPaiementController.createStripeCheckoutSession);

// 💳 ROUTES AUTHENTIFIÉES (CLIENT)
router.use(auth);
router.use(requireClient);

// Initiation des paiements
router.post("/initiate", reservationLimiter, publicPaiementController.initiatePayment);
router.post("/cart/initiate", reservationLimiter, publicPaiementController.initiateCartPayment);

// Confirmation et gestion des paiements
router.post("/:paymentId/confirm", reservationLimiter, publicPaiementController.confirmPayment);

// 🎫 GESTION DES BILLETS (après paiement)
router.post("/:paymentId/send-email", reservationLimiter, publicPaiementController.sendTicketByEmail);
router.post("/:paymentId/send-sms", reservationLimiter, publicPaiementController.sendTicketBySms);
router.post("/:paymentId/generate-ticket", reservationLimiter, publicPaiementController.generateTicket);
router.get("/:paymentId/invoice", reservationLimiter, publicPaiementController.downloadInvoice);
router.get("/history", reservationLimiter, publicPaiementController.getUserPaymentHistory);
router.post("/:paymentId/cancel", reservationLimiter, publicPaiementController.cancelPayment);
router.post("/calculate-fees", reservationLimiter, publicPaiementController.calculateFees);

module.exports = router;
 // ******ancien fichier qui fonction tres bien ***
/*const express = require("express");
const router = express.Router();
const publicPaiementController = require("../../controllers/public/publicPaiementController");
const { auth, requireClient } = require("../../middleware/auth");
const { apiLimiter, reservationLimiter } = require("../../middleware/rateLimiter");

// 💳 ROUTES PUBLIQUES
router.get("/moyens", apiLimiter, publicPaiementController.getMoyensPaiementActifs);
router.get("/:paymentId/status", apiLimiter, publicPaiementController.getPaymentStatus);
router.post("/:paymentId/stripe/checkout", apiLimiter, publicPaiementController.createStripeCheckoutSession);

// 💳 ROUTES AUTHENTIFIÉES (CLIENT)
router.use(auth);
router.use(requireClient);

router.post("/initiate", reservationLimiter, publicPaiementController.initiatePayment);
router.post("/cart/initiate", reservationLimiter, publicPaiementController.initiateCartPayment);
router.post("/:paymentId/confirm", reservationLimiter, publicPaiementController.confirmPayment);

module.exports = router;
*/