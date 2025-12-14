// backend/routes/admin/adminNotificationsRoutes.js
const express = require("express");
const router = express.Router();
const adminNotificationsController = require("../../controllers/admin/adminNotificationsController");
const { auth, requireAdmin } = require("../../middleware/auth");
const { validateInput } = require("../../middleware/validateInput");
//const validateInput = require("../../middleware/validateInput");

// 🔐 Toutes les routes nécessitent un admin authentifié
router.use(auth, requireAdmin);

// 🔔 LISTE DES NOTIFICATIONS
router.get("/", adminNotificationsController.getAllNotifications);

// 📤 ENVOI NOTIFICATION MASSIVE (email, SMS, push)
router.post("/mass", 
  validateInput({
    titre_fr: { type: 'string', required: true },
    message_fr: { type: 'string', required: true },
    type: { type: 'string', required: false },
    user_ids: { type: 'array', required: false },
    send_email: { type: 'boolean', required: false },
    send_sms: { type: 'boolean', required: false },
    send_push: { type: 'boolean', required: false }
  }),
  adminNotificationsController.sendMassNotification
);

// 📱 NOTIFICATIONS PUSH (React Native)
router.post("/push",
  validateInput({
    user_ids: { type: 'array', required: true },
    titre: { type: 'string', required: true },
    message: { type: 'string', required: true },
    data: { type: 'object', required: false }
  }),
  adminNotificationsController.sendPushNotification
);

// 📊 STATISTIQUES NOTIFICATIONS
router.get("/stats", (req, res) => {
  // Raccourci vers le contrôleur avec paramètres de stats
  req.query.type = 'stats';
  adminNotificationsController.getAllNotifications(req, res);
});

module.exports = router;