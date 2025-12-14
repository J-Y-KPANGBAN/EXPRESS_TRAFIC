const express = require('express');
const router = express.Router();
const pdfController = require('../../controllers/public/pdfController');
const { auth, requireClient } = require('../../middleware/auth');
const { apiLimiter } = require('../../middleware/rateLimiter');

// CORRECTION: Utiliser les bonnes fonctions du contrôleur
// Télécharger un ticket par ID de réservation (protégé, client uniquement)
router.get('/ticket/:reservationId', auth, requireClient, pdfController.generateTicketPDF);

// Télécharger un ticket par code (public mais limité)
router.get('/ticket/download/:ticketCode', apiLimiter, pdfController.downloadTicket);

// Vérifier l'existence d'un ticket (public mais limité)
router.get('/ticket/check/:ticketCode', apiLimiter, pdfController.checkTicketExists);

// Envoyer le ticket par email (protégé, client uniquement)
router.get('/ticket/email/:reservationId', auth, requireClient, pdfController.sendTicketByEmail);

// Télécharger une facture (protégé, client uniquement)
router.get('/facture/:reservationId', auth, requireClient, pdfController.generateInvoicePDF);

module.exports = router;