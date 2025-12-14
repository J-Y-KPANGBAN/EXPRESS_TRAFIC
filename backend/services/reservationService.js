// backend/services/reservationService.js
const db = require("../config/db");
const { generateReservationCode } = require("./generateCode");
const { logSecurityEvent } = require("../utils/securityUtils");
const logger = require("../utils/logger");

class ReservationService {
  
  /* ============================================================
     📋 CRÉER UNE RÉSERVATION
  ============================================================ */
  async createReservation(reservationData) {
    const { userId, trajetId, siegeNumero, passagers = [], informationsSpeciales = '' } = reservationData;

    try {
      logger.info(`📋 Création réservation - User: ${userId}, Trajet: ${trajetId}, Siège: ${siegeNumero}`);

      // Vérifier la disponibilité du siège
      const isSeatAvailable = await this.checkSeatAvailability(trajetId, siegeNumero);
      if (!isSeatAvailable) {
        throw new Error(`Le siège ${siegeNumero} n'est pas disponible`);
      }

      // Récupérer les détails du trajet
      const trajet = await this.getTrajetDetails(trajetId);
      if (!trajet) {
        throw new Error("Trajet introuvable");
      }

      // Vérifier s'il reste des places
      if (trajet.places_disponibles <= 0) {
        throw new Error("Plus de places disponibles pour ce trajet");
      }

      const codeReservation = generateReservationCode();
      const montantTotal = trajet.prix * (passagers.length || 1);

      const [result] = await db.execute(
        `INSERT INTO Reservations 
         (utilisateur_id, trajet_id, siege_numero, etat_reservation, montant_total, code_reservation, passagers, informations_speciales, date_reservation)
         VALUES (?, ?, ?, 'en_attente', ?, ?, ?, ?, NOW())`,
        [
          userId,
          trajetId,
          siegeNumero,
          montantTotal,
          codeReservation,
          JSON.stringify(passagers),
          informationsSpeciales
        ]
      );

      // Décrémenter le nombre de places disponibles
      await this.decrementAvailableSeats(trajetId);

      logger.success(`✅ Réservation créée: ${codeReservation} - ID: ${result.insertId}`);

      logSecurityEvent('RESERVATION_CREATED', null, userId, {
        reservationId: result.insertId,
        trajetId,
        siegeNumero,
        montantTotal
      });

      return {
        success: true,
        reservationId: result.insertId,
        codeReservation,
        montantTotal,
        trajetDetails: trajet
      };

    } catch (error) {
      logger.error(`❌ Erreur createReservation: ${error.message}`);
      
      logSecurityEvent('RESERVATION_FAILED', null, userId, {
        trajetId,
        siegeNumero,
        error: error.message
      });

      return {
        success: false,
        error: error.message,
        code: 'RESERVATION_ERROR'
      };
    }
  }

  /* ============================================================
     🛒 CRÉER DES RÉSERVATIONS MULTIPLES (PANIER)
  ============================================================ */
  async createMultipleReservations(cartData) {
    const { userId, items } = cartData;

    try {
      logger.info(`🛒 Création de ${items.length} réservations pour l'utilisateur ${userId}`);

      const reservations = [];
      const errors = [];

      for (const item of items) {
        try {
          const reservation = await this.createReservation({
            userId,
            trajetId: item.trajet_id,
            siegeNumero: item.siege_numero,
            passagers: item.passagers,
            informationsSpeciales: item.informations_speciales
          });

          if (reservation.success) {
            reservations.push(reservation);
          } else {
            errors.push({
              trajetId: item.trajet_id,
              error: reservation.error
            });
          }
        } catch (error) {
          errors.push({
            trajetId: item.trajet_id,
            error: error.message
          });
        }
      }

      const result = {
        success: errors.length === 0,
        reservations,
        errors,
        total: items.length,
        successful: reservations.length,
        failed: errors.length
      };

      if (errors.length > 0) {
        logger.warning(`⚠️ Réservations multiples: ${reservations.length} succès, ${errors.length} échecs`);
      } else {
        logger.success(`🎉 Toutes les réservations créées avec succès: ${reservations.length}`);
      }

      return result;

    } catch (error) {
      logger.error(`❌ Erreur createMultipleReservations: ${error.message}`);
      return {
        success: false,
        error: error.message,
        code: 'MULTIPLE_RESERVATION_ERROR'
      };
    }
  }

  /* ============================================================
     🔍 OBTENIR LES DÉTAILS D'UNE RÉSERVATION
  ============================================================ */
  async getReservationById(reservationId) {
    try {
      const [rows] = await db.execute(
        `SELECT 
           r.*,
           t.ville_depart,
           t.ville_arrivee,
           t.date_depart,
           t.heure_depart,
           t.duree,
           t.prix,
           t.places_disponibles,
           b.numero_immatriculation,
           b.type_bus,
           c.nom AS chauffeur_nom,
           c.prenom AS chauffeur_prenom,
           s.nom AS societe_nom,
           u.nom AS user_nom,
           u.prenom AS user_prenom,
           u.email AS user_email,
           u.telephone AS user_telephone
         FROM Reservations r
         JOIN Trajets t ON r.trajet_id = t.id
         LEFT JOIN Bus b ON t.bus_id = b.id
         LEFT JOIN Chauffeurs c ON b.chauffeur_id = c.id
         LEFT JOIN Societes s ON b.societe_id = s.id
         JOIN signup u ON r.utilisateur_id = u.id
         WHERE r.id = ?`,
        [reservationId]
      );

      if (rows.length === 0) {
        return null;
      }

      const reservation = rows[0];
      
      // Parser les données JSON
      if (reservation.passagers) {
        try {
          reservation.passagers = JSON.parse(reservation.passagers);
        } catch (e) {
          reservation.passagers = [];
        }
      }

      return reservation;

    } catch (error) {
      logger.error(`❌ Erreur getReservationById: ${error.message}`);
      throw error;
    }
  }

  /* ============================================================
     👤 OBTENIR LES RÉSERVATIONS D'UN UTILISATEUR
  ============================================================ */
  async getUserReservations(userId, options = {}) {
    try {
      const { limit = 50, offset = 0, statut = null, dateDebut = null, dateFin = null } = options;

      let query = `
        SELECT 
          r.*,
          t.ville_depart,
          t.ville_arrivee,
          t.date_depart,
          t.heure_depart,
          t.duree,
          t.prix,
          b.numero_immatriculation,
          s.nom AS societe_nom
        FROM Reservations r
        JOIN Trajets t ON r.trajet_id = t.id
        LEFT JOIN Bus b ON t.bus_id = b.id
        LEFT JOIN Societes s ON b.societe_id = s.id
        WHERE r.utilisateur_id = ?
      `;

      const params = [userId];

      if (statut) {
        query += ' AND r.etat_reservation = ?';
        params.push(statut);
      }

      if (dateDebut) {
        query += ' AND t.date_depart >= ?';
        params.push(dateDebut);
      }

      if (dateFin) {
        query += ' AND t.date_depart <= ?';
        params.push(dateFin);
      }

      query += ' ORDER BY r.date_reservation DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const [reservations] = await db.execute(query, params);

      // Parser les données JSON
      reservations.forEach(reservation => {
        if (reservation.passagers) {
          try {
            reservation.passagers = JSON.parse(reservation.passagers);
          } catch (e) {
            reservation.passagers = [];
          }
        }
      });

      return reservations;

    } catch (error) {
      logger.error(`❌ Erreur getUserReservations: ${error.message}`);
      throw error;
    }
  }

  /* ============================================================
     ✅ CONFIRMER UNE RÉSERVATION
  ============================================================ */
  async confirmReservation(reservationId, ticketPdfUrl = null) {
    try {
      const [result] = await db.execute(
        `UPDATE Reservations 
         SET etat_reservation = 'confirmee',
             ticket_pdf_url = COALESCE(?, ticket_pdf_url),
             email_sent = 1,
             email_sent_at = NOW()
         WHERE id = ?`,
        [ticketPdfUrl, reservationId]
      );

      if (result.affectedRows === 0) {
        throw new Error("Réservation introuvable");
      }

      logger.success(`✅ Réservation ${reservationId} confirmée`);

      logSecurityEvent('RESERVATION_CONFIRMED', null, null, {
        reservationId,
        ticketPdfUrl: !!ticketPdfUrl
      });

      return {
        success: true,
        reservationId,
        confirmed: true
      };

    } catch (error) {
      logger.error(`❌ Erreur confirmReservation: ${error.message}`);
      throw error;
    }
  }

  /* ============================================================
     ❌ ANNULER UNE RÉSERVATION
  ============================================================ */
  async cancelReservation(reservationId, reason = 'Annulation utilisateur') {
    try {
      const reservation = await this.getReservationById(reservationId);
      if (!reservation) {
        throw new Error("Réservation introuvable");
      }

      // Vérifier si l'annulation est possible
      const canCancel = await this.canCancelReservation(reservationId);
      if (!canCancel) {
        throw new Error("Cette réservation ne peut pas être annulée");
      }

      const [result] = await db.execute(
        `UPDATE Reservations 
         SET etat_reservation = 'annulee',
             informations_speciales = CONCAT(COALESCE(informations_speciales, ''), ' | Annulation: ', ?)
         WHERE id = ?`,
        [reason, reservationId]
      );

      // Réincrémenter les places disponibles
      await this.incrementAvailableSeats(reservation.trajet_id);

      logger.success(`❌ Réservation ${reservationId} annulée: ${reason}`);

      logSecurityEvent('RESERVATION_CANCELLED', null, reservation.utilisateur_id, {
        reservationId,
        reason,
        trajetId: reservation.trajet_id
      });

      return {
        success: true,
        reservationId,
        cancelled: true,
        refundEligible: this.isRefundEligible(reservation)
      };

    } catch (error) {
      logger.error(`❌ Erreur cancelReservation: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /* ============================================================
     🔄 MODIFIER UNE RÉSERVATION
  ============================================================ */
  async updateReservation(reservationId, updateData) {
    try {
      const allowedFields = ['siege_numero', 'passagers', 'informations_speciales'];
      const updates = [];
      const params = [];

      for (const [field, value] of Object.entries(updateData)) {
        if (allowedFields.includes(field)) {
          updates.push(`${field} = ?`);
          params.push(field === 'passagers' ? JSON.stringify(value) : value);
        }
      }

      if (updates.length === 0) {
        throw new Error("Aucun champ valide à mettre à jour");
      }

      // Si changement de siège, vérifier la disponibilité
      if (updateData.siege_numero) {
        const reservation = await this.getReservationById(reservationId);
        const isSeatAvailable = await this.checkSeatAvailability(reservation.trajet_id, updateData.siege_numero, reservationId);
        
        if (!isSeatAvailable) {
          throw new Error(`Le siège ${updateData.siege_numero} n'est pas disponible`);
        }
      }

      params.push(reservationId);

      const [result] = await db.execute(
        `UPDATE Reservations 
         SET ${updates.join(', ')}, date_reservation = NOW()
         WHERE id = ?`,
        params
      );

      if (result.affectedRows === 0) {
        throw new Error("Réservation introuvable");
      }

      logger.success(`✏️ Réservation ${reservationId} mise à jour`);

      return {
        success: true,
        reservationId,
        updated: true
      };

    } catch (error) {
      logger.error(`❌ Erreur updateReservation: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ============================================================
  // 🛠️ MÉTHODES UTILITAIRES
  // ============================================================

  async checkSeatAvailability(trajetId, siegeNumero, excludeReservationId = null) {
    try {
      let query = `
        SELECT COUNT(*) as count
        FROM Reservations 
        WHERE trajet_id = ? AND siege_numero = ? AND etat_reservation IN ('en_attente', 'confirmee')
      `;

      const params = [trajetId, siegeNumero];

      if (excludeReservationId) {
        query += ' AND id != ?';
        params.push(excludeReservationId);
      }

      const [rows] = await db.execute(query, params);
      return rows[0].count === 0;

    } catch (error) {
      logger.error(`❌ Erreur checkSeatAvailability: ${error.message}`);
      throw error;
    }
  }

  async getTrajetDetails(trajetId) {
    try {
      const [rows] = await db.execute(
        `SELECT * FROM Trajets WHERE id = ?`,
        [trajetId]
      );
      return rows[0] || null;
    } catch (error) {
      logger.error(`❌ Erreur getTrajetDetails: ${error.message}`);
      throw error;
    }
  }

  async decrementAvailableSeats(trajetId) {
    try {
      await db.execute(
        `UPDATE Trajets 
         SET places_disponibles = GREATEST(0, places_disponibles - 1)
         WHERE id = ?`,
        [trajetId]
      );
    } catch (error) {
      logger.error(`❌ Erreur decrementAvailableSeats: ${error.message}`);
      throw error;
    }
  }

  async incrementAvailableSeats(trajetId) {
    try {
      await db.execute(
        `UPDATE Trajets 
         SET places_disponibles = LEAST(places_total, places_disponibles + 1)
         WHERE id = ?`,
        [trajetId]
      );
    } catch (error) {
      logger.error(`❌ Erreur incrementAvailableSeats: ${error.message}`);
      throw error;
    }
  }

  async canCancelReservation(reservationId) {
    try {
      const reservation = await this.getReservationById(reservationId);
      if (!reservation) return false;

      // Vérifier si le trajet est dans plus de 24h
      const trajetDate = new Date(`${reservation.date_depart} ${reservation.heure_depart}`);
      const now = new Date();
      const diffHours = (trajetDate - now) / (1000 * 60 * 60);

      return diffHours > 24; // Annulation possible jusqu'à 24h avant

    } catch (error) {
      logger.error(`❌ Erreur canCancelReservation: ${error.message}`);
      return false;
    }
  }

  isRefundEligible(reservation) {
    const trajetDate = new Date(`${reservation.date_depart} ${reservation.heure_depart}`);
    const now = new Date();
    const diffHours = (trajetDate - now) / (1000 * 60 * 60);

    // Remboursement possible si annulation plus de 48h avant
    return diffHours > 48;
  }

  /* ============================================================
     📊 STATISTIQUES DES RÉSERVATIONS
  ============================================================ */
  async getReservationStats(period = 'month') {
    try {
      let dateFilter = '';
      switch (period) {
        case 'day':
          dateFilter = 'DATE(date_reservation) = CURDATE()';
          break;
        case 'week':
          dateFilter = 'date_reservation >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
          break;
        case 'month':
          dateFilter = 'date_reservation >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
          break;
        case 'year':
          dateFilter = 'date_reservation >= DATE_SUB(NOW(), INTERVAL 1 YEAR)';
          break;
        default:
          dateFilter = '1=1';
      }

      const [stats] = await db.execute(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN etat_reservation = 'confirmee' THEN 1 ELSE 0 END) as confirmees,
          SUM(CASE WHEN etat_reservation = 'en_attente' THEN 1 ELSE 0 END) as en_attente,
          SUM(CASE WHEN etat_reservation = 'annulee' THEN 1 ELSE 0 END) as annulees,
          SUM(montant_total) as chiffre_affaires,
          AVG(montant_total) as moyenne_par_reservation
        FROM Reservations 
        WHERE ${dateFilter}
      `);

      return stats[0] || { total: 0, confirmees: 0, en_attente: 0, annulees: 0, chiffre_affaires: 0, moyenne_par_reservation: 0 };

    } catch (error) {
      logger.error(`❌ Erreur getReservationStats: ${error.message}`);
      throw error;
    }
  }
}
// Lors de la création d'une réservation
const createReservation = async (userId, trajetId, siegeNumero) => {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  // Vérification améliorée
  const [existing] = await db.query(`
    SELECT * FROM Reservations 
    WHERE trajet_id = ? AND siege_numero = ? 
    AND etat_reservation IN ('confirmee')
    AND (expires_at IS NULL OR expires_at > NOW())
  `, [trajetId, siegeNumero]);
  
  if (existing.length > 0) {
    throw new Error('Siège déjà réservé');
  }
  
  // Nettoyer les anciennes réservations expirées
  await cleanupExpiredReservations();
  
  // Créer la nouvelle réservation
  await db.query(`
    INSERT INTO Reservations 
    (utilisateur_id, trajet_id, siege_numero, etat_reservation, expires_at)
    VALUES (?, ?, ?, 'en_attente', ?)
  `, [userId, trajetId, siegeNumero, expiresAt]);
};

module.exports = new ReservationService();