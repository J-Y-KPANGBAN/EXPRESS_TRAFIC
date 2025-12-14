// backend/controllers/admin/adminReductionsController.js
const db = require("../../config/db");
const  logger  = require("../../utils/logger");
const { generatePromoCode } = require("../../services/generateCode");

exports.getAllReductions = async (req, res) => {
  try {
    const { page = 1, limit = 20, statut, type } = req.query;
    const offset = (page - 1) * limit;

    let query = `SELECT * FROM Reductions WHERE 1=1`;
    const params = [];

    if (statut) {
      query += " AND statut = ?";
      params.push(statut);
    }

    if (type) {
      query += " AND type_reduction = ?";
      params.push(type);
    }

    query += " ORDER BY date_debut DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), offset);

    const [reductions] = await db.query(query, params);
    const [total] = await db.query("SELECT COUNT(*) as total FROM Reductions");

    // Statistiques d'utilisation
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_codes,
        SUM(utilisations_actuelles) as total_utilisations,
        AVG(pourcentage) as moyenne_pourcentage
      FROM Reductions
      WHERE statut = 'actif'
    `);

    res.json({
      success: true,
      data: reductions,
      stats: stats[0],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total[0].total
      }
    });

  } catch (error) {
    logger.error("Erreur getAllReductions: " + error.message);
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};

exports.createReduction = async (req, res) => {
  try {
    const { 
      code, 
      pourcentage, 
      montant_fixe, 
      type_reduction, 
      date_debut, 
      date_fin, 
      utilisations_max,
      conditions 
    } = req.body;

    // Génération automatique du code si non fourni
    const finalCode = code || generatePromoCode();
    
    if (!type_reduction || !date_debut || !date_fin) {
      return res.status(400).json({ 
        success: false, 
        message: "Type, date début et date fin obligatoires" 
      });
    }

    // Validation cohérence type réduction
    if (type_reduction === 'pourcentage' && (!pourcentage || pourcentage > 100)) {
      return res.status(400).json({ 
        success: false, 
        message: "Pourcentage invalide (0-100)" 
      });
    }

    if (type_reduction === 'montant_fixe' && !montant_fixe) {
      return res.status(400).json({ 
        success: false, 
        message: "Montant fixe obligatoire" 
      });
    }

    await db.query(
      `INSERT INTO Reductions 
        (code, pourcentage, montant_fixe, type_reduction, date_debut, date_fin, 
         utilisations_max, conditions, statut)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'actif')`,
      [
        finalCode,
        pourcentage || null,
        montant_fixe || null,
        type_reduction,
        date_debut,
        date_fin,
        utilisations_max || 100,
        JSON.stringify(conditions || {})
      ]
    );

    logger.success(`Code réduction créé: ${finalCode}`);
    
    res.json({ 
      success: true, 
      message: "Code promotionnel créé avec succès",
      data: { code: finalCode }
    });

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        success: false, 
        message: "Ce code existe déjà" 
      });
    }
    logger.error("Erreur createReduction: " + error.message);
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};

exports.validateReduction = async (req, res) => {
  try {
    const { code, montant_panier } = req.body;

    const [reductions] = await db.query(`
      SELECT * FROM Reductions 
      WHERE code = ? 
        AND statut = 'actif'
        AND date_debut <= CURDATE() 
        AND date_fin >= CURDATE()
        AND (utilisations_max IS NULL OR utilisations_actuelles < utilisations_max)
    `, [code]);

    if (reductions.length === 0) {
      return res.json({ 
        success: false, 
        valid: false,
        message: "Code promotionnel invalide ou expiré" 
      });
    }

    const reduction = reductions[0];
    let montant_reduction = 0;

    if (reduction.type_reduction === 'pourcentage') {
      montant_reduction = (montant_panier * reduction.pourcentage) / 100;
    } else {
      montant_reduction = reduction.montant_fixe;
    }

    // Vérifier les conditions supplémentaires
    if (reduction.conditions) {
      const conditions = JSON.parse(reduction.conditions);
      if (conditions.minimum_panier && montant_panier < conditions.minimum_panier) {
        return res.json({
          success: false,
          valid: false,
          message: `Minimum de panier requis: ${conditions.minimum_panier}€`
        });
      }
    }

    res.json({
      success: true,
      valid: true,
      data: {
        code: reduction.code,
        montant_reduction,
        nouveau_total: montant_panier - montant_reduction,
        type: reduction.type_reduction
      }
    });

  } catch (error) {
    logger.error("Erreur validateReduction: " + error.message);
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};
// Méthodes manquantes pour adminReductionsController.js
exports.updateReduction = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const fields = [];
    const values = [];

    Object.keys(updates).forEach(key => {
      fields.push(`${key} = ?`);
      values.push(updates[key]);
    });

    values.push(id);

    await db.query(
      `UPDATE Reductions SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    logger.success(`Réduction ${id} mise à jour`);
    res.json({ success: true, message: "Réduction mise à jour" });

  } catch (error) {
    logger.error("Erreur updateReduction: " + error.message);
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};

exports.deleteReduction = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query("DELETE FROM Reductions WHERE id = ?", [id]);

    logger.success(`Réduction ${id} supprimée`);
    res.json({ success: true, message: "Réduction supprimée" });

  } catch (error) {
    logger.error("Erreur deleteReduction: " + error.message);
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};

exports.getReductionStats = async (req, res) => {
  try {
    const { id } = req.params;

    const [stats] = await db.query(`
      SELECT 
        r.*,
        COUNT(pr.id) as utilisations,
        AVG(pr.montant_reduction) as reduction_moyenne
      FROM Reductions r
      LEFT JOIN promotion_redemptions pr ON r.id = pr.reduction_id
      WHERE r.id = ?
      GROUP BY r.id
    `, [id]);

    res.json({ success: true, data: stats[0] });

  } catch (error) {
    logger.error("Erreur getReductionStats: " + error.message);
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};