// backend/services/reductionService.js
const db = require("../config/db");
const { logSecurityEvent } = require("../utils/securityUtils");
const logger = require("../utils/logger");

class ReductionService {
  
  /* ============================================================
     🏷️ APPLIQUER UNE RÉDUCTION
  ============================================================ */
  async applyReduction(code, amount, userId = null, context = {}) {
    try {
      logger.info(`🏷️ Application code réduction: ${code} - Montant: ${amount}`);

      // Vérifier la validité du code
      const reduction = await this.validateReductionCode(code, amount, userId, context);
      
      if (!reduction.valid) {
        return {
          success: false,
          error: reduction.message,
          code: 'INVALID_PROMO_CODE'
        };
      }

      // Calculer le montant réduit
      const discountAmount = this.calculateDiscount(amount, reduction.data);
      const finalAmount = Math.max(0, amount - discountAmount);

      logger.success(`✅ Réduction appliquée: ${discountAmount}€ - Nouveau montant: ${finalAmount}€`);

      // Enregistrer l'utilisation
      await this.recordReductionUsage(reduction.data.id, userId, discountAmount, context);

      return {
        success: true,
        originalAmount: amount,
        discountAmount: discountAmount,
        finalAmount: finalAmount,
        reduction: {
          id: reduction.data.id,
          code: reduction.data.code,
          type: reduction.data.type_reduction,
          value: reduction.data.pourcentage || reduction.data.montant_fixe
        }
      };

    } catch (error) {
      logger.error(`❌ Erreur applyReduction: ${error.message}`);
      return {
        success: false,
        error: error.message,
        code: 'REDUCTION_ERROR'
      };
    }
  }

  /* ============================================================
     🔍 VALIDER UN CODE RÉDUCTION
  ============================================================ */
  async validateReductionCode(code, amount, userId, context) {
    try {
      const [reductions] = await db.execute(
        `SELECT * FROM Reductions 
         WHERE code = ? AND statut = 'actif'
         AND date_debut <= CURDATE() 
         AND date_fin >= CURDATE()`,
        [code.toUpperCase()]
      );

      if (reductions.length === 0) {
        return {
          valid: false,
          message: "Code promo invalide ou expiré"
        };
      }

      const reduction = reductions[0];

      // Vérifier les limites d'utilisation
      if (reduction.utilisations_actuelles >= reduction.utilisations_max) {
        return {
          valid: false,
          message: "Ce code promo a atteint sa limite d'utilisation"
        };
      }

      // Vérifier les conditions spécifiques
      const conditionsCheck = await this.checkConditions(reduction, amount, userId, context);
      if (!conditionsCheck.valid) {
        return conditionsCheck;
      }

      return {
        valid: true,
        data: reduction
      };

    } catch (error) {
      logger.error(`❌ Erreur validateReductionCode: ${error.message}`);
      return {
        valid: false,
        message: "Erreur de validation du code promo"
      };
    }
  }

  /* ============================================================
     📋 VÉRIFIER LES CONDITIONS
  ============================================================ */
  async checkConditions(reduction, amount, userId, context) {
    try {
      const conditions = reduction.conditions ? JSON.parse(reduction.conditions) : {};

      // Montant minimum
      if (conditions.minAmount && amount < conditions.minAmount) {
        return {
          valid: false,
          message: `Montant minimum requis: ${conditions.minAmount}€`
        };
      }

      // Utilisateur spécifique
      if (conditions.userId && conditions.userId !== userId) {
        return {
          valid: false,
          message: "Ce code promo n'est pas valable pour votre compte"
        };
      }

      // Premier achat
      if (conditions.firstPurchase && userId) {
        const hasPreviousPurchases = await this.hasPreviousPurchases(userId);
        if (hasPreviousPurchases) {
          return {
            valid: false,
            message: "Ce code promo est réservé au premier achat"
          };
        }
      }

      // Trajet spécifique
      if (conditions.trajetType && context.trajetType !== conditions.trajetType) {
        return {
          valid: false,
          message: "Ce code promo n'est pas valable pour ce type de trajet"
        };
      }

      // Période spécifique
      if (conditions.timeOfDay) {
        const currentHour = new Date().getHours();
        if (currentHour < conditions.timeOfDay.start || currentHour > conditions.timeOfDay.end) {
          return {
            valid: false,
            message: "Ce code promo n'est pas valable à cette heure"
          };
        }
      }

      return { valid: true };

    } catch (error) {
      logger.error(`❌ Erreur checkConditions: ${error.message}`);
      return {
        valid: false,
        message: "Erreur de validation des conditions"
      };
    }
  }

  /* ============================================================
     🧮 CALCULER LA RÉDUCTION
  ============================================================ */
  calculateDiscount(amount, reduction) {
    if (reduction.type_reduction === 'pourcentage') {
      return (amount * reduction.pourcentage) / 100;
    } else if (reduction.type_reduction === 'montant_fixe') {
      return Math.min(reduction.montant_fixe, amount);
    }
    return 0;
  }

  /* ============================================================
     📝 ENREGISTRER L'UTILISATION
  ============================================================ */
  async recordReductionUsage(reductionId, userId, discountAmount, context) {
    try {
      await db.execute(
        `INSERT INTO reduction_usage 
         (reduction_id, user_id, discount_amount, used_at, context)
         VALUES (?, ?, ?, NOW(), ?)`,
        [reductionId, userId, discountAmount, JSON.stringify(context)]
      );

      // Mettre à jour le compteur d'utilisations
      await db.execute(
        `UPDATE Reductions 
         SET utilisations_actuelles = utilisations_actuelles + 1,
             statut = IF(utilisations_actuelles + 1 >= utilisations_max, 'epuise', 'actif')
         WHERE id = ?`,
        [reductionId]
      );

      logger.info(`📝 Utilisation réduction enregistrée: ${reductionId}`);

    } catch (error) {
      logger.error(`❌ Erreur recordReductionUsage: ${error.message}`);
      // Ne pas bloquer le processus en cas d'erreur d'enregistrement
    }
  }

  /* ============================================================
     📊 CRÉER UNE NOUVELLE RÉDUCTION (ADMIN)
  ============================================================ */
  async createReduction(reductionData) {
    try {
      const {
        code,
        type_reduction,
        pourcentage,
        montant_fixe,
        date_debut,
        date_fin,
        utilisations_max = 1,
        conditions = {}
      } = reductionData;

      // Vérifier que le code n'existe pas déjà
      const [existing] = await db.execute(
        'SELECT id FROM Reductions WHERE code = ?',
        [code.toUpperCase()]
      );

      if (existing.length > 0) {
        return {
          success: false,
          error: "Un code promo avec ce nom existe déjà"
        };
      }

      const [result] = await db.execute(
        `INSERT INTO Reductions 
         (code, type_reduction, pourcentage, montant_fixe, date_debut, date_fin, utilisations_max, conditions, statut)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'actif')`,
        [
          code.toUpperCase(),
          type_reduction,
          pourcentage,
          montant_fixe,
          date_debut,
          date_fin,
          utilisations_max,
          JSON.stringify(conditions)
        ]
      );

      logger.success(`🏷️ Nouvelle réduction créée: ${code}`);

      return {
        success: true,
        reductionId: result.insertId,
        code: code.toUpperCase()
      };

    } catch (error) {
      logger.error(`❌ Erreur createReduction: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /* ============================================================
     📈 STATISTIQUES DES RÉDUCTIONS
  ============================================================ */
  async getReductionStats(reductionId = null) {
    try {
      let query = `
        SELECT 
          r.code,
          r.type_reduction,
          r.utilisations_actuelles,
          r.utilisations_max,
          r.statut,
          COUNT(ru.id) as total_utilisations,
          SUM(ru.discount_amount) as total_economies,
          r.date_debut,
          r.date_fin
        FROM Reductions r
        LEFT JOIN reduction_usage ru ON r.id = ru.reduction_id
      `;

      const params = [];

      if (reductionId) {
        query += ' WHERE r.id = ?';
        params.push(reductionId);
      }

      query += ' GROUP BY r.id ORDER BY r.date_debut DESC';

      const [stats] = await db.execute(query, params);

      return {
        success: true,
        stats: stats.map(stat => ({
          ...stat,
          utilisation_rate: stat.utilisations_max > 0 
            ? (stat.utilisations_actuelles / stat.utilisations_max) * 100 
            : 0,
          days_remaining: Math.ceil((new Date(stat.date_fin) - new Date()) / (1000 * 60 * 60 * 24))
        }))
      };

    } catch (error) {
      logger.error(`❌ Erreur getReductionStats: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /* ============================================================
     🛠️ MÉTHODES UTILITAIRES
  ============================================================ */
  async hasPreviousPurchases(userId) {
    try {
      const [reservations] = await db.execute(
        'SELECT id FROM Reservations WHERE utilisateur_id = ? LIMIT 1',
        [userId]
      );
      return reservations.length > 0;
    } catch (error) {
      logger.error(`❌ Erreur hasPreviousPurchases: ${error.message}`);
      return true; // En cas d'erreur, on suppose qu'il a déjà acheté pour éviter les abus
    }
  }

  generatePromoCode(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return code;
  }

  async cleanupExpiredReductions() {
    try {
      const [result] = await db.execute(
        `UPDATE Reductions 
         SET statut = 'inactif' 
         WHERE date_fin < CURDATE() AND statut = 'actif'`
      );

      logger.info(`🗑️ ${result.affectedRows} réductions expirées désactivées`);

      return {
        cleaned: result.affectedRows
      };

    } catch (error) {
      logger.error(`❌ Erreur cleanupExpiredReductions: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new ReductionService();