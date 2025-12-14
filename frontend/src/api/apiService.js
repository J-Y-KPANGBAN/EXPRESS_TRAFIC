// frontend/src/api/apiService.js - VERSION SÉPARATION CLIENT / ADMIN
import axios from "axios";

// Configuration centralisée
const API_CONFIG = {
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  timeout: 15000,
  retryAttempts: 3,
  retryDelay: 1000
};

// Cache intelligent
class SmartCache {
  constructor() {
    this.cache = new Map();
  }

  set(key, data, timeoutMs = 30000) {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + timeoutMs,
    });
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  clearByPattern(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) this.cache.delete(key);
    }
  }

  clear() { 
    this.cache.clear(); 
  }

  getSize() {
    return this.cache.size;
  }
}

const smartCache = new SmartCache();

// 🔒 SÉCURITÉ
const getCSRFToken = () => {
  const cookieValue = document.cookie
    .split('; ')
    .find(row => row.startsWith('XSRF-TOKEN='))
    ?.split('=')[1];
  
  const metaTag = document.querySelector('meta[name="csrf-token"]');
  
  return cookieValue || metaTag?.getAttribute('content') || null;
};

const sanitizeForLogging = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const sensitiveFields = [
    'password', 'token', 'cvv', 'cardNumber', 
    'carteBancaire', 'crypto', 'authorization',
    'iban', 'secret', 'privateKey', 'codeSecurite',
    'mot_de_passe', 'code_admin', 'newPassword',
    'currentPassword', 'confirmPassword'
  ];
  
  const sanitized = { ...data };
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '***';
    }
  });
  
  if (sanitized.headers?.Authorization) {
    sanitized.headers.Authorization = 'Bearer ***';
  }
  
  return sanitized;
};

const isValidEndpoint = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  const lowerUrl = url.toLowerCase();
  
  const suspiciousPatterns = [
    { test: () => lowerUrl.startsWith('javascript:'), reason: 'javascript protocol' },
    { test: () => lowerUrl.startsWith('data:'), reason: 'data protocol' },
    { test: () => lowerUrl.includes('..'), reason: 'parent directory traversal' },
    { test: () => lowerUrl.includes('//') && !lowerUrl.includes('://'), reason: 'double slash' },
  ];
  
  return !suspiciousPatterns.some(pattern => pattern.test());
};

// Instance axios
const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  headers: { 
    "Content-Type": "application/json"
    // Supprimer les en-têtes de sécurité côté client
    // 'X-Content-Type-Options': 'nosniff',      // Supprimé
    // 'X-Frame-Options': 'DENY',                // Supprimé  
    // 'X-XSS-Protection': '1; mode=block'      // Supprimé
  },
  timeout: API_CONFIG.timeout,
});

// 🔐 INTERCEPTEUR REQUÊTE
api.interceptors.request.use((config) => {
  if (!isValidEndpoint(config.url)) {
    console.error('❌ URL suspecte bloquée:', config.url);
    throw new Error('URL non valide');
  }

  // 👉 DÉTECTION CONTEXTE ADMIN vs CLIENT
  const isAdminApi = config.url?.startsWith('/admin/');
  let token = null;

  if (isAdminApi) {
    token = localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");
  } else {
    token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
  }

  if (token && token !== "undefined" && token !== "null") {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  if (['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase())) {
    const csrfToken = getCSRFToken();
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
  }

  console.log(`🚀 API ${config.method?.toUpperCase()} ${config.url}`, {
    data: sanitizeForLogging(config.data),
    params: config.params,
    timestamp: new Date().toISOString(),
    hasToken: !!token,
    context: isAdminApi ? 'admin' : 'client'
  });
  
  return config;
}, (error) => {
  console.error('❌ Erreur intercepteur requête:', error);
  return Promise.reject(error);
});

// 🔐 INTERCEPTEUR RÉPONSE
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API ${response.status} ${response.config.url}`, {
      timestamp: new Date().toISOString(),
      success: response.data?.success
    });
    return response;
  },
  async (error) => {
    const errorDetails = {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      timestamp: new Date().toISOString()
    };
    
    console.error("❌ API Error:", errorDetails);

    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const isAdminApi = url.startsWith('/admin/');
      
      const publicClientUrls = ['/auth/login', '/auth/signup', '/health'];
      const publicAdminUrls = ['/admin/auth/login', '/admin/auth/signup', '/admin/health'];

      const isPublicRoute = isAdminApi
        ? publicAdminUrls.some(u => url.includes(u))
        : publicClientUrls.some(u => url.includes(u));
      
      if (!isPublicRoute) {
        if (isAdminApi) {
          console.warn("🔐 401 sur route ADMIN protégée");
          const token = localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");
          
          if (!token) {
            if (!window.location.pathname.includes('/admin/login')) {
              window.location.href = "/admin/login?session=expired";
            }
          } else {
            // On nettoie le token admin en cas d'expiration probable
            localStorage.removeItem("adminToken");
            localStorage.removeItem("admin");
            sessionStorage.removeItem("adminToken");
            sessionStorage.removeItem("admin");
            
            if (!window.location.pathname.includes('/admin/login')) {
              window.location.href = "/admin/login?session=expired";
            }
          }
        } else {
          console.warn("🔐 401 sur route CLIENT protégée");
          const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
          
          if (!token) {
            if (!window.location.pathname.includes('/login')) {
              window.location.href = "/login?session=expired";
            }
          } else {
            try {
              const tokenParts = token.split('.');
              if (tokenParts.length === 3) {
                const payload = JSON.parse(atob(tokenParts[1]));
                const isExpired = payload.exp * 1000 < Date.now();
                
                if (isExpired) {
                  console.warn("🕒 Token client expiré");
                }
              }
            } catch (tokenError) {
              console.error("❌ Erreur vérification token client:", tokenError);
            }
            
            localStorage.removeItem("authToken");
            localStorage.removeItem("user");
            sessionStorage.removeItem("authToken");
            sessionStorage.removeItem("user");
            
            if (!window.location.pathname.includes('/login')) {
              window.location.href = "/login?session=expired";
            }
          }
        }
      }
    }

    if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
      console.error('🌐 Erreur réseau détectée');
      error.userMessage = 'Problème de connexion réseau. Vérifiez votre connexion internet.';
    }

    if (error.code === 'ECONNABORTED') {
      console.error('⏰ Timeout de la requête API');
      error.userMessage = 'La requête a pris trop de temps. Veuillez réessayer.';
    }

    if (error.response?.data?.message) {
      error.userMessage = error.response.data.message;
    } else if (!error.userMessage) {
      error.userMessage = 'Une erreur est survenue. Veuillez réessayer.';
    }

    return Promise.reject(error);
  }
);

// Service principal (inchangé sauf logs)
export const secureApiService = {
  get: (url, config = {}, options = {}) => {
    const cacheKey = `${url}:${JSON.stringify(config.params || {})}`;
    
    if (options.useCache !== false) {
      const cached = smartCache.get(cacheKey);
      if (cached) {
        console.log("📦 Cache Hit:", url);
        return Promise.resolve(cached);
      }
    }

    return api.get(url, config).then(response => {
      if (options.useCache !== false) {
        const timeout = options.cacheTimeout || 30000;
        smartCache.set(cacheKey, response, timeout);
        console.log(`💾 Cache Set: ${url} (${timeout}ms)`);
      }
      return response;
    });
  },

  post: (url, data, config = {}) => {
    secureApiService.invalidateRelatedCache(url);
    console.log(`📤 POST ${url} - Invalidation cache lié`);
    return api.post(url, data, config);
  },

  put: (url, data, config = {}) => {
    secureApiService.invalidateRelatedCache(url);
    console.log(`✏️ PUT ${url} - Invalidation cache lié`);
    return api.put(url, data, config);
  },

  patch: (url, data, config = {}) => {
    secureApiService.invalidateRelatedCache(url);
    console.log(`🔧 PATCH ${url} - Invalidation cache lié`);
    return api.patch(url, data, config);
  },

  delete: (url, config = {}) => {
    secureApiService.invalidateRelatedCache(url);
    console.log(`🗑️ DELETE ${url} - Invalidation cache lié`);
    return api.delete(url, config);
  },

  invalidateRelatedCache: (url) => {
    console.log(`🔄 Invalidation cache pour: ${url}`);
    
    if (url.includes('/reservations')) {
      smartCache.clearByPattern('/reservations');
      smartCache.clearByPattern('/trajets');
    }
    if (url.includes('/trajets')) {
      smartCache.clearByPattern('/trajets');
    }
    if (url.includes('/users') || url.includes('/profile')) {
      smartCache.clearByPattern('/users');
      smartCache.clearByPattern('/profile');
    }
    if (url.includes('/auth')) {
      smartCache.clearByPattern('/users');
      smartCache.clearByPattern('/profile');
      smartCache.clearByPattern('/reservations');
    }
  },

  upload: (url, formData, config = {}) => {
    secureApiService.invalidateRelatedCache(url);
    return api.post(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config.headers
      }
    });
  }
};

// petits utilitaires (inchangés)
export const checkAPIHealth = () => 
  api.get('/health', {}, { useCache: false })
    .then(() => ({ 
      status: 'online', 
      timestamp: new Date().toISOString(),
      message: 'API opérationnelle'
    }))
    .catch((error) => ({ 
      status: 'offline', 
      timestamp: new Date().toISOString(),
      message: error.userMessage || 'API indisponible',
      error: error.message
    }));

export const apiMonitor = {
  getCacheStats: () => ({ 
    size: smartCache.getSize(),
    timestamp: new Date().toISOString()
  }),
  
  getCacheEntries: () => {
    const entries = [];
    for (const [key, value] of smartCache.cache.entries()) {
      entries.push({
        key,
        expiresIn: value.expiresAt - Date.now(),
        url: key.split(':')[0]
      });
    }
    return entries;
  },
  
  getPerformance: () => ({
    uptime: typeof process !== 'undefined' && process.uptime ? process.uptime() : 'N/A',
    timestamp: new Date().toISOString()
  })
};

export const cacheManager = {
  clearAll: () => {
    const size = smartCache.getSize();
    smartCache.clear();
    console.log(`🧹 Cache vidé - ${size} entrées supprimées`);
    return size;
  },
  
  clearByPattern: (pattern) => {
    const beforeSize = smartCache.getSize();
    smartCache.clearByPattern(pattern);
    const afterSize = smartCache.getSize();
    const cleared = beforeSize - afterSize;
    console.log(`🧹 Cache partiellement vidé - ${cleared} entrées supprimées pour le motif: ${pattern}`);
    return cleared;
  },
  
  clearExpired: () => {
    const beforeSize = smartCache.getSize();
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, value] of smartCache.cache.entries()) {
      if (now > value.expiresAt) {
        smartCache.cache.delete(key);
        cleaned++;
      }
    }
    
    console.log(`🧹 Nettoyage auto du cache: ${cleaned} éléments expirés supprimés`);
    return cleaned;
  },
  
  getInfo: () => ({
    totalEntries: smartCache.getSize(),
    timestamp: new Date().toISOString()
  })
};

setInterval(() => {
  cacheManager.clearExpired();
}, 300000);

export const resetApiService = () => {
  smartCache.clear();
  console.log('🔄 API Service réinitialisé - Cache vidé');
};

export default api;