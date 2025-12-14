// backend/utils/validators.js
const { logSecurityEvent } = require('./securityUtils');
const logger = require('./logger');

/**
 * 🔹 Validation d'email avancée
 */
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  const isValid = emailRegex.test(email.trim().toLowerCase());
  
  if (!isValid) {
    logSecurityEvent('INVALID_EMAIL_ATTEMPT', null, null, { email });
  }
  
  return isValid;
};

/**
 * 🔹 Validation de téléphone international
 */
const isValidPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  
  // Nettoyer le numéro
  const cleaned = phone.replace(/\s/g, '').replace(/[-()]/g, '');
  
  // Formats internationaux supportés
  const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/;
  const isValid = phoneRegex.test(cleaned) && cleaned.length >= 8 && cleaned.length <= 15;
  
  return isValid;
};

/**
 * 🔹 Validation de mot de passe robuste
 */
const isValidPassword = (password) => {
  if (!password || typeof password !== 'string') return false;
  
  const requirements = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    noSpaces: !/\s/.test(password)
  };

  const isValid = Object.values(requirements).every(Boolean);
  
  if (!isValid) {
    logSecurityEvent('WEAK_PASSWORD_ATTEMPT', null, null, {
      length: password.length,
      hasUpper: requirements.hasUpperCase,
      hasLower: requirements.hasLowerCase,
      hasNumber: requirements.hasNumbers,
      hasSpecial: requirements.hasSpecialChar
    });
  }
  
  return isValid;
};

/**
 * 🔹 Validation de nom/prénom
 */
const isValidName = (name) => {
  if (!name || typeof name !== 'string') return false;
  
  const nameRegex = /^[a-zA-ZÀ-ÿ\s\-']{2,50}$/;
  return nameRegex.test(name.trim());
};

/**
 * 🔹 Validation de code postal
 */
const isValidPostalCode = (code, country = 'FR') => {
  if (!code || typeof code !== 'string') return false;
  
  const cleaned = code.trim().replace(/\s/g, '');
  
  const patterns = {
    FR: /^\d{5}$/, // France: 5 chiffres
    BE: /^\d{4}$/, // Belgique: 4 chiffres
    CH: /^\d{4}$/, // Suisse: 4 chiffres
    LU: /^\d{4}$/, // Luxembourg: 4 chiffres
    CA: /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/, // Canada: A1A 1A1
    US: /^\d{5}(-\d{4})?$/ // USA: 12345 ou 12345-6789
  };

  const pattern = patterns[country] || /^[0-9A-Za-z\s\-]{3,10}$/;
  return pattern.test(cleaned);
};

/**
 * 🔹 Validation de date de naissance (âge minimum 18 ans)
 */
const isValidBirthDate = (dateString, minAge = 18) => {
  if (!dateString) return false;
  
  try {
    let birthDate;
    
    // Accepter multiple formats
    if (dateString.includes('/')) {
      const [day, month, year] = dateString.split('/').map(Number);
      birthDate = new Date(year, month - 1, day);
    } else {
      birthDate = new Date(dateString);
    }
    
    if (isNaN(birthDate.getTime())) return false;
    
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age >= minAge;
  } catch (error) {
    logger.error('❌ Erreur validation date naissance:', error);
    return false;
  }
};

/**
 * 🔹 Validation de numéro de carte de crédit
 */
const isValidCreditCard = (cardNumber) => {
  if (!cardNumber || typeof cardNumber !== 'string') return false;
  
  const cleaned = cardNumber.replace(/\s/g, '');
  
  // Algorithme de Luhn
  let sum = 0;
  let isEven = false;
  
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
};

/**
 * 🔹 Validation de date d'expiration de carte
 */
const isValidCardExpiry = (expiry) => {
  if (!expiry || typeof expiry !== 'string') return false;
  
  const match = expiry.match(/^(\d{2})\/(\d{2})$/);
  if (!match) return false;
  
  const [, month, year] = match;
  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10) + 2000; // Supposer 20xx
  
  if (monthNum < 1 || monthNum > 12) return false;
  
  const now = new Date();
  const expiryDate = new Date(yearNum, monthNum - 1); // Dernier jour du mois
  
  return expiryDate >= now;
};

/**
 * 🔹 Validation de code CVC
 */
const isValidCVC = (cvc, cardType = 'generic') => {
  if (!cvc || typeof cvc !== 'string') return false;
  
  const lengthRequirements = {
    visa: 3,
    mastercard: 3,
    amex: 4,
    discover: 3,
    generic: 3
  };
  
  const requiredLength = lengthRequirements[cardType] || 3;
  const cvcRegex = new RegExp(`^\\d{${requiredLength}}$`);
  
  return cvcRegex.test(cvc.trim());
};

/**
 * 🔹 Validation de montant
 */
const isValidAmount = (amount, min = 0.01, max = 10000) => {
  if (typeof amount !== 'number' && typeof amount !== 'string') return false;
  
  const numAmount = parseFloat(amount);
  return !isNaN(numAmount) && numAmount >= min && numAmount <= max;
};

/**
 * 🔹 Validation d'URL
 */
const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * 🔹 Validation de code de réduction
 */
const isValidPromoCode = (code) => {
  if (!code || typeof code !== 'string') return false;
  
  const promoRegex = /^[A-Z0-9_-]{4,20}$/i;
  return promoRegex.test(code.trim());
};

/**
 * 🔹 Validation de numéro de siège
 */
const isValidSeatNumber = (seatNumber, maxSeats = 60) => {
  const seatNum = parseInt(seatNumber, 10);
  return !isNaN(seatNum) && seatNum >= 1 && seatNum <= maxSeats;
};

/**
 * 🔹 Validation d'identifiant de trajet
 */
const isValidTrajetId = (id) => {
  if (!id || typeof id !== 'string') return false;
  
  const trajetRegex = /^TR[A-Z0-9]{4,6}$/;
  return trajetRegex.test(id);
};

/**
 * 🔹 Validation d'identifiant de bus
 */
const isValidBusId = (id) => {
  if (!id || typeof id !== 'string') return false;
  
  const busRegex = /^BUS[A-Z0-9]{2,4}$/;
  return busRegex.test(id);
};

/**
 * 🔹 Sanitization des entrées utilisateur
 */
const sanitizeInput = (input, options = {}) => {
  if (input === null || input === undefined) return '';
  
  const {
    maxLength = 1000,
    allowHtml = false,
    trim = true,
    case: caseOption = 'preserve' // 'lower', 'upper', 'preserve'
  } = options;
  
  let sanitized = String(input);
  
  // Trim
  if (trim) {
    sanitized = sanitized.trim();
  }
  
  // Supprimer le HTML si non autorisé
  if (!allowHtml) {
    sanitized = sanitized.replace(/<[^>]*>?/gm, '');
  }
  
  // Échapper les caractères spéciaux
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  // Limiter la longueur
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  // Gestion de la casse
  switch (caseOption) {
    case 'lower':
      sanitized = sanitized.toLowerCase();
      break;
    case 'upper':
      sanitized = sanitized.toUpperCase();
      break;
    default:
      // Préserver la casse originale
      break;
  }
  
  return sanitized;
};

/**
 * 🔹 Validation de données de réservation
 */
const validateReservationData = (data) => {
  const errors = [];
  
  if (!isValidTrajetId(data.trajet_id)) {
    errors.push('Identifiant de trajet invalide');
  }
  
  if (!isValidSeatNumber(data.siege_numero)) {
    errors.push('Numéro de siège invalide');
  }
  
  if (data.passagers && Array.isArray(data.passagers)) {
    data.passagers.forEach((passager, index) => {
      if (!isValidName(passager.nom)) {
        errors.push(`Nom invalide pour le passager ${index + 1}`);
      }
      if (!isValidName(passager.prenom)) {
        errors.push(`Prénom invalide pour le passager ${index + 1}`);
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * 🔹 Validation de données de paiement
 */
const validatePaymentData = (data) => {
  const errors = [];
  
  if (!isValidAmount(data.amount)) {
    errors.push('Montant invalide');
  }
  
  if (!['carte', 'mobile_money', 'paypal', 'especes'].includes(data.method)) {
    errors.push('Méthode de paiement non supportée');
  }
  
  if (data.method === 'carte') {
    if (!isValidCreditCard(data.cardNumber)) {
      errors.push('Numéro de carte invalide');
    }
    if (!isValidCardExpiry(data.expiry)) {
      errors.push('Date d\'expiration invalide');
    }
    if (!isValidCVC(data.cvc, data.cardType)) {
      errors.push('Code CVC invalide');
    }
  }
  
  if (data.method === 'mobile_money' && !isValidPhone(data.phone)) {
    errors.push('Numéro de téléphone invalide pour Mobile Money');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  isValidEmail,
  isValidPhone,
  isValidPassword,
  isValidName,
  isValidPostalCode,
  isValidBirthDate,
  isValidCreditCard,
  isValidCardExpiry,
  isValidCVC,
  isValidAmount,
  isValidUrl,
  isValidPromoCode,
  isValidSeatNumber,
  isValidTrajetId,
  isValidBusId,
  sanitizeInput,
  validateReservationData,
  validatePaymentData
};