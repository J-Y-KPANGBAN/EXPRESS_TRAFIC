//backend/routes/public/publicIndex.js

const express = require('express');
const router = express.Router();

// Import des routes
const authRoutes = require('./publicAuthRoutes');
const trajetRoutes = require('./publicTrajetRoutes');
const reservationRoutes = require('./publicReservationRoutes');
const paiementRoutes = require('./publicPaiementRoutes');
const profileRoutes = require('./publicProfileRoutes');
const reductionsRoutes = require('./publicReductionsRoutes');
const cartRoutes = require('./cartRoutes');
const contactRoutes = require('./publicContactRoutes');
const pdfRoutes = require('./pdfRoutes');
const countryRoutes = require('./countryRoutes');
const destinationsRoutes = require('./publicDestinationsRoutes');
const publicUserRoutes = require('./publicUserRoutes');
const qrCodeRoutes = require('./qrCodeRoutes');
const EmailRoutes = require('./publicEmailRoutes');

// Configuration des routes 
router.use('/auth', authRoutes);
router.use('/trajets', trajetRoutes);
router.use('/reservations', reservationRoutes);
router.use('/paiements', paiementRoutes);  // CHANGER paiement → paiements
router.use('/profile', profileRoutes);
router.use('/reductions', reductionsRoutes);
router.use('/panier', cartRoutes);
router.use('/contact', contactRoutes);
router.use('/pdf', pdfRoutes);
router.use('/countries', countryRoutes);
router.use('/destinations', destinationsRoutes);
router.use('/users', publicUserRoutes); // ⬅️ CHANGER user → users (pluriel)
router.use('/qr', qrCodeRoutes);
router.use('/mail', EmailRoutes);

module.exports = router;