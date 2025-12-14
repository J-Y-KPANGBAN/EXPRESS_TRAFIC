// backend/utils/paymentUtils.js
const logger = require('./logger');

/**
 * 🔹 Formate un montant selon la devise
 */
const formatAmount = (amount, currency = 'EUR', locale = 'fr-FR') => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount);
  } catch (error) {
    logger.error('❌ Erreur formatAmount:', error);
    return `${amount} ${currency}`;
  }
};

/**
 * 🔹 Calcule les frais de service
 */
const calculateServiceFees = (amount, paymentMethod, context = {}) => {
  let fees = 0;
  
  switch (paymentMethod) {
    case 'carte':
      fees = amount * 0.02; // 2% pour carte
      break;
    case 'mobile_money':
      fees = amount * 0.015; // 1.5% pour mobile money
      break;
    case 'paypal':
      fees = amount * 0.025; // 2.5% pour PayPal
      break;
    case 'especes':
      fees = 0; // Pas de frais pour espèces
      break;
    default:
      fees = amount * 0.02; // 2% par défaut
  }

  // Appliquer des frais supplémentaires en haute saison
  if (context.highSeason) {
    fees += amount * 0.01; // +1% en haute saison
  }

  // Frais minimum
  const minFee = 0.50;
  fees = Math.max(fees, minFee);

  // Arrondir à 2 décimales
  return Math.round(fees * 100) / 100;
};

/**
 * 🔹 Calcule le montant total avec frais
 */
const calculateTotalAmount = (baseAmount, fees, taxRate = 0) => {
  const total = baseAmount + fees + (baseAmount * taxRate);
  return Math.round(total * 100) / 100;
};

/**
 * 🔹 Valide un numéro de carte (algorithme de Luhn)
 */
const validateCardNumber = (cardNumber) => {
  const cleaned = cardNumber.replace(/\s/g, '');
  
  if (!/^\d+$/.test(cleaned)) {
    return false;
  }

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
 * 🔹 Valide une date d'expiration de carte
 */
const validateCardExpiry = (expiry) => {
  if (!/^\d{2}\/\d{2}$/.test(expiry)) {
    return false;
  }

  const [month, year] = expiry.split('/').map(Number);
  const now = new Date();
  const currentYear = now.getFullYear() % 100;
  const currentMonth = now.getMonth() + 1;

  if (month < 1 || month > 12) {
    return false;
  }

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return false;
  }

  return true;
};

/**
 * 🔹 Valide un code CVC
 */
const validateCVC = (cvc) => {
  return /^\d{3,4}$/.test(cvc);
};

/**
 * 🔹 Génère un numéro de transaction unique
 */
const generateTransactionId = (prefix = 'TXN') => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`.toUpperCase();
};

/**
 * 🔹 Masque un numéro de carte pour l'affichage
 */
const maskCardNumber = (cardNumber) => {
  const cleaned = cardNumber.replace(/\s/g, '');
  if (cleaned.length < 8) return cardNumber;
  
  const firstFour = cleaned.substring(0, 4);
  const lastFour = cleaned.substring(cleaned.length - 4);
  const masked = '*'.repeat(cleaned.length - 8);
  
  return `${firstFour} ${masked} ${lastFour}`;
};

/**
 * 🔹 Obtient le type de carte à partir du numéro
 */
const getCardType = (cardNumber) => {
  const cleaned = cardNumber.replace(/\s/g, '');
  
  const patterns = {
    visa: /^4/,
    mastercard: /^5[1-5]/,
    amex: /^3[47]/,
    discover: /^6(?:011|5)/,
    diners: /^3(?:0[0-5]|[68])/,
    jcb: /^(?:2131|1800|35)/
  };

  for (const [type, pattern] of Object.entries(patterns)) {
    if (pattern.test(cleaned)) {
      return type;
    }
  }

  return 'unknown';
};

/**
 * 🔹 Valide un numéro de téléphone pour Mobile Money
 */
const validateMobileMoneyNumber = (phone, provider) => {
  const cleaned = phone.replace(/\s/g, '').replace(/^\+/, '');
  
  const providerPatterns = {
    orange: /^(33|221)[0-9]{8}$/,
    mtn: /^(24|25|26|27|28|29|54|55|56|57|58|59|65|66|67|68|69)[0-9]{7}$/,
    moov: /^(01|02|03|04|05|06|07|08|09)[0-9]{7}$/,
    wave: /^(33|70|75|76|77|78)[0-9]{7}$/
  };

  const pattern = providerPatterns[provider];
  return pattern ? pattern.test(cleaned) : /^[0-9]{8,15}$/.test(cleaned);
};

/**
 * 🔹 Convertit un montant entre devises (simulation)
 */
const convertCurrency = async (amount, fromCurrency, toCurrency) => {
  // En production, utiliser une API de conversion réelle
  const rates = {
    EUR: { USD: 1.08, XOF: 655.96, XAF: 655.96 },
    USD: { EUR: 0.93, XOF: 607.50, XAF: 607.50 },
    XOF: { EUR: 0.00152, USD: 0.00165, XAF: 1 },
    XAF: { EUR: 0.00152, USD: 0.00165, XOF: 1 }
  };

  if (fromCurrency === toCurrency) {
    return amount;
  }

  const rate = rates[fromCurrency]?.[toCurrency];
  if (!rate) {
    throw new Error(`Conversion non supportée: ${fromCurrency} -> ${toCurrency}`);
  }

  return amount * rate;
};

module.exports = {
  formatAmount,
  calculateServiceFees,
  calculateTotalAmount,
  validateCardNumber,
  validateCardExpiry,
  validateCVC,
  generateTransactionId,
  maskCardNumber,
  getCardType,
  validateMobileMoneyNumber,
  convertCurrency
};