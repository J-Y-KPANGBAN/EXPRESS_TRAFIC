// backend/routes/admin/adminReductionsRoutes.js
const express = require("express");
const router = express.Router();
const adminReductionsController = require("../../controllers/admin/adminReductionsController");
const { auth, requireAdmin } = require("../../middleware/auth");
const { validateInput } = require("../../middleware/validateInput");

router.use(auth, requireAdmin);

// 💰 LISTE DES RÉDUCTIONS
router.get("/", adminReductionsController.getAllReductions);

// ➕ CRÉER UNE RÉDUCTION
router.post("/",
  validateInput({
    code: { type: 'string', required: false },
    pourcentage: { type: 'number', required: false, min: 0, max: 100 },
    montant_fixe: { type: 'number', required: false, min: 0 },
    type_reduction: { type: 'string', required: true, enum: ['pourcentage', 'montant_fixe'] },
    date_debut: { type: 'string', required: true, format: 'date' },
    date_fin: { type: 'string', required: true, format: 'date' },
    utilisations_max: { type: 'number', required: false, min: 1 },
    conditions: { type: 'object', required: false }
  }),
  adminReductionsController.createReduction
);

// 🔍 VALIDER UN CODE (accessible aussi en public pour vérification)
router.post("/validate",
  validateInput({
    code: { type: 'string', required: true },
    montant_panier: { type: 'number', required: true, min: 0 }
  }),
  adminReductionsController.validateReduction
);

// 🔄 METTRE À JOUR UNE RÉDUCTION
router.put("/:id",
  validateInput({
    pourcentage: { type: 'number', required: false, min: 0, max: 100 },
    montant_fixe: { type: 'number', required: false, min: 0 },
    date_debut: { type: 'string', required: false, format: 'date' },
    date_fin: { type: 'string', required: false, format: 'date' },
    utilisations_max: { type: 'number', required: false, min: 1 },
    statut: { type: 'string', required: false, enum: ['actif', 'inactif', 'epuise'] }
  }),
  adminReductionsController.updateReduction
);

// ❌ SUPPRIMER UNE RÉDUCTION
router.delete("/:id", adminReductionsController.deleteReduction);

// 📊 STATISTIQUES D'UTILISATION
router.get("/:id/stats", adminReductionsController.getReductionStats);

module.exports = router;