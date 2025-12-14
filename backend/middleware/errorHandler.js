// backend/middleware/errorHandler.js
const { logSecurityEvent } = require('../utils/securityUtils');
const logger = require('../utils/logger');

/**
 * 🔹 Gestionnaire d'erreurs centralisé
 * Capture toutes les erreurs de l'application
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log de l'erreur
  logger.error('Error Handler:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    user: req.user ? req.user.id : 'non_authentifie'
  });

  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    logSecurityEvent('JWT_ERROR', req.ip, req.user?.id, { error: err.message });
    return res.status(401).json({
      success: false,
      code: 'INVALID_TOKEN',
      message: 'Token invalide'
    });
  }

  if (err.name === 'TokenExpiredError') {
    logSecurityEvent('JWT_EXPIRED', req.ip, req.user?.id);
    return res.status(401).json({
      success: false,
      code: 'TOKEN_EXPIRED',
      message: 'Session expirée'
    });
  }

  // Erreur de validation Mongoose
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Données invalides',
      errors: errors
    });
  }

  // Erreur de clé dupliquée Mongoose
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      code: 'DUPLICATE_ENTRY',
      message: `${field} existe déjà`
    });
  }

  // Erreur CastError (ID invalide)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      code: 'INVALID_ID',
      message: 'ID invalide'
    });
  }

  // Erreur de limite de taux
  if (err.status === 429) {
    return res.status(429).json({
      success: false,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Trop de requêtes, veuillez réessayer plus tard'
    });
  }

  // Erreur serveur par défaut
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erreur interne du serveur';

  res.status(statusCode).json({
    success: false,
    code: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'production' ? 'Erreur serveur' : message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

module.exports = errorHandler;