const express = require('express');
const router = express.Router();
const publicDestinationsController = require('../../controllers/public/publicDestinationsController');
const { apiLimiter } = require('../../middleware/rateLimiter');

// ⭐ Trajets populaires (public)
router.get('/popular-trips', apiLimiter, publicDestinationsController.getPopularTrips);

// 🔥 Destinations tendances (nouvelle route)
router.get('/trending', apiLimiter, publicDestinationsController.getTrendingDestinations);

module.exports = router;