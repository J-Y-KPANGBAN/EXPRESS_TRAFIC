import { secureApiService } from './apiService';

// 🔒 VALIDATION DES DONNÉES DE RÉSERVATION
const validateReservationData = (data) => {
  const sanitized = { ...data };
  
  // Validation email
  if (sanitized.email && !isValidEmail(sanitized.email)) {
    throw new Error('Email invalide');
  }
  
  // Validation téléphone
  if (sanitized.telephone) {
    sanitized.telephone = sanitized.telephone.replace(/[^\d+]/g, '');
    if (sanitized.telephone.length > 20) {
      throw new Error('Numéro de téléphone trop long');
    }
  }
  
  // Validation noms
  if (sanitized.nom) {
    sanitized.nom = sanitized.nom.replace(/[<>]/g, '').substring(0, 50);
  }
  
  if (sanitized.prenom) {
    sanitized.prenom = sanitized.prenom.replace(/[<>]/g, '').substring(0, 50);
  }
  
  return sanitized;
};

// 🔒 VALIDATION EMAIL
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 🔒 VALIDATION ID RÉSERVATION
const validateReservationId = (id) => {
  if (!id || typeof id !== 'string') {
    throw new Error('ID de réservation invalide');
  }
  return id;
};

// 🔒 VALIDATION ID TRAJET
const validateTrajetId = (id) => {
  if (!id || typeof id !== 'string') {
    throw new Error('ID de trajet invalide');
  }
  return id;
};

export const reservationService = {
  // 📋 RÉSERVATIONS UTILISATEUR
  getMyReservations: () => 
    secureApiService.get('/reservations/mes-reservations', {}, { 
      cacheTimeout: 30000 
    }),

  // 📜 HISTORIQUE RÉSERVATIONS
  getReservationHistory: () => 
    secureApiService.get('/reservations/historique', {}, { 
      cacheTimeout: 60000 
    }),

  // ➕ NOUVELLE RÉSERVATION SÉCURISÉE (Route générale)
  createReservation: (data) => {
    const sanitizedData = validateReservationData(data);
    return secureApiService.post('/reservations', sanitizedData);
  },

  // 👀 DÉTAILS RÉSERVATION
  getReservationById: (id) => {
    const validId = validateReservationId(id);
    return secureApiService.get(`/reservations/${validId}`, {}, { 
      useCache: false 
    });
  },

  // ❌ ANNULATION RÉSERVATION
  cancelReservation: (id, reason = "") => {
    const validId = validateReservationId(id);
    const sanitizedReason = reason.replace(/[<>]/g, '').substring(0, 200);
    return secureApiService.post(`/reservations/${validId}/cancel`, { 
      reason: sanitizedReason 
    });
  },

  // 🆕 CORRECTION : RÉSERVER UN TRAJET (route spécifique)
// frontend/src/api/reservationService.js
// MODIFIER LA FONCTION reserverTrajet :

reserverTrajet: (trajetId, data) => {
  const validTrajetId = validateTrajetId(trajetId);
  const sanitizedData = validateReservationData(data);
  
  console.log(`🎫 Création réservation via route spécifique: /trajets/${validTrajetId}/reserver`);
  
  // ✅ ENVOYER SEULEMENT LES DONNÉES NÉCESSAIRES (sans trajet_id en double)
  const reservationData = {
    ...sanitizedData,
    // N'inclure que les champs nécessaires
    siege_numero: sanitizedData.siege_numero,
    moyen_paiement: sanitizedData.moyen_paiement,
    arret_depart: sanitizedData.arret_depart,
    arret_arrivee: sanitizedData.arret_arrivee,
    prix_calcule: sanitizedData.prix_calcule || sanitizedData.prix_total
  };
  
  // ✅ RETIRER le trajet_id du body (il est déjà dans l'URL)
  delete reservationData.trajet_id;
  
  return secureApiService.post(`/trajets/${validTrajetId}/reserver`, reservationData, {
    timeout: 30000
  });
},

  // 📋 LISTE DES RÉSERVATIONS (pour l'admin ou autre)
  getReservations: (params = {}) => {
    return secureApiService.get('/reservations', { params }, {
      cacheTimeout: 30000
    });
  },

  getReservationDetails: (id) => {
    const validId = validateReservationId(id);
    return secureApiService.get(`/reservations/${validId}`, {}, { 
      cacheTimeout: 30000 
    });
  },

  // 📧 RENVOI BILLET
  resendTicket: (id) => {
    const validId = validateReservationId(id);
    return secureApiService.post(`/reservations/${validId}/resend-ticket`);
  },

  // 🎫 TÉLÉCHARGEMENT BILLET
  downloadTicket: (id) => {
    const validId = validateReservationId(id);
    return secureApiService.get(`/reservations/${validId}/ticket`, {}, { 
      useCache: false, 
      responseType: 'blob',
      timeout: 60000
    });
  },
  
  // 🔍 VÉRIFIER DISPONIBILITÉ D'UN SIÈGE
  checkSeatAvailability: (trajetId, seatNumber) => {
    const validTrajetId = validateTrajetId(trajetId);
    return secureApiService.get(`/trajets/${validTrajetId}/sieges/disponible`, {
      params: { siege: seatNumber }
    }, { 
      useCache: false,
      timeout: 10000 
    });
  },
  
  // 🔄 METTRE À JOUR UNE RÉSERVATION
  updateReservation: (reservationId, data) => {
    const validId = validateReservationId(reservationId);
    const sanitizedData = validateReservationData(data);
    return secureApiService.put(`/reservations/${validId}`, sanitizedData);
  }
};