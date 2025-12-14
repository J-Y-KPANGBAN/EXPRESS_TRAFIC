// backend/routes/admin/adminUserRoutes.js - VERSION CORRIGÉE
const express = require("express");
const router = express.Router();
const adminUserController = require("../../controllers/admin/adminUserController");
const { auth, requireAdmin } = require("../../middleware/auth");
const { validateInput } = require("../../middleware/validateInput");

router.use(auth, requireAdmin);

// 👤 PROFIL ADMIN
router.get('/profile', adminUserController.getAdminProfile);
router.put('/profile', adminUserController.updateAdminProfile);

// 👥 GESTION DES UTILISATEURS
router.get('/users', 
  validateInput({
    page: { type: 'number', required: false, min: 1 },
    limit: { type: 'number', required: false, min: 1, max: 100 },
    type_utilisateur: { type: 'string', required: false, enum: ['client', 'admin', 'conducteur'] },
    statut: { type: 'string', required: false, enum: ['actif', 'inactif', 'suspendu'] }
  }),
  adminUserController.getAllUsers
);

// 🔍 RECHERCHE UTILISATEURS
router.get('/users/search',
  validateInput({
    q: { type: 'string', required: true, minLength: 2 },
    page: { type: 'number', required: false, min: 1 },
    limit: { type: 'number', required: false, min: 1, max: 100 }
  }),
  adminUserController.searchUsers
);

// 👤 UTILISATEUR SPÉCIFIQUE
router.get('/users/:id',
  validateInput({
    id: { type: 'number', required: true, min: 1 }
  }),
  adminUserController.getUserById
);

// 📝 MODIFICATION STATUT
router.put('/users/:id/statut',
  validateInput({
    id: { type: 'number', required: true, min: 1 },
    statut: { type: 'string', required: true, enum: ['actif', 'inactif', 'suspendu'] }
  }),
  adminUserController.updateUserStatus
);

// 🗑️ SUPPRESSION UTILISATEUR
router.delete('/users/:id',
  validateInput({
    id: { type: 'number', required: true, min: 1 }
  }),
  adminUserController.deleteUser
);

module.exports = router;