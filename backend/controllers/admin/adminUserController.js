// backend/controllers/admin/adminUserController.js - VERSION SÉCURISÉE
const db = require("../../config/db");
const logger  = require("../../utils/logger");
const validator = require("validator");

/* ============================================================
   🛡️ FONCTIONS DE SÉCURITÉ AMÉLIORÉES
============================================================ */
const sanitizeLimit = (limit, max = 100) => {
  const parsed = parseInt(limit) || 10;
  return Math.min(Math.max(parsed, 1), max);
};

const sanitizePage = (page) => {
  const parsed = parseInt(page) || 1;
  return Math.max(parsed, 1);
};

const validateEmail = (email) => {
  if (!validator.isEmail(email)) {
    throw new Error("Format d'email invalide");
  }
  return validator.normalizeEmail(email);
};

const sanitizePhone = (phone) => {
  if (!phone) return null;
  // Supprimer tous les caractères non numériques
  return phone.replace(/[^\d+]/g, '');
};

const validateUserData = (userData) => {
  const errors = [];
  
  if (userData.nom && !validator.isLength(userData.nom, { min: 1, max: 100 })) {
    errors.push("Le nom doit contenir entre 1 et 100 caractères");
  }
  
  if (userData.prenom && !validator.isLength(userData.prenom, { min: 1, max: 100 })) {
    errors.push("Le prénom doit contenir entre 1 et 100 caractères");
  }
  
  if (userData.email) {
    if (!validator.isEmail(userData.email)) {
      errors.push("Format d'email invalide");
    }
  }
  
  if (userData.telephone && !validator.isMobilePhone(userData.telephone, 'any', { strictMode: false })) {
    errors.push("Format de téléphone invalide");
  }
  
  if (userData.date_naissance && !validator.isDate(userData.date_naissance)) {
    errors.push("Format de date invalide");
  }
  
  if (errors.length > 0) {
    throw new Error(errors.join(', '));
  }
  
  return userData;
};

/* ============================================================
   👤 PROFIL ADMIN — RÉCUPÉRATION SÉCURISÉE
============================================================ */
exports.getAdminProfile = async (req, res) => {
  try {
    // 🛡️ LOG ANONYMISÉ
    logger.info(`Récupération profil admin ID: ${req.user.id}`);

    const [users] = await db.query(
      `SELECT 
        id, nom, prenom, email, telephone, date_naissance,
        adresse_postale, ville, code_postal, country, region,
        numero_client, date_inscription, type_utilisateur, derniere_connexion
       FROM signup 
       WHERE id = ? AND type_utilisateur = 'admin'`,
      [req.user.id]
    );

    if (users.length === 0) {
      // 🛡️ MESSAGE GÉNÉRIQUE POUR ÉVITER L'ENUMERATION
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }

    const adminProfile = users[0];

    // 🛡️ LOG ANONYMISÉ
    logger.success(`Profil admin récupéré - ID: ${req.user.id}`);

    return res.json({
      success: true,
      data: adminProfile
    });

  } catch (error) {
    // 🛡️ ERREUR GÉNÉRIQUE - PAS DE DÉTAILS SENSIBLES
    logger.error("Erreur récupération profil admin");
    return res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
};

/* ============================================================
   👤 PROFIL ADMIN — MISE À JOUR SÉCURISÉE
============================================================ */
exports.updateAdminProfile = async (req, res) => {
  try {
    const {
      nom, prenom, email, telephone, date_naissance,
      adresse_postale, ville, code_postal, country, region  // 🛡️ CORRECTION : adresse_postale
    } = req.body;

    // 🛡️ VALIDATION DES DONNÉES
    const userData = validateUserData({
      nom, prenom, email, telephone, date_naissance,
      adresse_postale, ville, code_postal, country, region
    });

    // 🛡️ VÉRIFICATION UNICITÉ EMAIL
    if (email) {
      const [existingUsers] = await db.query(
        "SELECT id FROM signup WHERE email = ? AND id != ?",
        [email, req.user.id]
      );
      
      if (existingUsers.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Cet email est déjà utilisé par un autre utilisateur"
        });
      }
    }

    // 🛡️ NORMALISATION DES DONNÉES
    const sanitizedData = {
      ...userData,
      telephone: sanitizePhone(telephone),
      email: email ? await validateEmail(email) : undefined
    };

    await db.query(
      `UPDATE signup 
       SET nom = ?, prenom = ?, email = ?, telephone = ?, date_naissance = ?,
           adresse_postale = ?, ville = ?, code_postal = ?, country = ?, region = ?,
           derniere_connexion = NOW()
       WHERE id = ? AND type_utilisateur = 'admin'`,
      [
        sanitizedData.nom, 
        sanitizedData.prenom, 
        sanitizedData.email, 
        sanitizedData.telephone, 
        sanitizedData.date_naissance,
        sanitizedData.adresse_postale, 
        sanitizedData.ville, 
        sanitizedData.code_postal, 
        sanitizedData.country, 
        sanitizedData.region,
        req.user.id
      ]
    );

    // 🛡️ LOG SÉCURISÉ
    logger.success(`Profil admin mis à jour - ID: ${req.user.id}`);

    return res.json({
      success: true,
      message: "Profil admin mis à jour avec succès"
    });

  } catch (error) {
    // 🛡️ GESTION DIFFÉRENCIÉE DES ERREURS
    if (error.message.includes('Format') || error.message.includes('doit contenir')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    logger.error("Erreur mise à jour profil admin");
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la mise à jour"
    });
  }
};

/* ============================================================
   👥 LISTE TOUS LES UTILISATEURS - SÉCURISÉ
============================================================ */
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, type_utilisateur, statut } = req.query;
    
    // 🛡️ VALIDATION RENFORCÉE
    const safePage = sanitizePage(page);
    const safeLimit = sanitizeLimit(limit, 50); // 🛡️ LIMITE MAX REDUITE
    const offset = (safePage - 1) * safeLimit;

    let whereConditions = ["1=1"];
    let queryParams = [];

    // 🛡️ VALIDATION DES FILTRES
    if (type_utilisateur && ['client', 'admin', 'conducteur'].includes(type_utilisateur)) {
      whereConditions.push("type_utilisateur = ?");
      queryParams.push(type_utilisateur);
    }

    if (statut && ['actif', 'inactif', 'suspendu'].includes(statut)) {
      whereConditions.push("statut = ?");
      queryParams.push(statut);
    }

    const whereClause = whereConditions.join(" AND ");

    // 🛡️ REQUÊTE SÉCURISÉE - CHAMPS LIMITÉS
    const [users] = await db.query(
      `SELECT 
        id, 
        CONCAT(SUBSTRING(nom, 1, 1), '***') as nom_anonymise,  // 🛡️ ANONYMISATION
        CONCAT(SUBSTRING(prenom, 1, 1), '.') as prenom_anonymise,
        email,
        CONCAT(SUBSTRING(telephone, -4), '****') as telephone_anonymise,
        ville, code_postal, country, region,
        numero_client, date_inscription, type_utilisateur, 
        statut, derniere_connexion
       FROM signup 
       WHERE ${whereClause}
       ORDER BY date_inscription DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, safeLimit, offset]
    );

    // 🛡️ COMPTAGE SÉCURISÉ
    const [total] = await db.query(
      `SELECT COUNT(*) as total FROM signup WHERE ${whereClause}`,
      queryParams
    );

    logger.info(`Liste utilisateurs - Page ${safePage}, Limite ${safeLimit}`);

    return res.json({
      success: true,
      data: {
        users: users,
        pagination: {
          page: safePage,
          limit: safeLimit,
          total: total[0].total,
          pages: Math.ceil(total[0].total / safeLimit)
        },
        security: {
          donnees_anonymisees: true,
          champs_sensibles_masques: ['nom', 'prenom', 'telephone']
        }
      }
    });

  } catch (error) {
    logger.error("Erreur getAllUsers");
    return res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
};

/* ============================================================
   🔍 RECHERCHE UTILISATEURS - SÉCURISÉ
============================================================ */
exports.searchUsers = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;

    // 🛡️ VALIDATION RENFORCÉE
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Le terme de recherche doit contenir au moins 2 caractères"
      });
    }

    // 🛡️ PROTECTION CONTRE LES RECHERCHES TROP LARGES
    if (q.trim().length > 50) {
      return res.status(400).json({
        success: false,
        message: "Le terme de recherche est trop long"
      });
    }

    const safePage = sanitizePage(page);
    const safeLimit = sanitizeLimit(limit, 25); // 🛡️ LIMITE PLUS RESTRICTIVE
    const offset = (safePage - 1) * safeLimit;
    const searchTerm = `%${q.trim()}%`;

    // 🛡️ REQUÊTE AVEC ANONYMISATION
    const [users] = await db.query(
      `SELECT 
        id, 
        CONCAT(SUBSTRING(nom, 1, 1), '***') as nom_anonymise,
        CONCAT(SUBSTRING(prenom, 1, 1), '.') as prenom_anonymise,
        email,
        ville, code_postal,
        numero_client, date_inscription, type_utilisateur, 
        statut
       FROM signup 
       WHERE (nom LIKE ? OR prenom LIKE ? OR email LIKE ? OR numero_client LIKE ?)
         AND type_utilisateur != 'admin'  // 🛡️ NE PAS MONTRER LES ADMINS
       ORDER BY 
         CASE 
           WHEN nom LIKE ? THEN 1
           WHEN prenom LIKE ? THEN 2
           WHEN email LIKE ? THEN 3
           ELSE 4
         END
       LIMIT ? OFFSET ?`,
      [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, safeLimit, offset]
    );

    const [total] = await db.query(
      `SELECT COUNT(*) as total 
       FROM signup 
       WHERE (nom LIKE ? OR prenom LIKE ? OR email LIKE ? OR numero_client LIKE ?)
         AND type_utilisateur != 'admin'`,
      [searchTerm, searchTerm, searchTerm, searchTerm]
    );

    logger.info(`Recherche utilisateurs: "${q.substring(0, 10)}..." - ${users.length} résultats`);

    return res.json({
      success: true,
      data: {
        users: users,
        pagination: {
          page: safePage,
          limit: safeLimit,
          total: total[0].total,
          pages: Math.ceil(total[0].total / safeLimit)
        },
        security: {
          recherche_anonymisee: true,
          admins_exclus: true
        }
      }
    });

  } catch (error) {
    logger.error("Erreur searchUsers");
    return res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
};

// ... (les autres fonctions restent similaires mais avec les mêmes améliorations de sécurité)

/* ============================================================
   👤 RÉCUPÉRATION UTILISATEUR PAR ID - SÉCURISÉ
============================================================ */
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // 🛡️ VALIDATION ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: "ID utilisateur invalide"
      });
    }

    const [users] = await db.query(
      `SELECT 
        id, nom, prenom, email, telephone, date_naissance,
        adresse_postale, ville, code_postal, country, region,
        numero_client, numero_compte, date_inscription, 
        type_utilisateur, statut, derniere_connexion,
        conditions_acceptees, photo_profil
       FROM signup 
       WHERE id = ?`,
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }

    const user = users[0];

    // 🛡️ NE PAS RENVOYER LE MOT DE PASSE MÊME HACHÉ
    delete user.mot_de_passe;

    logger.success(`Utilisateur ${user.email} récupéré par admin`);

    return res.json({
      success: true,
      data: user
    });

  } catch (error) {
    logger.error("Erreur getUserById: " + error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération de l'utilisateur",
      error: error.message
    });
  }
};

/* ============================================================
   📝 MISE À JOUR STATUT UTILISATEUR - SÉCURISÉ
============================================================ */
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    // 🛡️ VALIDATION DES DONNÉES
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: "ID utilisateur invalide"
      });
    }

    const statutsValides = ['actif', 'inactif', 'suspendu'];
    if (!statut || !statutsValides.includes(statut)) {
      return res.status(400).json({
        success: false,
        message: `Statut invalide. Valeurs acceptées: ${statutsValides.join(', ')}`
      });
    }

    // Vérifier que l'utilisateur existe
    const [users] = await db.query(
      "SELECT id, email FROM signup WHERE id = ?",
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }

    // 🛡️ EMPÊCHER UN ADMIN DE SE DÉSACTIVER LUI-MÊME
    if (parseInt(id) === req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Vous ne pouvez pas modifier votre propre statut"
      });
    }

    // Mise à jour du statut
    await db.query(
      "UPDATE signup SET statut = ? WHERE id = ?",
      [statut, id]
    );

    const userEmail = users[0].email;
    logger.success(`Statut utilisateur ${userEmail} mis à jour: ${statut}`);

    return res.json({
      success: true,
      message: `Statut utilisateur mis à jour: ${statut}`,
      data: {
        user_id: parseInt(id),
        new_status: statut,
        updated_by: req.user.id,
        updated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error("Erreur updateUserStatus: " + error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la mise à jour du statut",
      error: error.message
    });
  }
};

/* ============================================================
   🗑️ SUPPRESSION UTILISATEUR - SÉCURISÉ
============================================================ */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // 🛡️ VALIDATION ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: "ID utilisateur invalide"
      });
    }

    // Vérifier que l'utilisateur existe
    const [users] = await db.query(
      "SELECT id, email, type_utilisateur FROM signup WHERE id = ?",
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }

    const user = users[0];

    // 🛡️ EMPÊCHER LA SUPPRESSION D'UN ADMIN PAR UN AUTRE ADMIN
    if (user.type_utilisateur === 'admin') {
      return res.status(403).json({
        success: false,
        message: "Impossible de supprimer un compte administrateur"
      });
    }

    // 🛡️ EMPÊCHER UN ADMIN DE SE SUPPRIMER LUI-MÊME
    if (parseInt(id) === req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Vous ne pouvez pas supprimer votre propre compte"
      });
    }

    // Vérifier s'il y a des réservations actives
    const [reservations] = await db.query(
      "SELECT COUNT(*) as count FROM Reservations WHERE utilisateur_id = ? AND etat_reservation IN ('confirmee', 'en_attente')",
      [id]
    );

    if (reservations[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: "Impossible de supprimer un utilisateur avec des réservations actives"
      });
    }

    // 🛡️ SUPPRESSION EN BASE DE DONNÉES
    await db.query("DELETE FROM signup WHERE id = ?", [id]);

    logger.warn(`Utilisateur ${user.email} supprimé par admin ${req.user.id}`);

    return res.json({
      success: true,
      message: "Utilisateur supprimé avec succès",
      data: {
        deleted_user_id: parseInt(id),
        deleted_by: req.user.id,
        deleted_at: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error("Erreur deleteUser: " + error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la suppression de l'utilisateur",
      error: error.message
    });
  }
};