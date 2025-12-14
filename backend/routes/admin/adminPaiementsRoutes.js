// backend/routes/admin/adminPaimentsRoutes.js (CORRIGÉ)
const express = require("express");
const router = express.Router();
const adminPaimentsController = require("../../controllers/admin/adminPaiementsController");
const { auth, requireAdmin } = require("../../middleware/auth");
const { validateInput } = require("../../middleware/validateInput"); // ⬅️ AJOUTEZ CETTE LIGNE

router.use(auth, requireAdmin);

// 💳 Liste paiements
router.get("/", adminPaimentsController.getAllPayments);

// 🔎 Détail d'un paiement
router.get("/:id", adminPaimentsController.getPaymentById);

// 🔄 Update statut paiement
router.put("/:id/statut", adminPaimentsController.updatePaymentStatus);

// ❌ Supprimer paiement
router.delete("/:id", adminPaimentsController.deletePayment);

// AJOUTER cette route
router.post("/:id/correction",
  validateInput({
    action: { type: 'string', required: true, enum: ['mark_as_paid', 'retry_payment', 'update_reference'] },
    nouvelle_reference: { type: 'string', required: false },
    motif_correction: { type: 'string', required: true }
  }),
  adminPaimentsController.correctPaymentError
);

router.post("/:id/remboursement", 
  validateInput({
    motif_remboursement: { type: 'string', required: true },
    montant_rembourse: { type: 'number', required: true, min: 0 }
  }),
  adminPaimentsController.processRefund
);

module.exports = router;