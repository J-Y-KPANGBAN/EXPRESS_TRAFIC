const db = require("../../config/db");
const bcrypt = require("bcryptjs");
const logger = require("../../utils/logger");

// ========================
// 🔹 PROFIL UTILISATEUR - AVEC JOINTURE COUNTRIES
// ========================
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("🔍 GET PROFILE - User ID:", userId);
    console.log("👤 User object from auth:", req.user);

    // ✅ REQUÊTE OPTIMISÉE POUR VOTRE BD
    const [rows] = await db.query(
      `SELECT 
        s.id, s.nom, s.prenom, s.email, s.telephone, 
        s.ville, s.region, s.adresse_postale, s.code_postal, 
        s.country, s.date_naissance, s.numero_client, s.date_inscription,
        s.type_utilisateur, s.derniere_connexion,
        p.photo_url, p.bio, p.preferences,
        c.name as country_name
       FROM signup s
       LEFT JOIN profile p ON s.id = p.user_id
       LEFT JOIN countries c ON s.country = c.code
       WHERE s.id = ?`,
      [userId]
    );

    console.log("📊 Résultat requête profil:", rows.length, "lignes");
    
    if (rows.length === 0) {
      console.log("❌ AUCUN UTILISATEUR TROUVÉ pour ID:", userId);
      return res.status(404).json({ 
        success: false, 
        message: "Utilisateur introuvable" 
      });
    }

    const userData = rows[0];
    
    // ✅ STRUCTURE COMPATIBLE AVEC VOTRE FRONTEND
    const profileResponse = {
      id: userData.id,
      nom: userData.nom || "",
      prenom: userData.prenom || "",
      email: userData.email || "",
      telephone: userData.telephone || "",
      date_naissance: userData.date_naissance || "",
      adresse_postale: userData.adresse_postale || "",
      ville: userData.ville || "",
      code_postal: userData.code_postal || "",
      country: userData.country || "",
      country_name: userData.country_name || userData.country || "",
      region: userData.region || "",
      numero_client: userData.numero_client || "",
      date_inscription: userData.date_inscription || "",
      type_utilisateur: userData.type_utilisateur || "client",
      derniere_connexion: userData.derniere_connexion || "",
      photo_url: userData.photo_url || "",
      bio: userData.bio || ""
    };

    console.log("✅ Données profil envoyées:", {
      id: profileResponse.id,
      email: profileResponse.email,
      nom_complet: `${profileResponse.prenom} ${profileResponse.nom}`
    });

    res.json({ 
      success: true, 
      data: profileResponse
    });

  } catch (err) {
    console.error("❌ Erreur getProfile:", err);
    res.status(500).json({ 
      success: false, 
      message: "Erreur serveur lors du chargement du profil" 
    });
  }
};

// ========================
// 🔹 MISE À JOUR PROFIL - CORRIGÉE POUR VOTRE BD
// ========================
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      nom, prenom, telephone, ville, region, 
      adresse_postale, code_postal, country, date_naissance
    } = req.body;

    console.log("📥 Données reçues pour mise à jour:", req.body);

    // Formater la date pour MySQL
    let formattedDate = null;
    if (date_naissance) {
      if (date_naissance.includes('T')) {
        formattedDate = date_naissance.split('T')[0];
      } else {
        formattedDate = date_naissance;
      }
      console.log("📅 Date formatée pour MySQL:", formattedDate);
    }

    // ✅ METTRE À JOUR LA TABLE SIGNUP (votre table principale)
    await db.query(
      `UPDATE signup 
       SET nom=?, prenom=?, telephone=?, ville=?, region=?, 
           adresse_postale=?, code_postal=?, country=?, date_naissance=?
       WHERE id=?`,
      [
        nom, prenom, telephone, ville, region, 
        adresse_postale, code_postal, country, formattedDate, userId
      ]
    );

    console.log("✅ Profil mis à jour avec succès pour l'utilisateur:", userId);

    // ✅ RÉPONSE STANDARDISÉE
    res.json({ 
      success: true, 
      message: "Profil mis à jour avec succès",
      data: {
        id: userId,
        nom,
        prenom,
        telephone,
        ville,
        region,
        adresse_postale,
        code_postal,
        country,
        date_naissance: formattedDate
      }
    });

  } catch (err) {
    console.error("❌ Erreur updateProfile:", err);
    res.status(500).json({ 
      success: false, 
      message: "Erreur serveur lors de la mise à jour" 
    });
  }
};

// ... (les autres fonctions restent inchangées)
// ========================
// 🔹 MàJ mot de passe
// ========================
exports.updatePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Mot de passe actuel et nouveau mot de passe requis"
      });
    }

    // Récupérer l'utilisateur avec le mot de passe
    const [users] = await db.query(
      "SELECT mot_de_passe FROM signup WHERE id = ?",
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }

    const user = users[0];

    // Vérifier le mot de passe actuel
    const isValid = await bcrypt.compare(currentPassword, user.mot_de_passe);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Mot de passe actuel incorrect"
      });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Mettre à jour le mot de passe
    await db.query(
      "UPDATE signup SET mot_de_passe = ? WHERE id = ?",
      [hashedPassword, userId]
    );

    res.json({ 
      success: true, 
      message: "Mot de passe mis à jour avec succès" 
    });

  } catch (err) {
    console.error("❌ Erreur updatePassword:", err);
    res.status(500).json({ 
      success: false, 
      message: "Erreur serveur lors de la mise à jour du mot de passe" 
    });
  }
};

// ========================
// 🔹 MàJ photo
// ========================
exports.updatePhoto = async (req, res) => {
  try {
    const userId = req.user.id;
    const { photo_url } = req.body;

    if (!photo_url) {
      return res.status(400).json({
        success: false,
        message: "URL de la photo requise"
      });
    }

    await db.query(
      "UPDATE profile SET photo_url = ?, date_derniere_modif = NOW() WHERE user_id = ?",
      [photo_url, userId]
    );

    res.json({ 
      success: true, 
      message: "Photo de profil mise à jour avec succès" 
    });

  } catch (err) {
    console.error("❌ Erreur updatePhoto:", err);
    res.status(500).json({ 
      success: false, 
      message: "Erreur serveur lors de la mise à jour de la photo" 
    });
  }
};

// ========================
// 🔹 SUPPRESSION COMPTE
// ========================
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    await db.query("DELETE FROM signup WHERE id = ?", [userId]);

    res.json({ 
      success: true, 
      message: "Compte supprimé avec succès" 
    });

  } catch (err) {
    console.error("❌ Erreur deleteAccount:", err);
    res.status(500).json({ 
      success: false, 
      message: "Erreur serveur lors de la suppression du compte" 
    });
  }
};