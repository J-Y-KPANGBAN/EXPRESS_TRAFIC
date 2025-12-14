// backend/controllers/admin/adminArretsController.js
const db = require("../../config/db");
const logger  = require("../../utils/logger");

/* ============================================================
   🚏 ADMIN — GESTION COMPLÈTE DES ARRÊTS
============================================================ */

exports.getAllArrets = async (req, res) => {
  try {
    const { trajet_id } = req.query;

    let query = `
      SELECT a.*, t.ville_depart, t.ville_arrivee 
      FROM Arrets a
      JOIN Trajets t ON a.trajet_id = t.id
      WHERE 1=1
    `;
    const params = [];

    if (trajet_id) {
      query += " AND a.trajet_id = ?";
      params.push(trajet_id);
    }

    query += " ORDER BY a.trajet_id, a.ordre ASC";

    const [arrets] = await db.query(query, params);
    
    res.json({
      success: true,
      data: arrets
    });

  } catch (error) {
    logger.error("Erreur getAllArrets: " + error.message);
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};

exports.getArretsByTrajet = async (req, res) => {
  try {
    const { trajet_id } = req.params;

    const [arrets] = await db.query(`
      SELECT a.*, t.ville_depart, t.ville_arrivee 
      FROM Arrets a
      JOIN Trajets t ON a.trajet_id = t.id
      WHERE a.trajet_id = ?
      ORDER BY a.ordre ASC
    `, [trajet_id]);

    res.json({
      success: true,
      data: arrets
    });

  } catch (error) {
    logger.error("Erreur getArretsByTrajet: " + error.message);
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};

exports.createArret = async (req, res) => {
  try {
    const { trajet_id, nom_arret, ordre, heure_arrivee, heure_depart, prix_arret, adresse_arret } = req.body;

    if (!trajet_id || !nom_arret || !ordre) {
      return res.status(400).json({
        success: false,
        message: "Trajet, nom et ordre sont obligatoires"
      });
    }

    // Vérifier que le trajet existe
    const [trajet] = await db.query("SELECT id FROM Trajets WHERE id = ?", [trajet_id]);
    if (trajet.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Trajet introuvable"
      });
    }

    await db.query(
      `INSERT INTO Arrets (trajet_id, nom_arret, ordre, heure_arrivee, heure_depart, prix_arret, adresse_arret)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [trajet_id, nom_arret, ordre, heure_arrivee, heure_depart, prix_arret, adresse_arret]
    );

    logger.success(`Arrêt créé: ${nom_arret} pour trajet ${trajet_id}`);
    
    res.json({
      success: true,
      message: "Arrêt créé avec succès"
    });

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: "Un arrêt avec cet ordre existe déjà pour ce trajet"
      });
    }
    logger.error("Erreur createArret: " + error.message);
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};

exports.updateArret = async (req, res) => {
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

    const [result] = await db.query(
      `UPDATE Arrets SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Arrêt introuvable"
      });
    }

    logger.success(`Arrêt ${id} mis à jour`);
    
    res.json({
      success: true,
      message: "Arrêt mis à jour avec succès"
    });

  } catch (error) {
    logger.error("Erreur updateArret: " + error.message);
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};

exports.deleteArret = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query("DELETE FROM Arrets WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Arrêt introuvable"
      });
    }

    logger.success(`Arrêt ${id} supprimé`);
    
    res.json({
      success: true,
      message: "Arrêt supprimé avec succès"
    });

  } catch (error) {
    logger.error("Erreur deleteArret: " + error.message);
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};