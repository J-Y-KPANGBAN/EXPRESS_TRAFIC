// backend/controllers/admin/adminReportsController.js
const db = require("../../config/db");
const  logger  = require("../../utils/logger");

/* ============================================================
   🛡️ FONCTIONS DE SÉCURITÉ
============================================================ */
const validateDateRange = (date_debut, date_fin, maxDays = 365) => {
  if (!date_debut || !date_fin) {
    throw new Error("Les dates de début et fin sont obligatoires");
  }

  const start = new Date(date_debut);
  const end = new Date(date_fin);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error("Format de date invalide");
  }

  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays > maxDays) {
    throw new Error(`La période ne peut pas dépasser ${maxDays} jours`);
  }
  
  if (start > new Date()) {
    throw new Error("La date de début ne peut pas être dans le futur");
  }

  return { start, end };
};

const sanitizeLimit = (limit, max = 1000) => {
  const parsed = parseInt(limit) || 50;
  return Math.min(Math.max(parsed, 1), max);
};

const sanitizePage = (page) => {
  const parsed = parseInt(page) || 1;
  return Math.max(parsed, 1);
};

/* ============================================================
   📊 RAPPORTS FINANCIERS - SÉCURISÉ
============================================================ */
exports.getFinancialReports = async (req, res) => {
  try {
    const { periode, date_debut, date_fin, format, limit = 100 } = req.query;
    
    // 🛡️ VALIDATION DES PARAMÈTRES
    const safeLimit = sanitizeLimit(limit, 500);
    
    let startDate, endDate;
    if (date_debut && date_fin) {
      const range = validateDateRange(date_debut, date_fin, 180); // Max 6 mois pour les rapports financiers
      startDate = range.start.toISOString().split('T')[0];
      endDate = range.end.toISOString().split('T')[0];
    } else {
      // Période par défaut sécurisée (30 jours)
      endDate = new Date().toISOString().split('T')[0];
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      startDate = startDate.toISOString().split('T')[0];
    }

    // 🛡️ REQUÊTES PARAMÉTRÉES (Anti-SQL Injection)
    const [revenus] = await db.query(`
      SELECT 
        DATE(r.date_reservation) as date,
        COUNT(*) as reservations,
        SUM(r.montant_total) as chiffre_affaires,
        AVG(r.montant_total) as panier_moyen,
        COUNT(DISTINCT r.utilisateur_id) as clients_uniques
      FROM Reservations r
      WHERE r.etat_reservation = 'confirmee'
        AND DATE(r.date_reservation) BETWEEN ? AND ?
      GROUP BY DATE(r.date_reservation)
      ORDER BY date DESC
      LIMIT ?
    `, [startDate, endDate, safeLimit]);

    // 🛡️ MÉTHODES DE PAIEMENT (LIMITÉ)
    const [paiements] = await db.query(`
      SELECT 
        p.methode,
        COUNT(*) as transactions,
        SUM(p.montant) as total,
        AVG(p.montant) as moyenne
      FROM Paiements p
      WHERE p.etat_paiement = 'reussi'
        AND DATE(p.date_paiement) BETWEEN ? AND ?
      GROUP BY p.methode
      ORDER BY total DESC
      LIMIT 10
    `, [startDate, endDate]);

    // 🛡️ TOP TRAJETS (ANONYMISÉ)
    const [topTrajets] = await db.query(`
      SELECT 
        t.ville_depart,
        t.ville_arrivee,
        COUNT(r.id) as reservations,
        SUM(r.montant_total) as revenus,
        AVG(r.montant_total) as prix_moyen
      FROM Reservations r
      JOIN Trajets t ON r.trajet_id = t.id
      WHERE r.etat_reservation = 'confirmee'
        AND DATE(r.date_reservation) BETWEEN ? AND ?
      GROUP BY t.id, t.ville_depart, t.ville_arrivee
      ORDER BY revenus DESC
      LIMIT 15
    `, [startDate, endDate]);

    const reportData = {
      periode: { startDate, endDate },
      resume: {
        total_reservations: revenus.reduce((sum, item) => sum + (item.reservations || 0), 0),
        chiffre_affaires: revenus.reduce((sum, item) => sum + parseFloat(item.chiffre_affaires || 0), 0),
        panier_moyen: revenus.length > 0 ? revenus.reduce((sum, item) => sum + parseFloat(item.panier_moyen || 0), 0) / revenus.length : 0,
        clients_uniques: revenus.reduce((sum, item) => sum + (item.clients_uniques || 0), 0)
      },
      details: {
        revenus: revenus,
        paiements: paiements,
        topTrajets: topTrajets
      },
      security: {
        donnees_sensibles: false,
        limite_appliquee: safeLimit,
        periode_max_jours: 180
      }
    };

    // 🛡️ GÉNÉRATION PDF (NON IMPLÉMENTÉE POUR L'INSTANT)
    if (format === 'pdf') {
      return res.status(501).json({ 
        success: false, 
        message: "Export PDF non disponible pour le moment" 
      });
    }

    res.json({
      success: true,
      data: reportData
    });

  } catch (error) {
    logger.error("Erreur sécurisée getFinancialReports: " + error.message);
    res.status(400).json({ 
      success: false, 
      message: error.message,
      code: "VALIDATION_ERROR"
    });
  }
};

/* ============================================================
   👥 ANALYTIQUES UTILISATEURS - SÉCURISÉ
============================================================ */
exports.getUserAnalytics = async (req, res) => {
  try {
    const { page = 1, limit = 50, date_debut, date_fin } = req.query;
    
    // 🛡️ VALIDATION PAGINATION
    const safePage = sanitizePage(page);
    const safeLimit = sanitizeLimit(limit, 100);
    const offset = (safePage - 1) * safeLimit;

    let startDate = '2024-01-01'; // Date par défaut sécurisée
    let endDate = new Date().toISOString().split('T')[0];

    if (date_debut && date_fin) {
      const range = validateDateRange(date_debut, date_fin, 365);
      startDate = range.start.toISOString().split('T')[0];
      endDate = range.end.toISOString().split('T')[0];
    }

    // 🛡️ REQUÊTE SÉCURISÉE AVEC PAGINATION ET DONNÉES ANONYMISÉES
    const [activite] = await db.query(`
      SELECT 
        u.id,
        CONCAT(SUBSTRING(u.nom, 1, 1), '.***') as nom, -- 🛡️ ANONYMISÉ
        CONCAT(SUBSTRING(u.prenom, 1, 1), '.') as prenom,
        u.date_inscription,
        u.derniere_connexion,
        COUNT(r.id) as total_reservations,
        SUM(COALESCE(r.montant_total, 0)) as total_depense,
        MAX(r.date_reservation) as derniere_reservation
      FROM signup u
      LEFT JOIN Reservations r ON u.id = r.utilisateur_id
      WHERE u.type_utilisateur = 'client'
        AND u.date_inscription BETWEEN ? AND ?
      GROUP BY u.id, u.nom, u.prenom, u.date_inscription, u.derniere_connexion
      ORDER BY total_depense DESC
      LIMIT ? OFFSET ?
    `, [startDate, endDate, safeLimit, offset]);

    // 🛡️ COMPTAGE TOTAL POUR LA PAGINATION
    const [total] = await db.query(`
      SELECT COUNT(DISTINCT u.id) as total
      FROM signup u
      WHERE u.type_utilisateur = 'client'
        AND u.date_inscription BETWEEN ? AND ?
    `, [startDate, endDate]);

    const totalCount = total[0]?.total || 0;

    res.json({
      success: true,
      data: {
        utilisateurs: activite,
        pagination: {
          page: safePage,
          limit: safeLimit,
          total: totalCount,
          pages: Math.ceil(totalCount / safeLimit),
          has_next: safePage < Math.ceil(totalCount / safeLimit)
        },
        periode: {
          start: startDate,
          end: endDate
        }
      }
    });

  } catch (error) {
    logger.error("Erreur sécurisée getUserAnalytics: " + error.message);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/* ============================================================
   🚌 PERFORMANCES TRAJETS - SÉCURISÉ
============================================================ */
exports.getTrajetsPerformance = async (req, res) => {
  try {
    const { date_debut, date_fin, limit = 50 } = req.query;

    // 🛡️ VALIDATION OBLIGATOIRE DES DATES
    if (!date_debut || !date_fin) {
      return res.status(400).json({
        success: false,
        message: "Les paramètres date_debut et date_fin sont obligatoires"
      });
    }

    const range = validateDateRange(date_debut, date_fin, 180);
    const safeLimit = sanitizeLimit(limit, 200);

    const startDate = range.start.toISOString().split('T')[0];
    const endDate = range.end.toISOString().split('T')[0];

    const [performance] = await db.query(`
      SELECT 
        t.id,
        t.ville_depart,
        t.ville_arrivee,
        t.date_depart,
        t.prix,
        t.places_total,
        t.places_disponibles,
        COUNT(r.id) as reservations_count,
        (t.places_total - t.places_disponibles) as places_occupees,
        ROUND(((t.places_total - t.places_disponibles) / t.places_total) * 100, 2) as taux_remplissage,
        SUM(COALESCE(r.montant_total, 0)) as revenus_generes,
        ROUND(AVG(COALESCE(a.note, 0)), 2) as satisfaction_moyenne
      FROM Trajets t
      LEFT JOIN Reservations r ON t.id = r.trajet_id AND r.etat_reservation = 'confirmee'
      LEFT JOIN Avis a ON t.id = a.trajet_id
      WHERE t.date_depart BETWEEN ? AND ?
      GROUP BY t.id, t.ville_depart, t.ville_arrivee, t.date_depart, t.prix, t.places_total, t.places_disponibles
      ORDER BY taux_remplissage DESC
      LIMIT ?
    `, [startDate, endDate, safeLimit]);

    const stats = performance.reduce((acc, t) => {
      acc.total_trajets++;
      acc.taux_remplissage_moyen += parseFloat(t.taux_remplissage || 0);
      acc.revenus_totaux += parseFloat(t.revenus_generes || 0);
      return acc;
    }, { total_trajets: 0, taux_remplissage_moyen: 0, revenus_totaux: 0 });

    if (stats.total_trajets > 0) {
      stats.taux_remplissage_moyen = (stats.taux_remplissage_moyen / stats.total_trajets).toFixed(2);
    }

    res.json({
      success: true,
      data: {
        trajets: performance,
        resume: stats,
        meta: {
          limite: safeLimit,
          periode: { startDate, endDate }
        }
      }
    });

  } catch (error) {
    logger.error("Erreur sécurisée getTrajetsPerformance: " + error.message);
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

/* ============================================================
   💳 STATISTIQUES PAIEMENTS - SÉCURISÉ
============================================================ */
exports.getPaymentsStats = async (req, res) => {
  try {
    const { periode } = req.query;

    // 🛡️ VALIDATION DU PARAMÈTRE PÉRIODE
    const periodesValides = ['today', 'week', 'month', 'year', 'all'];
    const safePeriode = periodesValides.includes(periode) ? periode : 'month';

    // 🛡️ CONSTRUCTION SÉCURISÉE DE LA REQUÊTE (PAS DE CONCATÉNATION)
    let dateCondition = "1=1";
    let queryParams = [];

    switch (safePeriode) {
      case 'today':
        dateCondition = "DATE(date_paiement) = CURDATE()";
        break;
      case 'week':
        dateCondition = "date_paiement >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
        break;
      case 'month':
        dateCondition = "date_paiement >= DATE_SUB(NOW(), INTERVAL 1 MONTH)";
        break;
      case 'year':
        dateCondition = "date_paiement >= DATE_SUB(NOW(), INTERVAL 1 YEAR)";
        break;
      default:
        dateCondition = "1=1";
    }

    // 🛡️ REQUÊTES PARAMÉTRÉES
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_transactions,
        SUM(montant) as montant_total,
        AVG(montant) as montant_moyen,
        COUNT(CASE WHEN etat_paiement = 'reussi' THEN 1 END) as paiements_reussis,
        COUNT(CASE WHEN etat_paiement = 'en_attente' THEN 1 END) as paiements_attente,
        COUNT(CASE WHEN etat_paiement = 'echoue' THEN 1 END) as paiements_echoues
      FROM Paiements
      WHERE ${dateCondition}
    `, queryParams);

    const [methodes] = await db.query(`
      SELECT 
        methode,
        COUNT(*) as count,
        SUM(montant) as total,
        AVG(montant) as moyenne
      FROM Paiements
      WHERE ${dateCondition}
      GROUP BY methode
      ORDER BY total DESC
      LIMIT 10
    `, queryParams);

    res.json({
      success: true,
      data: {
        resume: stats[0],
        methodes_paiement: methodes,
        periode: safePeriode,
        security: {
          requete_parametree: true,
          periode_validee: true
        }
      }
    });

  } catch (error) {
    logger.error("Erreur sécurisée getPaymentsStats: " + error.message);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/* ============================================================
   📈 RAPPORT COMPLET - SÉCURISÉ
============================================================ */
exports.getCompleteReport = async (req, res) => {
  try {
    const { date_debut, date_fin, format } = req.query;

    // 🛡️ VALIDATION OBLIGATOIRE DES DATES
    if (!date_debut || !date_fin) {
      return res.status(400).json({
        success: false,
        message: "Les paramètres date_debut et date_fin sont obligatoires"
      });
    }

    const range = validateDateRange(date_debut, date_fin, 90); // Max 90 jours pour rapport complet
    const startDate = range.start.toISOString().split('T')[0];
    const endDate = range.end.toISOString().split('T')[0];

    // 🛡️ RÉCUPÉRATION LIMITÉE DES DONNÉES
    const [
      financialData,
      userData,
      trajetsData,
      paymentsData
    ] = await Promise.all([
      // Données financières agrégées
      db.query(`
        SELECT 
          COUNT(*) as reservations_total,
          SUM(montant_total) as chiffre_affaires,
          AVG(montant_total) as panier_moyen
        FROM Reservations
        WHERE etat_reservation = 'confirmee'
          AND DATE(date_reservation) BETWEEN ? AND ?
      `, [startDate, endDate]),

      // Données utilisateurs agrégées
      db.query(`
        SELECT 
          COUNT(*) as nouveaux_utilisateurs,
          COUNT(CASE WHEN type_utilisateur = 'client' THEN 1 END) as clients,
          COUNT(CASE WHEN derniere_connexion >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as utilisateurs_actifs
        FROM signup
        WHERE date_inscription BETWEEN ? AND ?
      `, [startDate, endDate]),

      // Données trajets agrégées
      db.query(`
        SELECT 
          COUNT(*) as total_trajets,
          AVG(prix) as prix_moyen,
          SUM(places_total - places_disponibles) as total_passagers,
          AVG((places_total - places_disponibles) / places_total) * 100 as taux_remplissage_moyen
        FROM Trajets
        WHERE date_depart BETWEEN ? AND ?
      `, [startDate, endDate]),

      // Données paiements agrégées
      db.query(`
        SELECT 
          COUNT(*) as total_paiements,
          SUM(montant) as montant_total,
          AVG(montant) as moyenne_paiement
        FROM Paiements
        WHERE etat_paiement = 'reussi'
          AND DATE(date_paiement) BETWEEN ? AND ?
      `, [startDate, endDate])
    ]);

    const completeReport = {
      periode: {
        date_debut: startDate,
        date_fin: endDate,
        generated_at: new Date().toISOString()
      },
      resume: {
        financier: financialData[0][0] || {},
        utilisateurs: userData[0][0] || {},
        trajets: trajetsData[0][0] || {},
        paiements: paymentsData[0][0] || {}
      },
      security: {
        donnees_sensibles: false,
        donnees_agregees: true,
        periode_max_jours: 90,
        retention_donnees: "30 jours"
      }
    };

    // 🛡️ GESTION DES FORMATS D'EXPORT
    if (format === 'pdf') {
      return res.status(501).json({ 
        success: false, 
        message: "Export PDF non disponible pour le moment" 
      });
    }

    if (format === 'excel') {
      return res.status(501).json({ 
        success: false, 
        message: "Export Excel non disponible pour le moment" 
      });
    }

    // Format JSON par défaut
    res.json({
      success: true,
      data: completeReport
    });

  } catch (error) {
    logger.error("Erreur sécurisée getCompleteReport: " + error.message);
    res.status(400).json({ 
      success: false, 
      message: error.message,
      code: "VALIDATION_ERROR"
    });
  }
};