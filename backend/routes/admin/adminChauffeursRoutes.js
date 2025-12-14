// backend/routes/admin/adminChauffeursRoutes.js

const express = require("express");
const router = express.Router();
const adminChauffeursController = require("../../controllers/admin/adminChauffeursController");
const { auth, requireAdmin } = require("../../middleware/auth");

// 🛡 Accès admin requis
router.use(auth, requireAdmin);

// 🚖 Liste chauffeurs
router.get("/", adminChauffeursController.getAllChauffeurs);

// 🔎 Détail
router.get("/:id", adminChauffeursController.getChauffeurById);

// ➕ Créer chauffeur
router.post("/", adminChauffeursController.createChauffeur);

// 🔄 Modifier chauffeur
router.put("/:id", adminChauffeursController.updateChauffeur);

// ❌ Supprimer chauffeur
router.delete("/:id", adminChauffeursController.deleteChauffeur);

module.exports = router;
