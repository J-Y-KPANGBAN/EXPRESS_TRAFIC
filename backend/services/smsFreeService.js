// backend/services/smsFreeService.js
const nodemailer = require('nodemailer');
const { logger } = require("../utils/logger");

// Liste des opérateurs français
const OPERATEURS = {
  'orange': '@orange.fr',
  'sfr': '@sfr.fr', 
  'bouygues': '@bouyguestelecom.fr',
  'free': '@mobile.free.fr'
};

class SmsFreeService {
  async sendSMS(phone, message) {
    try {
      // Déterminer l'opérateur (simplifié)
      const operator = this.detectOperator(phone);
      const email = `${phone}${OPERATEURS[operator] || '@sfr.fr'}`;
      
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'SMS ExpressTrafic',
        text: message,
        html: `<p>${message}</p>`
      });
      
      logger.info(`📧 SMS via email envoyé à ${phone} (${email})`);
      return { success: true, method: 'email-to-sms' };
      
    } catch (error) {
      logger.error('❌ Erreur email-to-SMS:', error);
      return { success: false, error: error.message };
    }
  }
  
  detectOperator(phone) {
    // Logique simplifiée de détection
    if (phone.startsWith('06') || phone.startsWith('07')) return 'orange';
    return 'sfr';
  }
}

module.exports = new SmsFreeService();