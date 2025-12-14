// backend/routes/admin/adminServiceFeesRoutes.js - VERSION SÉCURISÉE
const express = require("express");
const router = express.Router();
const adminServiceFeesController = require("../../controllers/admin/adminServiceFeesController");
const { auth, requireAdmin } = require("../../middleware/auth");
const { validateInput } = require("../../middleware/validateInput");

router.use(auth, requireAdmin);

// 💸 LISTE DES FRAIS DE SERVICE
router.get("/",
  validateInput({
    page: { type: 'number', required: false, min: 1 },
    limit: { type: 'number', required: false, min: 1, max: 100 },
    active_only: { type: 'string', required: false, enum: ['true', 'false'] }
  }),
  adminServiceFeesController.getAllServiceFees
);

// ➕ CRÉER UN FRAIS DE SERVICE
router.post("/",
  validateInput({
    name: { type: 'string', required: true, minLength: 1, maxLength: 100 },
    fee_type: { type: 'string', required: true, enum: ['pourcentage', 'fixe'] },
    value: { type: 'number', required: true, min: 0, max: 1000 },
    apply_on: { type: 'string', required: true, enum: ['billet', 'panier', 'transaction', 'siege'] },
    context: { type: 'string', required: false, minLength: 1, maxLength: 50 },
    active: { type: 'boolean', required: false },
    start_date: { type: 'string', required: false, format: 'date' },
    end_date: { type: 'string', required: false, format: 'date' },
    description: { type: 'string', required: false, maxLength: 500 }
  }),
  adminServiceFeesController.createServiceFee
);

// 🔄 METTRE À JOUR UN FRAIS
router.put("/:id",
  validateInput({
    id: { type: 'number', required: true, min: 1 }
  }),
  adminServiceFeesController.updateServiceFee
);

// ❌ SUPPRIMER UN FRAIS
router.delete("/:id",
  validateInput({
    id: { type: 'number', required: true, min: 1 }
  }),
  adminServiceFeesController.deleteServiceFee
);

// 🔍 CALCULER L'IMPACT DES FRAIS
router.post("/calculate",
  validateInput({
    montant_base: { type: 'number', required: true, min: 0, max: 100000 },
    type_transaction: { type: 'string', required: true, enum: ['billet', 'panier', 'transaction', 'siege'] },
    contexte: { type: 'string', required: false, minLength: 1, maxLength: 50 }
  }),
  adminServiceFeesController.calculateFees
);

module.exports = router;