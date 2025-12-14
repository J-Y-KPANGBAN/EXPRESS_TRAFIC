// backend/middleware/index.js
const { 
  authenticateToken, 
  requireAdmin, 
  requireClient
} = require('./auth');

const errorHandler = require('./errorHandler');
const maintenanceMode = require('./maintenance');
const { 
  authLimiter,
  apiLimiter, 
  reservationLimiter,
  paymentLimiter,
  sensitiveLimiter  // Ajouter celui-ci
} = require('./rateLimiter');

const { 
  requireFields, 
  validateSignupInput, 
  validateLoginInput, 
  validateContactInput, 
  validatePublicReservationInput 
} = require('./validateInput');

// Importer les nouveaux middlewares
const { requireEmailVerified, antiBruteForce } = require('./security');

module.exports = {
  // Authentification
  auth: authenticateToken,
  requireAdmin,
  requireClient,
  
  // Sécurité avancée
  requireEmailVerified,
  antiBruteForce,
  
  // Sécurité de base
  errorHandler,
  maintenanceMode,
  
  // Rate Limiting
  authLimiter,
  apiLimiter,  
  reservationLimiter,
  paymentLimiter,
  sensitiveLimiter,  // Export ajouté
  
  // Validation
  validate: {
    requireFields,
    signup: validateSignupInput,
    login: validateLoginInput,
    contact: validateContactInput,
    publicReservation: validatePublicReservationInput
  }
};