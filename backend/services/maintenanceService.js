// backend/services/maintenanceService.js
const db = require("../config/db");
const { logSecurityEvent } = require("../utils/securityUtils");
const logger = require("../utils/logger");

class MaintenanceService {
  
  /* ============================================================
     🛠️ ACTIVER/DÉSACTIVER LE MODE MAINTENANCE
  ============================================================ */
  async toggleMaintenance(mode, message = null, estimatedDuration = null) {
    try {
      const maintenanceMessage = message || 
        "Le site est actuellement en maintenance. Veuillez nous excuser pour la gêne occasionnée.";
      
      const [result] = await db.execute(
        `INSERT INTO system_settings 
         (maintenance_mode, maintenance_message, maintenance_since, default_language, session_timeout_minutes)
         VALUES (?, ?, NOW(), 'fr', 10)
         ON DUPLICATE KEY UPDATE
         maintenance_mode = ?,
         maintenance_message = ?,
         maintenance_since = IF(?, NOW(), NULL),
         updated_at = NOW()`,
        [
          mode ? 1 : 0,
          maintenanceMessage,
          mode ? 1 : 0,
          maintenanceMessage,
          mode ? 1 : 0
        ]
      );

      const action = mode ? 'activé' : 'désactivé';
      logger.info(`🔧 Mode maintenance ${action}: ${maintenanceMessage}`);

      logSecurityEvent('MAINTENANCE_MODE_CHANGED', null, null, {
        mode: mode ? 'ON' : 'OFF',
        message: maintenanceMessage,
        estimatedDuration
      });

      return {
        success: true,
        maintenanceMode: mode,
        message: maintenanceMessage,
        since: mode ? new Date() : null,
        estimatedDuration
      };

    } catch (error) {
      logger.error(`❌ Erreur toggleMaintenance: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /* ============================================================
     🔍 VÉRIFIER LE STATUT DE MAINTENANCE
  ============================================================ */
  async getMaintenanceStatus() {
    try {
      const [rows] = await db.execute(
        `SELECT maintenance_mode, maintenance_message, maintenance_since
         FROM system_settings 
         WHERE id = 1`
      );

      const status = rows[0] || {
        maintenance_mode: 0,
        maintenance_message: null,
        maintenance_since: null
      };

      return {
        isActive: Boolean(status.maintenance_mode),
        message: status.maintenance_message,
        since: status.maintenance_since,
        isScheduled: this.isScheduledMaintenance(status.maintenance_since)
      };

    } catch (error) {
      logger.error(`❌ Erreur getMaintenanceStatus: ${error.message}`);
      // En cas d'erreur, on considère que la maintenance n'est pas active
      return {
        isActive: false,
        message: null,
        since: null,
        isScheduled: false
      };
    }
  }

  /* ============================================================
     📅 PLANIFIER UNE MAINTENANCE
  ============================================================ */
  async scheduleMaintenance(startTime, duration, message, notifyUsers = true) {
    try {
      const scheduledDate = new Date(startTime);
      const now = new Date();

      if (scheduledDate <= now) {
        throw new Error("La date de maintenance doit être dans le futur");
      }

      // Stocker la maintenance planifiée (vous pourriez créer une table dedicated)
      const [result] = await db.execute(
        `INSERT INTO scheduled_maintenance 
         (start_time, duration_minutes, message, status, created_at)
         VALUES (?, ?, ?, 'scheduled', NOW())`,
        [scheduledDate, duration, message]
      );

      logger.info(`📅 Maintenance planifiée: ${scheduledDate} - ${message}`);

      // Notifier les utilisateurs si demandé
      if (notifyUsers) {
        await this.notifyUsersOfScheduledMaintenance(scheduledDate, message, duration);
      }

      return {
        success: true,
        maintenanceId: result.insertId,
        startTime: scheduledDate,
        duration,
        message
      };

    } catch (error) {
      logger.error(`❌ Erreur scheduleMaintenance: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /* ============================================================
     📧 NOTIFIER LES UTILISATEURS D'UNE MAINTENANCE PLANIFIÉE
  ============================================================ */
  async notifyUsersOfScheduledMaintenance(scheduledDate, message, duration) {
    try {
      // Récupérer les utilisateurs actifs
      const [users] = await db.execute(
        `SELECT id, email, nom, prenom, langue_preferee 
         FROM signup 
         WHERE statut = 'actif' 
         AND derniere_connexion > DATE_SUB(NOW(), INTERVAL 30 DAY)`
      );

      const emailService = require('./emailService');
      
      for (const user of users) {
        try {
          await emailService.sendMail(
            user.email,
            '🚧 Maintenance planifiée - ExpressTrafic',
            this.getMaintenanceEmailTemplate(user, scheduledDate, message, duration)
          );
        } catch (emailError) {
          logger.warning(`❌ Erreur envoi email maintenance à ${user.email}: ${emailError.message}`);
        }
      }

      logger.success(`📧 Notifications maintenance envoyées à ${users.length} utilisateurs`);

    } catch (error) {
      logger.error(`❌ Erreur notifyUsersOfScheduledMaintenance: ${error.message}`);
    }
  }

  /* ============================================================
     🛠️ TEMPLATE EMAIL DE MAINTENANCE
  ============================================================ */
  getMaintenanceEmailTemplate(user, scheduledDate, message, duration) {
    const formattedDate = scheduledDate.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #2c5aa0, #1e3a8a); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">🚧 Maintenance Planifiée</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">ExpressTrafic - Service de transport</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <p>Bonjour ${user.prenom},</p>
          
          <p>Nous vous informons qu'une maintenance technique est planifiée sur notre plateforme :</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #2c5aa0; margin: 20px 0;">
            <p><strong>📅 Date et heure :</strong> ${formattedDate}</p>
            <p><strong>⏱️ Durée estimée :</strong> ${duration} minutes</p>
            <p><strong>📝 Détails :</strong> ${message}</p>
          </div>
          
          <p>Pendant cette période, le site sera temporairement inaccessible. Nous mettons tout en œuvre pour minimiser la gêne occasionnée.</p>
          
          <div style="background: #fff3cd; padding: 15px; border-radius: 5px; border: 1px solid #ffeaa7; margin: 20px 0;">
            <p style="margin: 0; color: #856404;">
              <strong>💡 Conseil :</strong> 
              Effectuez vos réservations avant la maintenance ou patientez jusqu'à la fin des travaux.
            </p>
          </div>
          
          <p>Merci de votre compréhension,<br>
          <strong>L'équipe ExpressTrafic</strong></p>
          
          <div style="border-top: 1px solid #dee2e6; margin-top: 30px; padding-top: 20px; text-align: center; color: #6c757d; font-size: 12px;">
            <p>Cet email a été envoyé à tous les utilisateurs actifs d'ExpressTrafic.</p>
            <p>© ${new Date().getFullYear()} ExpressTrafic. Tous droits réservés.</p>
          </div>
        </div>
      </div>
    `;
  }

  /* ============================================================
     🔧 MAINTENANCE AUTOMATIQUE (NUIT)
  ============================================================ */
  async performAutomaticMaintenance() {
    try {
      const now = new Date();
      const hour = now.getHours();

      // Maintenance automatique entre 2h et 4h du matin
      if (hour >= 2 && hour <= 4) {
        logger.info('🔧 Début maintenance automatique nocturne');

        // 1. Sauvegarde des données critiques
        await this.backupCriticalData();

        // 2. Nettoyage des logs anciens
        await this.cleanOldLogs();

        // 3. Optimisation de la base de données
        await this.optimizeDatabase();

        // 4. Nettoyage des sessions expirées
        await this.cleanExpiredSessions();

        logger.success('✅ Maintenance automatique terminée avec succès');

        return {
          success: true,
          tasksCompleted: ['backup', 'log_cleanup', 'db_optimization', 'session_cleanup'],
          duration: 'Variable'
        };
      }

      return {
        success: true,
        message: 'Pas de maintenance automatique programmée à cette heure'
      };

    } catch (error) {
      logger.error(`❌ Erreur maintenance automatique: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /* ============================================================
     💾 SAUVEGARDE DES DONNÉES CRITIQUES
  ============================================================ */
  async backupCriticalData() {
    try {
      // Sauvegarde des réservations récentes
      const [reservations] = await db.execute(
        `SELECT * FROM Reservations 
         WHERE date_reservation > DATE_SUB(NOW(), INTERVAL 7 DAY)`
      );

      // Sauvegarde des paiements récents
      const [payments] = await db.execute(
        `SELECT * FROM Paiements 
         WHERE date_paiement > DATE_SUB(NOW(), INTERVAL 7 DAY)`
      );

      logger.info(`💾 Sauvegarde: ${reservations.length} réservations, ${payments.length} paiements`);

      // Ici, vous pourriez sauvegarder dans un fichier ou un service cloud
      // Pour l'instant, on log juste les statistiques

      return {
        reservations: reservations.length,
        payments: payments.length,
        timestamp: new Date()
      };

    } catch (error) {
      logger.error(`❌ Erreur sauvegarde données: ${error.message}`);
      throw error;
    }
  }

  /* ============================================================
     🗑️ NETTOYAGE DES LOGS ANCIENS
  ============================================================ */
  async cleanOldLogs() {
    try {
      // Supprimer les logs de plus de 3 mois
      const [result] = await db.execute(
        `DELETE FROM logs_actions 
         WHERE created_at < DATE_SUB(NOW(), INTERVAL 3 MONTH)`
      );

      logger.info(`🗑️ ${result.affectedRows} logs anciens supprimés`);

      return {
        deletedLogs: result.affectedRows
      };

    } catch (error) {
      logger.error(`❌ Erreur nettoyage logs: ${error.message}`);
      throw error;
    }
  }

  /* ============================================================
     🗄️ OPTIMISATION BASE DE DONNÉES
  ============================================================ */
  async optimizeDatabase() {
    try {
      const tables = ['Reservations', 'Paiements', 'login', 'logs_actions', 'sessions'];
      
      for (const table of tables) {
        await db.execute(`OPTIMIZE TABLE ${table}`);
      }

      logger.info(`🗄️ Base de données optimisée: ${tables.join(', ')}`);

      return {
        optimizedTables: tables
      };

    } catch (error) {
      logger.error(`❌ Erreur optimisation DB: ${error.message}`);
      throw error;
    }
  }

  /* ============================================================
     🔐 NETTOYAGE SESSIONS EXPIRÉES
  ============================================================ */
  async cleanExpiredSessions() {
    try {
      const [result] = await db.execute(
        `DELETE FROM sessions 
         WHERE expires_at < NOW() OR is_active = 0`
      );

      logger.info(`🔐 ${result.affectedRows} sessions expirées supprimées`);

      return {
        deletedSessions: result.affectedRows
      };

    } catch (error) {
      logger.error(`❌ Erreur nettoyage sessions: ${error.message}`);
      throw error;
    }
  }

  /* ============================================================
     🛠️ MÉTHODES UTILITAIRES
  ============================================================ */
  isScheduledMaintenance(sinceDate) {
    if (!sinceDate) return false;
    
    const maintenanceStart = new Date(sinceDate);
    const now = new Date();
    const diffHours = (now - maintenanceStart) / (1000 * 60 * 60);
    
    return diffHours < 24; // Maintenance considérée comme planifiée si < 24h
  }

  getMaintenanceDuration(sinceDate) {
    if (!sinceDate) return null;
    
    const start = new Date(sinceDate);
    const now = new Date();
    const diffMs = now - start;
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return { hours, minutes };
  }
}

module.exports = new MaintenanceService();