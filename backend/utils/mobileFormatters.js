// backend/utils/mobileFormatters.js
exports.formatForMobile = (data) => {
  if (Array.isArray(data)) {
    return data.map(item => formatForMobile(item));
  }
  
  if (data && typeof data === 'object') {
    const formatted = {};
    Object.keys(data).forEach(key => {
      // Convertir les noms de colonnes SQL en camelCase pour React Native
      const camelCaseKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      formatted[camelCaseKey] = formatForMobile(data[key]);
    });
    return formatted;
  }
  
  return data;
};

// Formatter les dates pour le mobile
exports.formatDateForMobile = (dateString) => {
  if (!dateString) return null;
  return new Date(dateString).toISOString();
};