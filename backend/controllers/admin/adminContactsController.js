//backend/controllers/admin/adminContactsController.js

const db = require("../../config/db");
const logger = require("../../utils/logger");

/* ============================================================
   📩 ADMIN — GESTION DES CONTACTS
   - Liste messages contact
   - Détail message
   - Marquer comme traité / en attente
   - Suppression
============================================================ */



/* ============================================================
   📌 1. LISTER TOUS LES MESSAGES CONTACT
============================================================ */
exports.getAllContacts = async (req, res) => {
  try {
    logger.info("Chargement messages contact…");

    const [rows] = await db.query(`
      SELECT *
      FROM Contacts
      ORDER BY date_envoi DESC
    `);

    logger.success(`${rows.length} messages contact chargés ✔`);

    res.json({
      success: true,
      data: rows
    });

  } catch (error) {
    logger.error("Erreur getAllContacts: " + error.message);
    res.status(500).json({
      success: false,
      message: "Erreur lors du chargement des messages contact",
      error: error.message
    });
  }
};



/* ============================================================
   📌 2. RÉCUPÉRER UN MESSAGE PAR ID
============================================================ */
exports.getContactById = async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`Chargement message contact ID: ${id}`);

    const [rows] = await db.query(
      "SELECT * FROM Contacts WHERE id = ?",
      [id]
    );

    if (rows.length === 0)
      return res.status(404).json({ success: false, message: "Message introuvable" });

    logger.success(`Message contact ${id} chargé ✔`);

    res.json({
      success: true,
      data: rows[0]
    });

  } catch (error) {
    logger.error("Erreur getContactById: " + error.message);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du message",
      error: error.message
    });
  }
};



/* ============================================================
   📌 3. METTRE À JOUR STATUT (traité / en_attente)
============================================================ */
exports.updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    logger.warning(`Mise à jour message contact ${id} -> ${statut}`);

    if (!["traite", "en_attente"].includes(statut)) {
      return res.status(400).json({
        success: false,
        message: "Statut invalide (traite / en_attente)"
      });
    }

    await db.query(
      "UPDATE Contacts SET statut = ? WHERE id = ?",
      [statut, id]
    );

    logger.success("Statut contact mis à jour ✔");

    res.json({
      success: true,
      message: "Statut du message mis à jour"
    });

  } catch (error) {
    logger.error("Erreur updateContactStatus: " + error.message);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du statut",
      error: error.message
    });
  }
};



/* ============================================================
   📌 4. SUPPRIMER UN MESSAGE DE CONTACT
============================================================ */
exports.deleteContact = async (req, res) => {
  try {
    const { id } = req.params;

    logger.warning(`Suppression message contact ID: ${id}`);

    await db.query("DELETE FROM Contacts WHERE id = ?", [id]);

    logger.success("Message contact supprimé ✔");

    res.json({
      success: true,
      message: "Message de contact supprimé avec succès"
    });

  } catch (error) {
    logger.error("Erreur deleteContact: " + error.message);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression du message contact",
      error: error.message
    });
  }
};
