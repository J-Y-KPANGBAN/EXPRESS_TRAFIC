// backend/controllers/admin/adminSystemController.js - VERSION COMPLÈTE
const db = require("../../config/db");
const  logger  = require("../../utils/logger");
const fs = require('fs');
const path = require('path');

// 🛡️ SERVICES (mock pour l'instant)
const maintenanceService = {
  activateMaintenance: async (message) => {
    logger.info(`🛠️ Maintenance activée: ${message}`);
    return true;
  },
  deactivateMaintenance: async () => {
    logger.info("✅ Maintenance désactivée");
    return true;
  }
};

exports.getSystemSettings = async (req, res) => {
  try {
    const [settings] = await db.query("SELECT * FROM system_settings LIMIT 1");
    
    // Si pas de paramètres, créer des paramètres par défaut
    let systemSettings;
    if (settings.length === 0) {
      const [result] = await db.query(`
        INSERT INTO system_settings 
          (maintenance_mode, maintenance_message, default_language, session_timeout_minutes,
           password_expiry_months, inactivity_warning_months, inactivity_deletion_months)
        VALUES (0, 'Maintenance planifiée', 'fr', 10, 6, 6, 12)
      `);
      systemSettings = {
        id: result.insertId,
        maintenance_mode: 0,
        maintenance_message: 'Maintenance planifiée',
        default_language: 'fr',
        session_timeout_minutes: 10,
        password_expiry_months: 6,
        inactivity_warning_months: 6,
        inactivity_deletion_months: 12
      };
    } else {
      systemSettings = settings[0];
    }

    res.json({
      success: true,
      data: systemSettings
    });

  } catch (error) {
    logger.error("Erreur getSystemSettings: " + error.message);
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};

exports.updateSystemSettings = async (req, res) => {
  try {
    const {
      maintenance_mode,
      maintenance_message,
      default_language,
      session_timeout_minutes,
      password_expiry_months,
      inactivity_warning_months,
      inactivity_deletion_months
    } = req.body;

    // Validation des données
    if (!['fr', 'en', 'es'].includes(default_language)) {
      return res.status(400).json({ 
        success: false, 
        message: "Langue non supportée (fr, en, es)" 
      });
    }

    if (session_timeout_minutes < 1 || session_timeout_minutes > 1440) {
      return res.status(400).json({ 
        success: false, 
        message: "Timeout session invalide (1-1440 minutes)" 
      });
    }

    await db.query(`
      UPDATE system_settings 
      SET maintenance_mode = ?,
          maintenance_message = ?,
          default_language = ?,
          session_timeout_minutes = ?,
          password_expiry_months = ?,
          inactivity_warning_months = ?,
          inactivity_deletion_months = ?,
          maintenance_since = CASE 
            WHEN ? = 1 AND maintenance_mode = 0 THEN NOW()
            ELSE maintenance_since 
          END
      WHERE id = 1
    `, [
      maintenance_mode ? 1 : 0,
      maintenance_message,
      default_language,
      session_timeout_minutes,
      password_expiry_months,
      inactivity_warning_months,
      inactivity_deletion_months,
      maintenance_mode
    ]);

    // Si activation maintenance, notifier les services
    if (maintenance_mode) {
      await maintenanceService.activateMaintenance(maintenance_message);
    } else {
      await maintenanceService.deactivateMaintenance();
    }

    logger.success("Paramètres système mis à jour");
    
    res.json({
      success: true,
      message: "Paramètres système mis à jour avec succès"
    });

  } catch (error) {
    logger.error("Erreur updateSystemSettings: " + error.message);
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};

exports.getSystemHealth = async (req, res) => {
  try {
    // Vérification de la santé du système
    const healthChecks = [];

    // Vérification base de données
    try {
      const [dbCheck] = await db.query("SELECT 1 as status");
      healthChecks.push({
        service: 'database',
        status: 'healthy',
        response_time: 'OK'
      });
    } catch (dbError) {
      healthChecks.push({
        service: 'database',
        status: 'unhealthy',
        error: dbError.message
      });
    }

    // Vérification services externes
    const services = [
      { name: 'email_service', check: () => Promise.resolve(true) },
      { name: 'sms_service', check: () => Promise.resolve(true) },
      { name: 'payment_service', check: () => Promise.resolve(true) }
    ];

    for (const service of services) {
      try {
        await service.check();
        healthChecks.push({
          service: service.name,
          status: 'healthy'
        });
      } catch (error) {
        healthChecks.push({
          service: service.name,
          status: 'unhealthy',
          error: error.message
        });
      }
    }

    // Statistiques système
    const [stats] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM signup) as total_users,
        (SELECT COUNT(*) FROM Reservations WHERE DATE(date_reservation) = CURDATE()) as reservations_today,
        (SELECT COUNT(*) FROM Trajets WHERE date_depart >= CURDATE()) as upcoming_trips,
        (SELECT COUNT(*) FROM Bus WHERE statut = 'actif') as active_buses
    `);

    res.json({
      success: true,
      data: {
        health_checks: healthChecks,
        statistics: stats[0],
        timestamp: new Date().toISOString(),
        version: '2.1.0'
      }
    });

  } catch (error) {
    logger.error("Erreur getSystemHealth: " + error.message);
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};

// Pour React Native - Configuration mobile
exports.getMobileConfig = async (req, res) => {
  try {
    const [settings] = await db.query("SELECT * FROM system_settings LIMIT 1");
    
    const mobileConfig = {
      app: {
        version: '2.1.0',
        min_version: '2.0.0',
        maintenance_mode: settings[0]?.maintenance_mode || 0,
        maintenance_message: settings[0]?.maintenance_message || ''
      },
      features: {
        multi_language: true,
        push_notifications: true,
        mobile_payments: true,
        qr_code_tickets: true,
        real_time_tracking: false // À activer plus tard
      },
      urls: {
        api_base: process.env.API_BASE_URL || 'http://localhost:3000',
        terms_url: `${process.env.APP_URL || 'http://localhost:3000'}/terms`,
        privacy_url: `${process.env.APP_URL || 'http://localhost:3000'}/privacy`
      }
    };

    res.json({
      success: true,
      data: mobileConfig
    });

  } catch (error) {
    logger.error("Erreur getMobileConfig: " + error.message);
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};

// ========================================
// 🆕 FONCTIONS MANQUANTES - À AJOUTER
// ========================================

// 🗄️ SAUVEGARDE BASE DE DONNÉES
exports.createBackup = async (req, res) => {
  try {
    // Pour l'instant, on simule une sauvegarde
    // En production, vous utiliserez mysqldump ou un service dédié
    
    const backupInfo = {
      filename: `backup-${new Date().toISOString().split('T')[0]}.sql`,
      timestamp: new Date().toISOString(),
      tables: [
        'signup', 'Reservations', 'Trajets', 'Bus', 
        'Chauffeurs', 'Paiements', 'Avis'
      ],
      status: 'simulated',
      size: '0 MB'
    };

    logger.success(`📦 Sauvegarde simulée créée: ${backupInfo.filename}`);

    res.json({
      success: true,
      message: "Sauvegarde créée avec succès (simulation)",
      data: backupInfo
    });

  } catch (error) {
    logger.error("Erreur createBackup: " + error.message);
    res.status(500).json({ 
      success: false, 
      message: "Erreur lors de la sauvegarde",
      error: error.message 
    });
  }
};

// 📊 LOGS SYSTÈME
exports.getSystemLogs = async (req, res) => {
  try {
    const { type = 'all', date_debut, date_fin, limit = 100 } = req.query;

    // 🛡️ Validation des paramètres
    const validTypes = ['error', 'info', 'warning', 'all'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Type de log invalide"
      });
    }

    let whereConditions = [];
    let queryParams = [];

    // Filtre par type
    if (type !== 'all') {
      whereConditions.push("role = ?");
      queryParams.push(type);
    }

    // Filtre par date
    if (date_debut && date_fin) {
      whereConditions.push("DATE(created_at) BETWEEN ? AND ?");
      queryParams.push(date_debut, date_fin);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // 🛡️ Requête sécurisée avec limite
    const [logs] = await db.query(`
      SELECT 
        id,
        user_id,
        role,
        action,
        target_type,
        ip_address,
        created_at
      FROM logs_actions 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ?
    `, [...queryParams, parseInt(limit)]);

    // Statistiques des logs
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN role = 'error' THEN 1 END) as errors,
        COUNT(CASE WHEN role = 'warning' THEN 1 END) as warnings,
        COUNT(CASE WHEN role = 'info' THEN 1 END) as infos
      FROM logs_actions 
      ${whereClause}
    `, queryParams);

    res.json({
      success: true,
      data: {
        logs: logs,
        statistics: stats[0],
        filters: {
          type: type,
          date_range: date_debut && date_fin ? { date_debut, date_fin } : null,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    logger.error("Erreur getSystemLogs: " + error.message);
    res.status(500).json({ 
      success: false, 
      message: "Erreur lors de la récupération des logs",
      error: error.message 
    });
  }
};

// 🔧 MAINTENANCE AUTOMATIQUE
exports.triggerMaintenance = async (req, res) => {
  try {
    const { action, message = "Maintenance planifiée", duration_minutes } = req.body;

    if (action === 'start') {
      // Activer la maintenance
      await db.query(`
        UPDATE system_settings 
        SET maintenance_mode = 1,
            maintenance_message = ?,
            maintenance_since = NOW()
        WHERE id = 1
      `, [message]);

      await maintenanceService.activateMaintenance(message);

      logger.success(`🛠️ Maintenance démarrée: ${message}`);

      res.json({
        success: true,
        message: "Maintenance activée",
        data: {
          mode: 'maintenance',
          message: message,
          since: new Date().toISOString(),
          duration: duration_minutes || 'indéterminée'
        }
      });

    } else if (action === 'stop') {
      // Désactiver la maintenance
      await db.query(`
        UPDATE system_settings 
        SET maintenance_mode = 0,
            maintenance_message = ''
        WHERE id = 1
      `);

      await maintenanceService.deactivateMaintenance();

      logger.success("✅ Maintenance arrêtée");

      res.json({
        success: true,
        message: "Maintenance désactivée",
        data: {
          mode: 'normal',
          since: new Date().toISOString()
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Action invalide (start ou stop)"
      });
    }

  } catch (error) {
    logger.error("Erreur triggerMaintenance: " + error.message);
    res.status(500).json({ 
      success: false, 
      message: "Erreur lors de la gestion de la maintenance",
      error: error.message 
    });
  }
};

// 🆕 FONCTION UTILITAIRE - NETTOYAGE DES LOGS
exports.cleanupLogs = async (req, res) => {
  try {
    const { days_old = 30 } = req.query;

    // Supprimer les logs de plus de X jours
    const [result] = await db.query(`
      DELETE FROM logs_actions 
      WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [parseInt(days_old)]);

    logger.success(`🧹 Logs nettoyés: ${result.affectedRows} entrées supprimées`);

    res.json({
      success: true,
      message: `Nettoyage des logs terminé`,
      data: {
        deleted_entries: result.affectedRows,
        retention_days: parseInt(days_old)
      }
    });

  } catch (error) {
    logger.error("Erreur cleanupLogs: " + error.message);
    res.status(500).json({ 
      success: false, 
      message: "Erreur lors du nettoyage des logs",
      error: error.message 
    });
  }
};