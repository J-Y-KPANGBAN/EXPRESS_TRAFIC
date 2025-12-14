//backend/controllers/admin/adminSocietesController.js

const db = require("../../config/db");
const  logger  = require("../../utils/logger");

/* ============================================================
   🏢 ADMIN — GESTION DES SOCIÉTÉS
============================================================ */



/* ============================================================
   📌 1. LISTER TOUTES LES SOCIÉTÉS
============================================================ */
exports.getAllSocietes = async (req, res) => {
  try {
    logger.info("Chargement sociétés…");

    const [rows] = await db.query(`
      SELECT *
      FROM Societes
      ORDER BY id DESC
    `);

    logger.success(`${rows.length} sociétés chargées ✔`);
    res.json({ success: true, data: rows });

  } catch (error) {
    logger.error("Erreur getAllSocietes: " + error.message);
    res.status(500).json({
      success: false,
      message: "Erreur lors du chargement des sociétés",
      error: error.message
    });
  }
};



/* ============================================================
   📌 2. DÉTAIL D'UNE SOCIÉTÉ
============================================================ */
exports.getSocieteById = async (req, res) => {
  try {
    const { id } = req.params;

    logger.info(`Chargement société ID: ${id}`);

    const [rows] = await db.query(
      "SELECT * FROM Societes WHERE id = ?",
      [id]
    );

    if (rows.length === 0)
      return res.status(404).json({ success: false, message: "Société introuvable" });

    logger.success(`Société ID ${id} chargée ✔`);
    res.json({ success: true, data: rows[0] });

  } catch (error) {
    logger.error("Erreur getSocieteById: " + error.message);
    res.status(500).json({
      success: false,
      message: "Erreur lors du chargement de la société",
      error: error.message
    });
  }
};



/* ============================================================
   📌 3. CRÉER UNE SOCIÉTÉ
============================================================ */
exports.createSociete = async (req, res) => {
  try {
    const { nom, adresse, ville, email, telephone, site_web } = req.body;

    if (!nom)
      return res.status(400).json({ success: false, message: "Le nom est obligatoire" });

    logger.warning("Création d’une société…");

    await db.query(
      `INSERT INTO Societes (nom, adresse, ville, email, telephone, site_web)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nom, adresse || null, ville || null, email || null, telephone || null, site_web || null]
    );

    logger.success("Société créée ✔");

    res.json({
      success: true,
      message: "Société ajoutée avec succès"
    });

  } catch (error) {
    logger.error("Erreur createSociete: " + error.message);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création de la société",
      error: error.message
    });
  }
};



/* ============================================================
   📌 4. METTRE À JOUR UNE SOCIÉTÉ
============================================================ */
exports.updateSociete = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    logger.warning(`Mise à jour société ID: ${id}`);

    const fields = [];
    const values = [];

    for (const key of Object.keys(updates)) {
      fields.push(`${key} = ?`);
      values.push(updates[key]);
    }

    values.push(id);

    await db.query(
      `UPDATE Societes SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    logger.success("Société mise à jour ✔");

    res.json({
      success: true,
      message: "Société mise à jour avec succès"
    });

  } catch (error) {
    logger.error("Erreur updateSociete: " + error.message);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour",
      error: error.message
    });
  }
};



/* ============================================================
   📌 5. SUPPRIMER UNE SOCIÉTÉ
============================================================ */
exports.deleteSociete = async (req, res) => {
  try {
    const { id } = req.params;

    logger.warning(`Suppression société ID: ${id}`);

    await db.query("DELETE FROM Societes WHERE id = ?", [id]);

    logger.success("Société supprimée ✔");

    res.json({
      success: true,
      message: "Société supprimée avec succès"
    });

  } catch (error) {
    logger.error("Erreur deleteSociete: " + error.message);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression",
      error: error.message
    });
  }
};
