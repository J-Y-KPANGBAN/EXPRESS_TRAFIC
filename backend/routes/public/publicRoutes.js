// routes/public/publicRoutes.js
const express = require("express");
const router = express.Router();
const publicTrajetController = require("../../controllers/public/publicTrajetController");
const { apiLimiter } = require("../../middleware/rateLimiter");

// ==========================================================
// 🚌 ROUTES PUBLIQUES POUR LES TRAJETS
// ==========================================================

// ✅ Test base de données
router.get("/test/db", publicTrajetController.testDatabase);

// ✅ Liste des trajets (recherche principale)
router.get("/trajets", apiLimiter, publicTrajetController.getTrajets);

// ✅ Trajets populaires (BASÉS SUR RÉSERVATIONS RÉELLES)
router.get("/trajets/popular", apiLimiter, publicTrajetController.getPopularTrajets);

// ✅ Liste des villes disponibles
router.get("/trajets/villes", apiLimiter, publicTrajetController.getVilles);

// ✅ Détails d'un trajet spécifique
router.get("/trajets/:trajetId", apiLimiter, publicTrajetController.getTrajetById);

// ✅ Sièges disponibles pour un trajet
router.get("/trajets/:trajetId/sieges", apiLimiter, publicTrajetController.getSiegesDisponibles);

// ✅ Recherche avancée avec arrêts
router.get("/trajets/search/avance", apiLimiter, publicTrajetController.searchTrajetsWithArrets);

module.exports = router;