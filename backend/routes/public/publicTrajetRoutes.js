const express = require("express");
const router = express.Router();
const publicTrajetController = require("../../controllers/public/publicTrajetController");
const { auth, requireClient } = require("../../middleware/auth");
const { apiLimiter, reservationLimiter } = require("../../middleware/rateLimiter");

// ==========================================================
// 🚌 ROUTES PUBLIQUES - CORRIGÉES
// ==========================================================

// ✅ Test base de données
router.get("/test/db", publicTrajetController.testDatabase);

// ✅ Liste des trajets (route racine)
router.get("/", apiLimiter, publicTrajetController.getTrajets);

// ✅ Trajets populaires - ROUTE CORRIGÉE
router.get("/popular", apiLimiter, publicTrajetController.getPopularTrajets);

// ✅ Liste des villes - ROUTE CORRIGÉE  
router.get("/villes", apiLimiter, publicTrajetController.getVilles);


// ✅ Recherche avancée
router.get("/search/avance", apiLimiter, publicTrajetController.searchTrajetsWithArrets);

// ✅ Détails d'un trajet (DOIT ÊTRE APRÈS les routes fixes)
router.get("/:trajetId", apiLimiter, publicTrajetController.getTrajetById);

// ✅ Sièges disponibles
router.get("/:trajetId/sieges", apiLimiter, publicTrajetController.getSiegesDisponibles);

// ==========================================================
// 🎫 ROUTES AUTHENTIFIÉES (CLIENTS)
// ==========================================================

router.use(auth);
router.use(requireClient);

// ✅ Réserver un trajet
router.post("/:trajetId/reserver", reservationLimiter, publicTrajetController.reserverTrajet);

module.exports = router;