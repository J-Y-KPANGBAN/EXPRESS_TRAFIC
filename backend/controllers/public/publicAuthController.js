const db = require("../../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { isValidEmail, sanitize } = require("../../utils/validators");
const logger = require("../../utils/logger");
const EmailVerificationService = require('../../services/emailVerificationService');
const SmsService = require('../../services/smsService');

// ============================================
// 🔧 OPTIMISATIONS DE PERFORMANCE
// ============================================

// 🚀 Mise en cache des regex et fonctions
const PASSWORD_REGEX = {
  hasUpperCase: /[A-Z]/,
  hasLowerCase: /[a-z]/,
  hasNumbers: /\d/,
  hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/
};

const SENSITIVE_FIELDS = new Set([
  'mot_de_passe', 'password', 'token', 'cvv', 'cardNumber', 
  'carteBancaire', 'crypto', 'authorization', 'newPassword',
  'currentPassword', 'iban', 'secret', 'privateKey', 'otp'
]);

// 🚀 Validation mot de passe optimisée
const validatePasswordStrength = (password) => {
  if (password.length < 8) return false;
  
  return PASSWORD_REGEX.hasUpperCase.test(password) &&
         PASSWORD_REGEX.hasLowerCase.test(password) &&
         PASSWORD_REGEX.hasNumbers.test(password) &&
         PASSWORD_REGEX.hasSpecialChar.test(password);
};

// 🚀 Sanitisation optimisée pour logs
const sanitizeForLogging = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const sanitized = { ...data };
  for (const field of SENSITIVE_FIELDS) {
    if (sanitized[field] !== undefined) {
      sanitized[field] = '***';
    }
  }
  
  return sanitized;
};

// 🚀 Cache pour codes téléphoniques (améliore les performances)
const phoneCodeCache = new Map();
const getPhoneCode = async (country) => {
  if (phoneCodeCache.has(country)) {
    return phoneCodeCache.get(country);
  }
  
  try {
    const [result] = await db.query(
      'SELECT phone_code FROM phone_codes WHERE country_name = ?', 
      [country]
    );
    const code = result.length > 0 ? result[0].phone_code : '+33';
    phoneCodeCache.set(country, code);
    return code;
  } catch (error) {
    return '+33';
  }
};

// ============================================
// 🔐 INSCRIPTION CLIENT OPTIMISÉE
// ============================================

exports.signup = async (req, res) => {
  const startTime = Date.now();
  let userId = null;
  
  try {
    const {
      nom, prenom, email, mot_de_passe, confirm_mot_de_passe,
      telephone, ville, region, adresse_postale,
      date_naissance, country, code_postal,
      phone_code, conditions_acceptees,
      newsletter_optin, security_preferences
    } = req.body;

    // 🔒 LOG SÉCURISÉ
    logger.info(`🔐 Tentative signup CLIENT → ${email}`, {
      data: sanitizeForLogging(req.body),
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // 🚀 VALIDATION RAPIDE EN PARALLÈLE
    const validationPromises = [];
    
    // Validation mot de passe confirmation
    if (mot_de_passe !== confirm_mot_de_passe) {
      return res.status(400).json({
        success: false,
        message: "Les mots de passe ne correspondent pas",
        code: 'PASSWORD_MISMATCH'
      });
    }

    // Validation force mot de passe
    if (!validatePasswordStrength(mot_de_passe)) {
      return res.status(400).json({
        success: false,
        message: "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial",
        code: 'WEAK_PASSWORD'
      });
    }

    // Validation email
    if (!isValidEmail(email)) {
      return res.status(400).json({ 
        success: false, 
        message: "Format d'email invalide",
        code: 'INVALID_EMAIL'
      });
    }

    // 🚀 Vérification email unique en parallèle
    validationPromises.push(
      db.query("SELECT id FROM signup WHERE email = ?", [email.trim().toLowerCase()])
    );

    // 🚀 Récupération code téléphonique en parallèle
    if (!phone_code && country) {
      validationPromises.push(getPhoneCode(country));
    }

    // Exécution parallèle des validations
    const [emailResult, phoneCodeResult] = await Promise.all(validationPromises);

    // Vérification email unique
    if (emailResult && emailResult[0].length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Un compte avec cet email existe déjà",
        code: 'EMAIL_EXISTS'
      });
    }

    const finalPhoneCode = phone_code || (phoneCodeResult || '+33');

    // 🚀 Hash du mot de passe avec le bon coût
    const hashedPassword = await bcrypt.hash(mot_de_passe, 10); // Coût réduit pour performance

    // 🚀 Conversion date optimisée
    let formattedDate = date_naissance;
    if (date_naissance && date_naissance.includes('/')) {
      const [day, month, year] = date_naissance.split('/');
      formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      
      if (isNaN(new Date(formattedDate).getTime())) {
        return res.status(400).json({
          success: false,
          message: "Date de naissance invalide",
          code: 'INVALID_DATE'
        });
      }
    }

    // 🚀 Transaction DB pour atomicité
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Insertion utilisateur
      const [result] = await connection.query(
        `INSERT INTO signup
        (nom, prenom, email, mot_de_passe, telephone, phone_code, country, 
         ville, code_postal, region, adresse_postale, date_naissance, 
         conditions_acceptees, type_utilisateur, statut, date_inscription, email_verified)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'client', 'actif', NOW(), 0)`,
        [
          sanitize(nom), 
          sanitize(prenom), 
          sanitize(email.toLowerCase()),
          hashedPassword, 
          sanitize(telephone.replace(/\s/g, '')),
          finalPhoneCode,
          sanitize(country),
          sanitize(ville), 
          code_postal ? sanitize(code_postal) : null,
          region ? sanitize(region) : null, 
          sanitize(adresse_postale),
          formattedDate,
          1
        ]
      );

      userId = result.insertId;

      // Numéro client
      const numeroClient = `CLT-${new Date().getFullYear()}${String(userId).padStart(6, '0')}`;
      await connection.query(
        "UPDATE signup SET numero_client = ? WHERE id = ?",
        [numeroClient, userId]
      );

      // Création profil (exécution parallèle possible)
      await connection.query(
        "INSERT INTO profile (user_id, notifications_actives, langue_preferee) VALUES (?, 1, 'fr')",
        [userId]
      );

      await connection.commit();

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    logger.success(`✅ Signup réussi → ID ${userId}, Email: ${email}`, {
      duration: Date.now() - startTime
    });

    // 🚀 ENVOIS ASYNCHRONES POUR PERFORMANCE
    const asyncOperations = [];

    // Email de vérification (asynchrone)
    asyncOperations.push(
      (async () => {
        try {
          return await EmailVerificationService.sendVerificationEmail(
            userId, 
            email,
            {
              prenom,
              telephone,
              phone_code: finalPhoneCode,
              ip: req.ip,
              userAgent: req.get('User-Agent')
            }
          );
        } catch (error) {
          logger.error('❌ Erreur envoi email vérification:', error);
          return { success: false };
        }
      })()
    );

    // SMS de bienvenue (asynchrone, si activé)
    if (process.env.SMS_ENABLED === 'true') {
      asyncOperations.push(
        (async () => {
          try {
            return await SmsService.sendWelcomeSMS(
              telephone, 
              finalPhoneCode, 
              { nom, prenom, numeroClient }
            );
          } catch (error) {
            logger.error('❌ Erreur envoi SMS:', error);
            return { success: false };
          }
        })()
      );
    }

    // 🚀 Réponse immédiate sans attendre les envois
    res.status(201).json({
      success: true,
      message: `🎉 Compte créé avec succès ! Un email de vérification vous a été envoyé.`,
      data: {
        userId: userId,
        numero_client: numeroClient,
        type_utilisateur: 'client',
        requires_verification: true,
        next_steps: [
          "Vérifiez votre email pour activer votre compte",
          "Téléchargez notre application mobile",
          "Complétez votre profil pour une expérience personnalisée"
        ]
      },
      security: {
        email_verification_sent: true,
        account_status: "pending_verification",
        verification_timeout: "24 heures"
      },
      performance: {
        duration_ms: Date.now() - startTime,
        async_operations: asyncOperations.length
      }
    });

    // 🚀 Exécution asynchrone après réponse
    Promise.all(asyncOperations).then(results => {
      const emailResult = results[0];
      const smsResult = results[1];
      
      logger.info(`📧 Résultats envois asynchrones: Email: ${emailResult?.success}, SMS: ${smsResult?.success}`);
    }).catch(error => {
      logger.error('❌ Erreur dans les opérations asynchrones:', error);
    });

  } catch (error) {
    logger.error("❌ Erreur signup:", {
      error: error.message,
      code: error.code,
      userId,
      duration: Date.now() - startTime
    });

    // 🚀 Gestion d'erreurs spécifiques
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Un compte avec cet email existe déjà',
        code: 'DUPLICATE_EMAIL'
      });
    }
    
    if (error.code === 'ER_TRUNCATED_WRONG_VALUE') {
      return res.status(400).json({
        success: false,
        message: 'Format de date invalide',
        code: 'INVALID_DATE_FORMAT'
      });
    }

    // Erreur générique
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création du compte",
      code: 'SERVER_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      request_id: req.id || crypto.randomBytes(4).toString('hex')
    });
  }
};

// ============================================
// 🔐 LOGIN OPTIMISÉ
// ============================================

exports.login = async (req, res) => {
  const startTime = Date.now();
  let user = null;
  
  try {
    const { email, mot_de_passe } = req.body;

    // 🚀 Validation rapide
    if (!email || !mot_de_passe) {
      return res.status(400).json({
        success: false,
        message: "Email et mot de passe requis",
        code: 'MISSING_CREDENTIALS'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Format d'email invalide",
        code: 'INVALID_EMAIL'
      });
    }

    logger.info(`🔐 Tentative login → ${email}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // 🚀 Requête optimisée avec seulement les champs nécessaires
    const [users] = await db.query(
      `SELECT id, email, mot_de_passe, nom, prenom, type_utilisateur, 
              statut, tentatives_echec, bloque_jusqua, numero_client,
              email_verified, telephone
       FROM signup 
       WHERE email = ?`,
      [email.toLowerCase().trim()]
    );

    if (users.length === 0) {
      // 🛡️ Délai artificiel pour éviter l'énumération
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return res.status(401).json({
        success: false,
        message: "Identifiants incorrects",
        code: 'INVALID_CREDENTIALS'
      });
    }

    user = users[0];

    // 🛡️ Vérification compte bloqué
    if (user.bloque_jusqua && new Date(user.bloque_jusqua) > new Date()) {
      const remainingTime = Math.ceil((new Date(user.bloque_jusqua) - Date.now()) / (1000 * 60));
      return res.status(423).json({
        success: false,
        message: `Compte temporairement bloqué. Réessayez dans ${remainingTime} minutes.`,
        code: 'ACCOUNT_LOCKED',
        remaining_minutes: remainingTime
      });
    }

    // 🛡️ Vérification statut compte
    if (user.statut !== "actif") {
      return res.status(403).json({
        success: false,
        message: `Votre compte est ${user.statut}. Contactez le support.`,
        code: 'ACCOUNT_INACTIVE',
        status: user.statut
      });
    }

    // 🚀 Vérification mot de passe optimisée
    let isValid = false;
    
    if (user.mot_de_passe && user.mot_de_passe.startsWith('$2')) {
      let compatibleHash = user.mot_de_passe;
      
      // Conversion format PHP -> Node.js
      if (user.mot_de_passe.startsWith('$2y$')) {
        compatibleHash = '$2b$' + user.mot_de_passe.substring(4);
      }
      
      isValid = await bcrypt.compare(mot_de_passe, compatibleHash);
    } else {
      // Fallback pour mots de passe en clair (migration)
      isValid = user.mot_de_passe === mot_de_passe;
      
      if (isValid) {
        // Migration vers bcrypt
        const hashedPassword = await bcrypt.hash(mot_de_passe, 10);
        await db.query(
          "UPDATE signup SET mot_de_passe = ? WHERE id = ?",
          [hashedPassword, user.id]
        );
      }
    }

    if (!isValid) {
      // 🛡️ Gestion tentatives échouées
      const newTentatives = (user.tentatives_echec || 0) + 1;
      const updates = {
        tentatives_echec: newTentatives,
        date_derniere_tentative: new Date()
      };

      if (newTentatives >= 3) {
        updates.bloque_jusqua = new Date(Date.now() + 30 * 60 * 1000);
        updates.statut = 'suspendu';
        
        logger.warning(`🔒 Compte suspendu: ${email} après 3 échecs`);
      }

      await db.query(
        `UPDATE signup SET 
          tentatives_echec = ?, 
          date_derniere_tentative = ?,
          bloque_jusqua = ?,
          statut = ?
         WHERE id = ?`,
        [updates.tentatives_echec, updates.date_derniere_tentative, 
         updates.bloque_jusqua, updates.statut, user.id]
      );

      const tentativesRestantes = Math.max(0, 3 - newTentatives);
      
      if (newTentatives >= 3) {
        return res.status(423).json({
          success: false,
          message: "Compte suspendu après 3 tentatives échouées. Réessayez dans 30 minutes.",
          code: 'ACCOUNT_SUSPENDED'
        });
      }

      return res.status(401).json({
        success: false,
        message: `Identifiants incorrects. ${tentativesRestantes} tentative(s) restante(s).`,
        code: 'INVALID_CREDENTIALS',
        attempts_remaining: tentativesRestantes
      });
    }

    // ✅ Connexion réussie
    // 🚀 Réinitialisation tentatives en une seule requête
    await db.query(
      `UPDATE signup SET 
        tentatives_echec = 0, 
        bloque_jusqua = NULL, 
        derniere_connexion = NOW(),
        statut = 'actif'
       WHERE id = ?`,
      [user.id]
    );

    // 🚀 Génération JWT optimisée
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        type: user.type_utilisateur,
        client: user.numero_client,
        verified: user.email_verified
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: process.env.JWT_EXPIRE || '24h',
        issuer: 'express-trafic-api',
        audience: 'client-app',
        algorithm: 'HS256'
      }
    );

    // 🚀 Journalisation asynchrone
    setImmediate(() => {
      db.query(
        `INSERT INTO login_logs (user_id, email, adresse_ip, user_agent, statut) 
         VALUES (?, ?, ?, ?, 'success')`,
        [user.id, user.email, req.ip, req.get('User-Agent')]
      ).catch(err => logger.error('Erreur journalisation login:', err));
    });

    logger.success(`✅ Login réussi → ${user.email}`, {
      userId: user.id,
      duration: Date.now() - startTime
    });

    // 🚀 Réponse optimisée
    res.json({
      success: true,
      message: "Connexion réussie",
      token,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        telephone: user.telephone || "",
        type_utilisateur: user.type_utilisateur,
        numero_client: user.numero_client,
        email_verified: user.email_verified
      },
      security: {
        requires_2fa: false, // À implémenter si besoin
        session_timeout: process.env.JWT_EXPIRE || '24h'
      },
      performance: {
        duration_ms: Date.now() - startTime
      }
    });

  } catch (error) {
    logger.error("❌ Erreur login:", {
      error: error.message,
      email: user?.email,
      duration: Date.now() - startTime
    });
    
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la connexion",
      code: 'LOGIN_ERROR',
      request_id: req.id || crypto.randomBytes(4).toString('hex')
    });
  }
};

// ============================================
// 🔐 VÉRIFICATION TOKEN OPTIMISÉE
// ============================================

exports.verifyToken = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Token manquant",
        code: 'MISSING_TOKEN'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // 🚀 Vérification JWT sans db query si possible
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: 'express-trafic-api',
        audience: 'client-app'
      });
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: "Token invalide ou expiré",
        code: 'INVALID_TOKEN'
      });
    }

    // 🚀 Vérification rapide en base
    const [users] = await db.query(
      'SELECT id, email, nom, prenom, type_utilisateur, statut, numero_client FROM signup WHERE id = ? AND statut = "actif"',
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Token invalide",
        code: 'INVALID_TOKEN'
      });
    }

    const user = users[0];

    res.json({
      success: true,
      message: "Token valide",
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        type_utilisateur: user.type_utilisateur,
        numero_client: user.numero_client
      },
      token_info: {
        expires_in: decoded.exp ? Math.floor((decoded.exp * 1000 - Date.now()) / 1000) : null,
        issued_at: decoded.iat ? new Date(decoded.iat * 1000) : null
      }
    });

  } catch (error) {
    logger.error("❌ Erreur vérification token:", error);
    res.status(500).json({
      success: false,
      message: "Erreur de vérification",
      code: 'VERIFICATION_ERROR'
    });
  }
};

// ============================================
// 🚪 DÉCONNEXION OPTIMISÉE
// ============================================

exports.logout = (req, res) => {
  // Pour JWT stateless, on compte sur le client pour supprimer le token
  // Mais on peut journaliser pour audit
  if (req.user) {
    setImmediate(() => {
      logger.info(`🚪 Déconnexion → ${req.user.email}`, {
        userId: req.user.id,
        ip: req.ip
      });
    });
  }
  
  res.json({
    success: true,
    message: 'Déconnexion réussie'
  });
};

// ============================================
// 🔐 RÉINITIALISATION MOT DE PASSE OPTIMISÉE
// ============================================

exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email requis",
        code: 'MISSING_EMAIL'
      });
    }

    // 🚀 Vérification rapide
    const [users] = await db.query(
      "SELECT id, nom, prenom, email FROM signup WHERE email = ?",
      [email]
    );

    // 🛡️ Message générique pour éviter l'énumération
    const genericMessage = "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.";

    if (users.length === 0) {
      return res.json({
        success: true,
        message: genericMessage
      });
    }

    const user = users[0];

    // 🛡️ Limitation des tentatives
    const [recentAttempts] = await db.query(
      `SELECT COUNT(*) as count FROM user_tokens 
       WHERE user_id = ? AND type = 'password_reset' 
       AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
      [user.id]
    );

    if (recentAttempts[0].count >= 3) {
      return res.status(429).json({
        success: false,
        message: "Trop de demandes. Veuillez réessayer dans 1 heure.",
        code: 'RATE_LIMITED'
      });
    }

    // 🚀 Génération et sauvegarde token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 3600000);

    // 🚀 Suppression anciens tokens et insertion en une transaction
    await db.query(`
      DELETE FROM user_tokens WHERE user_id = ? AND type = 'password_reset';
      INSERT INTO user_tokens (user_id, token, type, expire_at) VALUES (?, ?, 'password_reset', ?);
    `, [user.id, user.id, tokenHash, expiresAt]);

    // 🚀 Construction lien
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    // 🚀 Envoi email asynchrone
    setImmediate(async () => {
      try {
        // Ici, vous pouvez appeler votre service d'email
        logger.info(`📧 Reset link pour ${user.email}: ${resetLink}`);
        
        // Pour le développement
        if (process.env.NODE_ENV === 'development') {
          console.log('\n🔗 LIEN RÉINITIALISATION:');
          console.log(resetLink);
        }
      } catch (error) {
        logger.error("Erreur envoi email reset:", error);
      }
    });

    res.json({
      success: true,
      message: genericMessage,
      debug: process.env.NODE_ENV === 'development' ? {
        reset_link: resetLink,
        user_id: user.id,
        expires_at: expiresAt
      } : undefined
    });

  } catch (error) {
    logger.error("❌ Erreur demande réinitialisation:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la demande",
      code: 'RESET_REQUEST_ERROR'
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    // 🚀 Validation rapide
    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Token et nouveaux mots de passe requis",
        code: 'MISSING_FIELDS'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Les mots de passe ne correspondent pas",
        code: 'PASSWORD_MISMATCH'
      });
    }

    if (!validatePasswordStrength(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial",
        code: 'WEAK_PASSWORD'
      });
    }

    // 🚀 Vérification token
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    const [tokens] = await db.query(
      `SELECT ut.*, s.id as user_id, s.email 
       FROM user_tokens ut 
       JOIN signup s ON ut.user_id = s.id 
       WHERE ut.token = ? AND ut.type = 'password_reset' 
       AND ut.used = 0 AND ut.expire_at > NOW()`,
      [tokenHash]
    );

    if (tokens.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Lien invalide ou expiré",
        code: 'INVALID_TOKEN'
      });
    }

    const tokenData = tokens[0];

    // 🚀 Mise à jour mot de passe et marquage token en une transaction
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await db.query(`
      UPDATE signup SET 
        mot_de_passe = ?, 
        tentatives_echec = 0, 
        bloque_jusqua = NULL,
        statut = 'actif' 
      WHERE id = ?;
      UPDATE user_tokens SET used = 1, used_at = NOW() WHERE id = ?;
    `, [hashedPassword, tokenData.user_id, tokenData.id]);

    logger.success(`✅ Mot de passe réinitialisé pour ${tokenData.email}`);

    res.json({
      success: true,
      message: "Mot de passe réinitialisé avec succès"
    });

  } catch (error) {
    logger.error("❌ Erreur réinitialisation mot de passe:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la réinitialisation",
      code: 'RESET_ERROR'
    });
  }
};

// ============================================
// 📱 RÉINITIALISATION PAR SMS OPTIMISÉE
// ============================================

exports.requestPasswordResetSMS = async (req, res) => {
  try {
    const { phone, phone_code } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Numéro de téléphone requis",
        code: 'MISSING_PHONE'
      });
    }

    // 🚀 Vérification utilisateur
    const [users] = await db.query(
      "SELECT id, nom, prenom, telephone, phone_code, email FROM signup WHERE telephone = ?",
      [phone]
    );

    const genericMessage = "Si un compte existe avec ce numéro, un SMS a été envoyé.";

    if (users.length === 0) {
      return res.json({
        success: true,
        message: genericMessage
      });
    }

    const user = users[0];
    const finalPhoneCode = phone_code || user.phone_code || '+33';

    // 🚀 Génération OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // 🚀 Sauvegarde OTP
    await db.query(
      "INSERT INTO user_otps (user_id, phone, otp, type, expires_at) VALUES (?, ?, ?, 'password_reset', ?)",
      [user.id, phone, otp, expiresAt]
    );

    // 🚀 Envoi SMS asynchrone
    setImmediate(async () => {
      try {
        if (process.env.SMS_ENABLED === 'true') {
          await SmsService.sendSMS(
            phone,
            `🔐 ExpressTrafic - Réinitialisation mot de passe\nCode: ${otp}\nValide 10 minutes`,
            { 
              phone_code: finalPhoneCode,
              category: 'password_reset' 
            }
          );
        } else {
          logger.info(`📱 [SIMULATION] OTP SMS pour ${phone}: ${otp}`);
        }
      } catch (error) {
        logger.error('❌ Erreur envoi SMS OTP:', error);
      }
    });

    const response = {
      success: true,
      message: genericMessage
    };

    // 🛡️ Masquage OTP en production
    if (process.env.NODE_ENV === 'development') {
      response.debug = { otp };
    }

    res.json(response);

  } catch (error) {
    logger.error("❌ Erreur demande réinitialisation SMS:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la demande",
      code: 'SMS_RESET_ERROR'
    });
  }
};

exports.resetPasswordWithOTP = async (req, res) => {
  try {
    const { phone, otp, newPassword, confirmPassword, phone_code = '+33' } = req.body;

    // 🚀 Validation rapide
    if (!phone || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs sont requis",
        code: 'MISSING_FIELDS'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Les mots de passe ne correspondent pas",
        code: 'PASSWORD_MISMATCH'
      });
    }

    if (!validatePasswordStrength(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial",
        code: 'WEAK_PASSWORD'
      });
    }

    // 🚀 Vérification OTP
    const [otps] = await db.query(
      "SELECT * FROM user_otps WHERE phone = ? AND otp = ? AND type = 'password_reset' AND used = 0 AND expires_at > NOW()",
      [phone, otp]
    );

    if (otps.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Code OTP invalide ou expiré",
        code: 'INVALID_OTP'
      });
    }

    const otpData = otps[0];

    // 🚀 Trouver utilisateur
    const [users] = await db.query(
      "SELECT id, email FROM signup WHERE telephone = ?",
      [phone]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
        code: 'USER_NOT_FOUND'
      });
    }

    const user = users[0];

    // 🚀 Mise à jour mot de passe et marquage OTP
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await db.query(`
      UPDATE signup SET 
        mot_de_passe = ?, 
        tentatives_echec = 0, 
        bloque_jusqua = NULL,
        statut = 'actif' 
      WHERE id = ?;
      UPDATE user_otps SET used = 1 WHERE id = ?;
    `, [hashedPassword, user.id, otpData.id]);

    logger.success(`✅ Mot de passe réinitialisé par SMS pour ${user.email}`);

    res.json({
      success: true,
      message: "Mot de passe réinitialisé avec succès"
    });

  } catch (error) {
    logger.error("❌ Erreur réinitialisation OTP:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la réinitialisation",
      code: 'OTP_RESET_ERROR'
    });
  }
};

// ============================================
// 📧 FONCTIONS EMAIL (DOUBLE OPT-IN)
// ============================================

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    
    const result = await EmailVerificationService.verifyEmailToken(token);
    
    if (result.success) {
      return res.json({
        success: true,
        message: result.message || "✅ Email vérifié avec succès !",
        data: result.data || {},
        redirect_to: '/login?verified=true'
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message || "Lien invalide ou expiré",
        code: result.code || 'INVALID_TOKEN'
      });
    }
  } catch (error) {
    logger.error('❌ Erreur vérification email:', error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
      code: 'EMAIL_VERIFICATION_ERROR'
    });
  }
};

exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email requis",
        code: 'MISSING_EMAIL'
      });
    }

    const result = await EmailVerificationService.resendVerification(
      email, 
      req.ip, 
      req.get('User-Agent')
    );

    return res.json(result);
  } catch (error) {
    logger.error('❌ Erreur renvoi vérification:', error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
      code: 'RESEND_ERROR'
    });
  }
};

// ============================================
// 🔐 FONCTIONS 2FA (SIMPLIFIÉES POUR L'INSTANT)
// ============================================

exports.enable2FA = async (req, res) => {
  try {
    // À implémenter avec speakeasy/qrcode
    return res.json({
      success: true,
      message: "2FA activé (implémentation en cours)",
      note: "Fonctionnalité en développement",
      code: 'FEATURE_IN_DEVELOPMENT'
    });
  } catch (error) {
    logger.error('❌ Erreur activation 2FA:', error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
      code: '2FA_ERROR'
    });
  }
};

exports.verify2FA = async (req, res) => {
  try {
    return res.json({
      success: true,
      message: "2FA vérifié (implémentation en cours)",
      code: 'FEATURE_IN_DEVELOPMENT'
    });
  } catch (error) {
    logger.error('❌ Erreur vérification 2FA:', error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
      code: '2FA_ERROR'
    });
  }
};

exports.disable2FA = async (req, res) => {
  try {
    return res.json({
      success: true,
      message: "2FA désactivé (implémentation en cours)",
      code: 'FEATURE_IN_DEVELOPMENT'
    });
  } catch (error) {
    logger.error('❌ Erreur désactivation 2FA:', error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
      code: '2FA_ERROR'
    });
  }
};

// ============================================
// 🗑️ GESTION COMPTE
// ============================================

exports.requestAccountDeletion = async (req, res) => {
  try {
    const { reason } = req.body;
    
    return res.json({
      success: true,
      message: "Demande de suppression envoyée",
      note: "Fonctionnalité en développement",
      code: 'FEATURE_IN_DEVELOPMENT'
    });
  } catch (error) {
    logger.error('❌ Erreur demande suppression:', error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
      code: 'ACCOUNT_DELETION_ERROR'
    });
  }
};

exports.confirmAccountDeletion = async (req, res) => {
  try {
    const { token } = req.params;
    
    return res.json({
      success: true,
      message: "Compte supprimé avec succès",
      note: "Fonctionnalité en développement",
      code: 'FEATURE_IN_DEVELOPMENT'
    });
  } catch (error) {
    logger.error('❌ Erreur confirmation suppression:', error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
      code: 'ACCOUNT_DELETION_ERROR'
    });
  }
};

// ============================================
// 📧 CHANGEMENT EMAIL
// ============================================

exports.requestEmailChange = async (req, res) => {
  try {
    const { new_email } = req.body;
    
    if (!new_email) {
      return res.status(400).json({
        success: false,
        message: "Nouvel email requis",
        code: 'MISSING_EMAIL'
      });
    }

    if (!isValidEmail(new_email)) {
      return res.status(400).json({
        success: false,
        message: "Format d'email invalide",
        code: 'INVALID_EMAIL'
      });
    }

    // À implémenter avec vérification et envoi de confirmation
    return res.json({
      success: true,
      message: "Demande de changement d'email envoyée",
      note: "Fonctionnalité en développement",
      code: 'FEATURE_IN_DEVELOPMENT'
    });
  } catch (error) {
    logger.error('❌ Erreur demande changement email:', error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
      code: 'EMAIL_CHANGE_ERROR'
    });
  }
};

exports.confirmEmailChange = async (req, res) => {
  try {
    const { token } = req.params;
    
    return res.json({
      success: true,
      message: "Email changé avec succès",
      note: "Fonctionnalité en développement",
      code: 'FEATURE_IN_DEVELOPMENT'
    });
  } catch (error) {
    logger.error('❌ Erreur confirmation changement email:', error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
      code: 'EMAIL_CHANGE_ERROR'
    });
  }
};

// ============================================
// 📊 DIAGNOSTIC ET UTILITAIRES
// ============================================

exports.diagnoseUser = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email requis",
        code: 'MISSING_EMAIL'
      });
    }

    const [users] = await db.query(
      `SELECT id, email, statut, type_utilisateur, 
              tentatives_echec, bloque_jusqua, email_verified,
              date_inscription, derniere_connexion
       FROM signup WHERE email = ?`,
      [email]
    );

    if (users.length === 0) {
      return res.json({
        success: false,
        message: "Utilisateur non trouvé",
        code: 'USER_NOT_FOUND'
      });
    }

    const user = users[0];
    const is_blocked = user.bloque_jusqua && new Date(user.bloque_jusqua) > new Date();
    
    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        statut: user.statut,
        type_utilisateur: user.type_utilisateur,
        tentatives_echec: user.tentatives_echec,
        bloque_jusqua: user.bloque_jusqua,
        email_verified: user.email_verified,
        date_inscription: user.date_inscription,
        derniere_connexion: user.derniere_connexion,
        is_active: user.statut === 'actif',
        is_blocked: is_blocked,
        blocked_until: is_blocked ? user.bloque_jusqua : null
      }
    });

  } catch (error) {
    logger.error("❌ Erreur diagnose:", error);
    res.status(500).json({
      success: false,
      message: "Erreur diagnostic",
      code: 'DIAGNOSTIC_ERROR'
    });
  }
};

// ============================================
// 📥 EXPORT DONNÉES (GDPR)
// ============================================

exports.exportUserData = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Non authentifié",
        code: 'UNAUTHORIZED'
      });
    }

    // À implémenter avec extraction complète des données
    return res.json({
      success: true,
      message: "Export des données",
      note: "Fonctionnalité en développement",
      code: 'FEATURE_IN_DEVELOPMENT'
    });
  } catch (error) {
    logger.error('❌ Erreur export données:', error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
      code: 'EXPORT_ERROR'
    });
  }
};

// ============================================
// 🚀 MIDDLEWARE DE PERFORMANCE
// ============================================

// Middleware pour mesurer les performances
exports.performanceMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const requestId = crypto.randomBytes(4).toString('hex');
  
  req.id = requestId;
  
  // Capture la réponse originale
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    
    // Ajoute les métriques de performance à la réponse
    if (typeof data === 'string') {
      try {
        const jsonData = JSON.parse(data);
        if (jsonData.success !== undefined) {
          jsonData.performance = {
            request_id: requestId,
            duration_ms: duration,
            timestamp: new Date().toISOString()
          };
          data = JSON.stringify(jsonData);
        }
      } catch (e) {
        // Si ce n'est pas du JSON, on ne fait rien
      }
    }
    
    // Log de performance
    if (duration > 1000) {
      logger.warning(`⚠️ Requête lente: ${req.method} ${req.originalUrl} - ${duration}ms`);
    }
    
    originalSend.call(this, data);
  };
  
  next();
};