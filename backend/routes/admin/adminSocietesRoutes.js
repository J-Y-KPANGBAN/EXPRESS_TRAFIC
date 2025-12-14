// backend/routes/admin/adminSocietesRoutes.js

const express = require("express");
const router = express.Router();
const adminSocietesController = require("../../controllers/admin/adminSocietesController");
const { auth, requireAdmin } = require("../../middleware/auth");

// Sécurisation admin
router.use(auth, requireAdmin);

// 🏢 Liste sociétés
router.get("/", adminSocietesController.getAllSocietes);

// 🔎 Détail société
router.get("/:id", adminSocietesController.getSocieteById);

// ➕ Ajouter société
router.post("/", adminSocietesController.createSociete);

// 🔄 Modifier société
router.put("/:id", adminSocietesController.updateSociete);

// ❌ Supprimer société
router.delete("/:id", adminSocietesController.deleteSociete);

module.exports = router;
