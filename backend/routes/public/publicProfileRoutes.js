// backend/routes/public/publicProfileRoutes.js
const express = require('express');
const router = express.Router();
const publicProfileController = require('../../controllers/public/publicProfileController');
const { auth, requireClient } = require('../../middleware/auth');

// ============================================
// 🔐 ROUTES PROTÉGÉES CLIENT
// ============================================

// ✅ Obtenir le profil utilisateur
router.get('/', auth, requireClient, publicProfileController.getProfile);

// ✅ Mettre à jour le profil
router.put('/', auth, requireClient, publicProfileController.updateProfile);

// ✅ Mettre à jour le mot de passe
router.put('/password', auth, requireClient, publicProfileController.updatePassword);

// ✅ Mettre à jour la photo de profil
router.put('/photo', auth, requireClient, publicProfileController.updatePhoto);

// ✅ Supprimer le compte
router.delete('/', auth, requireClient, publicProfileController.deleteAccount);

module.exports = router;