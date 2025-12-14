// backend/routes/admin/adminAvisRoutes.js

const express = require("express");
const router = express.Router();
const adminAvisController = require("../../controllers/admin/adminAvisController");
const { auth, requireAdmin } = require("../../middleware/auth");

// Accès admin
router.use(auth, requireAdmin);

// ⭐ Tous les avis
router.get("/", adminAvisController.getAllAvis);

// 🔎 Avis par ID
router.get("/:id", adminAvisController.getAvisById);

// 🛠 Modération avis
router.put("/:id/statut", adminAvisController.updateAvisStatus);

// ❌ Suppression avis
router.delete("/:id", adminAvisController.deleteAvis);

module.exports = router;
