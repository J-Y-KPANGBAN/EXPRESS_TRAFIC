// backend/routes/admin/adminSystemRoutes.js - VERSION CORRIGÉE
const express = require("express");
const router = express.Router();
const adminSystemController = require("../../controllers/admin/adminSystemController");
const { auth, requireAdmin } = require("../../middleware/auth");
const { validateInput } = require("../../middleware/validateInput");

router.use(auth, requireAdmin);

// ⚙️ PARAMÈTRES SYSTÈME
router.get("/settings", adminSystemController.getSystemSettings);

router.put("/settings",
  validateInput({
    maintenance_mode: { type: 'boolean', required: false },
    maintenance_message: { type: 'string', required: false },
    default_language: { type: 'string', required: false, enum: ['fr', 'en', 'es'] },
    session_timeout_minutes: { type: 'number', required: false, min: 1, max: 1440 },
    password_expiry_months: { type: 'number', required: false, min: 1, max: 24 },
    inactivity_warning_months: { type: 'number', required: false, min: 1, max: 24 },
    inactivity_deletion_months: { type: 'number', required: false, min: 1, max: 36 }
  }),
  adminSystemController.updateSystemSettings
);

// 🩺 SANTÉ DU SYSTÈME
router.get("/health", adminSystemController.getSystemHealth);

// 📱 CONFIGURATION MOBILE (React Native)
router.get("/mobile-config", adminSystemController.getMobileConfig);

// 🗄️ SAUVEGARDE BASE DE DONNÉES
router.post("/backup", adminSystemController.createBackup); // ✅ MAINTENANT DISPONIBLE

// 📊 LOGS SYSTÈME
router.get("/logs",
  validateInput({
    type: { type: 'string', required: false, enum: ['error', 'info', 'warning', 'all'] },
    date_debut: { type: 'string', required: false, format: 'date' },
    date_fin: { type: 'string', required: false, format: 'date' },
    limit: { type: 'number', required: false, min: 1, max: 1000 }
  }),
  adminSystemController.getSystemLogs // ✅ MAINTENANT DISPONIBLE
);

// 🔧 MAINTENANCE AUTOMATIQUE
router.post("/maintenance",
  validateInput({
    action: { type: 'string', required: true, enum: ['start', 'stop'] },
    message: { type: 'string', required: false },
    duration_minutes: { type: 'number', required: false, min: 1 }
  }),
  adminSystemController.triggerMaintenance // ✅ MAINTENANT DISPONIBLE
);

// 🧹 NETTOYAGE DES LOGS (NOUVELLE ROUTE)
router.delete("/logs/cleanup",
  validateInput({
    days_old: { type: 'number', required: false, min: 1, max: 365 }
  }),
  adminSystemController.cleanupLogs
);

module.exports = router;