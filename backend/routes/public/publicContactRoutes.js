// backend/routes/public/publicContactRoutes.js (MISE À JOUR)
const express = require('express');
const router = express.Router();
const publicContactController = require('../../controllers/public/publicContactController');
const { validateContactInput } = require('../../middleware/validateInput');
const { apiLimiter } = require('../../middleware/rateLimiter')

// 💌 Envoi d'un message de contact (public)
router.post('/', apiLimiter, validateContactInput, publicContactController.sendMessage);

module.exports = router;