// backend/controllers/public/publicContactController.js
const db = require("../../config/db");
const { isValidEmail, isValidPhone, logger } = require("../../utils/validators");

exports.sendMessage = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      telephone,
      sujet,
      sousSujet,
      message,
      indicatif,
    } = req.body;

    logger.info("📩 Nouvelle demande de contact reçue");

    // --- Validation des champs obligatoires ---
    if (!firstName || !lastName || !email || !sujet || !message) {
      return res.status(400).json({
        success: false,
        message: "Veuillez remplir tous les champs obligatoires.",
      });
    }

    // --- Vérification email ---
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Adresse email invalide.",
      });
    }

    // --- Vérification téléphone ---
    if (telephone && !isValidPhone(telephone)) {
      return res.status(400).json({
        success: false,
        message: "Numéro de téléphone invalide.",
      });
    }

    // Nettoyage texte
    const cleanMessage = message.trim().substring(0, 2000);

    // --- Insert dans la DB ---
    await db.query(
      `INSERT INTO contact 
       (firstName, lastName, email, telephone, sujet, sousSujet, message, indicatif) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        firstName.trim(),
        lastName.trim(),
        email.trim().toLowerCase(),
        telephone || null,
        sujet.trim(),
        sousSujet || null,
        cleanMessage,
        indicatif || null,
      ]
    );

    logger.success("💬 Message enregistré dans la base de données.");

    return res.status(201).json({
      success: true,
      message:
        "Message envoyé avec succès. Nous vous répondrons dans les plus brefs délais.",
    });
  } catch (error) {
    logger.error("❌ Erreur lors de l’envoi du message: " + error.message);

    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de l’envoi du message.",
    });
  }
};

exports.getMessages = async (req, res) => {
  try {
    logger.info("📥 Récupération des messages de contact...");

    const [messages] = await db.query(
      "SELECT * FROM contact ORDER BY date_envoi DESC"
    );

    logger.success(`📨 ${messages.length} messages récupérés.`);

    return res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    logger.error("❌ Erreur getMessages: " + error.message);

    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des messages.",
    });
  }
};
