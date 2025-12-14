const db = require("../../config/db");
const logger = require("../../utils/logger");


// ======================================================
// 🛡️ FONCTIONS DE VALIDATION
// ======================================================

const validateDate = (dateString) => {
  if (!dateString || typeof dateString !== 'string') return false;
  
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) return false;
  
  const [year, month, day] = dateString.split('-').map(Number);
  
  if (year < 2020 || year > 2030) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date) && 
         date.getFullYear() === year &&
         date.getMonth() + 1 === month &&
         date.getDate() === day;
};

// ======================================================
// 🔹 TEST DE LA BASE DE DONNÉES
// ======================================================
exports.testDatabase = async (req, res) => {
  try {
    const [trajets] = await db.query("SELECT COUNT(*) as count FROM Trajets");
    const [bus] = await db.query("SELECT COUNT(*) as count FROM Bus");
    const [reservations] = await db.query("SELECT COUNT(*) as count FROM Reservations");
    const [societes] = await db.query("SELECT COUNT(*) as count FROM Societes");
    
    logger.info(`📊 Stats DB - Trajets: ${trajets[0].count}, Bus: ${bus[0].count}, Reservations: ${reservations[0].count}, Societes: ${societes[0].count}`);

    const [columns] = await db.query("DESCRIBE Trajets");
    const columnNames = columns.map(col => col.Field);
    logger.info(`📋 Colonnes Trajets: ${columnNames.join(', ')}`);

    res.json({
      success: true,
      data: {
        trajets: trajets[0].count,
        bus: bus[0].count,
        reservations: reservations[0].count,
        societes: societes[0].count,
        colonnes_trajets: columnNames
      }
    });
  } catch (error) {
    logger.error("❌ Erreur testDatabase:", error.message);
    res.status(500).json({
      success: false,
      message: "Erreur de connexion à la base de données",
      error: error.message
    });
  }
};

// ======================================================
// 🔹 LISTE DES TRAJETS PUBLICS - VERSION CORRIGÉE
// ======================================================
exports.getTrajets = async (req, res) => {
  try {
    const { ville_depart, ville_arrivee, date_depart, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        t.id,
        t.ville_depart,
        t.ville_arrivee,
        t.date_depart,
        t.heure_depart,
        t.prix,
        t.duree,
        t.places_total,
        t.places_disponibles,
        t.description,
        s.nom as societe_nom,
        b.type_bus,
        b.equipements,
        b.numero_immatriculation,
        b.capacite,
        (t.places_disponibles - IFNULL(res.reserved_count, 0)) as places_reellement_disponibles
      FROM Trajets t
      LEFT JOIN Bus b ON t.bus_id = b.id
      LEFT JOIN Societes s ON b.societe_id = s.id
      LEFT JOIN (
        SELECT trajet_id, COUNT(*) as reserved_count
        FROM Reservations 
        WHERE etat_reservation IN ('confirmee', 'en_attente')
        GROUP BY trajet_id
      ) res ON t.id = res.trajet_id
      WHERE t.date_depart >= CURDATE() AND t.etat_trajet = 'actif'
    `;
    
    const params = [];

    if (ville_depart) {
      query += " AND t.ville_depart LIKE ?";
      params.push(`%${ville_depart}%`);
    }

    if (ville_arrivee) {
      query += " AND t.ville_arrivee LIKE ?";
      params.push(`%${ville_arrivee}%`);
    }

    if (date_depart) {
      query += " AND t.date_depart = ?";
      params.push(date_depart);
    }

    query += " ORDER BY t.date_depart ASC, t.heure_depart ASC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), offset);

    const [trajets] = await db.query(query, params);

    const trajetsAvecArrets = await Promise.all(
      trajets.map(async (trajet) => {
        const [arrets] = await db.query(
          `SELECT nom_arret, ordre, prix_arret 
           FROM Arrets 
           WHERE trajet_id = ? 
           ORDER BY ordre ASC`,
          [trajet.id]
        );
        
        return {
          ...trajet,
          arrets: arrets
        };
      })
    );

    let countQuery = `
      SELECT COUNT(*) as total 
      FROM Trajets t 
      WHERE t.date_depart >= CURDATE() AND t.etat_trajet = 'actif'
    `;
    const countParams = [];

    if (ville_depart) {
      countQuery += " AND t.ville_depart LIKE ?";
      countParams.push(`%${ville_depart}%`);
    }

    if (ville_arrivee) {
      countQuery += " AND t.ville_arrivee LIKE ?";
      countParams.push(`%${ville_arrivee}%`);
    }

    if (date_depart) {
      countQuery += " AND t.date_depart = ?";
      countParams.push(date_depart);
    }

    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    logger.success(`${trajets.length} trajets chargés (page ${page})`);

    res.json({
      success: true,
      data: trajetsAvecArrets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });

  } catch (error) {
    logger.error("❌ Erreur getTrajets:", error.message);
    logger.error("Stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Erreur lors du chargement des trajets",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ======================================================
// 🔹 TRAJETS POPULAIRES - VERSION CORRIGÉE
// ======================================================
exports.getPopularTrajets = async (req, res) => {
  try {
    const [trajets] = await db.query(`
      SELECT 
        t.id,
        t.ville_depart,
        t.ville_arrivee,
        t.prix,
        t.date_depart,
        t.heure_depart,
        t.duree,
        t.places_disponibles,
        s.nom as societe_nom,
        b.type_bus,
        COUNT(r.id) as total_reservations,
        ROUND((COUNT(r.id) / GREATEST(t.places_total, 1)) * 100, 2) as taux_occupation
      FROM Trajets t
      LEFT JOIN Reservations r ON t.id = r.trajet_id 
        AND r.etat_reservation IN ('confirmee', 'en_attente')
        AND r.date_reservation >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      LEFT JOIN Bus b ON t.bus_id = b.id
      LEFT JOIN Societes s ON b.societe_id = s.id
      WHERE t.date_depart >= CURDATE() AND t.etat_trajet = 'actif'
      GROUP BY t.id
      ORDER BY total_reservations DESC, taux_occupation DESC
      LIMIT 6
    `);

    logger.success(`📊 ${trajets.length} trajets populaires chargés (basés sur réservations réelles)`);

    res.json({
      success: true,
      data: trajets,
      metadata: {
        based_on: "reservations_recentes",
        periode: "7_derniers_jours"
      }
    });

  } catch (error) {
    logger.error("❌ Erreur getPopularTrajets:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors du chargement des trajets populaires"
    });
  }
};

// ======================================================
// 🔹 DÉTAILS D'UN TRAJET - VERSION CORRIGÉE
// ======================================================
exports.getTrajetById = async (req, res) => {
  try {
    const { trajetId } = req.params;

    const [trajets] = await db.query(`
      SELECT 
        t.*,
        b.numero_immatriculation,
        b.type_bus,
        b.equipements,
        b.capacite,
        s.nom as societe_nom,
        (t.places_disponibles - IFNULL(res.reserved_count, 0)) as places_reellement_disponibles
      FROM Trajets t
      LEFT JOIN Bus b ON t.bus_id = b.id
      LEFT JOIN Societes s ON b.societe_id = s.id
      LEFT JOIN (
        SELECT trajet_id, COUNT(*) as reserved_count
        FROM Reservations 
        WHERE etat_reservation IN ('confirmee', 'en_attente')
        GROUP BY trajet_id
      ) res ON t.id = res.trajet_id
      WHERE t.id = ?
    `, [trajetId]);

    if (trajets.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Trajet introuvable"
      });
    }

    const trajet = trajets[0];

    const [arrets] = await db.query(`
      SELECT nom_arret, ordre, prix_arret 
      FROM Arrets 
      WHERE trajet_id = ? 
      ORDER BY ordre ASC
    `, [trajetId]);

    const [siegesReserves] = await db.query(`
      SELECT siege_numero 
      FROM Reservations 
      WHERE trajet_id = ? 
      AND etat_reservation IN ('confirmee', 'en_attente')
    `, [trajetId]);

    const siegesReservesList = siegesReserves.map(s => s.siege_numero);

    res.json({
      success: true,
      data: {
        ...trajet,
        arrets: arrets,
        sieges_reserves: siegesReservesList,
        sieges_disponibles: Array.from({length: trajet.capacite}, (_, i) => i + 1)
          .filter(num => !siegesReservesList.includes(num))
      }
    });

  } catch (error) {
    logger.error("❌ Erreur getTrajetById:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors du chargement du trajet"
    });
  }
};

// ======================================================
// 🔹 SIÈGES DISPONIBLES - VERSION CORRIGÉE
// ======================================================
exports.getSiegesDisponibles = async (req, res) => {
  try {
    const { trajetId } = req.params;

    const [trajetRows] = await db.query(`
      SELECT b.capacite 
      FROM Trajets t 
      JOIN Bus b ON t.bus_id = b.id 
      WHERE t.id = ?
    `, [trajetId]);

    if (trajetRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Trajet introuvable"
      });
    }

    const capacite = trajetRows[0].capacite;

    const [siegesReserves] = await db.query(`
      SELECT siege_numero 
      FROM Reservations 
      WHERE trajet_id = ? 
      AND etat_reservation IN ('confirmee', 'en_attente')
    `, [trajetId]);

    const siegesReservesList = siegesReserves.map(s => s.siege_numero);
    const siegesDisponibles = Array.from({length: capacite}, (_, i) => i + 1)
      .filter(num => !siegesReservesList.includes(num));

    res.json({
      success: true,
      data: {
        capacite,
        reserves: siegesReservesList.length,
        disponibles: siegesDisponibles.length,
        liste_sieges_disponibles: siegesDisponibles,
        liste_sieges_reserves: siegesReservesList
      }
    });

  } catch (error) {
    logger.error("❌ Erreur getSiegesDisponibles:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors du chargement des sièges"
    });
  }
};

// ======================================================
// 🔹 RECHERCHE AVANCÉE AVEC ARRÊTS - VERSION CORRIGÉE ET UNIFIÉE
// ======================================================
exports.searchTrajetsWithArrets = async (req, res) => {
  try {
    console.log('🔍 searchTrajetsWithArrets appelé avec:', req.query);
    
    const { ville_depart, ville_arrivee, date_depart, arret_depart, arret_arrivee } = req.query;

    // 🛡️ VALIDATION DE LA DATE
    if (date_depart && !validateDate(date_depart)) {
      return res.status(400).json({
        success: false,
        message: "Format de date invalide. Utilisez YYYY-MM-DD"
      });
    }

    let query = `
      SELECT DISTINCT 
        t.id,
        t.ville_depart,
        t.ville_arrivee,
        t.date_depart,
        t.heure_depart,
        t.prix,
        t.duree,
        t.places_total,
        t.places_disponibles,
        s.nom as societe_nom,
        b.type_bus,
        b.equipements,
        b.numero_immatriculation,
        b.capacite,
        (t.places_disponibles - IFNULL(res.reserved_count, 0)) as places_reellement_disponibles
      FROM Trajets t
      LEFT JOIN Bus b ON t.bus_id = b.id
      LEFT JOIN Societes s ON b.societe_id = s.id
      LEFT JOIN Arrets a ON t.id = a.trajet_id
      LEFT JOIN (
        SELECT trajet_id, COUNT(*) as reserved_count
        FROM Reservations 
        WHERE etat_reservation IN ('confirmee', 'en_attente')
        GROUP BY trajet_id
      ) res ON t.id = res.trajet_id
      WHERE t.date_depart >= CURDATE() AND t.etat_trajet = 'actif'
    `;

    const params = [];

    // Recherche flexible : ville ou arrêt
    if (ville_depart || arret_depart) {
      const searchDepart = ville_depart || arret_depart;
      query += ` AND (
        t.ville_depart LIKE ? 
        OR a.nom_arret LIKE ?
      )`;
      params.push(`%${searchDepart}%`, `%${searchDepart}%`);
    }

    if (ville_arrivee || arret_arrivee) {
      const searchArrivee = ville_arrivee || arret_arrivee;
      query += ` AND (
        t.ville_arrivee LIKE ? 
        OR a.nom_arret LIKE ?
      )`;
      params.push(`%${searchArrivee}%`, `%${searchArrivee}%`);
    }

    if (date_depart) {
      query += " AND t.date_depart = ?";
      params.push(date_depart);
    }

    query += " ORDER BY t.date_depart, t.heure_depart";

    console.log('📋 Query searchTrajetsWithArrets:', query);
    console.log('📦 Params:', params);

    const [trajets] = await db.query(query, params);

    // Enrichir avec les détails des arrêts
    const trajetsAvecDetails = await Promise.all(
      trajets.map(async (trajet) => {
        const [arrets] = await db.query(`
          SELECT nom_arret, ordre, prix_arret 
          FROM Arrets 
          WHERE trajet_id = ? 
          ORDER BY ordre ASC
        `, [trajet.id]);

        return {
          ...trajet,
          arrets: arrets
        };
      })
    );

    console.log(`✅ ${trajetsAvecDetails.length} trajets trouvés avec recherche avancée`);

    res.json({
      success: true,
      count: trajetsAvecDetails.length,
      data: trajetsAvecDetails
    });

  } catch (error) {
    console.error("❌ Erreur searchTrajetsWithArrets:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la recherche avancée",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ======================================================
// 🔹 LISTE DES VILLES DISPONIBLES
// ======================================================
exports.getVilles = async (req, res) => {
  try {
    const [villesDepart] = await db.query(`
      SELECT DISTINCT ville_depart as nom 
      FROM Trajets 
      WHERE ville_depart IS NOT NULL 
      ORDER BY ville_depart
    `);

    const [villesArrivee] = await db.query(`
      SELECT DISTINCT ville_arrivee as nom 
      FROM Trajets 
      WHERE ville_arrivee IS NOT NULL 
      ORDER BY ville_arrivee
    `);

    const [arrets] = await db.query(`
      SELECT DISTINCT nom_arret as nom 
      FROM Arrets 
      WHERE nom_arret IS NOT NULL 
      ORDER BY nom_arret
    `);

    const toutesVilles = [
      ...villesDepart.map(v => v.nom),
      ...villesArrivee.map(v => v.nom),
      ...arrets.map(a => a.nom)
    ].filter((v, i, arr) => arr.indexOf(v) === i).sort();

    res.json({
      success: true,
      data: toutesVilles
    });

  } catch (error) {
    logger.error("❌ Erreur getVilles:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors du chargement des villes"
    });
  }
};

// ======================================================
// 🔹 RÉSERVER UN TRAJET
// ======================================================
exports.reserverTrajet = async (req, res) => {
  try {
    const { trajetId } = req.params;
    const userId = req.user.id;
    const { siege_numero, moyen_paiement, arret_depart, arret_arrivee, prix_calcule } = req.body;

    console.log("🎫 Réservation trajet:", { trajetId, userId, siege_numero });

    // Vérifier que le trajet existe
    const [trajets] = await db.query("SELECT * FROM Trajets WHERE id = ?", [trajetId]);
    if (trajets.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Trajet introuvable"
      });
    }

    const trajet = trajets[0];

    // Vérifier la disponibilité du siège
    const [existing] = await db.query(`
      SELECT * FROM Reservations 
      WHERE trajet_id = ? AND siege_numero = ? 
      AND etat_reservation IN ('confirmee', 'en_attente')
    `, [trajetId, siege_numero]);

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Ce siège est déjà réservé"
      });
    }

    // Générer le code de réservation
    const code_reservation = 'RES-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    
    // Calculer le montant
    const montant = prix_calcule || trajet.prix;

    // Créer la réservation
    const [result] = await db.query(`
      INSERT INTO Reservations 
      (utilisateur_id, trajet_id, siege_numero, etat_reservation, 
       moyen_paiement, montant_total, code_reservation,
       arret_depart, arret_arrivee, prix_calcule)
      VALUES (?, ?, ?, 'en_attente', ?, ?, ?, ?, ?, ?)
    `, [userId, trajetId, siege_numero, moyen_paiement, montant, code_reservation,
        arret_depart, arret_arrivee, prix_calcule]);

    logger.success(`✅ Réservation créée: ${code_reservation}`);

    res.json({
      success: true,
      message: "Réservation créée avec succès",
      reservation_id: result.insertId,
      code_reservation: code_reservation,
      data: {
        id: result.insertId,
        code_reservation,
        trajet: {
          id: trajet.id,
          depart: trajet.ville_depart,
          arrivee: trajet.ville_arrivee,
          date: trajet.date_depart,
          heure: trajet.heure_depart
        },
        siege: siege_numero,
        montant: montant,
        statut: "en_attente"
      }
    });

  } catch (error) {
    logger.error("❌ Erreur reserverTrajet:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la réservation"
    });
  }
};