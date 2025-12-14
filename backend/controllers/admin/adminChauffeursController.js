//backend/controllers/admin/adminChauffeursController.js

const db = require("../../config/db");
const logger  = require("../../utils/logger");

/* ============================================================
   🚖 ADMIN — GESTION DES CHAUFFEURS
============================================================ */



/* ============================================================
   📌 1. LISTER TOUS LES CHAUFFEURS
============================================================ */
exports.getAllChauffeurs = async (req, res) => {
  try {
    logger.info("Chargement chauffeurs…");

    const [rows] = await db.query(`
      SELECT 
        c.*,
        s.nom AS societe_nom
      FROM Chauffeurs c
      LEFT JOIN Societes s ON c.societe_id = s.id
      ORDER BY c.id DESC
    `);

    logger.success(`${rows.length} chauffeurs chargés ✔`);
    res.json({ success: true, data: rows });

  } catch (error) {
    logger.error("Erreur getAllChauffeurs: " + error.message);
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};



/* ============================================================
   📌 2. DÉTAIL D’UN CHAUFFEUR
============================================================ */
exports.getChauffeurById = async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`Chargement chauffeur ID: ${id}`);

    const [rows] = await db.query(`
      SELECT 
        c.*,
        s.nom AS societe_nom
      FROM Chauffeurs c
      LEFT JOIN Societes s ON c.societe_id = s.id
      WHERE c.id = ?
    `, [id]);

    if (rows.length === 0)
      return res.status(404).json({ success: false, message: "Chauffeur introuvable" });

    logger.success(`Chauffeur ID ${id} chargé ✔`);
    res.json({ success: true, data: rows[0] });

  } catch (error) {
    logger.error("Erreur getChauffeurById: " + error.message);
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};



/* ============================================================
   📌 3. CRÉER UN CHAUFFEUR
============================================================ */
exports.createChauffeur = async (req, res) => {
  try {
    const {
      nom,
      prenom,
      telephone,
      email,
      permis_numero,
      societe_id
    } = req.body;

    if (!nom || !prenom || !telephone || !permis_numero) {
      return res.status(400).json({
        success: false,
        message: "Champs obligatoires manquants"
      });
    }

    logger.warning("Création d’un chauffeur…");

    await db.query(
      `INSERT INTO Chauffeurs (nom, prenom, telephone, email, permis_numero, societe_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nom, prenom, telephone, email || null, permis_numero, societe_id || null]
    );

    logger.success("Chauffeur créé ✔");

    res.json({
      success: true,
      message: "Chauffeur ajouté avec succès"
    });

  } catch (error) {
    logger.error("Erreur createChauffeur: " + error.message);
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};



/* ============================================================
   📌 4. METTRE À JOUR UN CHAUFFEUR
============================================================ */
exports.updateChauffeur = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    logger.warning(`Mise à jour chauffeur ID: ${id}`);

    const fields = [];
    const values = [];

    Object.keys(updates).forEach((key) => {
      fields.push(`${key} = ?`);
      values.push(updates[key]);
    });

    values.push(id);

    await db.query(
      `UPDATE Chauffeurs SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    logger.success("Chauffeur mis à jour ✔");

    res.json({
      success: true,
      message: "Chauffeur mis à jour avec succès"
    });

  } catch (error) {
    logger.error("Erreur updateChauffeur: " + error.message);
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};



/* ============================================================
   📌 5. SUPPRIMER UN CHAUFFEUR
============================================================ */
exports.deleteChauffeur = async (req, res) => {
  try {
    const { id } = req.params;

    logger.warning(`Suppression chauffeur ID: ${id}`);

    await db.query(
      "DELETE FROM Chauffeurs WHERE id = ?",
      [id]
    );

    logger.success("Chauffeur supprimé ✔");

    res.json({
      success: true,
      message: "Chauffeur supprimé avec succès"
    });

  } catch (error) {
    logger.error("Erreur deleteChauffeur: " + error.message);
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};
