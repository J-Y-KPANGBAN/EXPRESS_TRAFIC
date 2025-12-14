// backend/middleware/maintenance.js
const maintenanceService = require('../services/maintenanceService');

/**
 * 🔹 Middleware de mode maintenance
 * Bloque l'accès au site en maintenance sauf pour les admins
 */
const maintenanceMode = async (req, res, next) => {
  try {
    // Utiliser le service de maintenance
    const status = await maintenanceService.getMaintenanceStatus();
    
    if (status.isActive) {
      // Les admins peuvent toujours accéder
      if (req.user && req.user.type_utilisateur === 'admin') {
        return next();
      }

      return res.status(503).json({
        success: false,
        code: 'MAINTENANCE_MODE',
        message: status.message || 'Le site est actuellement en maintenance. Veuillez nous excuser pour la gêne occasionnée.',
        estimatedRestoration: '30 minutes',
        since: status.since
      });
    }

    next();
  } catch (error) {
    // En cas d'erreur, on laisse passer pour ne pas bloquer le site
    console.error('Erreur middleware maintenance:', error);
    next();
  }
};

module.exports = maintenanceMode;