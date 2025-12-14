import { secureApiService } from './apiService';

// 🔒 VALIDATION DES CODES PAYS
const validateCountryCode = (countryCode) => {
  if (!countryCode || typeof countryCode !== 'string' || countryCode.length !== 2) {
    throw new Error('Code pays invalide');
  }
  
  // Validation basique du format (2 lettres)
  if (!/^[A-Z]{2}$/.test(countryCode.toUpperCase())) {
    throw new Error('Code pays doit contenir 2 lettres');
  }
  
  return countryCode.toUpperCase();
};

export const countryService = {
  // 🌍 LISTE DES PAYS
  getCountries: () => 
    secureApiService.get('/countries', {}, { 
      useCache: true, 
      cacheTimeout: 3600000 
    }),

  // 📞 CODES TÉLÉPHONIQUES
  getPhoneCodes: () => 
    secureApiService.get('/countries/phone-codes', {}, { 
      useCache: true, 
      cacheTimeout: 3600000 
    }),

  // 🏙️ VILLES PAR PAYS SÉCURISÉ
  getCitiesByCountry: (countryCode) => {
    const validCountryCode = validateCountryCode(countryCode);
    return secureApiService.get(`/countries/${validCountryCode}/cities`, {}, { 
      useCache: true, 
      cacheTimeout: 3600000 
    });
  },

  // 📍 RÉGIONS PAR PAYS SÉCURISÉ
  getRegionsByCountry: (countryCode) => {
    const validCountryCode = validateCountryCode(countryCode);
    return secureApiService.get(`/countries/${validCountryCode}/regions`, {}, { 
      useCache: true, 
      cacheTimeout: 3600000 
    });
  },

  // 🔍 RECHERCHER PAYS
  searchCountries: (query) => {
    const sanitizedQuery = query.replace(/[<>]/g, '').substring(0, 50);
    return secureApiService.get('/countries/search', { 
      params: { q: sanitizedQuery } 
    }, { 
      useCache: true, 
      cacheTimeout: 300000 
    });
  }
};