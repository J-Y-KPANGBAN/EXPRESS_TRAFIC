// backend/services/auth/EmailVerificationService.js
const crypto = require('crypto');
const db = require('../config/db');
const { sendEnhancedEmail } = require('./emailService');
const { logger } = require("../utils/logger");

class EmailVerificationService {
  constructor() {
    this.verificationTimeout = 24 * 60 * 60 * 1000; // 24h
  }

  async sendVerificationEmail(userId, email, userData = {}) {
    try {
      // Générer token unique
      const token = crypto.randomBytes(48).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const expiresAt = new Date(Date.now() + this.verificationTimeout);

      // Supprimer anciens tokens
      await db.query(
        "DELETE FROM user_tokens WHERE user_id = ? AND type = 'email_verification'",
        [userId]
      );

      // Sauvegarder nouveau token
      await db.query(
        "INSERT INTO user_tokens (user_id, token, type, expire_at, metadata) VALUES (?, ?, 'email_verification', ?, ?)",
        [userId, tokenHash, expiresAt, JSON.stringify({ ip: userData.ip, userAgent: userData.userAgent })]
      );

      // Construire le lien avec tracking
      const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}&uid=${userId}`;
      
      // Envoyer email amélioré
      await sendEnhancedEmail({
        to: email,
        template: 'email_verification',
        data: {
          prenom: userData.prenom || 'Utilisateur',
          verification_link: verificationLink,
          expires_in: '24 heures',
          support_email: 'support@expresstrafic.com',
          app_download_link: 'https://expresstrafic.com/app'
        },
        category: 'account_verification',
        tracking: true
      });

      // Envoyer notification SMS si configuré
      if (userData.telephone && process.env.SMS_ENABLED === 'true') {
        const SmsService = require('../notification/SmsService');
        await SmsService.sendVerificationSMS(
          userData.telephone,
          userData.phone_code || '+33',
          { prenom: userData.prenom }
        );
      }

      logger.success(`📧 Email de vérification envoyé à ${email}`, {
        userId,
        tokenPreview: token.substring(0, 8)
      });

      return {
        success: true,
        verification_sent: true,
        methods: ['email', ...(userData.telephone ? ['sms'] : [])],
        expires_at: expiresAt
      };

    } catch (error) {
      logger.error('❌ Erreur envoi email vérification:', error);
      
      // Fallback: créer un token temporaire pour test
      if (process.env.NODE_ENV === 'development') {
        const testToken = `dev_${Date.now()}_${userId}`;
        return {
          success: true,
          verification_sent: true,
          debug_token: testToken,
          note: 'Mode développement - email simulé'
        };
      }
      
      return { success: false, error: error.message };
    }
  }

  async verifyEmailToken(token, userId = null) {
    try {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      // Vérifier le token
      const [tokens] = await db.query(
        `SELECT ut.*, s.email, s.id as user_id, s.prenom, s.statut
         FROM user_tokens ut 
         JOIN signup s ON ut.user_id = s.id 
         WHERE ut.token = ? 
         AND ut.type = 'email_verification' 
         AND ut.used = 0 
         AND ut.expire_at > NOW()
         ${userId ? 'AND s.id = ?' : ''}`,
        userId ? [tokenHash, userId] : [tokenHash]
      );

      if (tokens.length === 0) {
        // Vérifier si déjà utilisé
        const [usedTokens] = await db.query(
          "SELECT * FROM user_tokens WHERE token = ? AND used = 1",
          [tokenHash]
        );
        
        if (usedTokens.length > 0) {
          return { 
            success: false, 
            code: 'ALREADY_VERIFIED',
            message: "Email déjà vérifié" 
          };
        }
        
        return { 
          success: false, 
          code: 'INVALID_TOKEN',
          message: "Lien de vérification invalide ou expiré" 
        };
      }

      const tokenData = tokens[0];

      // Vérifier que le compte n'est pas déjà vérifié
      const [user] = await db.query(
        "SELECT email_verified FROM signup WHERE id = ?",
        [tokenData.user_id]
      );

      if (user[0].email_verified) {
        return { 
          success: true, 
          code: 'ALREADY_VERIFIED',
          message: "Email déjà vérifié",
          email: tokenData.email
        };
      }

      // Mettre à jour le statut
      await db.query(
        "UPDATE signup SET email_verified = 1, email_verified_at = NOW(), statut = 'active' WHERE id = ?",
        [tokenData.user_id]
      );

      // Marquer le token comme utilisé
      await db.query(
        "UPDATE user_tokens SET used = 1, used_at = NOW() WHERE id = ?",
        [tokenData.id]
      );

      // Envoyer email de bienvenue
      await sendEnhancedEmail({
        to: tokenData.email,
        template: 'welcome_verified',
        data: {
          prenom: tokenData.prenom,
          login_link: `${process.env.FRONTEND_URL}/login`,
          app_download_link: 'https://expresstrafic.com/app',
          support_email: 'support@expresstrafic.com'
        }
      });

      // Journaliser
      logger.success(`✅ Email vérifié pour ${tokenData.email}`, {
        userId: tokenData.user_id,
        verificationMethod: 'email_token'
      });

      return {
        success: true,
        code: 'VERIFIED',
        message: "✅ Email vérifié avec succès !",
        data: {
          email: tokenData.email,
          user_id: tokenData.user_id,
          prenom: tokenData.prenom,
          redirect_to: '/dashboard'
        }
      };

    } catch (error) {
      logger.error('❌ Erreur vérification email:', error);
      return { success: false, error: error.message };
    }
  }

  async resendVerification(email, ip = null, userAgent = null) {
    try {
      // Vérifier l'utilisateur
      const [users] = await db.query(
        "SELECT id, email, prenom, email_verified, telephone FROM signup WHERE email = ?",
        [email]
      );

      if (users.length === 0) {
        // Pour la sécurité, ne pas révéler si l'email existe
        return { 
          success: true, 
          message: "Si un compte existe avec cet email, un nouveau lien a été envoyé",
          security: true
        };
      }

      const user = users[0];

      if (user.email_verified) {
        return { 
          success: true, 
          message: "Votre email est déjà vérifié",
          already_verified: true
        };
      }

      // Vérifier les tentatives récentes
      const [recentAttempts] = await db.query(
        `SELECT COUNT(*) as count FROM user_tokens 
         WHERE user_id = ? AND type = 'email_verification' 
         AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
        [user.id]
      );

      if (recentAttempts[0].count >= 3) {
        return {
          success: false,
          code: 'RATE_LIMITED',
          message: "Trop de demandes. Veuillez réessayer dans 1 heure."
        };
      }

      // Renvoyer l'email
      const result = await this.sendVerificationEmail(
        user.id, 
        user.email, 
        { 
          prenom: user.prenom,
          telephone: user.telephone,
          ip,
          userAgent
        }
      );

      return {
        success: true,
        message: "Nouveau lien de vérification envoyé",
        ...result
      };

    } catch (error) {
      logger.error('❌ Erreur renvoi vérification:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailVerificationService();