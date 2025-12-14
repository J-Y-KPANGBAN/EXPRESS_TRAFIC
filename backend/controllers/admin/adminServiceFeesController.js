// backend/controllers/admin/adminServiceFeesController.js - VERSION SÉCURISÉE
const db = require("../../config/db");
const  logger  = require("../../utils/logger");
const validator = require('validator');

/* ============================================================
   🛡️ FONCTIONS DE SÉCURITÉ
============================================================ */
const sanitizeLimit = (limit, max = 100) => {
  const parsed = parseInt(limit) || 10;
  return Math.min(Math.max(parsed, 1), max);
};

const validateServiceFeeData = (data, isUpdate = false) => {
  const errors = [];
  
  if (!isUpdate || data.name !== undefined) {
    if (!data.name || !validator.isLength(data.name, { min: 1, max: 100 })) {
      errors.push("Nom invalide (1-100 caractères)");
    }
  }
  
  if (!isUpdate || data.fee_type !== undefined) {
    if (!data.fee_type || !['pourcentage', 'fixe'].includes(data.fee_type)) {
      errors.push("Type de frais invalide");
    }
  }
  
  if (!isUpdate || data.value !== undefined) {
    if (!data.value || !validator.isFloat(data.value.toString(), { min: 0, max: 1000 })) {
      errors.push("Valeur invalide (0-1000)");
    }
  }
  
  if (!isUpdate || data.apply_on !== undefined) {
    if (!data.apply_on || !['billet', 'panier', 'transaction', 'siege'].includes(data.apply_on)) {
      errors.push("Application invalide");
    }
  }
  
  if (data.context && !validator.isLength(data.context, { min: 1, max: 50 })) {
    errors.push("Contexte trop long (max 50 caractères)");
  }
  
  // Validation des dates
  if (data.start_date && !validator.isDate(data.start_date)) {
    errors.push("Date de début invalide");
  }
  
  if (data.end_date && !validator.isDate(data.end_date)) {
    errors.push("Date de fin invalide");
  }
  
  if (data.start_date && data.end_date) {
    const start = new Date(data.start_date);
    const end = new Date(data.end_date);
    if (start >= end) {
      errors.push("La date de début doit être avant la date de fin");
    }
  }
  
  if (errors.length > 0) {
    throw new Error(errors.join(', '));
  }
  
  return data;
};

const allowedUpdateFields = [
  'name', 'fee_type', 'value', 'apply_on', 'context', 
  'active', 'start_date', 'end_date', 'description'
];

/* ============================================================
   💸 GESTION SÉCURISÉE DES FRAIS DE SERVICE
============================================================ */

exports.getAllServiceFees = async (req, res) => {
  try {
    const { page = 1, limit = 10, active_only } = req.query;
    
    // 🛡️ VALIDATION DES PARAMÈTRES
    const safePage = Math.max(1, parseInt(page) || 1);
    const safeLimit = sanitizeLimit(limit, 50);
    const offset = (safePage - 1) * safeLimit;

    let whereConditions = ["1=1"];
    let queryParams = [];

    // 🛡️ FILTRE ACTIF SÉCURISÉ
    if (active_only === 'true') {
      whereConditions.push("active = 1");
    }

    const whereClause = whereConditions.join(" AND ");

    const [frais] = await db.query(`
      SELECT * FROM service_fees 
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [...queryParams, safeLimit, offset]);

    // 🛡️ COMPTAGE TOTAL
    const [total] = await db.query(
      `SELECT COUNT(*) as total FROM service_fees WHERE ${whereClause}`,
      queryParams
    );

    logger.info(`Liste frais de service - ${frais.length} résultats`);

    res.json({ 
      success: true, 
      data: {
        frais: frais,
        pagination: {
          page: safePage,
          limit: safeLimit,
          total: total[0].total,
          pages: Math.ceil(total[0].total / safeLimit)
        }
      }
    });

  } catch (error) {
    // 🛡️ ERREUR GÉNÉRIQUE
    logger.error("Erreur getAllServiceFees sécurisé");
    res.status(500).json({ 
      success: false, 
      message: "Erreur lors du chargement des frais" 
    });
  }
};

exports.createServiceFee = async (req, res) => {
  try {
    const { 
      name, fee_type, value, apply_on, context, 
      active, start_date, end_date, description 
    } = req.body;

    // 🛡️ VALIDATION COMPLÈTE DES DONNÉES
    const feeData = validateServiceFeeData({
      name, fee_type, value, apply_on, context, 
      active, start_date, end_date, description
    }, false);

    // 🛡️ VÉRIFICATION DES CONFLITS POUR LES FRAIS ACTIFS
    if (active !== false) {
      const [existingActive] = await db.query(`
        SELECT id FROM service_fees 
        WHERE active = 1 
          AND apply_on = ? 
          AND context = ?
          AND (start_date IS NULL OR start_date <= CURDATE())
          AND (end_date IS NULL OR end_date >= CURDATE())
      `, [apply_on, context || 'standard']);

      if (existingActive.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Un frais actif existe déjà pour cette application et contexte"
        });
      }
    }

    // 🛡️ VALIDATION MÉTIER SUPPLÉMENTAIRE
    if (fee_type === 'pourcentage' && parseFloat(value) > 50) {
      return res.status(400).json({
        success: false,
        message: "Les frais en pourcentage ne peuvent pas dépasser 50%"
      });
    }

    if (fee_type === 'fixe' && parseFloat(value) > 100) {
      return res.status(400).json({
        success: false,
        message: "Les frais fixes ne peuvent pas dépasser 100€"
      });
    }

    await db.query(
      `INSERT INTO service_fees (name, fee_type, value, apply_on, context, active, start_date, end_date, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        feeData.name,
        feeData.fee_type,
        parseFloat(feeData.value),
        feeData.apply_on,
        feeData.context || 'standard',
        feeData.active !== undefined ? (feeData.active ? 1 : 0) : 1,
        feeData.start_date || null,
        feeData.end_date || null,
        feeData.description?.substring(0, 500) || "" // 🛡️ LIMITE LONGUEUR
      ]
    );

    logger.success(`Frais de service créé: ${name}`);
    
    res.json({ 
      success: true, 
      message: "Frais de service créé avec succès" 
    });

  } catch (error) {
    // 🛡️ GESTION DIFFÉRENCIÉE DES ERREURS
    if (error.message.includes('invalide') || error.message.includes('trop long')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    logger.error("Erreur createServiceFee sécurisé");
    res.status(500).json({ 
      success: false, 
      message: "Erreur lors de la création du frais" 
    });
  }
};

exports.updateServiceFee = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // 🛡️ VALIDATION ID
    if (!id || !validator.isInt(id)) {
      return res.status(400).json({
        success: false,
        message: "ID de frais invalide"
      });
    }

    // 🛡️ VÉRIFICATION EXISTENCE
    const [feeExists] = await db.query(
      "SELECT id, name FROM service_fees WHERE id = ?",
      [id]
    );

    if (feeExists.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Frais de service non trouvé"
      });
    }

    // 🛡️ FILTRAGE DES CHAMPS AUTORISÉS
    const filteredUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedUpdateFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Aucun champ valide à mettre à jour"
      });
    }

    // 🛡️ VALIDATION DES DONNÉES
    validateServiceFeeData(filteredUpdates, true);

    // 🛡️ VALIDATION MÉTIER
    if (filteredUpdates.fee_type === 'pourcentage' && filteredUpdates.value > 50) {
      return res.status(400).json({
        success: false,
        message: "Les frais en pourcentage ne peuvent pas dépasser 50%"
      });
    }

    if (filteredUpdates.fee_type === 'fixe' && filteredUpdates.value > 100) {
      return res.status(400).json({
        success: false,
        message: "Les frais fixes ne peuvent pas dépasser 100€"
      });
    }

    // 🛡️ CONSTRUCTION SÉCURISÉE DE LA REQUÊTE
    const fields = [];
    const values = [];

    Object.keys(filteredUpdates).forEach((key) => {
      fields.push(`${key} = ?`);
      
      // 🛡️ CONVERSION DES VALEURS
      if (key === 'active') {
        values.push(filteredUpdates[key] ? 1 : 0);
      } else if (key === 'value') {
        values.push(parseFloat(filteredUpdates[key]));
      } else {
        values.push(filteredUpdates[key]);
      }
    });

    values.push(id);

    const [result] = await db.query(
      `UPDATE service_fees SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Frais de service non trouvé"
      });
    }

    logger.success(`Frais de service ${id} mis à jour`);
    
    res.json({ 
      success: true, 
      message: "Frais de service mis à jour avec succès" 
    });

  } catch (error) {
    if (error.message.includes('invalide') || error.message.includes('trop long')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    logger.error("Erreur updateServiceFee sécurisé");
    res.status(500).json({ 
      success: false, 
      message: "Erreur lors de la mise à jour du frais" 
    });
  }
};

exports.deleteServiceFee = async (req, res) => {
  try {
    const { id } = req.params;

    // 🛡️ VALIDATION ID
    if (!id || !validator.isInt(id)) {
      return res.status(400).json({
        success: false,
        message: "ID de frais invalide"
      });
    }

    // 🛡️ VÉRIFICATION EXISTENCE
    const [feeExists] = await db.query(
      "SELECT id, name, active FROM service_fees WHERE id = ?",
      [id]
    );

    if (feeExists.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Frais de service non trouvé"
      });
    }

    const fee = feeExists[0];

    // 🛡️ EMPÊCHER LA SUPPRESSION DES FRAIS ACTIFS
    if (fee.active === 1) {
      return res.status(400).json({
        success: false,
        message: "Impossible de supprimer un frais actif. Désactivez-le d'abord."
      });
    }

    // 🛡️ VÉRIFICATION USAGE (si vous avez une table de logs des transactions)
    const [usage] = await db.query(`
      SELECT COUNT(*) as count 
      FROM Paiements 
      WHERE details_transaction LIKE ? 
      LIMIT 1
    `, [`%"fee_id":${id}%`]);

    if (usage[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: "Impossible de supprimer un frais utilisé dans des transactions historiques"
      });
    }

    // 🛡️ SUPPRESSION SÉCURISÉE
    const [result] = await db.query("DELETE FROM service_fees WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Frais de service non trouvé"
      });
    }

    logger.warn(`Frais de service supprimé - ID: ${id}, Nom: ${fee.name}`);
    
    res.json({ 
      success: true, 
      message: "Frais de service supprimé avec succès" 
    });

  } catch (error) {
    logger.error("Erreur deleteServiceFee sécurisé");
    res.status(500).json({ 
      success: false, 
      message: "Erreur lors de la suppression du frais" 
    });
  }
};

exports.calculateFees = async (req, res) => {
  try {
    const { montant_base, type_transaction, contexte } = req.body;

    // 🛡️ VALIDATION DES DONNÉES DE CALCUL
    if (!montant_base || !validator.isFloat(montant_base.toString(), { min: 0, max: 100000 })) {
      return res.status(400).json({
        success: false,
        message: "Montant de base invalide (0-100000€)"
      });
    }

    if (!type_transaction || !['billet', 'panier', 'transaction', 'siege'].includes(type_transaction)) {
      return res.status(400).json({
        success: false,
        message: "Type de transaction invalide"
      });
    }

    if (contexte && !validator.isLength(contexte, { min: 1, max: 50 })) {
      return res.status(400).json({
        success: false,
        message: "Contexte trop long"
      });
    }

    const safeMontant = parseFloat(montant_base);
    const safeContexte = contexte || 'standard';

    // 🛡️ REQUÊTE SÉCURISÉE
    const [fraisApplicables] = await db.query(`
      SELECT * FROM service_fees 
      WHERE active = 1 
        AND (apply_on = ? OR apply_on = 'transaction')
        AND (context IS NULL OR context = ? OR context = 'standard')
        AND (start_date IS NULL OR start_date <= CURDATE())
        AND (end_date IS NULL OR end_date >= CURDATE())
      ORDER BY value DESC
    `, [type_transaction, safeContexte]);

    let totalFrais = 0;
    const detailsFrais = [];

    // 🛡️ CALCULS SÉCURISÉS
    fraisApplicables.forEach(frais => {
      let montantFrais = 0;
      
      if (frais.fee_type === 'pourcentage') {
        montantFrais = (safeMontant * parseFloat(frais.value)) / 100;
        // 🛡️ LIMITE MAXIMUM POUR POURCENTAGE
        if (frais.value > 10) {
          const maxLimit = 50; // Maximum 50€ pour les pourcentages élevés
          montantFrais = Math.min(montantFrais, maxLimit);
        }
      } else {
        montantFrais = parseFloat(frais.value);
      }
      
      totalFrais += montantFrais;
      detailsFrais.push({
        nom: frais.name,
        type: frais.fee_type,
        valeur: frais.value,
        montant: parseFloat(montantFrais.toFixed(2)),
        application: frais.apply_on,
        contexte: frais.context
      });
    });

    // 🛡️ LIMITE MAXIMUM TOTALE DES FRAIS
    const maxTotalFrais = safeMontant * 0.25; // Maximum 25% du montant de base
    if (totalFrais > maxTotalFrais) {
      totalFrais = maxTotalFrais;
      detailsFrais.push({
        nom: "Limite automatique",
        type: "fixe",
        valeur: "25%",
        montant: 0,
        application: "sécurité",
        contexte: "limite_frais"
      });
    }

    const montantTotal = safeMontant + totalFrais;

    logger.info(`Calcul frais - Base: ${safeMontant}€, Frais: ${totalFrais}€, Total: ${montantTotal}€`);

    res.json({
      success: true,
      data: {
        montant_base: safeMontant,
        total_frais: parseFloat(totalFrais.toFixed(2)),
        montant_total: parseFloat(montantTotal.toFixed(2)),
        taux_frais: parseFloat(((totalFrais / safeMontant) * 100).toFixed(2)),
        details: detailsFrais,
        security: {
          limite_frais_appliquee: totalFrais > maxTotalFrais,
          limite_maximum: maxTotalFrais
        }
      }
    });

  } catch (error) {
    if (error.message.includes('invalide') || error.message.includes('trop long')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    logger.error("Erreur calculateFees sécurisé");
    res.status(500).json({ 
      success: false, 
      message: "Erreur lors du calcul des frais" 
    });
  }
};