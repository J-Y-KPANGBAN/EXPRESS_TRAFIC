const db = require("../../config/db");
const logger = require("../../utils/logger"); // ✅ CORRECTION : Import correct

/* ============================================================
   🛒 GESTION DU PANIER - RÉSERVATION MULTI-BILLETS
============================================================ */

class CartController {
  
  /* ============================================================
     📌 AJOUTER UN TRAJET AU PANIER
  ============================================================ */
  async addToCart(req, res) {
    try {
      const userId = req.user.id; // ✅ CORRECTION : req.user.id au lieu de req.user.userId
      const { trajet_id, siege_numero, quantity = 1, passenger_info } = req.body;

      logger.info(`🛒 Ajout au panier - User: ${userId}, Trajet: ${trajet_id}`);

      // Validation des données
      if (!trajet_id || !siege_numero) {
        return res.status(400).json({
          success: false,
          message: "Trajet et siège sont obligatoires"
        });
      }

      // Vérifier que le trajet existe
      const [trajets] = await db.query(
        "SELECT * FROM Trajets WHERE id = ? AND date_depart >= CURDATE() AND etat_trajet = 'actif'",
        [trajet_id]
      );

      if (trajets.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Trajet introuvable ou déjà passé"
        });
      }

      const trajet = trajets[0];

      // Vérifier disponibilité du siège
      const [existingReservation] = await db.query(
        `SELECT * FROM Reservations 
         WHERE trajet_id = ? AND siege_numero = ? 
         AND etat_reservation IN ('confirmee', 'en_attente')`,
        [trajet_id, siege_numero]
      );

      if (existingReservation.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Ce siège est déjà réservé"
        });
      }

      // Récupérer ou créer le panier
      let [carts] = await db.query(
        `SELECT * FROM carts 
         WHERE user_id = ? AND status = 'en_cours' 
         AND expires_at > NOW()`,
        [userId]
      );

      let cart;
      if (carts.length === 0) {
        // Créer un nouveau panier
        const [result] = await db.query(
          `INSERT INTO carts (user_id, total_amount, currency, status, source, expires_at)
           VALUES (?, 0, 'EUR', 'en_cours', 'web', DATE_ADD(NOW(), INTERVAL 1 HOUR))`,
          [userId]
        );
        cart = { id: result.insertId };
        logger.info(`🆕 Nouveau panier créé: ${cart.id}`);
      } else {
        cart = carts[0];
      }

      // Vérifier si l'élément existe déjà dans le panier
      const [existingItems] = await db.query(
        `SELECT * FROM cart_items 
         WHERE cart_id = ? AND trajet_id = ? AND JSON_CONTAINS(seat_numbers, ?)`,
        [cart.id, trajet_id, JSON.stringify(siege_numero)]
      );

      if (existingItems.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Ce siège est déjà dans votre panier"
        });
      }

      // Ajouter l'élément au panier
      const [result] = await db.query(
        `INSERT INTO cart_items 
         (cart_id, trajet_id, quantity, unit_price, total_price, seat_numbers, passenger_info)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          cart.id,
          trajet_id,
          quantity,
          trajet.prix,
          trajet.prix * quantity,
          JSON.stringify([siege_numero]),
          passenger_info ? JSON.stringify(passenger_info) : null
        ]
      );

      // Mettre à jour le total du panier
      await this.updateCartTotal(cart.id);

      logger.success(`✅ Article ajouté au panier - Cart: ${cart.id}, Item: ${result.insertId}`);

      res.json({
        success: true,
        message: "Article ajouté au panier",
        cart_id: cart.id,
        item_id: result.insertId,
        data: {
          trajet: {
            id: trajet.id,
            depart: trajet.ville_depart,
            arrivee: trajet.ville_arrivee,
            date: trajet.date_depart,
            heure: trajet.heure_depart,
            prix: trajet.prix
          },
          siege: siege_numero
        }
      });

    } catch (error) {
      logger.error("❌ Erreur addToCart: " + error.message);
      res.status(500).json({
        success: false,
        message: "Erreur lors de l'ajout au panier",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /* ============================================================
     📌 RÉCUPÉRER LE PANIER
  ============================================================ */
  async getCart(req, res) {
    try {
      const userId = req.user.id; // ✅ CORRECTION : req.user.id

      const [carts] = await db.query(
        `SELECT * FROM carts 
         WHERE user_id = ? AND status = 'en_cours' 
         AND expires_at > NOW()`,
        [userId]
      );

      if (carts.length === 0) {
        return res.json({
          success: true,
          data: {
            items: [],
            total_amount: 0,
            expires_at: null,
            item_count: 0
          }
        });
      }

      const cart = carts[0];

      // Récupérer les éléments du panier avec détails des trajets
      const [items] = await db.query(
        `SELECT 
          ci.*,
          t.ville_depart,
          t.ville_arrivee,
          t.date_depart,
          t.heure_depart,
          t.duree,
          t.places_disponibles,
          b.numero_immatriculation,
          b.type_bus,
          s.nom AS societe_nom
         FROM cart_items ci
         JOIN Trajets t ON ci.trajet_id = t.id
         LEFT JOIN Bus b ON t.bus_id = b.id
         LEFT JOIN Societes s ON b.societe_id = s.id
         WHERE ci.cart_id = ?`,
        [cart.id]
      );

      // Formater les données
      const formattedItems = items.map(item => ({
        ...item,
        seat_numbers: JSON.parse(item.seat_numbers || '[]'),
        passenger_info: item.passenger_info ? JSON.parse(item.passenger_info) : null
      }));

      logger.info(`📦 Panier récupéré - User: ${userId}, Items: ${formattedItems.length}`);

      res.json({
        success: true,
        data: {
          id: cart.id,
          items: formattedItems,
          total_amount: cart.total_amount,
          expires_at: cart.expires_at,
          item_count: items.length,
          expires_in_minutes: Math.max(0, Math.round((new Date(cart.expires_at) - new Date()) / 60000))
        }
      });

    } catch (error) {
      logger.error("❌ Erreur getCart: " + error.message);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération du panier"
      });
    }
  }

  /* ============================================================
     📌 SUPPRIMER UN ÉLÉMENT DU PANIER
  ============================================================ */
  async removeFromCart(req, res) {
    try {
      const userId = req.user.id; // ✅ CORRECTION : req.user.id
      const { item_id } = req.params;

      // Vérifier que l'élément appartient à l'utilisateur
      const [items] = await db.query(
        `SELECT ci.* FROM cart_items ci
         JOIN carts c ON ci.cart_id = c.id
         WHERE ci.id = ? AND c.user_id = ?`,
        [item_id, userId]
      );

      if (items.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Élément non trouvé dans le panier"
        });
      }

      const cartId = items[0].cart_id;
      const trajetInfo = items[0].trajet_id;

      // Supprimer l'élément
      await db.query("DELETE FROM cart_items WHERE id = ?", [item_id]);

      // Mettre à jour le total du panier
      await this.updateCartTotal(cartId);

      logger.success(`✅ Élément supprimé du panier - Item: ${item_id}, Trajet: ${trajetInfo}`);

      res.json({
        success: true,
        message: "Élément supprimé du panier"
      });

    } catch (error) {
      logger.error("❌ Erreur removeFromCart: " + error.message);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la suppression"
      });
    }
  }

  /* ============================================================
     📌 VIDER LE PANIER
  ============================================================ */
  async clearCart(req, res) {
    try {
      const userId = req.user.id; // ✅ CORRECTION : req.user.id

      const [carts] = await db.query(
        "SELECT id FROM carts WHERE user_id = ? AND status = 'en_cours'",
        [userId]
      );

      if (carts.length === 0) {
        return res.json({
          success: true,
          message: "Panier déjà vide"
        });
      }

      const cartId = carts[0].id;

      // Supprimer tous les éléments
      await db.query("DELETE FROM cart_items WHERE cart_id = ?", [cartId]);
      
      // Réinitialiser le panier
      await db.query(
        "UPDATE carts SET total_amount = 0 WHERE id = ?",
        [cartId]
      );

      logger.success(`✅ Panier vidé - Cart: ${cartId}, User: ${userId}`);

      res.json({
        success: true,
        message: "Panier vidé avec succès"
      });

    } catch (error) {
      logger.error("❌ Erreur clearCart: " + error.message);
      res.status(500).json({
        success: false,
        message: "Erreur lors du vidage du panier"
      });
    }
  }

  /* ============================================================
     📌 PASSER AU PAIEMENT (Convertir panier en réservations)
  ============================================================ */
  async checkoutCart(req, res) {
    try {
      const userId = req.user.id; // ✅ CORRECTION : req.user.id
      const { cart_id, moyen_paiement } = req.body;

      logger.info(`💰 Checkout panier - User: ${userId}, Cart: ${cart_id}`);

      // Vérifier le panier
      const [carts] = await db.query(
        `SELECT * FROM carts 
         WHERE id = ? AND user_id = ? AND status = 'en_cours' 
         AND expires_at > NOW()`,
        [cart_id, userId]
      );

      if (carts.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Panier non trouvé ou expiré"
        });
      }

      const cart = carts[0];

      // Récupérer les éléments du panier
      const [items] = await db.query(
        `SELECT ci.*, t.ville_depart, t.ville_arrivee, t.date_depart, t.heure_depart
         FROM cart_items ci
         JOIN Trajets t ON ci.trajet_id = t.id
         WHERE ci.cart_id = ?`,
        [cart.id]
      );

      if (items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Panier vide"
        });
      }

      const reservationIds = [];
      const codesReservation = [];
      const reservationsDetails = [];

      // Créer les réservations pour chaque élément
      for (const item of items) {
        const seatNumbers = JSON.parse(item.seat_numbers || '[]');
        
        for (const siege_numero of seatNumbers) {
          // Vérifier à nouveau la disponibilité
          const [existing] = await db.query(
            `SELECT * FROM Reservations 
             WHERE trajet_id = ? AND siege_numero = ? 
             AND etat_reservation IN ('confirmee', 'en_attente')`,
            [item.trajet_id, siege_numero]
          );

          if (existing.length > 0) {
            return res.status(400).json({
              success: false,
              message: `Le siège ${siege_numero} n'est plus disponible sur le trajet ${item.ville_depart} → ${item.ville_arrivee}`
            });
          }

          // Générer code réservation
          const code_reservation = 'RES-' + Math.random().toString(36).substr(2, 9).toUpperCase();

          // Créer la réservation
          const [result] = await db.query(
            `INSERT INTO Reservations 
             (utilisateur_id, trajet_id, siege_numero, etat_reservation, 
              moyen_paiement, montant_total, code_reservation)
             VALUES (?, ?, ?, 'en_attente', ?, ?, ?)`,
            [
              userId,
              item.trajet_id,
              siege_numero,
              moyen_paiement,
              item.unit_price,
              code_reservation
            ]
          );

          reservationIds.push(result.insertId);
          codesReservation.push(code_reservation);
          
          reservationsDetails.push({
            reservation_id: result.insertId,
            code_reservation,
            trajet: {
              depart: item.ville_depart,
              arrivee: item.ville_arrivee,
              date: item.date_depart,
              heure: item.heure_depart
            },
            siege: siege_numero,
            montant: item.unit_price
          });
        }
      }

      // Marquer le panier comme validé
      await db.query(
        "UPDATE carts SET status = 'valide', updated_at = NOW() WHERE id = ?",
        [cart.id]
      );

      logger.success(`✅ Panier converti en réservations - ${reservationIds.length} réservations créées`);

      res.json({
        success: true,
        message: "Panier converti en réservations avec succès",
        data: {
          reservation_ids: reservationIds,
          codes_reservation: codesReservation,
          reservations: reservationsDetails,
          total_reservations: reservationIds.length,
          montant_total: cart.total_amount
        }
      });

    } catch (error) {
      logger.error("❌ Erreur checkoutCart: " + error.message);
      res.status(500).json({
        success: false,
        message: "Erreur lors du passage au paiement",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /* ============================================================
     📌 MÉTHODE UTILITAIRE - Mettre à jour le total du panier
  ============================================================ */
  async updateCartTotal(cartId) {
    try {
      const [result] = await db.query(
        "SELECT SUM(total_price) as total FROM cart_items WHERE cart_id = ?",
        [cartId]
      );

      const total = result[0].total || 0;

      await db.query(
        "UPDATE carts SET total_amount = ?, updated_at = NOW() WHERE id = ?",
        [total, cartId]
      );

      return total;
    } catch (error) {
      logger.error("Erreur updateCartTotal: " + error.message);
      throw error;
    }
  }

  /* ============================================================
     📌 PROLONGER LA DURÉE DU PANIER
  ============================================================ */
  async extendCartExpiry(req, res) {
    try {
      const userId = req.user.id;
      const { cart_id } = req.body;

      const [result] = await db.query(
        `UPDATE carts 
         SET expires_at = DATE_ADD(NOW(), INTERVAL 1 HOUR), updated_at = NOW()
         WHERE id = ? AND user_id = ? AND status = 'en_cours'`,
        [cart_id, userId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Panier non trouvé"
        });
      }

      logger.info(`⏰ Panier prolongé - Cart: ${cart_id}`);

      res.json({
        success: true,
        message: "Panier prolongé d'une heure"
      });

    } catch (error) {
      logger.error("❌ Erreur extendCartExpiry: " + error.message);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la prolongation du panier"
      });
    }
  }
}

module.exports = new CartController();