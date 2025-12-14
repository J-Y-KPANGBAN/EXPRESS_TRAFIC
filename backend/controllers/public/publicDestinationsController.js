const db = require("../../config/db");
const logger = require("../../utils/logger"); // ✅ CORRECTION : Import correct du logger

// ✅ CORRECTION : Utilisation des noms de tables en MAJUSCULES comme dans votre BD
exports.getPopularTrips = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        t.id,
        t.ville_depart,
        t.ville_arrivee,
        t.prix,
        t.date_depart,
        t.heure_depart,
        t.duree,
        s.nom as societe_nom,
        b.type_bus,
        COUNT(r.id) AS total_reservations
      FROM Trajets t
      LEFT JOIN Reservations r ON r.trajet_id = t.id
      LEFT JOIN Bus b ON t.bus_id = b.id
      LEFT JOIN Societes s ON b.societe_id = s.id
      WHERE t.date_depart >= CURDATE() AND t.etat_trajet = 'actif'
      GROUP BY t.id, t.ville_depart, t.ville_arrivee, t.prix, t.date_depart, t.heure_depart, t.duree, s.nom, b.type_bus
      ORDER BY total_reservations DESC
      LIMIT 6
    `);

    logger.success(`✅ ${rows.length} destinations populaires chargées`);

    return res.status(200).json({
      success: true,
      data: rows
    });

  } catch (error) {
    logger.error("❌ Erreur getPopularTrips :", error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur lors du chargement des destinations populaires",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ✅ NOUVELLE FONCTION : Destinations tendances (basées sur les recherches)
exports.getTrendingDestinations = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        ville_depart,
        ville_arrivee,
        COUNT(*) as search_count,
        AVG(prix) as prix_moyen
      FROM Trajets 
      WHERE date_depart >= CURDATE() 
      GROUP BY ville_depart, ville_arrivee
      ORDER BY search_count DESC
      LIMIT 8
    `);

    res.json({
      success: true,
      data: rows
    });

  } catch (error) {
    logger.error("❌ Erreur getTrendingDestinations:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors du chargement des destinations tendances"
    });
  }
};