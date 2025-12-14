const db = require("../../config/db");
const logger  = require("../../utils/logger");
const emailService = require("../../services/emailService");

exports.getAllAvis = async (req, res) => {
  try {
    const { page = 1, limit = 20, statut, type_avis } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        a.*,
        u.nom AS utilisateur_nom,
        u.prenom AS utilisateur_prenom,
        u.email AS utilisateur_email,
        t.ville_depart,
        t.ville_arrivee,
        t.date_depart
      FROM Avis a
      LEFT JOIN signup u ON u.id = a.utilisateur_id
      LEFT JOIN Trajets t ON t.id = a.trajet_id
      WHERE 1=1
    `;
    const params = [];

    if (statut) {
      query += " AND a.statut = ?";
      params.push(statut);
    }

    if (type_avis) {
      query += " AND a.type_avis = ?";
      params.push(type_avis);
    }

    query += " ORDER BY a.date DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), offset);

    const [avis] = await db.query(query, params);
    const [total] = await db.query("SELECT COUNT(*) as total FROM Avis WHERE 1=1");

    res.json({
      success: true,
      data: avis,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total[0].total
      }
    });

  } catch (error) {
    logger.error("Erreur getAllAvis: " + error.message);
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};

exports.updateAvisStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut, reponse_gerant } = req.body;

    if (!["approuve", "rejete", "en_attente"].includes(statut)) {
      return res.status(400).json({ success: false, message: "Statut invalide" });
    }

    await db.query(
      "UPDATE Avis SET statut = ?, reponse_gerant = ?, date_reponse = NOW() WHERE id = ?",
      [statut, reponse_gerant, id]
    );

    // Notifier l'utilisateur si son avis est approuvé
    if (statut === "approuve") {
      const [avis] = await db.query(`
        SELECT a.*, u.email, u.prenom 
        FROM Avis a 
        JOIN signup u ON a.utilisateur_id = u.id 
        WHERE a.id = ?
      `, [id]);
      
      if (avis.length > 0) {
        await emailService.sendEmail({
          to: avis[0].email,
          subject: "Votre avis a été publié",
          html: `<p>Bonjour ${avis[0].prenom},</p><p>Votre avis a été approuvé et est maintenant visible par tous les utilisateurs.</p>`
        });
      }
    }

    logger.success(`Avis ${id} mis à jour: ${statut}`);
    res.json({ success: true, message: "Statut de l'avis mis à jour" });

  } catch (error) {
    logger.error("Erreur updateAvisStatus: " + error.message);
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};// AJOUTEZ CES FONCTIONS MANQUANTES :

exports.getAvisById = async (req, res) => {
  try {
    const { id } = req.params;

    const [avis] = await db.query(`
      SELECT 
        a.*,
        u.nom AS utilisateur_nom,
        u.prenom AS utilisateur_prenom,
        u.email AS utilisateur_email,
        t.ville_depart,
        t.ville_arrivee,
        t.date_depart
      FROM Avis a
      LEFT JOIN signup u ON u.id = a.utilisateur_id
      LEFT JOIN Trajets t ON t.id = a.trajet_id
      WHERE a.id = ?
    `, [id]);

    if (avis.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Avis non trouvé" 
      });
    }

    res.json({
      success: true,
      data: avis[0]
    });

  } catch (error) {
    logger.error("Erreur getAvisById: " + error.message);
    res.status(500).json({ 
      success: false, 
      message: "Erreur serveur", 
      error: error.message 
    });
  }
};

exports.deleteAvis = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query("DELETE FROM Avis WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Avis non trouvé" 
      });
    }

    logger.success(`Avis ${id} supprimé`);
    res.json({ 
      success: true, 
      message: "Avis supprimé avec succès" 
    });

  } catch (error) {
    logger.error("Erreur deleteAvis: " + error.message);
    res.status(500).json({ 
      success: false, 
      message: "Erreur serveur", 
      error: error.message 
    });
  }
};