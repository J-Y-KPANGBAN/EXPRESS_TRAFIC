// backend/routes/admin/adminArretsRoutes.js
const express = require("express");
const router = express.Router();
const adminArretsController = require("../../controllers/admin/adminArretsController");
const { auth, requireAdmin } = require("../../middleware/auth");
const { validateInput } = require("../../middleware/validateInput");

router.use(auth, requireAdmin);

// 🚏 LISTE DES ARRÊTS (avec filtre trajet optionnel)
router.get("/", adminArretsController.getAllArrets);

// 🔍 ARRÊTS PAR TRAJET
router.get("/trajet/:trajet_id", adminArretsController.getArretsByTrajet);

// ➕ CRÉER UN ARRÊT
router.post("/",
  validateInput({
    trajet_id: { type: 'string', required: true },
    nom_arret: { type: 'string', required: true },
    ordre: { type: 'number', required: true, min: 1 },
    heure_arrivee: { type: 'string', required: true },
    heure_depart: { type: 'string', required: true },
    prix_arret: { type: 'number', required: false, min: 0 },
    adresse_arret: { type: 'string', required: false }
  }),
  adminArretsController.createArret
);

// 🔄 MODIFIER UN ARRÊT
router.put("/:id",
  validateInput({
    nom_arret: { type: 'string', required: false },
    ordre: { type: 'number', required: false, min: 1 },
    heure_arrivee: { type: 'string', required: false },
    heure_depart: { type: 'string', required: false },
    prix_arret: { type: 'number', required: false, min: 0 },
    adresse_arret: { type: 'string', required: false }
  }),
  adminArretsController.updateArret
);

// ❌ SUPPRIMER UN ARRÊT
router.delete("/:id", adminArretsController.deleteArret);

module.exports = router;