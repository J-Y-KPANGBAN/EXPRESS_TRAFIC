// backend/utils/dateUtils.js
const logger = require('./logger');

/**
 * 🔹 Formate une date selon la locale
 */
const formatDate = (date, locale = 'fr-FR', options = {}) => {
  try {
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options
    };
    return new Date(date).toLocaleDateString(locale, defaultOptions);
  } catch (error) {
    logger.error('❌ Erreur formatDate:', error);
    return date;
  }
};

/**
 * 🔹 Formate une heure
 */
const formatTime = (date, locale = 'fr-FR', options = {}) => {
  try {
    const defaultOptions = {
      hour: '2-digit',
      minute: '2-digit',
      ...options
    };
    return new Date(date).toLocaleTimeString(locale, defaultOptions);
  } catch (error) {
    logger.error('❌ Erreur formatTime:', error);
    return date;
  }
};

/**
 * 🔹 Formate une date et heure complètes
 */
const formatDateTime = (date, locale = 'fr-FR') => {
  try {
    return new Date(date).toLocaleString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    logger.error('❌ Erreur formatDateTime:', error);
    return date;
  }
};

/**
 * 🔹 Ajoute des jours à une date
 */
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * 🔹 Ajoute des heures à une date
 */
const addHours = (date, hours) => {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
};

/**
 * 🔹 Calcule la différence en jours entre deux dates
 */
const diffInDays = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * 🔹 Calcule la différence en heures entre deux dates
 */
const diffInHours = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60));
};

/**
 * 🔹 Vérifie si une date est dans le futur
 */
const isFutureDate = (date) => {
  return new Date(date) > new Date();
};

/**
 * 🔹 Vérifie si une date est dans le passé
 */
const isPastDate = (date) => {
  return new Date(date) < new Date();
};

/**
 * 🔹 Vérifie si une date est aujourd'hui
 */
const isToday = (date) => {
  const today = new Date();
  const checkDate = new Date(date);
  return today.toDateString() === checkDate.toDateString();
};

/**
 * 🔹 Convertit une durée en format lisible
 */
const formatDuration = (duration) => {
  if (!duration) return 'N/A';
  
  try {
    if (typeof duration === 'string') {
      const [hours, minutes] = duration.split(':').map(Number);
      if (hours === 0) return `${minutes}min`;
      if (minutes === 0) return `${hours}h`;
      return `${hours}h${minutes.toString().padStart(2, '0')}`;
    }
    return duration;
  } catch (error) {
    logger.error('❌ Erreur formatDuration:', error);
    return duration;
  }
};

/**
 * 🔹 Obtient le nom du jour de la semaine
 */
const getDayName = (date, locale = 'fr-FR') => {
  return new Date(date).toLocaleDateString(locale, { weekday: 'long' });
};

/**
 * 🔹 Obtient le nom du mois
 */
const getMonthName = (date, locale = 'fr-FR') => {
  return new Date(date).toLocaleDateString(locale, { month: 'long' });
};

/**
 * 🔹 Vérifie si deux dates sont le même jour
 */
const isSameDay = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

/**
 * 🔹 Formate une date pour l'input HTML date
 */
const toDateInputValue = (date) => {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

/**
 * 🔹 Obtient l'âge à partir de la date de naissance
 */
const getAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * 🔹 Génère une plage de dates
 */
const generateDateRange = (startDate, endDate) => {
  const dates = [];
  let currentDate = new Date(startDate);
  const finalDate = new Date(endDate);

  while (currentDate <= finalDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
};

module.exports = {
  formatDate,
  formatTime,
  formatDateTime,
  addDays,
  addHours,
  diffInDays,
  diffInHours,
  isFutureDate,
  isPastDate,
  isToday,
  formatDuration,
  getDayName,
  getMonthName,
  isSameDay,
  toDateInputValue,
  getAge,
  generateDateRange
};