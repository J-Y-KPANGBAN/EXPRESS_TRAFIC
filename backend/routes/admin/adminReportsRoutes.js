// backend/routes/admin/adminReportsRoutes.js
const express = require("express");
const router = express.Router();
const adminReportsController = require("../../controllers/admin/adminReportsController");
const { auth, requireAdmin } = require("../../middleware/auth");
const { validateInput } = require("../../middleware/validateInput");

router.use(auth, requireAdmin);

// 📊 RAPPORTS FINANCIERS
router.get("/financial",
  validateInput({
    periode: { type: 'string', required: false, enum: ['today', 'week', 'month', 'custom'] },
    date_debut: { type: 'string', required: false, format: 'date' },
    date_fin: { type: 'string', required: false, format: 'date' },
    format: { type: 'string', required: false, enum: ['json', 'pdf'] }
  }),
  adminReportsController.getFinancialReports
);

// 👥 ANALYTIQUES UTILISATEURS
router.get("/users",
  validateInput({
    date_debut: { type: 'string', required: false, format: 'date' },
    date_fin: { type: 'string', required: false, format: 'date' }
  }),
  adminReportsController.getUserAnalytics
);

// 🚌 PERFORMANCES TRAJETS
router.get("/trajets",
  validateInput({
    date_debut: { type: 'string', required: false, format: 'date' },
    date_fin: { type: 'string', required: false, format: 'date' }
  }),
  adminReportsController.getTrajetsPerformance
);

// 💳 STATISTIQUES PAIEMENTS
router.get("/paiements",
  validateInput({
    periode: { type: 'string', required: false, enum: ['today', 'week', 'month', 'year'] }
  }),
  adminReportsController.getPaymentsStats
);

// 📈 RAPPORT COMPLET (Toutes les données)
router.get("/complet",
  validateInput({
    date_debut: { type: 'string', required: true, format: 'date' },
    date_fin: { type: 'string', required: true, format: 'date' },
    format: { type: 'string', required: false, enum: ['json', 'pdf', 'excel'] }
  }),
  adminReportsController.getCompleteReport
);

module.exports = router;