const db = require("../config/db");
const logger = require("../utils/logger");

const cleanupExpiredReservations = async () => {
  try {
    const connection = await db.getConnection();
    
    // 1. Récupérer les réservations expirées
    const [expiredReservations] = await connection.query(`
      SELECT id, trajet_id 
      FROM Reservations 
      WHERE etat_reservation = 'en_attente' 
        AND expires_at <= NOW()
    `);
    
    if (expiredReservations.length > 0) {
      // 2. Marquer comme expirées
      await connection.query(`
        UPDATE Reservations 
        SET etat_reservation = 'expiree'
        WHERE etat_reservation = 'en_attente' 
          AND expires_at <= NOW()
      `);
      
      // 3. Libérer les places dans les trajets
      for (const reservation of expiredReservations) {
        await connection.query(`
          UPDATE Trajets 
          SET places_disponibles = LEAST(places_total, places_disponibles + 1)
          WHERE id = ?
        `, [reservation.trajet_id]);
      }
      
      logger.info(`🧹 Nettoyage: ${expiredReservations.length} réservations expirées libérées`);
    }
    
    connection.release();
  } catch (error) {
    logger.error('❌ Erreur nettoyage réservations:', error);
  }
};

// Exporter pour usage manuel
module.exports = { cleanupExpiredReservations };

// Nettoyage automatique toutes les minutes
if (process.env.NODE_ENV !== 'test') {
  setInterval(cleanupExpiredReservations, 60 * 1000); // Toutes les minutes
  cleanupExpiredReservations(); // Au démarrage
}