// backend/utils/generateReservationCode.js
const crypto = require('crypto');
const logger = require('./logger');

/**
 * Génère un code de réservation unique
 * Format: RES-XXXX-XXXX-XXXX
 */
const generateReservationCode = () => {
  try {
    // Générer une partie aléatoire sécurisée
    const randomPart = crypto.randomBytes(12).toString('hex').toUpperCase();
    
    // Format: RES-XXXX-XXXX-XXXX
    const code = `RES-${randomPart.substring(0, 4)}-${randomPart.substring(4, 8)}-${randomPart.substring(8, 12)}`;
    
    logger.info(`🆕 Code réservation généré: ${code}`);
    return code;
    
  } catch (error) {
    logger.error('❌ Erreur génération code réservation:', error);
    
    // Fallback simple si crypto échoue
    const fallbackCode = 'RES-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    logger.warn(`🔄 Fallback code: ${fallbackCode}`);
    
    return fallbackCode;
  }
};

/**
 * Vérifie si un code de réservation existe déjà
 */
const isReservationCodeUnique = async (db, code) => {
  try {
    const [existing] = await db.query(
      'SELECT id FROM Reservations WHERE code_reservation = ?',
      [code]
    );
    return existing.length === 0;
  } catch (error) {
    logger.error('❌ Erreur vérification unicité code:', error);
    return false;
  }
};

/**
 * Génère un code unique garantie
 */
const generateUniqueReservationCode = async (db, maxAttempts = 5) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const code = generateReservationCode();
    
    if (await isReservationCodeUnique(db, code)) {
      return code;
    }
    
    logger.warn(`🔄 Code dupliqué, nouvelle tentative: ${code}`);
  }
  
  throw new Error('Impossible de générer un code de réservation unique');
};

module.exports = {
  generateReservationCode,
  generateUniqueReservationCode,
  isReservationCodeUnique
};