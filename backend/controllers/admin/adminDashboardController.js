// backend/controllers/admin/adminDashboardController.js
const db = require("../../config/db");
const  logger  = require("../../utils/logger");

/* ============================================================
   🛡️ FONCTIONS DE SÉCURITÉ
============================================================ */
const validatePeriod = (periode) => {
  const validPeriods = ['today', 'week', 'month', 'year'];
  if (periode && !validPeriods.includes(periode)) {
    throw new Error("Période invalide");
  }
  return periode || 'today';
};

const sanitizeLimit = (limit, max = 100) => {
  const parsed = parseInt(limit) || 10;
  return Math.min(Math.max(parsed, 1), max);
};

const validateDateRange = (start, end, maxDays = 365) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = Math.abs(endDate - startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays > maxDays) {
    throw new Error(`La période ne peut pas dépasser ${maxDays} jours`);
  }
  
  if (startDate > new Date()) {
    throw new Error("La date de début ne peut pas être dans le futur");
  }
};

/* ============================================================
   📊 DASHBOARD ADMIN — VERSION SÉCURISÉE
============================================================ */

exports.getStats = async (req, res) => {
  try {
    const { periode = 'today', langue = 'fr', limit = 10 } = req.query;
    
    // 🛡️ VALIDATION DES PARAMÈTRES
    const safePeriod = validatePeriod(periode);
    const safeLimit = sanitizeLimit(limit, 50);
    
    logger.info(`📊 Dashboard admin sécurisé - Période: ${safePeriod}, Limite: ${safeLimit}`);

    // 🛡️ DÉTERMINER LES DATES AVEC VALIDATION
    const dateRange = getDateRange(safePeriod);
    validateDateRange(dateRange.start, dateRange.end, 90); // Max 90 jours pour le dashboard
    
    // 🛡️ RÉCUPÉRATION PARALLÈLE AVEC LIMITES
    const [
      utilisateursStats,
      reservationsStats,
      financesStats,
      trajetsStats,
      topTrajets,
      reservationsRecent,
      avisRecents,
      performanceChauffeurs
    ] = await Promise.all([
      getUtilisateursStats(dateRange),
      getReservationsStats(dateRange),
      getFinancesStats(dateRange),
      getTrajetsStats(dateRange),
      getTopTrajets(dateRange, safeLimit),
      getReservationsRecent(safeLimit),
      getAvisRecents(safeLimit),
      getPerformanceChauffeurs(dateRange, safeLimit)
    ]);

    const stats = {
      // 📈 KPI PRINCIPAUX (Données agrégées uniquement)
      kpis: {
        utilisateurs: utilisateursStats,
        reservations: reservationsStats,
        finances: financesStats,
        trajets: trajetsStats
      },

      // 🚌 DONNÉES OPÉRATIONNELLES (Limitées)
      operationnel: {
        top_trajets: topTrajets,
        reservations_recentes: reservationsRecent,
        avis_recents: avisRecents,
        performance_chauffeurs: performanceChauffeurs
      },

      // 📱 MÉTADONNÉES SÉCURISÉES
      meta: {
        periode: safePeriod,
        date_mise_a_jour: new Date().toISOString(),
        limite_resultats: safeLimit,
        donnees_sensibles: false, // 🛡️ Confirmation qu'aucune donnée sensible n'est exposée
        version_api: '2.1.0-secure'
      }
    };

    logger.success("✅ Dashboard admin sécurisé généré avec succès");
    
    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error("❌ Erreur dashboard sécurisé: " + error.message);
    res.status(400).json({ // 🛡️ 400 pour erreurs de validation
      success: false,
      message: error.message,
      code: "VALIDATION_ERROR"
    });
  }
};

/* ============================================================
   📈 STATISTIQUES UTILISATEURS - SÉCURISÉ
============================================================ */
async function getUtilisateursStats(dateRange) {
  const [stats] = await db.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN type_utilisateur = 'client' THEN 1 END) as clients,
      COUNT(CASE WHEN type_utilisateur = 'admin' THEN 1 END) as admins,
      COUNT(CASE WHEN type_utilisateur = 'conducteur' THEN 1 END) as conducteurs,
      COUNT(CASE WHEN date_inscription >= ? THEN 1 END) as nouveaux,
      COUNT(CASE WHEN derniere_connexion >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as actifs_30j
    FROM signup
    WHERE date_inscription BETWEEN ? AND ?
  `, [dateRange.start, dateRange.start, dateRange.end]);

  return stats[0];
}

/* ============================================================
   🎫 STATISTIQUES RÉSERVATIONS - SÉCURISÉ
============================================================ */
async function getReservationsStats(dateRange) {
  const [stats] = await db.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN etat_reservation = 'confirmee' THEN 1 END) as confirmees,
      COUNT(CASE WHEN etat_reservation = 'en_attente' THEN 1 END) as en_attente,
      COUNT(CASE WHEN etat_reservation = 'annulee' THEN 1 END) as annulees,
      COUNT(CASE WHEN DATE(date_reservation) = CURDATE() THEN 1 END) as aujourdhui,
      AVG(montant_total) as panier_moyen
    FROM Reservations
    WHERE DATE(date_reservation) BETWEEN ? AND ?
  `, [dateRange.start, dateRange.end]);

  return stats[0];
}

/* ============================================================
   💰 STATISTIQUES FINANCIÈRES - SÉCURISÉ
============================================================ */
async function getFinancesStats(dateRange) {
  const [stats] = await db.query(`
    SELECT 
      COALESCE(SUM(r.montant_total), 0) as chiffre_affaires,
      COALESCE(SUM(CASE WHEN DATE(r.date_reservation) = CURDATE() THEN r.montant_total ELSE 0 END), 0) as ca_aujourdhui,
      COALESCE(SUM(p.montant), 0) as total_paiements,
      COUNT(DISTINCT p.id) as transactions,
      AVG(p.montant) as transaction_moyenne,
      COUNT(CASE WHEN p.etat_paiement = 'en_attente' THEN 1 END) as paiements_attente
    FROM Reservations r
    LEFT JOIN Paiements p ON r.id = p.reservation_id
    WHERE DATE(r.date_reservation) BETWEEN ? AND ?
      AND r.etat_reservation = 'confirmee'
  `, [dateRange.start, dateRange.end]);

  // 🛡️ RÉPARTITION LIMITÉE SANS DONNÉES SENSIBLES
  const [methodes] = await db.query(`
    SELECT 
      methode,
      COUNT(*) as transactions,
      SUM(montant) as total
    FROM Paiements
    WHERE DATE(date_paiement) BETWEEN ? AND ?
      AND etat_paiement = 'reussi'
    GROUP BY methode
    ORDER BY total DESC
    LIMIT 5
  `, [dateRange.start, dateRange.end]);

  return {
    ...stats[0],
    repartition_methodes: methodes
  };
}

/* ============================================================
   🚌 STATISTIQUES TRAJETS - SÉCURISÉ
============================================================ */
async function getTrajetsStats(dateRange) {
  const [stats] = await db.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN date_depart >= CURDATE() THEN 1 END) as a_venir,
      COUNT(CASE WHEN date_depart < CURDATE() THEN 1 END) as termines,
      COUNT(CASE WHEN places_disponibles = 0 THEN 1 END) as complets,
      AVG(places_disponibles) as disponibilite_moyenne,
      AVG(prix) as prix_moyen
    FROM Trajets
    WHERE DATE(date_depart) BETWEEN ? AND ?
  `, [dateRange.start, dateRange.end]);

  return stats[0];
}

/* ============================================================
   🏆 TOP TRAJETS - SÉCURISÉ
============================================================ */
async function getTopTrajets(dateRange, limit) {
  const [trajets] = await db.query(`
    SELECT 
      t.id,
      t.ville_depart,
      t.ville_arrivee,
      t.date_depart,
      t.prix,
      COUNT(r.id) as reservations_count,
      SUM(r.montant_total) as revenus,
      ROUND(AVG(COALESCE(a.note, 0)), 2) as note_moyenne
    FROM Trajets t
    LEFT JOIN Reservations r ON t.id = r.trajet_id
    LEFT JOIN Avis a ON t.id = a.trajet_id
    WHERE DATE(t.date_depart) BETWEEN ? AND ?
    GROUP BY t.id, t.ville_depart, t.ville_arrivee, t.date_depart, t.prix
    ORDER BY reservations_count DESC
    LIMIT ?
  `, [dateRange.start, dateRange.end, limit]);

  return trajets;
}

/* ============================================================
   📋 RÉSERVATIONS RÉCENTES - SÉCURISÉ
============================================================ */
async function getReservationsRecent(limit) {
  const [reservations] = await db.query(`
    SELECT 
      r.id,
      r.code_reservation,
      r.date_reservation,
      r.etat_reservation,
      r.montant_total,
      CONCAT(SUBSTRING(u.nom, 1, 1), '.***') as nom, -- 🛡️ Données anonymisées
      CONCAT(SUBSTRING(u.prenom, 1, 1), '.') as prenom,
      t.ville_depart,
      t.ville_arrivee,
      t.date_depart
    FROM Reservations r
    JOIN signup u ON r.utilisateur_id = u.id
    JOIN Trajets t ON r.trajet_id = t.id
    ORDER BY r.date_reservation DESC
    LIMIT ?
  `, [limit]);

  return reservations;
}

/* ============================================================
   ⭐ AVIS RÉCENTS - SÉCURISÉ
============================================================ */
async function getAvisRecents(limit) {
  const [avis] = await db.query(`
    SELECT 
      a.id,
      a.note,
      SUBSTRING(a.commentaire, 1, 100) as commentaire, -- 🛡️ Commentaire tronqué
      a.date,
      a.statut,
      a.type_avis,
      CONCAT(SUBSTRING(u.nom, 1, 1), '.***') as nom, -- 🛡️ Anonymisé
      t.ville_depart,
      t.ville_arrivee
    FROM Avis a
    JOIN signup u ON a.utilisateur_id = u.id
    LEFT JOIN Trajets t ON a.trajet_id = t.id
    ORDER BY a.date DESC
    LIMIT ?
  `, [limit]);

  return avis;
}

/* ============================================================
   🚖 PERFORMANCE CHAUFFEURS - SÉCURISÉ
============================================================ */
async function getPerformanceChauffeurs(dateRange, limit) {
  const [chauffeurs] = await db.query(`
    SELECT 
      c.id,
      c.nom,
      c.prenom,
      c.statut,
      COUNT(DISTINCT t.id) as trajets_effectues,
      COUNT(r.id) as reservations,
      ROUND(COALESCE(AVG(a.note), 0), 2) as note_moyenne,
      COUNT(CASE WHEN a.note = 5 THEN 1 END) as notes_5_etoiles
    FROM Chauffeurs c
    LEFT JOIN Bus b ON c.id = b.chauffeur_id
    LEFT JOIN Trajets t ON b.id = t.bus_id
    LEFT JOIN Reservations r ON t.id = r.trajet_id
    LEFT JOIN Avis a ON t.id = a.trajet_id AND a.type_avis = 'chauffeur'
    WHERE DATE(t.date_depart) BETWEEN ? AND ?
    GROUP BY c.id, c.nom, c.prenom, c.statut
    ORDER BY note_moyenne DESC
    LIMIT ?
  `, [dateRange.start, dateRange.end, limit]);

  return chauffeurs;
}

/* ============================================================
   🗓️ CALCUL DES PÉRIODES - SÉCURISÉ
============================================================ */
function getDateRange(periode) {
  const now = new Date();
  let start, end;

  switch (periode) {
    case 'today':
      start = new Date(now.toISOString().split('T')[0]);
      end = new Date(now);
      break;
    
    case 'week':
      start = new Date(now);
      start.setDate(now.getDate() - 7);
      end = new Date(now);
      break;
    
    case 'month':
      start = new Date(now);
      start.setMonth(now.getMonth() - 1);
      end = new Date(now);
      break;
    
    case 'year':
      start = new Date(now);
      start.setFullYear(now.getFullYear() - 1);
      end = new Date(now);
      break;
    
    default:
      start = new Date(now);
      start.setDate(now.getDate() - 7); // Default à 1 semaine
      end = new Date(now);
  }

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  };
}

/* ============================================================
   📱 DASHBOARD MOBILE SÉCURISÉ
============================================================ */
exports.getMobileDashboard = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const safeLimit = sanitizeLimit(limit, 10);
    
    logger.info("📱 Dashboard mobile admin sécurisé chargé");

    // 🛡️ VERSION ALLÉGÉE ET SÉCURISÉE POUR MOBILE
    const [
      kpisBasiques,
      reservationsAujourdhui,
      alertes
    ] = await Promise.all([
      getKpisBasiques(),
      getReservationsAujourdhui(safeLimit),
      getAlertesSysteme()
    ]);

    const mobileStats = {
      kpis: kpisBasiques,
      reservations_aujourdhui: reservationsAujourdhui,
      alertes: alertes,
      meta: {
        optimise_mobile: true,
        limite: safeLimit,
        donnees_sensibles: false,
        timestamp: new Date().toISOString()
      }
    };

    res.json({
      success: true,
      data: mobileStats
    });

  } catch (error) {
    logger.error("❌ Erreur mobile dashboard sécurisé: " + error.message);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

async function getKpisBasiques() {
  const [kpis] = await db.query(`
    SELECT 
      (SELECT COUNT(*) FROM signup WHERE type_utilisateur = 'client') as total_clients,
      (SELECT COUNT(*) FROM Reservations WHERE DATE(date_reservation) = CURDATE()) as reservations_aujourdhui,
      (SELECT COALESCE(SUM(montant_total), 0) FROM Reservations WHERE DATE(date_reservation) = CURDATE() AND etat_reservation = 'confirmee') as ca_aujourdhui,
      (SELECT COUNT(*) FROM Trajets WHERE date_depart >= CURDATE()) as trajets_avenir,
      (SELECT COUNT(*) FROM Paiements WHERE etat_paiement = 'en_attente') as paiements_attente
  `);

  return kpis[0];
}

async function getReservationsAujourdhui(limit) {
  const [reservations] = await db.query(`
    SELECT 
      r.code_reservation,
      r.etat_reservation,
      CONCAT(SUBSTRING(u.prenom, 1, 1), '.') as prenom, -- 🛡️ Anonymisé
      t.ville_depart,
      t.ville_arrivee,
      t.heure_depart
    FROM Reservations r
    JOIN signup u ON r.utilisateur_id = u.id
    JOIN Trajets t ON r.trajet_id = t.id
    WHERE DATE(r.date_reservation) = CURDATE()
    ORDER BY r.date_reservation DESC
    LIMIT ?
  `, [limit]);

  return reservations;
}

async function getAlertesSysteme() {
  const alertes = [];

  try {
    // 🛡️ REQUÊTES SÉPARÉES POUR MEILLEURE GESTION D'ERREURS
    const [trajetsSansBus] = await db.query(`
      SELECT COUNT(*) as count 
      FROM Trajets 
      WHERE bus_id IS NULL 
        AND date_depart >= CURDATE()
    `);
    
    if (trajetsSansBus[0].count > 0) {
      alertes.push({
        type: 'warning',
        message: `${trajetsSansBus[0].count} trajet(s) sans bus assigné`,
        action: '/admin/trajets',
        priorite: 'moyenne'
      });
    }

    const [paiementsAttente] = await db.query(`
      SELECT COUNT(*) as count 
      FROM Paiements 
      WHERE etat_paiement = 'en_attente'
        AND date_paiement >= DATE_SUB(NOW(), INTERVAL 7 DAY) -- 🛡️ Limité aux 7 derniers jours
    `);
    
    if (paiementsAttente[0].count > 0) {
      alertes.push({
        type: 'info',
        message: `${paiementsAttente[0].count} paiement(s) en attente`,
        action: '/admin/paiements',
        priorite: 'basse'
      });
    }

    const [avisEnAttente] = await db.query(`
      SELECT COUNT(*) as count 
      FROM Avis 
      WHERE statut = 'en_attente'
        AND date >= DATE_SUB(NOW(), INTERVAL 30 DAY) -- 🛡️ Limité aux 30 derniers jours
    `);
    
    if (avisEnAttente[0].count > 0) {
      alertes.push({
        type: 'warning',
        message: `${avisEnAttente[0].count} avis en attente de modération`,
        action: '/admin/avis',
        priorite: 'moyenne'
      });
    }

  } catch (error) {
    logger.error("Erreur dans getAlertesSysteme: " + error.message);
    // 🛡️ NE PAS PROPAGER L'ERREUR POUR NE PAS CASSER TOUT LE DASHBOARD
  }

  return alertes;
}

// 🛡️ EXPORT SÉCURISÉ POUR LES ALERTES
exports.getAlertesSysteme = async (req, res) => {
  try {
    const alertes = await getAlertesSysteme();
    res.json({ 
      success: true, 
      data: alertes,
      meta: {
        total: alertes.length,
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error("Erreur getAlertesSysteme: " + error.message);
    res.status(500).json({ 
      success: false, 
      message: "Erreur lors de la récupération des alertes",
      code: "ALERTES_ERROR"
    });
  }
};