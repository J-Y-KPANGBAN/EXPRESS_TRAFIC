// backend/middleware/auth.js - VERSION MULTI-RÔLES OPTIMISÉE
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const logger = require("../utils/logger");

/**
 * 🔹 Middleware principal d'authentification UNIFIÉ
 */
exports.auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        code: "TOKEN_REQUIRED",
        message: 'Token d\'authentification manquant'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 🚀 REQUÊTE OPTIMISÉE - seulement les champs nécessaires
    const [users] = await db.query(
      'SELECT id, email, nom, prenom, type_utilisateur, statut FROM signup WHERE id = ? AND statut = "actif"',
      [decoded.id || decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        code: "USER_NOT_FOUND", 
        message: 'Utilisateur non trouvé ou compte désactivé'
      });
    }

    // 🚀 STRUCTURE UNIFIÉE
    req.user = {
      id: users[0].id,
      userId: users[0].id,
      email: users[0].email,
      nom: users[0].nom,
      prenom: users[0].prenom,
      type_utilisateur: users[0].type_utilisateur,
      role: users[0].type_utilisateur // Alias pour compatibilité
    };

    next();
  } catch (error) {
    logger.error('Middleware auth error: ' + error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        code: "TOKEN_EXPIRED",
        message: 'Token expiré'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        code: "INVALID_TOKEN",
        message: 'Token invalide'
      });
    }

    res.status(500).json({
      success: false,
      code: "AUTH_ERROR",
      message: 'Erreur d\'authentification'
    });
  }
};

/**
 * 🔹 CLIENT uniquement - ESPACE PUBLIC
 * Bloque les admins/conducteurs dans l'espace public
 */
exports.requireClient = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      code: "AUTH_REQUIRED", 
      message: "Authentification requise"
    });
  }

  // 🛡️ SÉCURITÉ : Seuls les clients dans l'espace public
  if (req.user.type_utilisateur !== 'client') {
    return res.status(403).json({
      success: false,
      code: "CLIENT_ACCESS_ONLY",
      message: "Accès réservé aux clients - Utilisez votre espace dédié"
    });
  }

  next();
};

/**
 * 🔹 MIDDLEWARE RÔLES MULTIPLES OPTIMISÉ
 * Vérifie si l'utilisateur a un des rôles autorisés
 */
exports.requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        code: "AUTH_REQUIRED",
        message: "Authentification requise"
      });
    }

    // 🚀 VÉRIFICATION ULTRA-RAPIDE
    if (!allowedRoles.includes(req.user.type_utilisateur)) {
      logger.warn(`Tentative accès non autorisé - User: ${req.user.id}, Role: ${req.user.type_utilisateur}, Required: ${allowedRoles.join(', ')}`);
      
      return res.status(403).json({
        success: false,
        code: "ROLE_ACCESS_DENIED",
        message: `Accès refusé. Rôles autorisés: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

/**
 * 🔹 MIDDLEWARE PERMISSIONS GRANULAIRES
 * Pour des contrôles d'accès plus fins
 */
exports.requirePermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        code: "AUTH_REQUIRED",
        message: "Authentification requise"
      });
    }

    // 🎯 DÉFINITION DES PERMISSIONS PAR RÔLE
    const rolePermissions = {
      'admin': [
        'all', 'manage_users', 'manage_trajets', 'manage_reservations', 
        'manage_bus', 'manage_chauffeurs', 'view_reports', 'system_settings',
        'financial_management', 'mass_communications'
      ],
      'conducteur': [
        'view_schedule', 'manage_availability', 'view_assignments',
        'report_incidents', 'update_status'
      ],
      'client': [
        'make_reservations', 'view_history', 'manage_profile',
        'write_reviews', 'cancel_reservations'
      ]
    };

    const userPermissions = rolePermissions[req.user.type_utilisateur] || [];
    
    // 🚀 VÉRIFICATION OPTIMISÉE
    const hasPermission = userPermissions.includes('all') || 
                         userPermissions.includes(requiredPermission);

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        code: "PERMISSION_DENIED",
        message: `Permission insuffisante: ${requiredPermission}`
      });
    }

    next();
  };
};

exports.requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      code: "AUTH_REQUIRED",
      message: "Authentification requise"
    });
  }

  // 🛡️ Vérification rôle super_admin
  if (req.user.type_utilisateur !== 'super_admin') {
    logger.warn(`Tentative accès super_admin non autorisé - User: ${req.user.id}, Role: ${req.user.type_utilisateur}`);
    
    return res.status(403).json({
      success: false,
      code: "SUPER_ADMIN_ACCESS_DENIED",
      message: "Accès refusé. Privilèges super_admin requis."
    });
  }

  next();
};

// 🎯 ALIAS POUR COMPATIBILITÉ
exports.requireAdmin = exports.requireRole.bind(null, ['admin']);