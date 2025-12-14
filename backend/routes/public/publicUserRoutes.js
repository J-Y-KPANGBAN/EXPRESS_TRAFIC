// backend/routes/public/publicUserRoutes.js (CORRIGÉ)
const express = require('express');
const router = express.Router();
const publicUserController = require('../../controllers/public/publicUserController'); // ⬅️ CORRIGE LE CHEMIN
const { auth, requireClient } = require('../../middleware/auth'); // ⬅️ CORRIGE UserAuth en auth

// ============================================
// 🔐 ROUTES PROTÉGÉES CLIENT 
// (bloque les admins pour l'espace client)
// ============================================

// ✅ Profil utilisateur
router.get('/profile', auth, requireClient, publicUserController.getProfile);

// ✅ Mise à jour profil
router.put('/profile', auth, requireClient, publicUserController.updateProfile);

// ✅ Mise à jour mot de passe
router.put('/password', auth, requireClient, publicUserController.updatePassword);

// ✅ Mise à jour photo
router.put('/photo', auth, requireClient, publicUserController.updatePhoto);

// ✅ Suppression compte
router.delete('/delete', auth, requireClient, publicUserController.deleteAccount);

module.exports = router;