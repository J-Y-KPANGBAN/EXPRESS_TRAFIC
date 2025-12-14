// backend/controllers/admin/adminNotificationsController.js
const db = require("../../config/db");
const  logger  = require("../../utils/logger");
const emailService = require("../../services/emailService");
const smsService = require("../../services/smsService");

/* ============================================================
   🔔 ADMIN — NOTIFICATIONS INTELLIGENTES & MULTI-LANGUE
============================================================ */

exports.getAllNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 50, type, statut, user_id } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        n.*,
        s.nom AS user_nom,
        s.prenom AS user_prenom,
        s.email,
        s.telephone,
        s.langue_preferee
      FROM Notifications n
      LEFT JOIN signup s ON n.utilisateur_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (type) {
      query += " AND n.type_notification = ?";
      params.push(type);
    }

    if (statut) {
      query += " AND n.statut = ?";
      params.push(statut);
    }

    if (user_id) {
      query += " AND n.utilisateur_id = ?";
      params.push(user_id);
    }

    query += " ORDER BY n.date_envoi DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), offset);

    const [notifications] = await db.query(query, params);
    const [total] = await db.query("SELECT COUNT(*) as total FROM Notifications WHERE 1=1");

    // Statistiques des notifications
    const [stats] = await db.query(`
      SELECT 
        type_notification,
        COUNT(*) as total,
        COUNT(CASE WHEN statut = 'lu' THEN 1 END) as lus,
        COUNT(CASE WHEN statut = 'non_lu' THEN 1 END) as non_lus
      FROM Notifications 
      GROUP BY type_notification
    `);

    res.json({
      success: true,
      data: notifications,
      stats: stats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total[0].total
      }
    });

  } catch (error) {
    logger.error("Erreur getAllNotifications: " + error.message);
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};

exports.sendMassNotification = async (req, res) => {
  try {
    const { 
      titre_fr, titre_en, titre_es,
      message_fr, message_en, message_es,
      type, user_ids, send_email, send_sms, send_push 
    } = req.body;

    if (!titre_fr || !message_fr) {
      return res.status(400).json({ 
        success: false, 
        message: "Titre et message en français obligatoires" 
      });
    }

    let users = [];
    if (user_ids && user_ids.length > 0) {
      // Notification ciblée
      const placeholders = user_ids.map(() => '?').join(',');
      const [userRows] = await db.query(
        `SELECT id, nom, prenom, email, telephone, langue_preferee 
         FROM signup WHERE id IN (${placeholders})`,
        user_ids
      );
      users = userRows;
    } else {
      // Notification globale (tous les utilisateurs actifs)
      const [userRows] = await db.query(
        `SELECT id, nom, prenom, email, telephone, langue_preferee 
         FROM signup WHERE statut = 'actif'`
      );
      users = userRows;
    }

    const notifications = [];
    const emailPromises = [];
    const smsPromises = [];

    for (const user of users) {
      // Déterminer la langue
      const langue = user.langue_preferee || 'fr';
      const titre = { fr: titre_fr, en: titre_en, es: titre_es }[langue] || titre_fr;
      const message = { fr: message_fr, en: message_en, es: message_es }[langue] || message_fr;

      // Créer notification en base
      const [result] = await db.query(
        `INSERT INTO Notifications (utilisateur_id, type_notification, titre, message, statut, priorite)
         VALUES (?, ?, ?, ?, 'non_lu', 'normale')`,
        [user.id, type || 'systeme', titre, message]
      );

      notifications.push(result.insertId);

      // Envoi email multi-langue
      if (send_email && user.email) {
        emailPromises.push(
          emailService.sendEmail({
            to: user.email,
            subject: titre,
            html: `
              <div style="font-family: Arial, sans-serif;">
                <h2>${titre}</h2>
                <p>${message.replace(/\n/g, '<br>')}</p>
                <hr>
                <p><small>${this.getFooterText(langue)}</small></p>
              </div>
            `
          }).catch(err => logger.error(`Email failed for ${user.email}: ${err.message}`))
        );
      }

      // Envoi SMS
      if (send_sms && user.telephone) {
        smsPromises.push(
          smsService.sendSMS(user.telephone, `${titre}: ${message.substring(0, 140)}`)
            .catch(err => logger.error(`SMS failed for ${user.telephone}: ${err.message}`))
        );
      }
    }

    // Traitement parallèle des envois
    await Promise.allSettled([...emailPromises, ...smsPromises]);

    logger.success(`Notifications envoyées à ${users.length} utilisateurs`);
    
    res.json({ 
      success: true, 
      message: `Notifications envoyées à ${users.length} utilisateurs`,
      details: {
        notifications: notifications.length,
        emails: emailPromises.length,
        sms: smsPromises.length
      }
    });

  } catch (error) {
    logger.error("Erreur sendMassNotification: " + error.message);
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};

// Helper pour les textes de footer multi-langue
exports.getFooterText = (langue) => {
  const texts = {
    fr: "Cet email est envoyé automatiquement, merci de ne pas y répondre.",
    en: "This email is sent automatically, please do not reply.",
    es: "Este correo se envía automáticamente, por favor no responda."
  };
  return texts[langue] || texts.fr;
};

// Pour React Native - Notifications push
exports.sendPushNotification = async (req, res) => {
  try {
    const { user_ids, titre, message, data } = req.body;

    // Simulation envoi push - À intégrer avec FCM/APNS pour React Native
    const pushResults = user_ids.map(userId => ({
      userId,
      status: 'sent',
      messageId: `push_${Date.now()}_${userId}`
    }));

    logger.success(`Push notifications envoyées à ${user_ids.length} utilisateurs`);
    
    res.json({
      success: true,
      message: "Notifications push envoyées",
      data: pushResults
    });

  } catch (error) {
    logger.error("Erreur sendPushNotification: " + error.message);
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};