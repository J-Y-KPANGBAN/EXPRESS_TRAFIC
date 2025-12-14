// backend/routes/admin/adminContactsRoutes.js

const express = require("express");
const router = express.Router();
const adminContactsController = require("../../controllers/admin/adminContactsController");
const { auth, requireAdmin } = require("../../middleware/auth");

// Accès admin
router.use(auth, requireAdmin);

// 📩 Liste messages contact
router.get("/", adminContactsController.getAllContacts);

// 🔎 Détail message
router.get("/:id", adminContactsController.getContactById);

// 🔄 Mettre à jour statut
router.put("/:id/statut", adminContactsController.updateContactStatus);

// ❌ Supprimer message
router.delete("/:id", adminContactsController.deleteContact);

module.exports = router;
