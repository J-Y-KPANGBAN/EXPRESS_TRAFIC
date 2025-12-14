// backend/services/smsTextLocalService.js
const axios = require('axios');
const { logger } = require("../utils/logger");

class SmsTextLocalService {
  async sendSMS(to, message) {
    try {
      const response = await axios.post('https://api.textlocal.in/send/', null, {
        params: {
          apikey: process.env.TEXTLOCAL_API_KEY,
          sender: process.env.TEXTLOCAL_SENDER || 'TXTLCL',
          numbers: to,
          message: message
        }
      });
      
      logger.success(`✅ SMS TextLocal envoyé à ${to}`);
      return { success: true, data: response.data };
      
    } catch (error) {
      logger.error('❌ Erreur TextLocal:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new SmsTextLocalService();