import { secureApiService } from './apiService';

// 🔒 VALIDATION DES PARAMÈTRES DE RECHERCHE
const validateSearchParams = (filters) => {
  const allowedParams = [
    'depart', 'destination', 'date', 'passengers',
    'heure', 'classe', 'compagnie', 'ville_depart',
    'ville_arrivee', 'date_depart', 'date_arrivee',
    'arret_depart', 'arret_arrivee', 'page', 'limit'
  ];
  
  const sanitized = {};
  
  allowedParams.forEach(param => {
    if (filters[param] !== undefined && filters[param] !== null && filters[param] !== '') {
      // Sanitization basique
      if (typeof filters[param] === 'string') {
        sanitized[param] = filters[param]
          .replace(/[<>]/g, '') // Éviter l'injection HTML
          .substring(0, 100);   // Limiter la longueur
      } else {
        sanitized[param] = filters[param];
      }
    }
  });
  
  return sanitized;
};

// 🔒 VALIDATION ID TRAJET
const validateTrajetId = (id) => {
  if (!id || typeof id !== 'string') {
    throw new Error('ID de trajet invalide');
  }
  
  // Validation basique du format (TR + caractères alphanumériques)
  if (!/^TR[A-Z0-9]+$/.test(id)) {
    throw new Error('Format ID de trajet invalide');
  }
  
  return id;
};

// 🔒 VALIDATION DATE
const isValidDate = (dateString) => {
  if (!dateString) return false;
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

export const trajetService = {
  // ======================================================
  // 🚌 TRAJETS PUBLICS - ROUTES CORRIGÉES (SANS /public)
  // ======================================================
  
  // 🔍 RECHERCHE AVEC CACHE INTELLIGENT ET SÉCURISÉE
  searchTrajets: (filters = {}) => {
    const sanitizedFilters = validateSearchParams(filters);
    return secureApiService.get('/trajets', 
      { params: sanitizedFilters }, 
      { useCache: true, cacheTimeout: 30000 }
    );
  },

  // 📋 LISTE AVEC OPTIONS
  getTrajets: (filters = {}, options = {}) => {
    const sanitizedFilters = validateSearchParams(filters);
    return secureApiService.get('/trajets', { 
      params: sanitizedFilters 
    }, {
      useCache: options.forceRefresh ? false : true,
      cacheTimeout: options.cacheTimeout || 30000
    });
  },

  // 👀 DÉTAILS AVEC CACHE LONG
  getTrajetById: (id) => {
    const validId = validateTrajetId(id);
    return secureApiService.get(`/trajets/${validId}`, {}, { 
      cacheTimeout: 60000 
    });
  },

  // 🗺️ DESTINATIONS POPULAIRES - CACHE TRÈS LONG
  getPopularDestinations: () => 
    secureApiService.get('/destinations/popular-trips', {}, { 
      cacheTimeout: 3600000 
    }),

  // 📅 DISPONIBILITÉS - PAS DE CACHE
  checkDisponibilite: (trajetId, date) => {
    const validTrajetId = validateTrajetId(trajetId);
    
    if (!isValidDate(date)) {
      throw new Error('Date invalide');
    }
    
    return secureApiService.get(`/trajets/${validTrajetId}/disponibilite`, 
      { params: { date } }, 
      { useCache: false }
    );
  },

  // 🎫 SIÈGES DISPONIBLES - PAS DE CACHE
  getSiegesDisponibles: (trajetId) => {
    const validTrajetId = validateTrajetId(trajetId);
    
    return secureApiService.get(`/trajets/${validTrajetId}/sieges`, 
      {}, 
      { useCache: false }
    );
  },

  // ======================================================
  // ⭐ FONCTIONNALITÉS SPÉCIFIQUES - ROUTES CORRIGÉES
  // ======================================================

  // ⭐ TRAJETS POPULAIRES - ROUTE CORRECTE (SANS /public)
  getPopularTrajets: () => 
    secureApiService.get('/trajets/popular', {}, { 
      cacheTimeout: 300000,
      useCache: true
    }),

  // 🔍 RECHERCHE AVANCÉE
  searchTrajetsAvances: (filters) => {
    const sanitizedFilters = validateSearchParams(filters);
    const params = new URLSearchParams();
    
    Object.entries(sanitizedFilters).forEach(([key, value]) => {
      if (value !== '' && value != null) params.append(key, value);
    });
    
    return secureApiService.get(`/trajets/search/avance?${params}`, {}, { 
      useCache: false 
    });
  },

  // 🏙️ OBTENIR LA LISTE DES VILLES - ROUTE CORRECTE (SANS /public)
  getVilles: () => 
    secureApiService.get('/trajets/villes', {}, { 
      cacheTimeout: 3600000,
      useCache: true
    }),

  // 🔍 RECHERCHE AVEC ARRÊTS
  searchTrajetsAvecArrets: (filters) => {
    const sanitizedFilters = validateSearchParams(filters);
    const params = new URLSearchParams(sanitizedFilters);
    
    return secureApiService.get(`/trajets/search/avance?${params}`, {}, { 
      useCache: false,
      cacheTimeout: 0
    });
  },

  // ✅ RECHERCHE UNIFIÉE INTELLIGENTE
  searchTrajetsIntelligente: (filters) => {
    const sanitizedFilters = validateSearchParams(filters);
    
    // Détecter le type de recherche
    const hasArretSearch = sanitizedFilters.arret_depart || sanitizedFilters.arret_arrivee;
    
    if (hasArretSearch) {
      return trajetService.searchTrajetsAvecArrets(sanitizedFilters);
    } else {
      return trajetService.getTrajets(sanitizedFilters);
    }
  },

  // 📊 STATISTIQUES TRAJETS (Admin)
  getTrajetsStats: (periode = '30') => {
    if (!['7', '30', '90', '365'].includes(periode)) {
      throw new Error('Période invalide. Valeurs acceptées: 7, 30, 90, 365');
    }
    
    return secureApiService.get(`/admin/trajets/stats?periode=${periode}`, {}, {
      useCache: false
    });
  },

  // 🔄 FORCER LE RAFRAÎCHISSEMENT DU CACHE
  refreshCache: () => {
    secureApiService.invalidateRelatedCache('/trajets');
    console.log("🔄 Cache des trajets rafraîchi");
  }
};

// ✅ Gestion des erreurs globales pour le service
const createServiceWithErrorHandling = (service) => {
  const wrappedService = {};
  
  Object.keys(service).forEach(key => {
    wrappedService[key] = async (...args) => {
      try {
        return await service[key](...args);
      } catch (error) {
        console.error(`❌ Erreur trajetService.${key}:`, error);
        
        // Gestion spécifique des erreurs réseau
        if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
          throw new Error('Problème de connexion réseau. Vérifiez votre connexion internet.');
        }
        
        // Gestion des erreurs 404 - Routes non trouvées
        if (error.response?.status === 404) {
          console.warn(`⚠️ Route non trouvée: ${error.config?.url}`);
          
          // Fallback intelligent pour les routes populaires
          if (key === 'getPopularTrajets') {
            console.log('🔄 Fallback: utilisation des trajets récents');
            return await service.getTrajets({ limit: 6 });
          }
          
          if (key === 'getVilles') {
            console.log('🔄 Fallback: utilisation des villes par défaut');
            return {
              data: {
                success: true,
                data: ["Paris", "Lyon", "Marseille", "Toulouse", "Bordeaux", "Nantes", "Lille", "Strasbourg"]
              }
            };
          }
          
          throw new Error('Service temporairement indisponible');
        }
        
        // Gestion des erreurs 500
        if (error.response?.status === 500) {
          throw new Error('Erreur interne du serveur. Veuillez réessayer plus tard.');
        }
        
        throw error;
      }
    };
  });
  
  return wrappedService;
};

export default createServiceWithErrorHandling(trajetService);