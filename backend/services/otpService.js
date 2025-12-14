// backend/services/otpService.js
const { logger } = require("../utils/logger");
const crypto = require('crypto');
const smsService = require('./smsService');
const db = require("../config/db");

class OTPService {
  // Générer un OTP de 6 chiffres
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Envoyer OTP par SMS
  async sendOTPBySMS(phone, phoneCode = '+33') {
    try {
      const otp = this.generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      logger.info(`📱 OTP généré pour ${phoneCode}${phone}: ${otp}`);

      // Sauvegarder OTP en base
      await db.query(
        "INSERT INTO user_otps (phone, phone_code, otp, expires_at) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE otp = ?, expires_at = ?",
        [phone, phoneCode, otp, expiresAt, otp, expiresAt]
      );

      // Envoyer SMS via Twilio
      const message = `Votre code de vérification ExpressTrafic: ${otp}. Valide 10 minutes.`;
      const smsResult = await smsService.sendSMS(`${phoneCode}${phone}`, message);

      return {
        success: true,
        otp: otp, // En développement seulement - pas en production!
        expiresIn: '10 minutes',
        smsResult
      };

    } catch (error) {
      logger.error("❌ Erreur envoi OTP SMS:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Vérifier OTP
  async verifyOTP(phone, otp, phoneCode = '+33') {
    try {
      const [otps] = await db.query(
        "SELECT * FROM user_otps WHERE phone = ? AND phone_code = ? AND otp = ? AND expires_at > NOW()",
        [phone, phoneCode, otp]
      );

      if (otps.length === 0) {
        return {
          success: false,
          message: "OTP invalide ou expiré"
        };
      }

      // Supprimer OTP utilisé
      await db.query(
        "DELETE FROM user_otps WHERE phone = ? AND phone_code = ?",
        [phone, phoneCode]
      );

      return {
        success: true,
        message: "OTP vérifié avec succès"
      };

    } catch (error) {
      logger.error("❌ Erreur vérification OTP:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new OTPService();