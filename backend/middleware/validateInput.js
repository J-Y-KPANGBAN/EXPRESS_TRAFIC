// backend/middleware/validateInput.js (VERSION OPTIMISÉE)
const { body, validationResult } = require('express-validator');
const { isValidEmail, isValidPhone } = require('../utils/validators');

// 🔹 Validation inscription client
exports.validateSignupInput = [
  body('nom').trim().isLength({ min: 1, max: 100 }).withMessage('Nom requis (1-100 caractères)'),
  body('prenom').trim().isLength({ min: 1, max: 100 }).withMessage('Prénom requis (1-100 caractères)'),
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('mot_de_passe').isLength({ min: 8 }).withMessage('Mot de passe minimum 8 caractères'),
  body('telephone').isMobilePhone('any').withMessage('Numéro de téléphone invalide'),
  body('ville').trim().isLength({ min: 1 }).withMessage('Ville requise'),
  body('date_naissance').isDate().withMessage('Date de naissance invalide'),
  body('conditions_acceptees').equals('1').withMessage('Vous devez accepter les CGU'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }
    next();
  }
];

// 🔹 Validation connexion - VERSION CORRIGÉE

exports.validateLoginInput = [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('mot_de_passe').isLength({ min: 1 }).withMessage('Mot de passe requis'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ ERREUR VALIDATION LOGIN:', errors.array()); // ← AJOUTEZ CE LOG
      return res.status(400).json({
        success: false,
        message: 'Données de connexion invalides', // ← CORRIGEZ LE MESSAGE
        errors: errors.array()
      });
    }
    next();
  }
];

// 🔹 Validation réservation
exports.validateReservationInput = [
  body('trajet_id').isLength({ min: 1 }).withMessage('Trajet requis'),
  body('siege_numero').isInt({ min: 1 }).withMessage('Numéro de siège invalide'),
  body('moyen_paiement').isLength({ min: 1 }).withMessage('Moyen de paiement requis'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données de réservation invalides',
        errors: errors.array()
      });
    }
    next();
  }
];

// 🔹 Validation contact
exports.validateContactInput = [
  body('firstName').trim().isLength({ min: 1, max: 100 }).withMessage('Prénom requis'),
  body('lastName').trim().isLength({ min: 1, max: 100 }).withMessage('Nom requis'),
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('sujet').trim().isLength({ min: 1, max: 100 }).withMessage('Sujet requis'),
  body('message').trim().isLength({ min: 10, max: 2000 }).withMessage('Message entre 10 et 2000 caractères'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données de contact invalides',
        errors: errors.array()
      });
    }
    next();
  }
];
// 🔹 Validation générique avec express-validator
exports.validateInput = (validationRules) => {
  const validations = [];
  
  for (const [field, rules] of Object.entries(validationRules)) {
    let validator = body(field);
    
    if (rules.required) {
      validator = validator.notEmpty().withMessage(`Le champ ${field} est requis`);
    }
    
    if (rules.type === 'string') {
      validator = validator.isString().withMessage(`Le champ ${field} doit être une chaîne de caractères`);
    } else if (rules.type === 'number') {
      validator = validator.isNumeric().withMessage(`Le champ ${field} doit être un nombre`);
    } else if (rules.type === 'boolean') {
      validator = validator.isBoolean().withMessage(`Le champ ${field} doit être un booléen`);
    } else if (rules.type === 'array') {
      validator = validator.isArray().withMessage(`Le champ ${field} doit être un tableau`);
    } else if (rules.type === 'object') {
      // Pour les objets, on vérifie que c'est un objet JSON valide
      validator = validator.custom((value) => {
        if (typeof value === 'object' && !Array.isArray(value)) return true;
        try {
          JSON.parse(value);
          return true;
        } catch {
          return false;
        }
      }).withMessage(`Le champ ${field} doit être un objet JSON valide`);
    }
    
    if (rules.minLength) {
      validator = validator.isLength({ min: rules.minLength })
        .withMessage(`Le champ ${field} doit avoir au moins ${rules.minLength} caractères`);
    }
    
    if (rules.maxLength) {
      validator = validator.isLength({ max: rules.maxLength })
        .withMessage(`Le champ ${field} ne doit pas dépasser ${rules.maxLength} caractères`);
    }
    
    validations.push(validator);
  }
  
  // Middleware final de traitement des erreurs
  validations.push((req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }
    next();
  });
  
  return validations;
};

exports.validateLoginInput = [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('mot_de_passe').isLength({ min: 1 }).withMessage('Mot de passe requis'),
  
  (req, res, next) => {
    console.log('🔍 VALIDATION LOGIN - Données reçues:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ ERREURS VALIDATION:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Données de connexion invalides',
        errors: errors.array()
      });
    }
    
    console.log('✅ Validation login réussie');
    next();
  }
];