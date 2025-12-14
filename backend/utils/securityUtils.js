// backend/utils/securityUtils.js
const logger = require('./logger');
const bcrypt = require('bcryptjs');

/**
 * 🔹 Journalisation des événements de sécurité
 */
const logSecurityEvent = (eventType, ip, userId = null, additionalData = {}) => {
  const securityEvent = {
    timestamp: new Date().toISOString(),
    eventType,
    ip,
    userId,
    userAgent: additionalData.userAgent,
    ...additionalData
  };

  // Journalisation selon le niveau de sévérité
  switch (eventType) {
    case 'BRUTEFORCE_ATTEMPT':
    case 'UNAUTHORIZED_ADMIN_ACCESS':
      logger.warn('SECURITY WARNING:', securityEvent);
      break;
    case 'SUSPICIOUS_ACTIVITY':
    case 'ACCOUNT_LOCKOUT':
      logger.error('SECURITY ALERT:', securityEvent);
      break;
    default:
      logger.info('SECURITY EVENT:', securityEvent);
  }

  // TODO: Stocker en base de données pour audit
  // await SecurityLog.create(securityEvent);
};

/**
 * 🔹 Validation de la force du mot de passe
 */
const validatePasswordStrength = (password) => {
  const requirements = {
    minLength: 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };

  const errors = [];

  if (password.length < requirements.minLength) {
    errors.push(`Le mot de passe doit contenir au moins ${requirements.minLength} caractères`);
  }
  if (!requirements.hasUpperCase) {
    errors.push('Le mot de passe doit contenir au moins une majuscule');
  }
  if (!requirements.hasLowerCase) {
    errors.push('Le mot de passe doit contenir au moins une minuscule');
  }
  if (!requirements.hasNumbers) {
    errors.push('Le mot de passe doit contenir au moins un chiffre');
  }
  if (!requirements.hasSpecialChar) {
    errors.push('Le mot de passe doit contenir au moins un caractère spécial');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * 🔹 Génération de token sécurisé
 */
const generateSecureToken = (length = 32) => {
  return require('crypto').randomBytes(length).toString('hex');
};

/**
 * 🔹 Hash de mot de passe
 */
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * 🔹 Vérification de mot de passe
 */
const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

/**
 * 🔹 Sanitization des entrées utilisateur
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Supprime les balises HTML
    .substring(0, 1000); // Limite la longueur
};

/**
 * 🔹 Validation d'email
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 🔹 Validation de téléphone
 */
const isValidPhone = (phone) => {
  // Accepte les numéros internationaux
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

module.exports = {
  logSecurityEvent,
  validatePasswordStrength,
  generateSecureToken,
  hashPassword,
  verifyPassword,
  sanitizeInput,
  isValidEmail,
  isValidPhone
};