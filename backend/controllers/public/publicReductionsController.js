// backend/controllers/public/publicReductionsController.js (NOUVEAU)
const db = require("../../config/db");
const logger = require("../../utils/logger");

// ========================
// 🔹 LISTE DES RÉDUCTIONS DISPONIBLES
// ========================
exports.getAvailableReductions = async (req, res) => {
  try {
    const [reductions] = await db.query(`
      SELECT 
        code, 
        pourcentage, 
        montant_fixe, 
        type_reduction,
        date_debut,
        date_fin,
        conditions,
        utilisations_max,
        utilisations_actuelles,
        statut
      FROM Reductions 
      WHERE statut = 'actif' 
        AND date_debut <= CURDATE() 
        AND date_fin >= CURDATE()
        AND (utilisations_max IS NULL OR utilisations_actuelles < utilisations_max)
      ORDER BY type_reduction DESC, pourcentage DESC
    `);

    res.json({
      success: true,
      data: reductions,
      count: reductions.length
    });

  } catch (error) {
    logger.error("Erreur getAvailableReductions:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors du chargement des réductions"
    });
  }
};

// ========================
// 🔹 VALIDER UN CODE DE RÉDUCTION
// ========================
exports.validateReductionCode = async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.id;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Code de réduction requis"
      });
    }

    // Rechercher le code de réduction
    const [reductions] = await db.query(`
      SELECT * FROM Reductions 
      WHERE code = ? 
        AND statut = 'actif'
        AND date_debut <= CURDATE() 
        AND date_fin >= CURDATE()
        AND (utilisations_max IS NULL OR utilisations_actuelles < utilisations_max)
    `, [code.toUpperCase()]);

    if (reductions.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Code de réduction invalide ou expiré"
      });
    }

    const reduction = reductions[0];

    // Vérifier les conditions spécifiques
    if (reduction.conditions) {
      const conditions = JSON.parse(reduction.conditions);
      
      // Exemple: Vérifier si l'utilisateur est nouveau
      if (conditions.premiere_commande) {
        const [userReservations] = await db.query(
          "SELECT COUNT(*) as count FROM Reservations WHERE utilisateur_id = ?",
          [userId]
        );
        
        if (userReservations[0].count > 0) {
          return res.status(400).json({
            success: false,
            message: "Ce code est réservé aux premières commandes"
          });
        }
      }
    }

    res.json({
      success: true,
      message: "Code de réduction valide",
      data: {
        code: reduction.code,
        type_reduction: reduction.type_reduction,
        valeur: reduction.type_reduction === 'pourcentage' ? reduction.pourcentage : reduction.montant_fixe,
        description: `Réduction de ${reduction.type_reduction === 'pourcentage' ? reduction.pourcentage + '%' : reduction.montant_fixe + '€'}`
      }
    });

  } catch (error) {
    logger.error("Erreur validateReductionCode:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la validation du code"
    });
  }
};

// ========================
// 🔹 APPLIQUER UNE RÉDUCTION À UN PANIER
// ========================
exports.applyReductionToCart = async (req, res) => {
  try {
    const { cartId, reductionCode } = req.body;
    const userId = req.user.id;

    // Vérifier que le panier appartient à l'utilisateur
    const [carts] = await db.query(
      "SELECT * FROM carts WHERE id = ? AND user_id = ?",
      [cartId, userId]
    );

    if (carts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Panier non trouvé"
      });
    }

    // Valider le code de réduction
    const validationResult = await this.validateReductionCodeInternal(reductionCode, userId);
    
    if (!validationResult.valid) {
      return res.status(400).json({
        success: false,
        message: validationResult.message
      });
    }

    const reduction = validationResult.reduction;

    // Calculer le nouveau total avec réduction
    const cart = carts[0];
    let nouveauTotal = cart.total_amount;

    if (reduction.type_reduction === 'pourcentage') {
      nouveauTotal = cart.total_amount * (1 - reduction.pourcentage / 100);
    } else if (reduction.type_reduction === 'montant_fixe') {
      nouveauTotal = Math.max(0, cart.total_amount - reduction.montant_fixe);
    }

    // Mettre à jour le panier
    await db.query(
      "UPDATE carts SET total_amount = ?, metadata = JSON_SET(COALESCE(metadata, '{}'), '$.reduction_applied', ?) WHERE id = ?",
      [nouveauTotal, reductionCode, cartId]
    );

    // Incrémenter le compteur d'utilisation
    await db.query(
      "UPDATE Reductions SET utilisations_actuelles = utilisations_actuelles + 1 WHERE code = ?",
      [reductionCode]
    );

    res.json({
      success: true,
      message: "Réduction appliquée avec succès",
      data: {
        ancien_total: cart.total_amount,
        nouveau_total: nouveauTotal,
        reduction: reduction.type_reduction === 'pourcentage' ? 
          `${reduction.pourcentage}%` : `${reduction.montant_fixe}€`,
        economie: cart.total_amount - nouveauTotal
      }
    });

  } catch (error) {
    logger.error("Erreur applyReductionToCart:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'application de la réduction"
    });
  }
};

// ========================
// 🔹 FONCTION INTERNE DE VALIDATION
// ========================
exports.validateReductionCodeInternal = async (code, userId) => {
  try {
    const [reductions] = await db.query(`
      SELECT * FROM Reductions 
      WHERE code = ? 
        AND statut = 'actif'
        AND date_debut <= CURDATE() 
        AND date_fin >= CURDATE()
        AND (utilisations_max IS NULL OR utilisations_actuelles < utilisations_max)
    `, [code.toUpperCase()]);

    if (reductions.length === 0) {
      return { valid: false, message: "Code de réduction invalide ou expiré" };
    }

    const reduction = reductions[0];

    // Vérifier les conditions
    if (reduction.conditions) {
      const conditions = JSON.parse(reduction.conditions);
      
      if (conditions.premiere_commande) {
        const [userReservations] = await db.query(
          "SELECT COUNT(*) as count FROM Reservations WHERE utilisateur_id = ?",
          [userId]
        );
        
        if (userReservations[0].count > 0) {
          return { valid: false, message: "Ce code est réservé aux premières commandes" };
        }
      }

      if (conditions.minimum_montant) {
        // Cette vérification se fera au moment de l'application au panier
      }
    }

    return { valid: true, reduction };

  } catch (error) {
    logger.error("Erreur validateReductionCodeInternal:", error);
    return { valid: false, message: "Erreur lors de la validation du code" };
  }
};