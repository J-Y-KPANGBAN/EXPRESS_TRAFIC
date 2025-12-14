// backend/services/notification/SmsService.js
const axios = require('axios');
const nodemailer = require('nodemailer');
const { logger } = require("../utils/logger");

class SmsService {
  constructor() {
    this.providers = this.initProviders();
  }

  initProviders() {
    const providers = [];

    // 1. Vonage (Nexmo) - Alternative professionnelle
    if (process.env.VONAGE_API_KEY && process.env.VONAGE_API_SECRET) {
      const { Vonage } = require('@vonage/server-sdk');
      providers.push({
        name: 'vonage',
        priority: 1,
        client: new Vonage({
          apiKey: process.env.VONAGE_API_KEY,
          apiSecret: process.env.VONAGE_API_SECRET
        }),
        send: async (to, message) => {
          const response = await this.client.sms.send({ 
            to, 
            from: process.env.VONAGE_FROM || 'ExpressTrafic',
            text: message 
          });
          return { id: response.messages[0]['message-id'] };
        }
      });
    }

    // 2. Email-to-SMS (GRATUIT pour les tests)
    providers.push({
      name: 'email_to_sms',
      priority: 3,
      send: async (phone, message, phoneCode = '+33') => {
        return await this.sendViaEmail(phone, message, phoneCode);
      }
    });

    // 3. API SMS gratuite (fallback)
    providers.push({
      name: 'free_api',
      priority: 4,
      send: async (phone, message) => {
        return await this.sendViaFreeAPI(phone, message);
      }
    });

    return providers;
  }

  // Méthode principale d'envoi
  async sendSMS(phone, message, options = {}) {
    const phoneWithCode = this.formatPhoneNumber(phone, options.phoneCode);
    
    logger.info(`📱 Tentative envoi SMS à ${phoneWithCode}`, {
      messagePreview: message.substring(0, 50) + '...',
      providerPriority: this.providers.map(p => p.name)
    });

    // Essayer chaque provider par ordre de priorité
    for (const provider of this.providers.sort((a, b) => a.priority - b.priority)) {
      try {
        logger.info(`🔧 Essai avec provider: ${provider.name}`);
        
        const result = await provider.send(phoneWithCode, message, options);
        
        logger.success(`✅ SMS envoyé via ${provider.name} à ${phoneWithCode}`);
        
        return {
          success: true,
          provider: provider.name,
          message_id: result.id || `sms_${Date.now()}`,
          to: phoneWithCode,
          timestamp: new Date().toISOString()
        };
        
      } catch (error) {
        logger.warn(`⚠️ Échec avec ${provider.name}:`, error.message);
        continue; // Essayer le provider suivant
      }
    }

    // Tous les providers ont échoué
    logger.error('❌ Tous les providers SMS ont échoué');
    
    // En mode développement, simuler l'envoi
    if (process.env.NODE_ENV === 'development') {
      logger.info(`📱 [SIMULATION] SMS à ${phoneWithCode}: ${message}`);
      
      return {
        success: true,
        provider: 'simulation',
        simulated: true,
        debug: { phone: phoneWithCode, message }
      };
    }
    
    return {
      success: false,
      error: 'Aucun provider SMS disponible'
    };
  }

  // Envoyer via email-to-SMS (gratuit)
  async sendViaEmail(phone, message, phoneCode = '+33') {
    const operator = this.detectFrenchOperator(phone);
    const email = this.getSMSEmail(phone, operator, phoneCode);
    
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
      html: `<div style="font-family: Arial, sans-serif;">
              <h3 style="color: #2c5aa0;">📱 ExpressTrafic</h3>
              <p>${message}</p>
              <hr>
              <small>Envoyé via email-to-SMS</small>
            </div>`
    });
    
    return { id: `email_sms_${Date.now()}` };
  }

  // Envoyer via API gratuite
  async sendViaFreeAPI(phone, message) {
    // Exemple avec TextLocal (gratuit pour les tests)
    const response = await axios.get('https://api.textlocal.in/send/', {
      params: {
        apikey: process.env.TEXTLOCAL_API_KEY || 'demo',
        sender: process.env.TEXTLOCAL_SENDER || 'TXTLCL',
        numbers: phone,
        message: message.substring(0, 160) // Limite SMS
      }
    });
    
    return { id: response.data.message_id };
  }

  // Envoyer SMS de bienvenue
  async sendWelcomeSMS(phone, phoneCode, userData) {
    const message = `🎉 Bienvenue ${userData.prenom} sur ExpressTrafic !
Votre numéro client: ${userData.numeroClient}
Téléchargez notre app: https://expresstrafic.com/app
Support: 0800 123 456`;
    
    return await this.sendSMS(phone, message, { 
      phoneCode,
      category: 'welcome'
    });
  }

  // Envoyer SMS de vérification
  async sendVerificationSMS(phone, phoneCode, userData) {
    const otp = Math.floor(100000 + Math.random() * 900000);
    const message = `🔐 ExpressTrafic - Code de vérification
Bonjour ${userData.prenom},
Votre code: ${otp}
Valide 10 minutes`;
    
    // Sauvegarder OTP en base
    const db = require('../../config/db');
    await db.query(
      "INSERT INTO user_otps (phone, phone_code, otp, type, expires_at) VALUES (?, ?, ?, 'verification', DATE_ADD(NOW(), INTERVAL 10 MINUTE))",
      [phone, phoneCode, otp]
    );
    
    const result = await this.sendSMS(phone, message, { 
      phoneCode,
      category: 'verification'
    });
    
    return {
      ...result,
      otp: process.env.NODE_ENV === 'development' ? otp : undefined
    };
  }

  // Détecter l'opérateur français
  detectFrenchOperator(phone) {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('6') || cleaned.startsWith('7')) {
      return 'orange'; // Orange ou SFR
    }
    
    return 'sfr'; // Par défaut
  }

  // Obtenir l'email SMS selon l'opérateur
  getSMSEmail(phone, operator, phoneCode) {
    const cleaned = phone.replace(/\D/g, '');
    
    const operators = {
      'orange': '@orange.fr',
      'sfr': '@sfr.fr',
      'bouygues': '@bouyguestelecom.fr',
      'free': '@mobile.free.fr'
    };
    
    const domain = operators[operator] || '@sfr.fr';
    return `${cleaned}${domain}`;
  }

  // Formater le numéro
  formatPhoneNumber(phone, phoneCode = '+33') {
    let cleaned = phone.replace(/\D/g, '');
    
    // Si commence par 0, le remplacer par l'indicatif
    if (cleaned.startsWith('0')) {
      cleaned = phoneCode.replace('+', '') + cleaned.substring(1);
    }
    
    // Ajouter le + si absent
    if (!cleaned.startsWith('+')) {
      cleaned = `+${cleaned}`;
    }
    
    return cleaned;
  }
}

module.exports = new SmsService();