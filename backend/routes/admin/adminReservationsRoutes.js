const express = require("express");
const router = express.Router();

// Import des contrôleurs et middleware
const adminReservationsController = require("../../controllers/admin/adminReservationsController");
const { auth, requireAdmin } = require("../../middleware/auth");
const { validateInput } = require("../../middleware/validateInput");
const { adminLimiter, createReservationLimiter } = require("../../middleware/rateLimiter");

// 🔐 MIDDLEWARE ADMIN RENFORCÉ
router.use(auth);
router.use(requireAdmin);

// 📦 LISTE DE TOUTES LES RÉSERVATIONS
router.get("/", 
  adminLimiter,
  validateInput({
    page: { type: 'number', required: false, min: 1, max: 1000 },
    limit: { type: 'number', required: false, min: 1, max: 100 },
    statut: { type: 'string', required: false, enum: ['confirmee', 'en_attente', 'annulee', 'termine'] },
    date_debut: { type: 'string', required: false, format: 'date' },
    date_fin: { type: 'string', required: false, format: 'date' },
    trajet_id: { type: 'string', required: false, minLength: 3, maxLength: 10, pattern: /^TR[A-Z0-9]+$/ }
  }, 'query'),
  adminReservationsController.getAllReservations
);

// 🔎 DÉTAIL D'UNE RÉSERVATION
router.get("/:reservationId",
  adminLimiter,
  validateInput({
    reservationId: { type: 'number', required: true, min: 1, max: 999999 }
  }, 'params'),
  adminReservationsController.getReservationById
);

// ➕ CRÉER UNE RÉSERVATION POUR UN CLIENT
router.post("/create",
  createReservationLimiter,
  validateInput({
    client_email: { type: 'string', required: true, format: 'email', maxLength: 150 },
    client_nom: { type: 'string', required: true, minLength: 2, maxLength: 100, pattern: /^[A-Za-zÀ-ÿ -]+$/ },
    client_prenom: { type: 'string', required: true, minLength: 2, maxLength: 100, pattern: /^[A-Za-zÀ-ÿ -]+$/ },
    trajet_id: { type: 'string', required: true, minLength: 3, maxLength: 10, pattern: /^TR[A-Z0-9]+$/ },
    siege_numero: { type: 'number', required: true, min: 1, max: 100 },
    moyen_paiement: { type: 'string', required: false, enum: ['carte', 'mobile_money', 'paypal', 'especes'] },
    arret_depart: { type: 'string', required: false, maxLength: 255 },
    arret_arrivee: { type: 'string', required: false, maxLength: 255 },
    prix_calcule: { type: 'number', required: false, min: 0, max: 1000 }
  }, 'body'),
  adminReservationsController.createReservationForClient
);

// 🔄 MODIFIER UNE RÉSERVATION
router.put("/:reservationId",
  adminLimiter,
  validateInput({
    reservationId: { type: 'number', required: true, min: 1, max: 999999 }
  }, 'params'),
  validateInput({
    etat_reservation: { type: 'string', required: false, enum: ['confirmee', 'en_attente', 'annulee', 'termine'] },
    siege_numero: { type: 'number', required: false, min: 1, max: 100 },
    montant_total: { type: 'number', required: false, min: 0, max: 1000 },
    notes: { type: 'string', required: false, maxLength: 500 }
  }, 'body'),
  adminReservationsController.updateReservation
);

// ❌ ANNULER UNE RÉSERVATION
router.put("/:reservationId/cancel",
  adminLimiter,
  validateInput({
    reservationId: { type: 'number', required: true, min: 1, max: 999999 }
  }, 'params'),
  validateInput({
    raison_annulation: { type: 'string', required: false, maxLength: 500 }
  }, 'body'),
  adminReservationsController.cancelReservation
);

// 📊 STATISTIQUES DES RÉSERVATIONS
router.get("/stats/overview",
  adminLimiter,
  validateInput({
    periode: { type: 'string', required: false, enum: ['7', '30', '90', '365'] }
  }, 'query'),
  adminReservationsController.getReservationsStats
);

module.exports = router;