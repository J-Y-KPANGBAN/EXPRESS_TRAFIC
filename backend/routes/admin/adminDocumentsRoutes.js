// backend/routes/admin/adminDocumentsRoutes.js
const express = require("express");
const router = express.Router();
const adminDocumentsController = require("../../controllers/admin/adminDocumentsController");
const { auth, requireAdmin } = require("../../middleware/auth");
const { validateInput } = require("../../middleware/validateInput");

router.use(auth, requireAdmin);

// 🎫 GÉNÉRER UN BILLET PDF
router.get("/billet/:reservation_id", adminDocumentsController.generateTicket);

// 🧾 GÉNÉRER UN REÇU PDF
router.get("/recu/:payment_id", adminDocumentsController.generateReceipt);

// 📊 GÉNÉRER RAPPORT FINANCIER
router.get("/rapport-financier",
  validateInput({
    date_debut: { type: 'string', required: true, format: 'date' },
    date_fin: { type: 'string', required: true, format: 'date' }
  }),
  adminDocumentsController.generateFinancialReport
);

module.exports = router;