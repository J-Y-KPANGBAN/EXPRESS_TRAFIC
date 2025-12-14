// backend/routes/public/countryRoutes.js
const express = require('express');
const router = express.Router();
const countryController = require('../../controllers/public/countryController');
const { apiLimiter } = require('../../middleware/rateLimiter');

// 🌍 Liste des pays (public)
router.get('/', apiLimiter, countryController.getCountries);

module.exports = router;