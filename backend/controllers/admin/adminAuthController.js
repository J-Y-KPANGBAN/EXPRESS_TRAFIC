const db = require("../../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const  logger  = require("../../utils/logger");
const { sendEmail } = require("../../services/emailService");
const validator = require("validator");

/* ============================================================
   🔐 LOGIN ADMIN SÉCURISÉ - VERSION COMPATIBLE $2y$ CORRIGÉE
============================================================ */
exports.adminLogin = async (req, res) => {
  try {
    const { email, mot_de_passe, code_admin } = req.body;

    console.log("📥 ADMIN LOGIN - Données reçues:", { 
      email, 
      code_admin_present: !!code_admin 
    });

    logger.info(`Tentative login ADMIN → ${email}`);

    // 🛡️ VALIDATIONS RENFORCÉES
    if (!email || !mot_de_passe) {
      return res.status(400).json({
        success: false,
        message: "Email et mot de passe requis"
      });
    }

    // 🛡️ VÉRIFICATION CODE ADMIN 
    if (!code_admin || code_admin !== process.env.ADMIN_ACCESS_CODE) {
      logger.warning(`Code admin incorrect pour ${email}`);
      return res.status(401).json({
        success: false,
        message: "Code d'accès administrateur incorrect"
      });
    }

    // 🛡️ VÉRIFICATION COMPTE ADMIN
    const [users] = await db.query(
      `SELECT * FROM signup 
       WHERE email = ? AND type_utilisateur = 'admin'`,
      [email.toLowerCase()]
    );

    if (users.length === 0) {
      logger.warning(`Tentative login admin - email non trouvé: ${email}`);
      return res.status(401).json({
        success: false,
        message: "Identifiants administrateur incorrects"
      });
    }

    const admin = users[0];

    // 🛡️ VÉRIFICATION STATUT COMPTE - CORRECTION CRITIQUE
    if (admin.statut && admin.statut !== "actif") {
      console.log(`❌ Compte admin ${admin.email} avec statut: ${admin.statut}`);
      return res.status(403).json({
        success: false,
        message: `Votre compte administrateur est ${admin.statut}`
      });
    }

    console.log("🔐 Vérification mot de passe admin...");
    console.log("🔑 Format du mot de passe admin stocké:", admin.mot_de_passe?.substring(0, 10));

    // ✅ CORRECTION CRITIQUE : GESTION DES FORMATS $2y$ ET $2b$ POUR ADMIN
    let isValid = false;
    
    // Vérifier si le mot de passe est hashé (commence par $2)
    if (admin.mot_de_passe && admin.mot_de_passe.startsWith('$2')) {
      // ✅ CORRECTION : Convertir $2y$ en $2b$ pour la compatibilité Node.js bcrypt
      let compatibleHash = admin.mot_de_passe;
      
      if (admin.mot_de_passe.startsWith('$2y$')) {
        // Convertir $2y$ en $2b$ (compatibilité PHP -> Node.js)
        compatibleHash = '$2b$' + admin.mot_de_passe.substring(4);
        console.log("🔄 Conversion $2y$ → $2b$ pour admin");
      }
      
      console.log("🔐 Comparaison avec mot de passe admin hashé:", compatibleHash.substring(0, 10));
      isValid = await bcrypt.compare(mot_de_passe, compatibleHash);
    } else {
      // Mot de passe en clair - comparaison directe (ne devrait pas arriver)
      isValid = admin.mot_de_passe === mot_de_passe;
      console.log("🔐 Comparaison avec mot de passe admin en clair");
      
      // 🔒 HACHER LE MOT DE PASSE POUR LA PROCHAINE FOIS
      if (isValid) {
        const hashedPassword = await bcrypt.hash(mot_de_passe, 12);
        await db.query(
          "UPDATE signup SET mot_de_passe = ? WHERE id = ?",
          [hashedPassword, admin.id]
        );
        console.log("✅ Mot de passe admin hashé et mis à jour en base");
      }
    }

    if (!isValid) {
      console.log("❌ Mot de passe admin incorrect");
      
      // 🛡️ SUIVI DES TENTATIVES ÉCHOUÉES
      await db.query(
        `UPDATE signup SET tentatives_echec = COALESCE(tentatives_echec, 0) + 1 
         WHERE id = ?`,
        [admin.id]
      );

      const [updatedAdmin] = await db.query(
        "SELECT tentatives_echec FROM signup WHERE id = ?",
        [admin.id]
      );

      const tentatives = updatedAdmin[0].tentatives_echec || 0;

      if (tentatives >= 3) {
        await db.query(
          "UPDATE signup SET statut = 'suspendu' WHERE id = ?",
          [admin.id]
        );

        logger.warning(`Compte admin ${email} suspendu après 3 échecs`);

        return res.status(403).json({
          success: false,
          message: "Compte suspendu après 3 tentatives échouées. Contactez le super-admin."
        });
      }

      return res.status(401).json({
        success: false,
        message: `Identifiants incorrects. ${3 - tentatives} tentative(s) restante(s)`
      });
    }

    console.log("✅ Mot de passe admin correct");

    // 🛡️ RÉINITIALISATION TENTATIVES EN CAS DE SUCCÈS
    await db.query(
      "UPDATE signup SET tentatives_echec = 0, derniere_connexion = NOW() WHERE id = ?",
      [admin.id]
    );

    // 🛡️ GÉNÉRATION TOKEN JWT
    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        type_utilisateur: admin.type_utilisateur,
        type: "admin",
        permissions: ["full_access"]
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    // 🛡️ JOURNALISATION CONNEXION
    await db.query(
      `INSERT INTO login (user_id, email, adresse_ip, user_agent, statut) 
       VALUES (?, ?, ?, ?, 'réussi')`,
      [admin.id, admin.email, req.ip, req.get('User-Agent')]
    );

    logger.success(`Login ADMIN réussi → ${admin.email}`);

    res.json({
      success: true,
      message: "Connexion administrateur réussie",
      token,
      user: {
        id: admin.id,
        nom: admin.nom,
        prenom: admin.prenom,
        email: admin.email,
        type_utilisateur: admin.type_utilisateur
      }
    });

  } catch (error) {
    console.error("❌ ERREUR ADMIN LOGIN COMPLÈTE:", error);
    logger.error("Erreur adminLogin: " + error.message);
    
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la connexion administrateur"
    });
  }
};

/* ============================================================
   🔐 DÉCONNEXION ADMIN
============================================================ */
exports.adminLogout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      // 🛡️ INVALIDATION DU TOKEN (optionnel - selon stratégie)
      await db.query(
        "INSERT INTO revoked_tokens (token, revoked_at, expires_at) VALUES (?, NOW(), DATE_ADD(NOW(), INTERVAL 8 HOUR))",
        [token]
      );
    }

    logger.info(`Admin ${req.user.email} déconnecté`);

    res.json({
      success: true,
      message: "Déconnexion administrateur réussie"
    });

  } catch (error) {
    logger.error("Erreur adminLogout: " + error.message);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la déconnexion"
    });
  }
};

/* ============================================================
   🔐 DEMANDE RÉINITIALISATION MOT DE PASSE ADMIN
============================================================ */
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email requis"
      });
    }

    // 🛡️ VÉRIFICATION QUE C'EST BIEN UN COMPTE ADMIN
    const [admins] = await db.query(
      "SELECT id, nom, prenom, email FROM signup WHERE email = ? AND type_utilisateur = 'admin'",
      [email]
    );

    if (admins.length === 0) {
      // 🛡️ MESSAGE GÉNÉRIQUE POUR ÉVITER L'ENUMERATION
      return res.json({
        success: true,
        message: "Si un compte administrateur existe avec cet email, un lien de réinitialisation a été envoyé"
      });
    }

    const admin = admins[0];

    // 🛡️ VÉRIFICATION DES TENTATIVES RÉCENTES (max 3/h)
    const [recentAttempts] = await db.query(
      `SELECT COUNT(*) as count FROM user_tokens 
       WHERE user_id = ? AND type = 'password_reset' 
       AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
      [admin.id]
    );

    if (recentAttempts[0].count >= 3) {
      return res.status(429).json({
        success: false,
        message: "Trop de demandes de réinitialisation. Veuillez réessayer dans 1 heure."
      });
    }

    // 🛡️ GÉNÉRATION TOKEN SÉCURISÉ
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 heure

    // 🛡️ SUPPRESSION DES ANCIENS TOKENS
    await db.query(
      "DELETE FROM user_tokens WHERE user_id = ? AND type = 'password_reset'",
      [admin.id]
    );

    // 🛡️ SAUVEGARDE DU NOUVEAU TOKEN
    await db.query(
      "INSERT INTO user_tokens (user_id, token, type, expire_at) VALUES (?, ?, 'password_reset', ?)",
      [admin.id, tokenHash, expiresAt]
    );

    // 🛡️ ENVOI EMAIL
    const resetLink = `${process.env.ADMIN_FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    await sendEmail({
      to: admin.email,
      subject: "Réinitialisation de votre mot de passe administrateur",
      template: 'password_reset_admin',
      data: {
        prenom: admin.prenom,
        nom: admin.nom,
        reset_link: resetLink,
        expires_in: "1 heure"
      }
    });

    logger.info(`Demande réinitialisation MDP admin envoyée à ${admin.email}`);

    res.json({
      success: true,
      message: "Un lien de réinitialisation a été envoyé à votre email administrateur"
    });

  } catch (error) {
    logger.error("Erreur requestPasswordReset admin: " + error.message);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la demande de réinitialisation"
    });
  }
};

/* ============================================================
   🔐 RÉINITIALISATION MOT DE PASSE ADMIN
============================================================ */
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token et nouveau mot de passe requis"
      });
    }

    // 🛡️ VALIDATION FORCE MOT DE PASSE
    if (!validatePasswordStrength(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial"
      });
    }

    // 🛡️ HACHAGE DU TOKEN POUR COMPARAISON
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // 🛡️ VÉRIFICATION TOKEN
    const [tokens] = await db.query(
      `SELECT ut.*, s.id as user_id, s.email, s.type_utilisateur 
       FROM user_tokens ut 
       JOIN signup s ON ut.user_id = s.id 
       WHERE ut.token = ? AND ut.type = 'password_reset' AND ut.used = 0 AND ut.expire_at > NOW()`,
      [tokenHash]
    );

    if (tokens.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Token invalide ou expiré"
      });
    }

    const tokenData = tokens[0];

    // 🛡️ VÉRIFICATION QUE C'EST BIEN UN ADMIN
    if (tokenData.type_utilisateur !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Action non autorisée"
      });
    }

    // 🛡️ HACHAGE NOUVEAU MOT DE PASSE
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // 🛡️ MISE À JOUR MOT DE PASSE
    await db.query(
      "UPDATE signup SET mot_de_passe = ?, tentatives_echec = 0 WHERE id = ?",
      [hashedPassword, tokenData.user_id]
    );

    // 🛡️ MARQUAGE TOKEN COMME UTILISÉ
    await db.query(
      "UPDATE user_tokens SET used = 1, used_at = NOW() WHERE id = ?",
      [tokenData.id]
    );

    // 🛡️ JOURNALISATION
    logger.success(`Mot de passe admin réinitialisé pour ${tokenData.email}`);

    res.json({
      success: true,
      message: "Mot de passe administrateur réinitialisé avec succès"
    });

  } catch (error) {
    logger.error("Erreur resetPassword admin: " + error.message);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la réinitialisation du mot de passe"
    });
  }
};

/* ============================================================
   🔐 ENVOI RÉINITIALISATION MDP UTILISATEUR PAR ADMIN
============================================================ */
exports.sendUserPasswordReset = async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "ID utilisateur requis"
      });
    }

    // 🛡️ VÉRIFICATION UTILISATEUR
    const [users] = await db.query(
      "SELECT id, nom, prenom, email, type_utilisateur FROM signup WHERE id = ?",
      [user_id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }

    const user = users[0];

    // 🛡️ EMPÊCHER LA RÉINITIALISATION D'UN ADMIN PAR UN AUTRE ADMIN (sauf super-admin)
    if (user.type_utilisateur === 'admin' && req.user.id !== user.id) {
      // Vérifier si l'admin actuel est super-admin
      const [currentAdmin] = await db.query(
        "SELECT role FROM admin_roles WHERE user_id = ?",
        [req.user.id]
      );

      if (!currentAdmin.length || currentAdmin[0].role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: "Seul un super-admin peut réinitialiser le mot de passe d'un autre administrateur"
        });
      }
    }

    // 🛡️ GÉNÉRATION TOKEN
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 heure

    // 🛡️ SUPPRESSION ANCIENS TOKENS
    await db.query(
      "DELETE FROM user_tokens WHERE user_id = ? AND type = 'password_reset'",
      [user.id]
    );

    // 🛡️ SAUVEGARDE NOUVEAU TOKEN
    await db.query(
      "INSERT INTO user_tokens (user_id, token, type, expire_at) VALUES (?, ?, 'password_reset', ?)",
      [user.id, tokenHash, expiresAt]
    );

    // 🛡️ ENVOI EMAIL
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    await sendEmail({
      to: user.email,
      subject: "Réinitialisation de votre mot de passe",
      template: 'password_reset_user',
      data: {
        prenom: user.prenom,
        nom: user.nom,
        reset_link: resetLink,
        expires_in: "1 heure",
        initiated_by: `${req.user.prenom} ${req.user.nom} (Administrateur)`
      }
    });

    // 🛡️ JOURNALISATION ACTION ADMIN
    await db.query(
      `INSERT INTO logs_actions (user_id, role, action, target_type, target_id, ip_address, details) 
       VALUES (?, 'admin', 'SEND_PASSWORD_RESET', 'User', ?, ?, ?)`,
      [req.user.id, user.id, req.ip, JSON.stringify({
        user_email: user.email,
        admin_email: req.user.email
      })]
    );

    logger.info(`Admin ${req.user.email} a envoyé une réinitialisation MDP à ${user.email}`);

    res.json({
      success: true,
      message: `Lien de réinitialisation envoyé à ${user.email}`
    });

  } catch (error) {
    logger.error("Erreur sendUserPasswordReset: " + error.message);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'envoi de la réinitialisation"
    });
  }
};

/* ============================================================
   🛡️ FONCTION DE VALIDATION MOT DE PASSE RENFORCÉE
============================================================ */
const validatePasswordStrength = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
};