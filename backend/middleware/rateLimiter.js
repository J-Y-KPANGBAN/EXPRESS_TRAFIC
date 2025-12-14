const rateLimit = require('express-rate-limit');

// 🔹 Create un limiteur de taux configurable
const createRateLimiter = (options) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      success: false,
      code: 'RATE_LIMIT_EXCEEDED',
      message: options.message || 'Trop de requêtes, veuillez réessayer plus tard.',
      retryAfter: Math.ceil(options.windowMs / 1000 / 60) + ' minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    skip: (req, res) => {
      // Skip rate limiting for super_admin in development
      return process.env.NODE_ENV === 'development' && req.user?.role === 'super_admin';
    }
  });
};

// 🔹 Export des limiteurs les plus utilisés
module.exports = {
  // Limite pour l'authentification
  authLimiter: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 tentatives max
    message: 'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes',
    skipSuccessfulRequests: true
  }),

  // Limite pour les réservations
  reservationLimiter: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 réservations max par minute
    message: 'Trop de réservations, veuillez ralentir'
  }),

  // Limite pour la création de réservations (admin)
  createReservationLimiter: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 créations max par minute
    message: 'Trop de réservations créées, veuillez ralentir'
  }),

  // Limite générale pour l'API publique
  apiLimiter: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requêtes max
    message: 'Trop de requêtes, veuillez réessayer plus tard'
  }),

  // Limite pour les paiements
  paymentLimiter: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 3, // 3 paiements max par minute
    message: 'Trop de tentatives de paiement, réessayez dans 1 minute'
  }),

  // Limite pour les administrateurs
  adminLimiter: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requêtes max
    message: 'Trop de requêtes administrateur, veuillez réessayer plus tard'
  })
};