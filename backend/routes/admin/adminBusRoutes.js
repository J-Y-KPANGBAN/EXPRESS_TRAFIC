// backend/routes/admin/adminBusRoutes.js
const express = require("express");
const router = express.Router();
const adminBusController = require("../../controllers/admin/adminBusController");
const { auth, requireAdmin } = require("../../middleware/auth");

router.use(auth, requireAdmin);

// 🚌 Liste bus
router.get("/", adminBusController.getAllBus);

// 🔎 Détail bus
router.get("/:id", adminBusController.getBusById);

// ➕ Ajouter bus
router.post("/", adminBusController.createBus);

// 🔄 Modifier bus
router.put("/:id", adminBusController.updateBus);

// ❌ Supprimer bus
router.delete("/:id", adminBusController.deleteBus);

module.exports = router;
