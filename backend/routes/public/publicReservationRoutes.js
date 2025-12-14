// backend/routes/public/publicReservationRoutes.js (CORRIGÉ)
const express = require('express');
const router = express.Router();
const publicReservationsController = require('../../controllers/public/publicReservationsController');
const { auth, requireClient } = require('../../middleware/auth');
const { validateReservationInput } = require('../../middleware/validateInput');
const { reservationLimiter } = require('../../middleware/rateLimiter'); // ⬅️ CORRIGÉ ICI

// ==================== ROUTES PUBLIQUES ====================

// ❌ Réservation sans compte (DÉSACTIVÉE et SÉCURISÉE)
router.post('/sans-compte', (req, res) => {
  res.status(403).json({
    success: false,
    message: "La réservation sans compte n'est plus autorisée pour des raisons de sécurité"
  });
});

// 🔍 Consultation publique d'une réservation (limité)
router.get('/code/:code', 
  reservationLimiter,
  publicReservationsController.getPublicReservationByCode
);

// ==================== ROUTES UTILISATEUR CONNECTÉ ====================

// 🔐 Protection globale pour toutes les routes suivantes
router.use(auth);
router.use(requireClient); // ⚠️ UNIQUEMENT CLIENTS

// 📋 Liste des réservations utilisateur
router.get('/mes-reservations', 
  publicReservationsController.getUserReservations
);

// 🎫 Réservations en cours
router.get('/encours',
  publicReservationsController.getReservationsEncours
);

// 📊 Historique
router.get('/historique',
  publicReservationsController.getHistorique
);

// 🗄️ Archives
router.get('/archives',
  publicReservationsController.getArchives
);

// ➕ Nouvelle réservation (avec validation et limite)
router.post('/',
  reservationLimiter,
  validateReservationInput,
  publicReservationsController.createReservationForUser
);

// 👀 Détail d'une réservation (vérification propriétaire intégrée)
router.get('/:reservationId',
  publicReservationsController.getReservationById
);

// ❌ Annulation (vérification propriétaire intégrée)
router.put('/:reservationId/annuler',
  publicReservationsController.cancelReservation
);

// 📎 Mise à jour URL ticket (vérification propriétaire intégrée)
router.put('/:reservationId/ticket-url',
  publicReservationsController.updateTicketUrl
);

module.exports = router;