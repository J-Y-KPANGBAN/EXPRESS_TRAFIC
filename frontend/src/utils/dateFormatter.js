// frontend/src/utils/dateFormatter.js - FICHIER COMPLET MIS À JOUR
/**
 * Utilitaire de formatage de dates pour toute l'application
 */

// ===========================================================================
// ✅ FONCTIONS EXISTANTES (GARDÉES POUR COMPATIBILITÉ)
// ===========================================================================

export const formatDate = (dateString, options = {}) => {
  if (!dateString) return "Date non disponible";
  
  try {
    const date = new Date(dateString);
    
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Europe/Paris'
    };

    const mergedOptions = { ...defaultOptions, ...options };
    
    return date.toLocaleDateString('fr-FR', mergedOptions);
  } catch (error) {
    console.error('Erreur formatage date:', error);
    return String(dateString);
  }
};

export const formatDateTime = (dateString) => {
  if (!dateString) return "Date/heure non disponible";
  
  try {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Paris'
    });
  } catch (error) {
    console.error('Erreur formatage date/heure:', error);
    return String(dateString);
  }
};

export const formatDateForInput = (dateString) => {
  if (!dateString) return "";
  
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error('Erreur formatage date input:', error);
    return "";
  }
};

// Format spécial pour les réservations
export const formatReservationDate = (dateString) => {
  return formatDate(dateString, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Format pour l'heure
export const formatTime = (timeString) => {
  if (!timeString) return "Heure non disponible";
  
  try {
    const [hours, minutes] = timeString.split(':');
    return `${hours}h${minutes}`;
  } catch (error) {
    return timeString;
  }
};

// ===========================================================================
// ✅ NOUVELLES FONCTIONS POUR FORMAT jj/mm/yyyy
// ===========================================================================

// ✅ CONVERSION jj/mm/yyyy → YYYY-MM-DD (pour MySQL)
export const convertToMySQLDate = (dateString) => {
  if (!dateString) return null;
  
  if (dateString.includes('/')) {
    const [day, month, year] = dateString.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  return dateString;
};

// ✅ CONVERSION YYYY-MM-DD → jj/mm/yyyy (pour affichage)
export const convertToDisplayDate = (dateString) => {
  if (!dateString) return "";
  
  if (dateString.includes('-')) {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  }
  
  return dateString;
};

// ✅ FORMATAGE AUTOMATIQUE PENDANT LA SAISIE
export const formatDateInput = (value) => {
  const numbers = value.replace(/\D/g, '');
  
  if (numbers.length <= 2) {
    return numbers;
  } else if (numbers.length <= 4) {
    return numbers.slice(0, 2) + '/' + numbers.slice(2);
  } else {
    return numbers.slice(0, 2) + '/' + numbers.slice(2, 4) + '/' + numbers.slice(4, 8);
  }
};

// ✅ VALIDATION FORMAT jj/mm/yyyy
export const isValidDateFormat = (dateString) => {
  return /^\d{2}\/\d{2}\/\d{4}$/.test(dateString);
};

// ✅ VALIDATION DATE RÉELLE
export const isValidDate = (dateString) => {
  if (!isValidDateFormat(dateString)) return false;
  
  const [day, month, year] = dateString.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  
  return date.getDate() === day && 
         date.getMonth() === month - 1 && 
         date.getFullYear() === year;
};

// ✅ CALCUL ÂGE
export const calculateAge = (dateString) => {
  if (!isValidDate(dateString)) return null;
  
  const [day, month, year] = dateString.split('/').map(Number);
  const birthDate = new Date(year, month - 1, day);
  const today = new Date();
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

// ✅ FORMATAGE POUR L'AFFICHAGE (nom du mois) - VERSION AMÉLIORÉE
export const formatDateForDisplay = (dateString) => {
  if (!dateString) return "Date non disponible";
  
  try {
    let date;
    
    if (dateString.includes('/')) {
      const [day, month, year] = dateString.split('/');
      date = new Date(year, month - 1, day);
    } else {
      date = new Date(dateString);
    }
    
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    return String(dateString);
  }
};

// ===========================================================================
// ✅ FONCTION UTILITAIRE POUR LE PROFIL
// ===========================================================================

// Fonction spéciale pour le profil qui gère les deux formats
export const formatProfileDateForInput = (dateString) => {
  if (!dateString) return "";
  
  // Si la date est au format jj/mm/yyyy, la convertir en YYYY-MM-DD
  if (dateString.includes('/')) {
    const [day, month, year] = dateString.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Si c'est déjà en YYYY-MM-DD, utiliser directement
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? "" : date.toISOString().split("T")[0];
  } catch {
    return "";
  }
};