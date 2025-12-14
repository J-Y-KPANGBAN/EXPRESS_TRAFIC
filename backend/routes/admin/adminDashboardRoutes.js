// backend/routes/admin/adminDashboardRoutes.js
const express = require("express");
const router = express.Router();
const adminDashboardController = require("../../controllers/admin/adminDashboardController");
const { auth, requireAdmin } = require("../../middleware/auth");

router.use(auth, requireAdmin);

// 📊 Tableau de bord statistiques
router.get('/stats', adminDashboardController.getStats);

module.exports = router;