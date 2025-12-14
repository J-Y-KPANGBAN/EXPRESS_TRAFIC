// frontend/src/api/userService.js - VERSION CORRIGÉE

import { secureApiService } from './apiService';

// 🔒 VALIDATION EMAIL
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 🔒 VALIDATION DES DONNÉES UTILISATEUR
const validateUserData = (data, isLogin = false) => {
  const sanitized = { ...data };
  
  // Validation email
  if (sanitized.email && !isValidEmail(sanitized.email)) {
    throw new Error('Email invalide');
  }
  
  // Validation mot de passe (pour signup uniquement)
  if (!isLogin && sanitized.mot_de_passe) {
    if (sanitized.mot_de_passe.length < 8) {
      throw new Error('Le mot de passe doit contenir au moins 8 caractères');
    }
  }
  
  // Sanitization des noms
  if (sanitized.nom) {
    sanitized.nom = sanitized.nom.replace(/[<>]/g, '').substring(0, 50);
  }
  
  if (sanitized.prenom) {
    sanitized.prenom = sanitized.prenom.replace(/[<>]/g, '').substring(0, 50);
  }
  
  // Ne jamais logger les mots de passe (mais NE PAS les supprimer)
  if (sanitized.mot_de_passe || sanitized.password) {
    console.log('🔒 Mot de passe fourni - non loggé');
    // 👉 On NE touche PAS aux champs, on ne fait que logguer
  }
  
  return sanitized;
};

export const userService = {
  // 🔐 AUTHENTIFICATION CLIENT SÉCURISÉE
  signup: (data) => {
    console.log("📤 Service signup appelé avec:", { 
      email: data.email, 
      nom: data.nom,
      prenom: data.prenom 
    });
    const sanitizedData = validateUserData(data);
    return secureApiService.post("/auth/signup", sanitizedData);
  },

  login: (data) => {
    console.log("📤 Service login appelé avec:", { 
      email: data.email,
      mot_de_passe_present: !!data.mot_de_passe 
    });
    const sanitizedData = validateUserData(data, true);
    // 🔥 On envoie bien email + mot_de_passe
    return secureApiService.post("/auth/login", sanitizedData);
  },

  // 👤 PROFIL UTILISATEUR
  getProfile: () => {
    console.log("📤 Service getProfile appelé");
    return secureApiService.get("/users/profile");
  },

  updateProfile: (data) => {
    console.log("📤 Service updateProfile appelé avec:", data);
    const sanitizedData = validateUserData(data);
    return secureApiService.put("/users/profile", sanitizedData);
  },

  // 🎫 RÉSERVATIONS CLIENT
  getMyReservations: () => {
    console.log("📤 Service getMyReservations appelé");
    return secureApiService.get("/reservations/mes-reservations");
  },

  reserverTrajet: (trajetId, data) => {
    console.log("📤 Service reserverTrajet appelé pour trajet:", trajetId);
    const sanitizedData = validateUserData(data);
    return secureApiService.post("/reservations", { 
      trajet_id: trajetId, 
      ...sanitizedData 
    });
  },

  cancelReservation: (id, reason = "") => {
    console.log("📤 Service cancelReservation appelé pour réservation:", id);
    const sanitizedReason = reason.replace(/[<>]/g, '').substring(0, 200);
    return secureApiService.post(`/reservations/${id}/cancel`, { 
      reason: sanitizedReason 
    });
  },

  // ⭐ AVIS CLIENT
  createAvis: (data) => {
    console.log("📤 Service createAvis appelé");
    const sanitizedData = { ...data };
    
    if (sanitizedData.commentaire) {
      sanitizedData.commentaire = sanitizedData.commentaire
        .replace(/[<>]/g, '')
        .substring(0, 500);
    }
    
    return secureApiService.post("/avis", sanitizedData);
  },

  getMyAvis: () => {
    console.log("📤 Service getMyAvis appelé");
    return secureApiService.get("/avis/mes-avis");
  },

  // 🔄 MOT DE PASSE
  updatePassword: (currentPassword, newPassword) => {
    console.log("📤 Service updatePassword appelé");
    
    if (!currentPassword || !newPassword) {
      throw new Error('Les mots de passe sont requis');
    }
    
    if (newPassword.length < 8) {
      throw new Error('Le nouveau mot de passe doit contenir au moins 8 caractères');
    }
    
    console.log('🔒 Mise à jour mot de passe - données sécurisées');
    return secureApiService.put("/users/password", {
      currentPassword,
      newPassword
    });
  },

  // 📧 RÉINITIALISATION MOT DE PASSE
  requestPasswordReset: (email) => {
    console.log("📤 Service requestPasswordReset appelé pour:", email);
    
    if (!isValidEmail(email)) {
      throw new Error('Email invalide');
    }
    
    return secureApiService.post("/auth/forgot-password", { email });
  },

  confirmPasswordReset: (token, newPassword) => {
    console.log("📤 Service confirmPasswordReset appelé");
    
    if (!token || !newPassword) {
      throw new Error('Token et nouveau mot de passe requis');
    }
    
    if (newPassword.length < 8) {
      throw new Error('Le nouveau mot de passe doit contenir au moins 8 caractères');
    }
    
    return secureApiService.post("/auth/reset-password", {
      token,
      newPassword
    });
  },

  // 🆕 VÉRIFICATION TOKEN
  verifyToken: () => {
    console.log("📤 Service verifyToken appelé");
    return secureApiService.get("/auth/verify");
  }
};

export default userService;
