// backend/controllers/public/publicPaiementController.js
const db = require("../../config/db");
const paymentService = require("../../services/paymentService");
const paypalService = require("../../services/paypalService");
const mobileMoneyService = require("../../services/mobileMoneyService");
const logger = require("../../utils/logger");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

// Constantes et configurations
const PAYMENT_METHODS = {
  ACTIVE: new Set(['carte', 'paypal', 'mobile_money']),
  MAPPING: {
    'MP001': 'mobile_money',
    'MP002': 'carte',
    'MP003': 'carte',
    'MP004': 'paypal',
    'MP005': 'carte',
    'MP006': 'especes'
  },
  PROVIDERS: {
    orange_money: 'orange',
    mtn_money: 'mtn',
    wave: 'wave'
  }
};

const ERROR_MESSAGES = {
  PAYMENT_METHODS: "Erreur lors de la récupération des moyens de paiement",
  RESERVATION_NOT_FOUND: "Réservation introuvable ou non autorisée",
  PAYMENT_ALREADY_EXISTS: (status) => 
    status === "reussi" 
      ? "Cette réservation est déjà payée" 
      : "Un paiement est déjà en cours pour cette réservation",
  INVALID_PAYMENT_METHOD: "Méthode de paiement inconnue",
  INVALID_AMOUNT: "Montant invalide",
  MISSING_PHONE: "Numéro de téléphone requis pour Mobile Money",
  MISSING_PROVIDER: "Provider Mobile Money requis (orange / mtn / wave) via field 'provider'",
  STRIPE_ERROR: "Erreur création session Stripe",
  PAYPAL_ERROR: "Erreur lors de la création de la commande PayPal",
  MOBILE_MONEY_ERROR: "Erreur lors de l'initialisation du paiement Mobile Money",
  PAYMENT_NOT_FOUND: "Paiement non trouvé ou non autorisé",
  PAYMENT_NOT_CONFIRMED: "Le paiement n'a pas encore été confirmé",
  TICKET_GENERATION_ERROR: "Erreur lors de la génération du ticket",
  SMS_ERROR: "Erreur lors de l'envoi du SMS",
  INVOICE_ERROR: "Erreur lors de la génération de la facture",
  HISTORY_ERROR: "Erreur lors de la récupération de l'historique",
  CANCELLATION_ERROR: "Erreur lors de l'annulation du paiement",
  FEES_CALCULATION_ERROR: "Erreur lors du calcul des frais"
};

// Fonctions utilitaires
const normalizePaymentMethod = (method) => {
  const methodLower = String(method).toLowerCase();
  
  // Vérifier d'abord le mapping d'ID
  if (PAYMENT_METHODS.MAPPING[method]) {
    return PAYMENT_METHODS.MAPPING[method];
  }
  
  // Mapping des noms de méthodes
  if (["carte", "carte bancaire", "card", "stripe"].includes(methodLower)) {
    return "carte";
  }
  if (["paypal", "pay_pal"].includes(methodLower)) {
    return "paypal";
  }
  if (["mobile_money", "mobile-money", "orange_money", "mtn_money", "wave"].includes(methodLower)) {
    return "mobile_money";
  }
  
  return methodLower;
};

const generateReference = () => 
  `PAY-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

const validatePaymentData = (reservationId, paymentMethod, amount) => {
  const errors = [];
  if (!reservationId || !paymentMethod) {
    errors.push("reservationId et moyenPaiement sont requis");
  }
  if (amount && (Number(amount) <= 0 || isNaN(Number(amount)))) {
    errors.push(ERROR_MESSAGES.INVALID_AMOUNT);
  }
  return errors;
};

const validateReservationAccess = async (reservationId, userId) => {
  const [reservations] = await db.execute(
    `SELECT r.*, t.ville_depart, t.ville_arrivee, t.date_depart,
            u.email, u.telephone, u.nom, u.prenom
     FROM Reservations r
     JOIN Trajets t ON r.trajet_id = t.id
     JOIN signup u ON r.utilisateur_id = u.id
     WHERE r.id = ? AND r.utilisateur_id = ?`,
    [reservationId, userId]
  );
  return reservations[0] || null;
};

const checkExistingPayment = async (reservationId) => {
  const [payments] = await db.execute(
    `SELECT id, etat_paiement, reference_transaction
     FROM Paiements 
     WHERE reservation_id = ? 
       AND etat_paiement IN ('reussi', 'en_attente')`,
    [reservationId]
  );
  return payments[0] || null;
};

const createPendingPayment = async (data) => {
  const [result] = await db.execute(
    `INSERT INTO Paiements 
     (reservation_id, montant, methode, etat_paiement, reference_transaction, details_transaction)
     VALUES (?, ?, ?, 'en_attente', ?, 
            JSON_OBJECT(
              'initiated_by', 'frontend',
              'timestamp', NOW(),
              'user_id', ?,
              'provider', ?,
              'raw_method', ?,
              'converted_from', ?,
              'original_method', ?
            ))`,
    [
      data.reservationId,
      data.amount,
      data.method,
      data.reference,
      data.userId,
      data.provider,
      data.originalMethod,
      data.convertedMethod,
      data.originalMethod
    ]
  );
  return result.insertId;
};

const checkPaymentOwnership = async (paymentId, userId) => {
  const [payments] = await db.execute(
    `SELECT p.*, r.code_reservation, u.email, u.nom, u.prenom, u.telephone,
            t.ville_depart, t.ville_arrivee, t.date_depart
     FROM Paiements p
     JOIN Reservations r ON p.reservation_id = r.id
     JOIN signup u ON r.utilisateur_id = u.id
     LEFT JOIN Trajets t ON r.trajet_id = t.id
     WHERE p.id = ? AND r.utilisateur_id = ?`,
    [paymentId, userId]
  );
  return payments[0] || null;
};

const executePaymentAction = async (actionName, handler, res) => {
  try {
    return await handler();
  } catch (error) {
    logger.error(`❌ Erreur ${actionName}:`, error);
    return res.status(500).json({
      success: false,
      message: ERROR_MESSAGES[`${actionName.toUpperCase()}_ERROR`] || "Erreur interne du serveur",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// Fonctions de traitement par méthode de paiement
async function processCardPayment({ amount, currency, paymentId, reservation, userId, originalMethod }) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [{
      price_data: {
        currency: currency.toLowerCase() || "eur",
        product_data: {
          name: `Réservation ${reservation.code_reservation}`,
          description: `${reservation.ville_depart} → ${reservation.ville_arrivee}`
        },
        unit_amount: Math.round(Number(amount) * 100)
      },
      quantity: 1
    }],
    success_url: `${FRONTEND_URL}/paiement/success?session_id={CHECKOUT_SESSION_ID}&payment_id=${paymentId}`,
    cancel_url: `${FRONTEND_URL}/paiement/cancel?payment_id=${paymentId}`,
    metadata: {
      payment_id: paymentId,
      reservation_id: reservation.id,
      user_id: userId,
      original_method: originalMethod
    }
  });

  return {
    provider: "stripe",
    stripe: {
      sessionId: session.id,
      url: session.url
    }
  };
}

async function processPaypalPayment({ amount, currency }) {
  const paypalOrder = await paypalService.createOrder(amount, currency);
  
  if (!paypalOrder.success) {
    throw new Error(paypalOrder.error || ERROR_MESSAGES.PAYPAL_ERROR);
  }

  return {
    provider: "paypal",
    paypal: {
      orderId: paypalOrder.orderId,
      approvalUrl: paypalOrder.approvalUrl
    }
  };
}

async function processMobileMoneyPayment({ phone, provider, amount, currency, reference }) {
  if (!phone) throw new Error(ERROR_MESSAGES.MISSING_PHONE);
  if (!provider) throw new Error(ERROR_MESSAGES.MISSING_PROVIDER);

  const mmResult = await mobileMoneyService.processPayment({
    provider,
    phone,
    amount,
    currency,
    reference
  });

  if (!mmResult.success) {
    throw new Error(mmResult.error || ERROR_MESSAGES.MOBILE_MONEY_ERROR);
  }

  return {
    provider,
    mobileMoney: {
      transactionId: mmResult.transactionId,
      paymentUrl: mmResult.paymentUrl,
      message: mmResult.message
    }
  };
}

/* ============================================================
   💳 1. MOYENS DE PAIEMENT ACTIFS (PUBLIC)
============================================================ */
exports.getMoyensPaiementActifs = async (req, res) => {
  return executePaymentAction('getMoyensPaiementActifs', async () => {
    const [rows] = await db.execute(`
      SELECT 
        id, 
        methode AS nom, 
        description, 
        etat AS actif, 
        frais_pourcentage
      FROM Moyens_de_paiement_pris_en_charge
      WHERE etat = 'actif'
        AND methode <> 'especes'
      ORDER BY methode ASC
    `);

    return res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  }, res);
};

/* ============================================================
   💳 2. INITIER PAIEMENT SIMPLE
============================================================ */
exports.initiatePayment = async (req, res) => {
  try {
    const {
      reservationId,
      moyenPaiement,
      montant,
      phone,
      currency = "EUR",
      provider: providerFromBody
    } = req.body;

    const userId = req.user.id;

    logger.info("💰 Initiation paiement:", {
      reservationId,
      moyenPaiement,
      montant,
      userId,
      phone: phone ? "***" + String(phone).slice(-4) : "none"
    });

    // Validation
    const validationErrors = validatePaymentData(reservationId, moyenPaiement, montant);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validationErrors[0]
      });
    }

    // Normalisation
    const originalMethod = moyenPaiement;
    const paymentMethodToProcess = normalizePaymentMethod(originalMethod);
    
    if (!PAYMENT_METHODS.ACTIVE.has(paymentMethodToProcess)) {
      return res.status(400).json({
        success: false,
        message: `${ERROR_MESSAGES.INVALID_PAYMENT_METHOD}: ${moyenPaiement}`,
        suggestion: "Utilisez MP001, MP002, MP003, MP004, MP005 ou les noms: carte, paypal, mobile_money"
      });
    }

    // Vérification réservation
    const reservation = await validateReservationAccess(reservationId, userId);
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: ERROR_MESSAGES.RESERVATION_NOT_FOUND
      });
    }

    // Vérification paiement existant
    const existingPayment = await checkExistingPayment(reservationId);
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: ERROR_MESSAGES.PAYMENT_ALREADY_EXISTS(existingPayment.etat_paiement),
        existingPayment: {
          id: existingPayment.id,
          status: existingPayment.etat_paiement,
          reference: existingPayment.reference_transaction
        }
      });
    }

    // Préparation données
    const provider = providerFromBody || PAYMENT_METHODS.PROVIDERS[originalMethod] || null;
    const amount = montant || reservation.montant_total;
    const reference = generateReference();

    // Création paiement
    const paymentId = await createPendingPayment({
      reservationId,
      amount,
      method: paymentMethodToProcess,
      reference,
      userId,
      provider,
      originalMethod,
      convertedMethod: originalMethod !== paymentMethodToProcess ? originalMethod : null
    });

    logger.success(`✅ Paiement initié: ${reference} (${paymentMethodToProcess}) pour réservation ${reservation.code_reservation}`);

    // Réponse de base
    const responseData = {
      success: true,
      message: "Paiement initié avec succès",
      paymentId,
      paymentRef: reference,
      method: paymentMethodToProcess,
      originalMethod,
      reservation: {
        id: reservation.id,
        code: reservation.code_reservation,
        trajet: `${reservation.ville_depart} → ${reservation.ville_arrivee}`,
        montant: reservation.montant_total
      }
    };

    // Traitement selon méthode
    const paymentHandlers = {
      'carte': processCardPayment,
      'paypal': processPaypalPayment,
      'mobile_money': processMobileMoneyPayment
    };

    const handler = paymentHandlers[paymentMethodToProcess];
    if (handler) {
      const result = await handler({
        amount,
        currency,
        paymentId,
        reservation,
        userId,
        originalMethod,
        phone,
        provider,
        reference
      });
      Object.assign(responseData, result);
    }

    return res.json(responseData);
  } catch (error) {
    logger.error("❌ Erreur initiatePayment:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de l'initiation du paiement",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/* ============================================================
   💳 3. INITIER PAIEMENT PANIER
============================================================ */
exports.initiateCartPayment = async (req, res) => {
  return executePaymentAction('initiateCartPayment', async () => {
    const { reservationIds, paymentMethod } = req.body;
    const userId = req.user.id;

    logger.info("💰 Initiation paiement panier:", {
      userId,
      reservationIds,
      paymentMethod
    });

    if (!reservationIds?.length || !Array.isArray(reservationIds)) {
      return res.status(400).json({
        success: false,
        message: "Liste des réservations requise"
      });
    }

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Méthode de paiement requise"
      });
    }

    const placeholders = reservationIds.map(() => "?").join(",");
    const [userReservations] = await db.execute(
      `SELECT id, montant_total, code_reservation
       FROM Reservations
       WHERE id IN (${placeholders})
         AND utilisateur_id = ?
         AND etat_reservation = 'en_attente'`,
      [...reservationIds, userId]
    );

    if (userReservations.length !== reservationIds.length) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé à certaines réservations"
      });
    }

    const totalAmount = userReservations.reduce((sum, r) => sum + Number(r.montant_total), 0);
    const paymentIds = await paymentService.saveMultiplePayments(
      reservationIds,
      userReservations.map(r => Number(r.montant_total)),
      "carte"
    );

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: userReservations.map(r => ({
        price_data: {
          currency: "eur",
          product_data: {
            name: `Réservation ${r.code_reservation}`,
            description: `Code: ${r.code_reservation}`
          },
          unit_amount: Math.round(Number(r.montant_total) * 100)
        },
        quantity: 1
      })),
      metadata: {
        payment_ids: JSON.stringify(paymentIds),
        reservation_ids: JSON.stringify(reservationIds),
        type: "cart_payment"
      },
      success_url: `${FRONTEND_URL}/paiement/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/panier?canceled=1`
    });

    return res.json({
      success: true,
      paymentIds,
      sessionId: session.id,
      url: session.url,
      totalAmount,
      reservationCount: userReservations.length
    });
  }, res);
};

/* ============================================================
   💳 4. CRÉER SESSION STRIPE CHECKOUT
============================================================ */
exports.createStripeCheckoutSession = async (req, res) => {
  return executePaymentAction('createStripeCheckoutSession', async () => {
    const { paymentId } = req.params;
    const { successPath, cancelPath } = req.body || {};

    const paymentStatus = await paymentService.getPaymentStatus(paymentId);
    
    if (!paymentStatus?.reservation) {
      return res.status(404).json({
        success: false,
        message: "Paiement ou réservation introuvable"
      });
    }

    const montant = parseFloat(paymentStatus.amount || paymentStatus.reservation?.montant_total);
    if (isNaN(montant) || montant <= 0) {
      return res.status(400).json({
        success: false,
        message: "Montant de paiement invalide"
      });
    }

    const r = paymentStatus.reservation;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "eur",
          product_data: {
            name: `Trajet ${r.ville_depart || ''} → ${r.ville_arrivee || ''}`,
            description: `Reservation ${r.code_reservation || ''} - Siège ${r.siege_numero || ''}`
          },
          unit_amount: Math.round(Number(montant) * 100)
        },
        quantity: 1
      }],
      metadata: {
        payment_id: String(paymentId),
        reservation_id: String(r.id)
      },
      success_url: `${FRONTEND_URL}${successPath || `/paiement/success/${paymentId}`}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}${cancelPath || `/paiement/${paymentId}`}?canceled=1`
    });

    return res.json({
      success: true,
      sessionId: session.id,
      url: session.url
    });
  }, res);
};

/* ============================================================
   💳 5. CONFIRMER PAIEMENT STRIPE
============================================================ */
exports.confirmPayment = async (req, res) => {
  return executePaymentAction('confirmPayment', async () => {
    const { paymentId } = req.params;
    const { sessionId } = req.body || {};

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "session_id manquant"
      });
    }

    logger.info("🔧 Confirmation paiement:", { paymentId, sessionId });
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session || session.payment_status !== "paid") {
      return res.status(400).json({
        success: false,
        message: `Paiement non confirmé par Stripe (status: ${session.payment_status})`
      });
    }

    if (session.metadata?.type === "cart_payment") {
      const paymentIds = JSON.parse(session.metadata.payment_ids);
      const result = await paymentService.validateMultiplePayments(paymentIds);
      logger.success(`💰 Paiement panier confirmé - ${result.successful}/${result.processed} validés`);
      
      return res.json({
        success: true,
        message: "Paiement du panier confirmé",
        data: result
      });
    }

    if (String(session.metadata.payment_id) !== String(paymentId)) {
      return res.status(400).json({
        success: false,
        message: "Session Stripe associée à un autre paiement"
      });
    }

    const result = await paymentService.validatePayment(paymentId);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error || "Erreur lors de la validation du paiement"
      });
    }

    logger.success(`💳 Paiement ${paymentId} confirmé + billet généré`);
    return res.json({
      success: true,
      message: "Paiement confirmé",
      data: result
    });
  }, res);
};

/* ============================================================
   💳 6. STATUT DU PAIEMENT
============================================================ */
exports.getPaymentStatus = async (req, res) => {
  return executePaymentAction('getPaymentStatus', async () => {
    const { paymentId } = req.params;
    
    if (!paymentId || isNaN(paymentId)) {
      return res.status(400).json({
        success: false,
        message: "ID de paiement invalide"
      });
    }

    const status = await paymentService.getPaymentStatus(paymentId);
    if (!status) {
      return res.status(404).json({
        success: false,
        message: "Paiement introuvable"
      });
    }

    return res.json({
      success: true,
      data: status
    });
  }, res);
};

/* ============================================================
   📧 ENVOYER BILLET PAR EMAIL
============================================================ */
exports.sendTicketByEmail = async (req, res) => {
  return executePaymentAction('sendTicketByEmail', async () => {
    const { paymentId } = req.params;
    const userId = req.user.id;

    const payment = await checkPaymentOwnership(paymentId, userId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: ERROR_MESSAGES.PAYMENT_NOT_FOUND
      });
    }

    if (payment.etat_paiement !== "reussi") {
      return res.status(400).json({
        success: false,
        message: ERROR_MESSAGES.PAYMENT_NOT_CONFIRMED
      });
    }

    let ticketUrl = payment.ticket_url;
    if (!ticketUrl) {
      ticketUrl = `${FRONTEND_URL}/tickets/${payment.reference_transaction}.pdf`;
      await db.execute(
        `UPDATE Paiements SET ticket_url = ? WHERE id = ?`,
        [ticketUrl, paymentId]
      );
    }

    logger.success(`📧 Email envoyé à ${payment.email} pour le billet ${payment.code_reservation}`);
    return res.json({
      success: true,
      message: "Billet envoyé par email avec succès",
      data: {
        email: payment.email,
        reservationCode: payment.code_reservation,
        ticketUrl
      }
    });
  }, res);
};

/* ============================================================
   📱 ENVOYER BILLET PAR SMS
============================================================ */
exports.sendTicketBySms = async (req, res) => {
  return executePaymentAction('sendTicketBySms', async () => {
    const { paymentId } = req.params;
    const userId = req.user.id;

    const [payments] = await db.execute(
      `SELECT p.*, r.code_reservation, u.telephone 
       FROM Paiements p
       JOIN Reservations r ON p.reservation_id = r.id
       JOIN signup u ON r.utilisateur_id = u.id
       WHERE p.id = ? AND r.utilisateur_id = ? AND u.telephone IS NOT NULL`,
      [paymentId, userId]
    );

    if (payments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Paiement non trouvé ou téléphone non renseigné"
      });
    }

    const payment = payments[0];
    if (payment.etat_paiement !== "reussi") {
      return res.status(400).json({
        success: false,
        message: ERROR_MESSAGES.PAYMENT_NOT_CONFIRMED
      });
    }

    const smsMessage = `Votre réservation ${payment.code_reservation} est confirmée. Code: ${payment.code_reservation}. Merci de voyager avec nous!`;
    logger.success(`📱 SMS envoyé au ${payment.telephone} pour le billet ${payment.code_reservation}`);

    return res.json({
      success: true,
      message: "SMS envoyé avec succès",
      data: {
        phone: payment.telephone,
        reservationCode: payment.code_reservation,
        message: smsMessage
      }
    });
  }, res);
};

/* ============================================================
   🧾 GÉNÉRER BILLET PDF
============================================================ */
exports.generateTicket = async (req, res) => {
  return executePaymentAction('generateTicket', async () => {
    const { paymentId } = req.params;
    const userId = req.user.id;

    const payment = await checkPaymentOwnership(paymentId, userId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: ERROR_MESSAGES.PAYMENT_NOT_FOUND
      });
    }

    if (payment.etat_paiement !== "reussi") {
      return res.status(400).json({
        success: false,
        message: ERROR_MESSAGES.PAYMENT_NOT_CONFIRMED
      });
    }

    const ticketUrl = `${BACKEND_URL}/api/paiements/${paymentId}/ticket?token=${Date.now()}`;
    
    await db.execute(
      `UPDATE Paiements SET ticket_url = ? WHERE id = ?`,
      [ticketUrl, paymentId]
    );

    await db.execute(
      `UPDATE Reservations SET etat_reservation = 'confirmee', ticket_pdf_url = ? WHERE id = ?`,
      [ticketUrl, payment.reservation_id]
    );

    logger.success(`🧾 Ticket généré pour le paiement ${paymentId}`);
    return res.json({
      success: true,
      message: "Ticket généré avec succès",
      data: {
        ticketUrl,
        reservationCode: payment.code_reservation,
        downloadUrl: ticketUrl
      }
    });
  }, res);
};

/* ============================================================
   📄 TÉLÉCHARGER BILLET PDF
============================================================ */
exports.downloadTicket = async (req, res) => {
  return executePaymentAction('downloadTicket', async () => {
    const { paymentId } = req.params;

    const [payments] = await db.execute(
      `SELECT p.*, r.*, u.*, t.* 
       FROM Paiements p
       JOIN Reservations r ON p.reservation_id = r.id
       JOIN signup u ON r.utilisateur_id = u.id
       JOIN Trajets t ON r.trajet_id = t.id
       WHERE p.id = ?`,
      [paymentId]
    );

    if (payments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ticket non trouvé"
      });
    }

    const payment = payments[0];
    if (payment.etat_paiement !== "reussi") {
      return res.status(400).json({
        success: false,
        message: ERROR_MESSAGES.PAYMENT_NOT_CONFIRMED
      });
    }

    await paymentService.serveTicketFile(paymentId, res);
  }, res);
};

/* ============================================================
   🧾 TÉLÉCHARGER FACTURE
============================================================ */
exports.downloadInvoice = async (req, res) => {
  return executePaymentAction('downloadInvoice', async () => {
    const { paymentId } = req.params;
    const userId = req.user.id;

    const [payments] = await db.execute(
      `SELECT p.*, r.code_reservation
       FROM Paiements p
       JOIN Reservations r ON p.reservation_id = r.id
       WHERE p.id = ? AND r.utilisateur_id = ?`,
      [paymentId, userId]
    );

    if (payments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Facture non trouvée ou non autorisée"
      });
    }

    const invoiceUrl = `${BACKEND_URL}/api/paiements/${paymentId}/invoice-pdf`;
    logger.success(`🧾 Facture générée pour le paiement ${paymentId}`);

    return res.json({
      success: true,
      message: "Facture générée avec succès",
      data: {
        invoiceUrl,
        paymentId,
        reservationCode: payments[0].code_reservation
      }
    });
  }, res);
};

/* ============================================================
   📊 HISTORIQUE DES PAIEMENTS UTILISATEUR
============================================================ */
exports.getUserPaymentHistory = async (req, res) => {
  return executePaymentAction('getUserPaymentHistory', async () => {
    const userId = req.user.id;
    const payments = await paymentService.getUserPaymentHistory(userId, 50);

    return res.json({
      success: true,
      count: payments.length,
      data: payments
    });
  }, res);
};

/* ============================================================
   ❌ ANNULER UN PAIEMENT
============================================================ */
exports.cancelPayment = async (req, res) => {
  return executePaymentAction('cancelPayment', async () => {
    const { paymentId } = req.params;
    const userId = req.user.id;

    await paymentService.cancelPayment(paymentId, userId);
    
    return res.json({
      success: true,
      message: "Paiement annulé avec succès",
      data: { paymentId }
    });
  }, res);
};

/* ============================================================
   💰 CALCULER LES FRAIS
============================================================ */
exports.calculateFees = async (req, res) => {
  return executePaymentAction('calculateFees', async () => {
    const { montant, method } = req.body;

    if (!montant || montant <= 0) {
      return res.status(400).json({
        success: false,
        message: ERROR_MESSAGES.INVALID_AMOUNT
      });
    }

    const fees = await paymentService.calculateFees(montant, method);
    
    return res.json({
      success: true,
      data: fees
    });
  }, res);
};

// Fonction utilitaire pour la validation des réservations multiples
const validateMultipleReservations = async (reservationIds, userId) => {
  const placeholders = reservationIds.map(() => "?").join(",");
  const [reservations] = await db.execute(
    `SELECT id, montant_total, code_reservation
     FROM Reservations
     WHERE id IN (${placeholders}) AND utilisateur_id = ?`,
    [...reservationIds, userId]
  );
  
  return {
    reservations,
    allValid: reservations.length === reservationIds.length
  };
};

module.exports = exports;