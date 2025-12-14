
//backend/controllers/admin/adminBusController.js
const db = require("../../config/db");
const logger = require("../../utils/logger");

//
// ============================================================
// 🚌 ADMIN — GESTION DES BUS
// ============================================================
//


/* ============================================================
   📌 1. LISTER TOUS LES BUS
============================================================ */
exports.getAllBus = async (req, res) => {
  try {
    logger.info("Chargement bus…");

    const [rows] = await db.query(`
      SELECT 
        b.*,
        c.nom AS chauffeur_nom, 
        c.prenom AS chauffeur_prenom,
        s.nom AS societe_nom
      FROM Bus b
      LEFT JOIN Chauffeurs c ON b.chauffeur_id = c.id
      LEFT JOIN Societes s ON b.societe_id = s.id
      ORDER BY b.id DESC
    `);

    logger.success(`${rows.length} bus chargés ✔`);
    res.json({ success: true, data: rows });

  } catch (error) {
    logger.error("Erreur getAllBus: " + error.message);
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};



/* ============================================================
   📌 2. DÉTAIL D’UN BUS
============================================================ */
exports.getBusById = async (req, res) => {
  try {
    const { id } = req.params;

    logger.info(`Chargement bus ID: ${id}`);

    const [rows] = await db.query(`
      SELECT 
        b.*,
        c.nom AS chauffeur_nom, 
        c.prenom AS chauffeur_prenom,
        s.nom AS societe_nom
      FROM Bus b
      LEFT JOIN Chauffeurs c ON b.chauffeur_id = c.id
      LEFT JOIN Societes s ON b.societe_id = s.id
      WHERE b.id = ?
    `, [id]);

    if (rows.length === 0)
      return res.status(404).json({ success: false, message: "Bus introuvable" });

    logger.success(`Bus ${id} chargé ✔`);
    res.json({ success: true, data: rows[0] });

  } catch (error) {
    logger.error("Erreur getBusById: " + error.message);
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};



/* ============================================================
   📌 3. AJOUTER UN BUS
============================================================ */
exports.createBus = async (req, res) => {
  try {
    const { 
      numero_immatriculation, 
      type_bus, 
      capacite, 
      chauffeur_id, 
      societe_id 
    } = req.body;

    if (!numero_immatriculation || !type_bus || !capacite) {
      return res.status(400).json({
        success: false,
        message: "Champs obligatoires manquants"
      });
    }

    logger.warning("Création d’un bus…");

    await db.query(
      `INSERT INTO Bus (numero_immatriculation, type_bus, capacite, chauffeur_id, societe_id)
       VALUES (?, ?, ?, ?, ?)`,
      [
        numero_immatriculation,
        type_bus,
        capacite,
        chauffeur_id || null,
        societe_id || null
      ]
    );

    logger.success("Bus créé ✔");

    res.json({
      success: true,
      message: "Bus ajouté avec succès"
    });

  } catch (error) {
    logger.error("Erreur createBus: " + error.message);
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};



/* ============================================================
   📌 4. METTRE À JOUR UN BUS
============================================================ */
exports.updateBus = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    logger.warning(`Mise à jour bus ID: ${id}`);

    const fields = [];
    const values = [];

    Object.keys(updates).forEach((key) => {
      fields.push(`${key} = ?`);
      values.push(updates[key]);
    });

    values.push(id);

    await db.query(
      `UPDATE Bus SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    logger.success("Bus mis à jour ✔");

    res.json({
      success: true,
      message: "Bus mis à jour avec succès"
    });

  } catch (error) {
    logger.error("Erreur updateBus: " + error.message);
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};



/* ============================================================
   📌 5. SUPPRIMER UN BUS
============================================================ */
exports.deleteBus = async (req, res) => {
  try {
    const { id } = req.params;

    logger.warning(`Suppression bus ID: ${id}`);

    await db.query("DELETE FROM Bus WHERE id = ?", [id]);

    logger.success("Bus supprimé ✔");

    res.json({
      success: true,
      message: "Bus supprimé avec succès"
    });

  } catch (error) {
    logger.error("Erreur deleteBus: " + error.message);
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};
