// backend/services/smsVonageService.js
const { Vonage } = require('@vonage/server-sdk');
const { logger } = require("../utils/logger");

const vonage = new Vonage({
  apiKey: process.env.VONAGE_API_KEY,
  apiSecret: process.env.VONAGE_API_SECRET
});

class SmsVonageService {
  async sendSMS(to, message) {
    try {
      const from = process.env.VONAGE_FROM || 'ExpressTrafic';
      
      const response = await vonage.sms.send({ 
        to, 
        from, 
        text: message 
      });
      
      logger.success(`✅ SMS Vonage envoyé à ${to}`);
      return { success: true, id: response.messages[0]['message-id'] };
      
    } catch (error) {
      logger.error('❌ Erreur Vonage:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new SmsVonageService();