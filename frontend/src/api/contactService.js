import { secureApiService } from './apiService';

// 🔒 VALIDATION ANTI-SPAM ET DONNÉES CONTACT
const validateContactData = (data) => {
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
  
  // Limiter la longueur du message
  if (sanitized.message && sanitized.message.length > 1000) {
    sanitized.message = sanitized.message.substring(0, 1000);
  }
  
  // Limiter la longueur du sujet
  if (sanitized.sujet && sanitized.sujet.length > 200) {
    sanitized.sujet = sanitized.sujet.substring(0, 200);
  }
  
  return sanitized;
};

// 🔒 VALIDATION EMAIL
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 🔒 VALIDATION ID MESSAGE
const validateMessageId = (id) => {
  if (!id || typeof id !== 'string') {
    throw new Error('ID de message invalide');
  }
  return id;
};

export const contactService = {
  // 📧 SOUMISSION FORMULAIRE CONTACT SÉCURISÉE
  submitContact: (data) => {
    const sanitizedData = validateContactData(data);
    return secureApiService.post('/contact', sanitizedData);
  },

  // 📋 MESSAGES UTILISATEUR (protégé)
  getMyMessages: () => 
    secureApiService.get('/contact/mes-messages', {}, { 
      useCache: true, 
      cacheTimeout: 30000 
    }),

  // 👀 DÉTAILS MESSAGE
  getMessageById: (id) => {
    const validId = validateMessageId(id);
    return secureApiService.get(`/contact/messages/${validId}`, {}, { 
      useCache: false 
    });
  },

  // 🏷️ MISE À JOUR STATUT MESSAGE
  updateMessageStatus: (id, statut) => {
    const validId = validateMessageId(id);
    
    // Validation du statut
    const allowedStatus = ['nouveau', 'lu', 'en_cours', 'resolu'];
    if (!allowedStatus.includes(statut)) {
      throw new Error('Statut de message invalide');
    }
    
    return secureApiService.put(`/contact/messages/${validId}/statut`, { statut });
  },

  // 🔍 RECHERCHER MESSAGES
  searchMessages: (query, filters = {}) => {
    const sanitizedQuery = query.replace(/[<>]/g, '').substring(0, 100);
    return secureApiService.get('/contact/messages/search', { 
      params: { q: sanitizedQuery, ...filters } 
    }, { 
      useCache: false 
    });
  }
};