const express = require("express");
const router = express.Router();
const { auth, requireAdmin, requireSuperAdmin } = require("../../middleware/auth");
const { validateInput } = require("../../middleware/validateInput");
const { adminLimiter } = require("../../middleware/rateLimiter");
const adminTrajetsController = require("../../controllers/admin/adminTrajetsController");

// 🔐 MIDDLEWARE ADMIN RENFORCÉ
router.use(auth, requireAdmin);

// 📋 LISTE TRAJETS AVEC PAGINATION ET FILTRES
router.get("/", 
  adminLimiter,
  validateInput({
    page: { type: 'number', required: false, min: 1, max: 1000 },
    limit: { type: 'number', required: false, min: 1, max: 100 },
    date_debut: { type: 'string', required: false, format: 'date' },
    date_fin: { type: 'string', required: false, format: 'date' },
    ville_depart: { type: 'string', required: false, minLength: 1, maxLength: 100 },
    ville_arrivee: { type: 'string', required: false, minLength: 1, maxLength: 100 },
    etat: { type: 'string', required: false, enum: ['actif', 'annule', 'termine', 'complet'] }
  }, 'query'),
  adminTrajetsController.getAllTrajets
);

// 🔍 TRAJET PAR ID
router.get("/:id",
  adminLimiter,
  validateInput({
    id: { type: 'string', required: true, minLength: 3, maxLength: 10, pattern: /^TR[A-Z0-9]+$/ }
  }, 'params'),
  adminTrajetsController.getTrajetByIdAdmin
);

// ➕ CRÉATION TRAJET
router.post("/",
  adminLimiter,
  validateInput({
    ville_depart: { type: 'string', required: true, minLength: 1, maxLength: 100, pattern: /^[A-Za-zÀ-ÿ -]+$/ },
    ville_arrivee: { type: 'string', required: true, minLength: 1, maxLength: 100, pattern: /^[A-Za-zÀ-ÿ -]+$/ },
    date_depart: { type: 'string', required: true, format: 'date' },
    heure_depart: { type: 'string', required: true, pattern: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
    duree: { type: 'string', required: false, pattern: /^([0-9]+):[0-5][0-9]:[0-5][0-9]$/ },
    prix: { type: 'number', required: true, min: 0, max: 1000 },
    bus_id: { type: 'string', required: false, minLength: 1, maxLength: 10, pattern: /^BUS[A-Z0-9]+$/ },
    places_total: { type: 'number', required: false, min: 1, max: 100 },
    description: { type: 'string', required: false, maxLength: 1000 },
    conditions_annulation: { type: 'string', required: false, maxLength: 1000 }
  }, 'body'),
  adminTrajetsController.createTrajet
);

// ✏️ MISE À JOUR TRAJET
router.put("/:id",
  adminLimiter,
  validateInput({
    id: { type: 'string', required: true, minLength: 3, maxLength: 10, pattern: /^TR[A-Z0-9]+$/ }
  }, 'params'),
  validateInput({
    ville_depart: { type: 'string', required: false, minLength: 1, maxLength: 100, pattern: /^[A-Za-zÀ-ÿ -]+$/ },
    ville_arrivee: { type: 'string', required: false, minLength: 1, maxLength: 100, pattern: /^[A-Za-zÀ-ÿ -]+$/ },
    date_depart: { type: 'string', required: false, format: 'date' },
    heure_depart: { type: 'string', required: false, pattern: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
    duree: { type: 'string', required: false, pattern: /^([0-9]+):[0-5][0-9]:[0-5][0-9]$/ },
    prix: { type: 'number', required: false, min: 0, max: 1000 },
    bus_id: { type: 'string', required: false, minLength: 1, maxLength: 10, pattern: /^BUS[A-Z0-9]+$/ },
    places_total: { type: 'number', required: false, min: 1, max: 100 },
    description: { type: 'string', required: false, maxLength: 1000 },
    conditions_annulation: { type: 'string', required: false, maxLength: 1000 },
    etat_trajet: { type: 'string', required: false, enum: ['actif', 'annule', 'termine', 'complet'] }
  }, 'body'),
  adminTrajetsController.updateTrajet
);

// 🗑️ SUPPRESSION TRAJET (Uniquement super_admin)
router.delete("/:id",
  adminLimiter,
  requireSuperAdmin,
  validateInput({
    id: { type: 'string', required: true, minLength: 3, maxLength: 10, pattern: /^TR[A-Z0-9]+$/ }
  }, 'params'),
  adminTrajetsController.deleteTrajet
);

module.exports = router;