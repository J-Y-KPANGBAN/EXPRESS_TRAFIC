// backend/config/mailer.js - VERSION CORRIGÉE
const nodemailer = require("nodemailer");

// ✅ CORRECTION : Importer logger correctement
let logger;
try {
  logger = require("../utils/logger");
} catch (error) {
  // Fallback si le logger n'existe pas
  console.log("⚠️ Logger non trouvé, utilisation de console.log");
  logger = {
    info: (...args) => console.log('📧', ...args),
    error: (...args) => console.error('❌', ...args),
    success: (...args) => console.log('✅', ...args),
    warn: (...args) => console.warn('⚠️', ...args)
  };
}

// Vérifier si l'email est configuré
const isEmailConfigured = process.env.MAIL_HOST || process.env.EMAIL_HOST;

if (!isEmailConfigured) {
  logger.warn("📧 Aucune configuration email trouvée - Mode simulation activé");
  
  // Créer un transporteur simulé
  const simulatedTransporter = {
    sendMail: async (mailOptions) => {
      logger.info(`📨 Email simulé vers: ${mailOptions.to} - Sujet: ${mailOptions.subject}`);
      return Promise.resolve({ 
        messageId: 'simulated-' + Date.now(),
        response: '250 OK - Mode simulation'
      });
    },
    verify: (callback) => {
      logger.info("✅ Transporteur email simulé vérifié");
      callback(null, true);
    }
  };
  
  module.exports = simulatedTransporter;
} else {
  // Utiliser MAIL_* en priorité, sinon EMAIL_*
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || process.env.EMAIL_HOST,
    port: process.env.MAIL_PORT || process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.MAIL_USER || process.env.EMAIL_USER,
      pass: process.env.MAIL_PASS || process.env.EMAIL_PASS
    }
  });

  // Vérification SMTP avec gestion d'erreur robuste
  transporter.verify((error) => {
    if (error) {
      logger.error("❌ SMTP connection failed: " + error.message);
      logger.info("💡 Utilisation du mode simulation pour les emails");
    } else {
      logger.success("📨 SMTP ready to send emails");
    }
  });

  module.exports = transporter;
}