import { secureApiService } from './apiService';

// 🔒 VALIDATION DES CREDENTIALS ADMIN - VERSION CORRIGÉE
const validateAdminCredentials = (credentials) => {
  if (!credentials || typeof credentials !== 'object') {
    throw new Error('Données de connexion invalides');
  }
  
  // Validation plus flexible pour le développement
  if (!credentials.email || !credentials.mot_de_passe) {
    throw new Error('Email et mot de passe requis');
  }
  
  // Code admin requis en production, optionnel en développement pour le debug
  if (process.env.NODE_ENV === 'production' && !credentials.code_admin) {
    throw new Error('Code admin requis');
  }
  
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
    throw new Error('Format d\'email invalide');
  }
  
  // Ne pas logger les données sensibles
  const sanitized = { ...credentials };
  console.log('🔒 Connexion admin - Email:', credentials.email);
  
  return sanitized;
};

// 🔒 VALIDATION EMAIL
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 🔒 VALIDATION ID
const validateId = (id, entityName = '') => {
  if (!id || typeof id !== 'string') {
    throw new Error(`ID ${entityName} invalide`);
  }
  return id;
};

export const adminService = {
  // 🔐 AUTHENTIFICATION ADMIN SÉCURISÉE - CORRIGÉE
  login: (credentials) => {
    console.log("🛡️ [ADMIN] Tentative connexion admin sécurisée");
    const sanitizedCredentials = validateAdminCredentials(credentials);
    return secureApiService.post("/admin/auth/login", sanitizedCredentials);
  },

  // 🔐 DÉCONNEXION ADMIN
  logout: () => {
    return secureApiService.post("/admin/auth/logout");
  },

  signup: (adminData) => {
    console.log("🛡️ [ADMIN] Création compte admin sécurisée");
    const sanitizedData = validateAdminCredentials(adminData);
    return secureApiService.post("/admin/auth/signup", sanitizedData);
  },

  // 📊 DASHBOARD ADMIN
  getDashboardStats: () => 
    secureApiService.get('/admin/dashboard/stats', {}, { 
      useCache: true, 
      cacheTimeout: 60000 
    }),

  // 👤 PROFIL ADMIN
  getAdminProfile: () => 
    secureApiService.get('/admin/profile', {}, { 
      useCache: false 
    }),

  updateAdminProfile: (data) => 
    secureApiService.put('/admin/profile', data),

  // 👥 GESTION UTILISATEURS SÉCURISÉE
  getUsers: (filters = {}) => 
    secureApiService.get('/admin/users', { params: filters }, { 
      useCache: true, 
      cacheTimeout: 30000 
    }),

  searchUsers: (query, filters = {}) => {
    const sanitizedQuery = query.replace(/[<>]/g, '').substring(0, 100);
    return secureApiService.get('/admin/users/search', { 
      params: { q: sanitizedQuery, ...filters } 
    }, { 
      useCache: false 
    });
  },

  getUserById: (id) => {
    const validId = validateId(id, 'utilisateur');
    return secureApiService.get(`/admin/users/${validId}`, {}, { 
      useCache: false 
    });
  },

  updateUserStatus: (id, statut) => {
    const validId = validateId(id, 'utilisateur');
    const allowedStatus = ['actif', 'inactif', 'suspendu'];
    
    if (!allowedStatus.includes(statut)) {
      throw new Error('Statut utilisateur invalide');
    }
    
    return secureApiService.put(`/admin/users/${validId}/statut`, { statut });
  },

  deleteUser: (id) => {
    const validId = validateId(id, 'utilisateur');
    return secureApiService.delete(`/admin/users/${validId}`);
  },

  // 🚌 GESTION TRAJETS SÉCURISÉE
  getTrajets: (filters = {}) => 
    secureApiService.get('/admin/trajets', { params: filters }, { 
      useCache: true, 
      cacheTimeout: 30000 
    }),

  createTrajet: (data) => 
    secureApiService.post('/admin/trajets', data),

  updateTrajet: (id, data) => {
    const validId = validateId(id, 'trajet');
    return secureApiService.put(`/admin/trajets/${validId}`, data);
  },

  deleteTrajet: (id) => {
    const validId = validateId(id, 'trajet');
    return secureApiService.delete(`/admin/trajets/${validId}`);
  },

  // 🎫 GESTION RÉSERVATIONS SÉCURISÉE
  getReservations: (filters = {}) => 
    secureApiService.get('/admin/reservations', { params: filters }, { 
      useCache: true, 
      cacheTimeout: 15000 
    }),

  updateReservationStatus: (id, status) => {
    const validId = validateId(id, 'réservation');
    const allowedStatus = ['confirmée', 'en_attente', 'annulée', 'terminée'];
    
    if (!allowedStatus.includes(status)) {
      throw new Error('Statut réservation invalide');
    }
    
    return secureApiService.put(`/admin/reservations/${validId}/status`, { status });
  },

  // 🚍 GESTION BUS
  getBus: () => 
    secureApiService.get('/admin/bus', {}, { 
      useCache: true, 
      cacheTimeout: 60000 
    }),

  // ⭐ GESTION AVIS
  getAvis: (filters = {}) => 
    secureApiService.get('/admin/avis', { params: filters }, { 
      useCache: true, 
      cacheTimeout: 30000 
    }),

  // 📧 GESTION CONTACTS SÉCURISÉE
  getContacts: () => 
    secureApiService.get('/admin/contacts', {}, { 
      useCache: true, 
      cacheTimeout: 30000 
    }),

  updateContactStatus: (id, statut) => {
    const validId = validateId(id, 'contact');
    const allowedStatus = ['nouveau', 'lu', 'en_cours', 'resolu'];
    
    if (!allowedStatus.includes(statut)) {
      throw new Error('Statut contact invalide');
    }
    
    return secureApiService.put(`/admin/contacts/${validId}/statut`, { statut });
  },

  // ⚙️ PARAMÈTRES SYSTÈME
  getSystemSettings: () => 
    secureApiService.get('/admin/system/settings', {}, { 
      useCache: false 
    }),

  updateSystemSettings: (data) => 
    secureApiService.put('/admin/system/settings', data),

  getSystemLogs: (filters = {}) => 
    secureApiService.get('/admin/system/logs', { params: filters }, { 
      useCache: false 
    }),

  triggerMaintenance: (data) => 
    secureApiService.post('/admin/system/maintenance', data),

  createBackup: () => 
    secureApiService.post('/admin/system/backup'),

  getSystemHealth: () => 
    secureApiService.get('/admin/system/health', {}, { 
      useCache: false 
    }),

  // 🏢 GESTION SOCIÉTÉS
  getSocietes: () => 
    secureApiService.get('/admin/societes', {}, { 
      useCache: true, 
      cacheTimeout: 60000 
    }),

  createSociete: (data) => 
    secureApiService.post('/admin/societes', data),

  // 🚗 GESTION CHAUFFEURS
  getChauffeurs: () => 
    secureApiService.get('/admin/chauffeurs', {}, { 
      useCache: true, 
      cacheTimeout: 60000 
    }),

  createChauffeur: (data) => 
    secureApiService.post('/admin/chauffeurs', data),

  // 💰 RAPPORTS FINANCIERS
  getFinancialReports: (filters = {}) => 
    secureApiService.get('/admin/reports/financial', { params: filters }, { 
      useCache: false 
    })
};