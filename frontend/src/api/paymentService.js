// frontend/api/paymentService.js - CORRECTION COMPLÈTE
import { secureApiService } from './apiService';

// 🔒 VALIDATION DES DONNÉES DE PAIEMENT
const validatePaymentData = (data) => {
  const required = ['reservationId', 'paymentMethod'];
  const missing = required.filter(field => !data[field]);
  
  if (missing.length > 0) {
    throw new Error(`Champs manquants: ${missing.join(', ')}`);
  }
  
  const sanitized = { ...data };
  
  // Ne jamais logger les données sensibles
  if (sanitized.cardDetails) {
    console.log('🔒 Données carte cryptées - non loggées');
    delete sanitized.cardDetails;
  }
  
  if (sanitized.cvv) {
    console.log('🔒 CVV fourni - non loggé');
    delete sanitized.cvv;
  }
  
  return sanitized;
};

// 🔒 VALIDATION DES IDS DE PAIEMENT
const validatePaymentId = (paymentId) => {
  if (!paymentId || typeof paymentId !== 'string' || paymentId.length > 50) {
    throw new Error('ID de paiement invalide');
  }
  return paymentId;
};

export const paymentService = {
  // ============================================
  // 💳 MÉTHODES DE PAIEMENT DISPONIBLES
  // ============================================
  getPaymentMethods: () => 
    secureApiService.get('/paiements/moyens', {}, { 
      cacheTimeout: 60000 
    }),

  // ============================================
  // 🔐 INITIALISATION PAIEMENT (PRINCIPALE)
  // ============================================
  initiatePayment: (reservationId, method, amount = null) => {
    const sanitizedData = {
      reservationId: String(reservationId),
      moyenPaiement: method,
      montant: amount
    };
    
    console.log(`💰 Initiation paiement - Reservation: ${reservationId}, Méthode: ${method}`);
    
    return secureApiService.post('/paiements/initiate', sanitizedData, {
      timeout: 30000
    });
  },

  // ============================================
  // 📊 OBTENIR STATUT/DÉTAILS D'UN PAIEMENT
  // ============================================
  getPaymentStatus: (paymentId) => {
    const validPaymentId = validatePaymentId(paymentId);
    return secureApiService.get(`/paiements/${validPaymentId}/status`, {}, { 
      useCache: false 
    });
  },

  // ALIAS pour compatibilité avec PaiementPage.js
  getPaymentDetails: (paymentId) => {
    console.log(`🔍 Récupération détails paiement: ${paymentId}`);
    return paymentService.getPaymentStatus(paymentId);
  },

  // ============================================
  // 💳 STRIPE CHECKOUT - CORRECTION ICI !!!
  // ============================================
  createStripeCheckout: (paymentId, options = {}) => {
    const validPaymentId = validatePaymentId(paymentId);
    
    const defaultOptions = {
      successPath: `/paiement/success/${validPaymentId}`,
      cancelPath: `/paiement/${validPaymentId}`
    };
    
    console.log(`💳 Création session Stripe pour paiement: ${validPaymentId}`, options);
    
    // CORRECTION : URL CORRECTE
    return secureApiService.post(`/paiements/${validPaymentId}/stripe/checkout`, {
      ...defaultOptions,
      ...options
    });
  },

  // ============================================
  // ✅ CONFIRMATION PAIEMENT (Stripe callback)
  // ============================================
  confirmPayment: (paymentId, sessionId) => {
    const validPaymentId = validatePaymentId(paymentId);
    
    return secureApiService.post(`/paiements/${validPaymentId}/confirm`, {
      sessionId: sessionId
    });
  },

  // ============================================
  // 📧 ENVOI BILLET PAR EMAIL
  // ============================================
  sendTicketByEmail: (paymentId) => {
    const validPaymentId = validatePaymentId(paymentId);
    return secureApiService.post(`/paiements/${validPaymentId}/send-email`);
  },

  // ============================================
  // 📱 ENVOI BILLET PAR SMS
  // ============================================
  sendTicketBySms: (paymentId) => {
    const validPaymentId = validatePaymentId(paymentId);
    return secureApiService.post(`/paiements/${validPaymentId}/send-sms`);
  },

  // ============================================
  // 🧾 GÉNÉRATION BILLET
  // ============================================
  generateTicket: (paymentId) => {
    const validPaymentId = validatePaymentId(paymentId);
    return secureApiService.post(`/paiements/${validPaymentId}/generate-ticket`);
  },

  // ============================================
  // 📄 TÉLÉCHARGEMENT BILLET
  // ============================================
  downloadTicket: (paymentId) => {
    const validPaymentId = validatePaymentId(paymentId);
    return secureApiService.get(`/paiements/${validPaymentId}/ticket`, {}, {
      responseType: 'blob',
      useCache: false
    });
  },

  // ============================================
  // ❌ ANNULATION PAIEMENT
  // ============================================
  cancelPayment: (paymentId) => {
    const validPaymentId = validatePaymentId(paymentId);
    return secureApiService.post(`/paiements/${validPaymentId}/cancel`);
  },

  // ============================================
  // 💰 CALCUL DES FRAIS
  // ============================================
  calculateFees: (montant, method) => {
    if (!montant || montant <= 0) {
      throw new Error('Montant invalide');
    }
    return secureApiService.post('/paiements/calculate-fees', { 
      montant: parseFloat(montant), 
      method 
    });
  },

  // ============================================
  // 🔄 PAIEMENT PANIER (multiple réservations)
  // ============================================
  initiateCartPayment: (reservationIds, paymentMethod) => {
    if (!Array.isArray(reservationIds) || reservationIds.length === 0) {
      throw new Error('Liste de réservations invalide');
    }
    
    return secureApiService.post('/paiements/cart/initiate', {
      reservationIds: reservationIds.map(id => String(id)),
      paymentMethod: paymentMethod
    });
  },

  // ============================================
  // 📊 HISTORIQUE DES PAIEMENTS UTILISATEUR
  // ============================================
  getUserPayments: () => {
    return secureApiService.get('/paiements/history', {}, {
      cacheTimeout: 30000
    });
  },

  // ============================================
  // 🧾 TÉLÉCHARGEMENT FACTURE
  // ============================================
  downloadInvoice: (paymentId) => {
    const validPaymentId = validatePaymentId(paymentId);
    return secureApiService.get(`/paiements/${validPaymentId}/invoice`, {}, {
      responseType: 'blob',
      useCache: false
    });
  },

  // ============================================
  // 🎯 UTILITAIRES POUR URLS
  // ============================================
  getSuccessUrl: (paymentId) => {
    return `/paiement/success/${paymentId}`;
  },

  getCancelUrl: (paymentId) => {
    return `/paiement/${paymentId}`;
  },

  // ============================================
  // 🔒 FONCTIONS DE SÉCURITÉ (compatibilité)
  // ============================================
  initPayment: (data) => {
    const sanitizedData = validatePaymentData(data);
    return secureApiService.post('/paiements/init', sanitizedData);
  },

  checkPaymentStatus: (paymentId) => {
    return paymentService.getPaymentStatus(paymentId);
  },

  verifyPayment: (paymentId, data) => {
    return paymentService.confirmPayment(paymentId, data?.sessionId);
  }
};

// Export par défaut pour compatibilité
export default paymentService;