// backend/services/whatsappService.js
const axios = require('axios');
const { logger } = require("../utils/logger");

class WhatsAppService {
  constructor() {
    this.baseURL = `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION}`;
    this.headers = {
      'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    };
  }

  // Envoyer un message texte simple
  async sendMessage(to, message) {
    try {
      const response = await axios.post(
        `${this.baseURL}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: "whatsapp",
          to: to,
          type: "text",
          text: { body: message }
        },
        { headers: this.headers }
      );
      
      logger.success(`✅ WhatsApp envoyé à ${to}`);
      return { success: true, data: response.data };
      
    } catch (error) {
      logger.error('❌ Erreur WhatsApp:', error.response?.data || error.message);
      return { success: false, error: error.message };
    }
  }

  // Envoyer un template (pour OTP)
  async sendOTPTemplate(to, otp, language = 'fr') {
    try {
      const response = await axios.post(
        `${this.baseURL}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: "whatsapp",
          to: to,
          type: "template",
          template: {
            name: "express_trafic_otp",
            language: { code: language },
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: otp },
                  { type: "text", text: "10" } // minutes de validité
                ]
              }
            ]
          }
        },
        { headers: this.headers }
      );
      
      logger.success(`✅ WhatsApp OTP envoyé à ${to}: ${otp}`);
      return { success: true, data: response.data };
      
    } catch (error) {
      logger.error('❌ Erreur WhatsApp template:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new WhatsAppService();