const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const { sanitizeInput } = require("./sanitize");

// Réexport des limiteurs depuis rateLimiter (pour compatibilité)
const { authLimiter, paymentLimiter, adminLimiter } = require("./rateLimiter");

// Headers de sécurité
exports.securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Sanitization des données (wrapper)
exports.sanitizeData = sanitizeInput;

// Réexport des limiteurs pour compatibilité
exports.authLimiter = authLimiter;
exports.paymentLimiter = paymentLimiter;
exports.adminLimiter = adminLimiter;