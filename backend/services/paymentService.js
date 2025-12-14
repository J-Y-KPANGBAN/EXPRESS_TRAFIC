// backend/services/paymentService.js
const db = require("../config/db");
const stripe = require("./stripeService");
const generateCode = require('./generateCode');
const emailService = require("./emailService");
const pdfService = require("./pdfService");
const reservationService = require("./reservationService");
const smsService = require("./smsService");
const mobileMoneyService = require("./mobileMoneyService");
const paypalService = require("./paypalService");
const { logSecurityEvent } = require("../utils/securityUtils");
const logger = require("../utils/logger");
const fs = require('fs');
const path = require('path');

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

class PaymentService {
  
  /* ============================================================
     💳 PROCESSUS DE PAIEMENT UNIFIÉ
  ============================================================ */
  async processPayment(paymentData) {
    const { method, amount, currency, reservationIds, user, metadata = {} } = paymentData;

    logger.info(`💳 Début traitement paiement ${method} - Montant: ${amount} ${currency}`);

    try {
      // Vérification anti-fraude basique
      if (amount > 1000) { // Seuil arbitraire, à ajuster
        logSecurityEvent('HIGH_AMOUNT_PAYMENT_ATTEMPT', metadata.ip, user?.id, { amount, method });
      }

      let paymentResult;

      switch (method) {
        case 'carte':
          paymentResult = await this.processStripePayment(amount, currency, metadata);
          break;
        case 'mobile_money':
          paymentResult = await mobileMoneyService.processPayment({
            provider: metadata.provider || 'orange', // orange, mtn, moov, wave
            phone: metadata.phone,
            amount,
            currency,
            reference: metadata.reference
          });
          break;
        case 'paypal':
          paymentResult = await paypalService.createOrder(amount, currency);
          break;
        case 'especes':
          // Pour paiement en espèces, on valide directement (réservé admin)
          paymentResult = { success: true, transactionId: 'CASH_' + Date.now() };
          break;
        default:
          throw new Error(`Méthode de paiement non supportée: ${method}`);
      }

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || `Échec du paiement ${method}`);
      }

      // Enregistrement du paiement en base
      const paymentIds = await this.saveMultiplePayments(reservationIds, amount, method, paymentResult.transactionId);

      // Si le paiement est immédiatement réussi (mobile money, espèces), on valide
      if (method === 'mobile_money' || method === 'especes') {
        await this.validateMultiplePayments(paymentIds);
      }

      logSecurityEvent('PAYMENT_SUCCESS', metadata.ip, user?.id, {
        method,
        amount,
        paymentIds,
        transactionId: paymentResult.transactionId
      });

      return {
        success: true,
        paymentIds,
        transactionId: paymentResult.transactionId,
        ...(method === 'carte' && { stripeSessionId: paymentResult.sessionId }),
        ...(method === 'paypal' && { paypalOrderId: paymentResult.orderId, approvalUrl: paymentResult.approvalUrl })
      };

    } catch (error) {
      logSecurityEvent('PAYMENT_FAILED', metadata.ip, user?.id, {
        method,
        amount,
        error: error.message
      });
      
      logger.error(`❌ Erreur processPayment: ${error.message}`);
      return {
        success: false,
        error: error.message,
        code: 'PAYMENT_PROCESSING_ERROR'
      };
    }
  }

  /* ============================================================
     💳 PAIEMENT STRIPE (EXISTANT - AMÉLIORÉ)
  ============================================================ */
  async processStripePayment(amount, currency, metadata) {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              product_data: {
                name: this.getPaymentDescription(metadata),
                description: 'Réservation ExpressTrafic - Service de transport premium'
              },
              unit_amount: Math.round(amount * 100), // Conversion en centimes
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${FRONTEND_URL}/paiement/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${FRONTEND_URL}/paiement/cancel`,
        customer_email: metadata.customerEmail,
        metadata: {
          reservation_ids: metadata.reservationIds?.join(','),
          user_id: metadata.userId
        }
      });

      logger.success(`✅ Session Stripe créée: ${session.id}`);

      return {
        success: true,
        sessionId: session.id,
        transactionId: session.id
      };
    } catch (error) {
      logger.error(`❌ Erreur Stripe: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /* ============================================================
     🔍 VÉRIFICATION SESSION STRIPE
  ============================================================ */
  async verifyStripeSession(sessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      
      if (session.payment_status === 'paid') {
        return { success: true, session };
      }
      
      return { 
        success: false, 
        status: session.payment_status,
        error: 'Paiement non complété'
      };
    } catch (error) {
      logger.error(`❌ Erreur vérification session Stripe: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /* ============================================================
     💾 SAUVEGARDER PAIEMENT (EXISTANT - OPTIMISÉ)
  ============================================================ */
  async savePayment(reservationId, amount, method, transactionId = null) {
    try {
      const [result] = await db.execute(
        `INSERT INTO Paiements 
         (reservation_id, montant, methode, etat_paiement, reference_transaction, date_paiement)
         VALUES (?, ?, ?, 'en_attente', ?, NOW())`,
        [reservationId, amount, method, transactionId]
      );

      logger.success(`📝 Paiement enregistré - ID: ${result.insertId}`);
      return result.insertId;

    } catch (error) {
      logger.error(`❌ Erreur savePayment: ${error.message}`);
      throw error;
    }
  }

  /* ============================================================
     💾 SAUVEGARDER PAIEMENTS MULTIPLES (EXISTANT - OPTIMISÉ)
  ============================================================ */
  async saveMultiplePayments(reservationIds, amounts, method, transactionId = null) {
    try {
      const paymentIds = [];
      
      for (let i = 0; i < reservationIds.length; i++) {
        const paymentId = await this.savePayment(reservationIds[i], amounts[i], method, transactionId);
        paymentIds.push(paymentId);
      }

      logger.success(`💰 ${paymentIds.length} paiements enregistrés`);
      return paymentIds;

    } catch (error) {
      logger.error(`❌ Erreur saveMultiplePayments: ${error.message}`);
      throw error;
    }
  }

  /* ============================================================
     ✅ VALIDER PAIEMENT (EXISTANT - RENFORCÉ)
  ============================================================ */
  async validatePayment(paymentId) {
    logger.info(`💳 Validation paiement: ${paymentId}`);

    try {
      const payment = await this.getPaymentWithDetails(paymentId);
      if (!payment) throw new Error("Paiement introuvable");

      // Vérifier si déjà validé
      if (payment.etat_paiement === "reussi" && payment.ticket_pdf_url) {
        logger.info(`✅ Paiement ${paymentId} déjà validé`);
        return {
          success: true,
          paymentId,
          reservationId: payment.reservation_id,
          ticketUrl: payment.ticket_pdf_url,
        };
      }

      // Marquer comme payé
      await db.execute(
        `UPDATE Paiements 
         SET etat_paiement = 'reussi', date_paiement = NOW()
         WHERE id = ?`,
        [paymentId]
      );

      logger.success("🟢 Paiement validé en base");

      // Génération du billet PDF
      const ticketResult = await pdfService.generateTicket(payment);

      // Mise à jour réservation
      await reservationService.confirmReservation(payment.reservation_id, ticketResult.publicUrl);

      // Notifications (email + SMS)
      await this.sendPaymentNotifications(payment, ticketResult.publicUrl);

      logger.success(`🎉 Paiement ${paymentId} complètement validé`);

      return {
        success: true,
        paymentId,
        reservationId: payment.reservation_id,
        ticketUrl: ticketResult.publicUrl,
      };

    } catch (error) {
      logger.error(`❌ ERREUR validatePayment pour ${paymentId}: ${error.message}`);
      
      // Marquer comme échoué en base
      try {
        await db.execute(
          `UPDATE Paiements SET etat_paiement = 'echoue' WHERE id = ?`,
          [paymentId]
        );
      } catch (dbError) {
        logger.error(`❌ Impossible de marquer paiement comme échoué: ${dbError.message}`);
      }

      return {
        success: false,
        error: error.message
      };
    }
  }

  /* ============================================================
     ✅ VALIDER PAIEMENTS MULTIPLES
  ============================================================ */
  async validateMultiplePayments(paymentIds) {
    logger.info(`💳 Validation multiple paiements: ${paymentIds.length} paiements`);

    const results = {
      processed: paymentIds.length,
      successful: 0,
      failed: 0,
      details: []
    };

    for (const paymentId of paymentIds) {
      try {
        const result = await this.validatePayment(paymentId);
        if (result.success) {
          results.successful++;
          results.details.push({
            paymentId,
            status: 'success',
            ticketUrl: result.ticketUrl
          });
        } else {
          results.failed++;
          results.details.push({
            paymentId,
            status: 'failed',
            error: result.error
          });
        }
      } catch (error) {
        results.failed++;
        results.details.push({
          paymentId,
          status: 'error',
          error: error.message
        });
      }
    }

    logger.success(`💰 Validation multiple terminée: ${results.successful} succès, ${results.failed} échecs`);
    return results;
  }

  /* ============================================================
     📧 NOTIFICATIONS DE PAIEMENT
  ============================================================ */
  async sendPaymentNotifications(payment, ticketUrl) {
    // Notification email
    if (payment.user_email) {
      try {
        await emailService.sendTicketEmail(payment.user_email, ticketUrl);
        logger.success(`📧 Email envoyé à: ${payment.user_email}`);
      } catch (emailError) {
        logger.warning(`❌ Erreur envoi email: ${emailError.message}`);
      }
    }

    // Notification SMS
    try {
      if (payment.user_telephone) {
        await smsService.sendSMS(
          payment.user_telephone,
          `🎫 ExpressTrafic - Votre billet est prêt! Code: ${payment.code_reservation}. Trajet: ${payment.ville_depart} → ${payment.ville_arrivee}. Téléchargez: ${FRONTEND_URL}/mes-billets`
        );
        logger.success(`📱 SMS envoyé à: ${payment.user_telephone}`);
      }
    } catch (smsError) {
      logger.warning(`❌ Erreur SMS: ${smsError.message}`);
    }
  }

  // backend/services/paymentService.js - dans la fonction getPaymentStatus
async getPaymentStatus(paymentId) {
  try {
    console.log('🔍 getPaymentStatus - Recherche paiement ID:', paymentId);
    
    const [payments] = await db.execute(
      `SELECT 
        p.*,
        r.id as reservation_id,
        r.code_reservation,
        r.utilisateur_id,
        r.trajet_id,
        r.montant_total,
        r.siege_numero,  
        r.etat_reservation,
        t.ville_depart,
        t.ville_arrivee,
        t.date_depart,
        t.heure_depart,
        u.email AS user_email,
        u.telephone AS user_telephone,
        u.nom AS user_nom,
        u.prenom AS user_prenom
      FROM Paiements p
      LEFT JOIN Reservations r ON p.reservation_id = r.id
      LEFT JOIN Trajets t ON r.trajet_id = t.id
      LEFT JOIN signup u ON r.utilisateur_id = u.id
      WHERE p.id = ?`,
      [paymentId]
    );

    console.log('📊 Résultats de la requête:', {
      nombre: payments.length,
      premiereLigne: payments[0] ? {
        id: payments[0].id,
        reservation_id: payments[0].reservation_id,
        ville_depart: payments[0].ville_depart,
        ville_arrivee: payments[0].ville_arrivee
      } : 'Aucun résultat'
    });

    if (payments.length === 0) {
      console.log('❌ Aucun paiement trouvé pour ID:', paymentId);
      return null;
    }

    const payment = payments[0];

    // Formater les données pour l'API
    const result = {
      paymentId: payment.id,
      status: payment.etat_paiement,
      method: payment.methode,
      amount: payment.montant,
      reference: payment.reference_transaction,
      date: payment.date_paiement,
      reservation: payment.reservation_id ? {
        id: payment.reservation_id,
        code: payment.code_reservation,
        trajet: `${payment.ville_depart} → ${payment.ville_arrivee}`,
        ville_depart: payment.ville_depart,
        ville_arrivee: payment.ville_arrivee,
        date: payment.date_depart,
        time: payment.heure_depart,
        seat: payment.siege_numero,
        montant_total: payment.montant_total,
        status: payment.etat_reservation
      } : null,
      user: payment.user_prenom ? {
        id: payment.utilisateur_id,
        name: `${payment.user_prenom} ${payment.user_nom}`,
        email: payment.user_email,
        phone: payment.user_telephone
      } : null
    };

    console.log('✅ Données formatées:', {
      hasReservation: !!result.reservation,
      reservationData: result.reservation
    });

    return result;
  } catch (error) {
    logger.error(`❌ Erreur getPaymentStatus: ${error.message}`);
    throw error;
  }
}

  /* ============================================================
     🔍 RÉCUPÉRER LES DÉTAILS D'UN PAIEMENT (avec jointures)
  ============================================================ */
  async getPaymentWithDetails(paymentId) {
    try {
      const [payments] = await db.execute(
        `SELECT 
          p.*,
          r.code_reservation,
          r.utilisateur_id,
          r.trajet_id,
          r.montant_total,
          r.siege_numero,
          r.etat_reservation,
          t.ville_depart,
          t.ville_arrivee,
          t.date_depart,
          t.heure_depart,
          u.email AS user_email,
          u.telephone AS user_telephone,
          u.nom AS user_nom,
          u.prenom AS user_prenom
        FROM Paiements p
        JOIN Reservations r ON p.reservation_id = r.id
        JOIN Trajets t ON r.trajet_id = t.id
        JOIN signup u ON r.utilisateur_id = u.id
        WHERE p.id = ?`,
        [paymentId]
      );

      if (payments.length === 0) {
        return null;
      }

      return payments[0];
    } catch (error) {
      logger.error(`❌ Erreur getPaymentWithDetails: ${error.message}`);
      throw error;
    }
  }

  /* ============================================================
     📄 SERVIR FICHIER TICKET
  ============================================================ */
  async serveTicketFile(paymentId, res) {
    try {
      const payment = await this.getPaymentWithDetails(paymentId);
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Paiement introuvable"
        });
      }

      // Vérifier que le paiement est réussi
      if (payment.etat_paiement !== "reussi") {
        return res.status(400).json({
          success: false,
          message: "Le paiement n'a pas encore été confirmé"
        });
      }

      // Chemin du fichier ticket
      const ticketsDir = path.join(__dirname, '..', 'tickets');
      if (!fs.existsSync(ticketsDir)) {
        fs.mkdirSync(ticketsDir, { recursive: true });
      }

      const ticketFileName = `ticket-${payment.code_reservation}.pdf`;
      const ticketPath = path.join(ticketsDir, ticketFileName);

      // Générer le PDF si nécessaire
      if (!fs.existsSync(ticketPath)) {
        const ticketData = {
          reservationCode: payment.code_reservation,
          passengerName: `${payment.user_prenom} ${payment.user_nom}`,
          trajet: `${payment.ville_depart} → ${payment.ville_arrivee}`,
          date: payment.date_depart,
          time: payment.heure_depart,
          seat: payment.siege_numero,
          amount: payment.montant,
          reference: payment.reference_transaction
        };

        // Utiliser le service PDF existant
        await pdfService.generateTicketPDF(ticketData, ticketPath);
      }

      // Servir le fichier
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${ticketFileName}"`);
      
      const fileStream = fs.createReadStream(ticketPath);
      fileStream.pipe(res);

    } catch (error) {
      logger.error(`❌ Erreur serveTicketFile: ${error.message}`);
      throw error;
    }
  }

  /* ============================================================
     🛠️ MÉTHODES UTILITAIRES
  ============================================================ */
  getPaymentDescription(metadata) {
    if (metadata.reservationCount > 1) {
      return `${metadata.reservationCount} réservations ExpressTrafic`;
    }
    return `Réservation ${metadata.ville_depart} → ${metadata.ville_arrivee}`;
  }

  /* ============================================================
     🔍 RÉCUPÉRER L'HISTORIQUE DES PAIEMENTS D'UN UTILISATEUR
  ============================================================ */
  async getUserPaymentHistory(userId, limit = 50) {
    try {
      const [payments] = await db.execute(
        `SELECT 
          p.*,
          r.code_reservation,
          t.ville_depart,
          t.ville_arrivee,
          t.date_depart
        FROM Paiements p
        JOIN Reservations r ON p.reservation_id = r.id
        JOIN Trajets t ON r.trajet_id = t.id
        WHERE r.utilisateur_id = ?
        ORDER BY p.date_paiement DESC
        LIMIT ?`,
        [userId, limit]
      );

      return payments;
    } catch (error) {
      logger.error(`❌ Erreur getUserPaymentHistory: ${error.message}`);
      throw error;
    }
  }

  /* ============================================================
     ❌ ANNULER UN PAIEMENT
  ============================================================ */
  async cancelPayment(paymentId, userId) {
    try {
      // Vérifier que le paiement appartient à l'utilisateur
      const payment = await this.getPaymentWithDetails(paymentId);
      if (!payment || payment.utilisateur_id !== userId) {
        throw new Error("Paiement non trouvé ou non autorisé");
      }

      // Vérifier que le paiement peut être annulé
      if (payment.etat_paiement === 'reussi') {
        throw new Error("Impossible d'annuler un paiement déjà réussi");
      }

      // Annuler le paiement
      await db.execute(
        `UPDATE Paiements 
         SET etat_paiement = 'annule', date_paiement = NOW()
         WHERE id = ?`,
        [paymentId]
      );

      // Annuler la réservation associée
      await reservationService.cancelReservation(payment.reservation_id, 'Paiement annulé');

      logger.success(`❌ Paiement ${paymentId} annulé par l'utilisateur ${userId}`);

      return {
        success: true,
        message: "Paiement annulé avec succès"
      };
    } catch (error) {
      logger.error(`❌ Erreur cancelPayment: ${error.message}`);
      throw error;
    }
  }

  /* ============================================================
     💰 CALCULER LES FRAIS DE PAIEMENT
  ============================================================ */
  async calculateFees(amount, method) {
    // Définir les frais par méthode
    const fees = {
      'carte': 0.02,      // 2%
      'paypal': 0.03,     // 3%
      'mobile_money': 0.01, // 1%
      'especes': 0.00     // 0%
    };

    const feePercentage = fees[method] || 0.02;
    const feeAmount = amount * feePercentage;
    const total = amount + feeAmount;

    return {
      amount: parseFloat(amount),
      method: method,
      feePercentage: feePercentage * 100,
      feeAmount: parseFloat(feeAmount.toFixed(2)),
      total: parseFloat(total.toFixed(2))
    };
  }
}

module.exports = new PaymentService();