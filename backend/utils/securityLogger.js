// backend/utils/securityLogger.js
const logger = require('./logger');

exports.logSecurityEvent = (eventType, details, userId = null, ip = null) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event: eventType,
    userId,
    ip: ip || 'unknown',
    details
  };

  // Log en console en développement
  if (process.env.NODE_ENV === 'development') {
    console.log('🔐 SECURITY EVENT:', logEntry);
  }

  // Log structuré pour la production
  logger.warn(`SECURITY: ${eventType} - ${JSON.stringify(logEntry)}`);

  // TODO: Envoyer une alerte pour les événements critiques
  if (eventType.includes('FAILED') || eventType.includes('SUSPICIOUS')) {
    // Intégration avec un service d'alerting
  }
};

// Types d'événements à surveiller
exports.SecurityEvents = {
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  SIGNUP_ATTEMPT: 'SIGNUP_ATTEMPT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_SUCCESS: 'PAYMENT_SUCCESS'
};