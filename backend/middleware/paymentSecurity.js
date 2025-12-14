const logger = require("../utils/logger");
const { logSecurityEvent } = require("../utils/securityUtils");

const paymentSecurity = {
  // 🔒 Valider les montants de paiement
  validateAmount: (req, res, next) => {
    const { amount } = req.body;
    
    if (!amount || isNaN(amount) || amount <= 0) {
      logSecurityEvent('INVALID_PAYMENT_AMOUNT', req.ip, req.user?.id, { amount });
      return res.status(400).json({
        success: false,
        message: "Montant de paiement invalide"
      });
    }

    // Limite maximale (1000€)
    if (amount > 1000) {
      logSecurityEvent('EXCESSIVE_PAYMENT_AMOUNT', req.ip, req.user?.id, { amount });
      return res.status(400).json({
        success: false,
        message: "Montant de paiement trop élevé"
      });
    }

    next();
  },

  // 🔒 Valider les méthodes de paiement
  validateMethod: (allowedMethods) => {
    return (req, res, next) => {
      const { method } = req.body;
      
      if (!allowedMethods.includes(method)) {
        logSecurityEvent('INVALID_PAYMENT_METHOD', req.ip, req.user?.id, { method });
        return res.status(400).json({
          success: false,
          message: `Méthode de paiement non supportée. Méthodes autorisées: ${allowedMethods.join(', ')}`
        });
      }

      next();
    };
  },

  // 🔒 Prévention contre la double soumission
  preventDuplicate: async (req, res, next) => {
    const { reservationId } = req.body;
    const userId = req.user?.id;

    try {
      const [existing] = await db.execute(`
        SELECT * FROM Paiements 
        WHERE reservation_id = ? 
        AND etat_paiement IN ('en_attente', 'reussi')
        AND JSON_EXTRACT(details_transaction, '$.user_id') = ?
        AND created_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
      `, [reservationId, userId]);

      if (existing.length > 0) {
        logSecurityEvent('DUPLICATE_PAYMENT_ATTEMPT', req.ip, userId, { reservationId });
        return res.status(429).json({
          success: false,
          message: "Un paiement est déjà en cours pour cette réservation. Veuillez patienter."
        });
      }

      next();
    } catch (error) {
      logger.error("❌ Erreur preventDuplicate:", error);
      next();
    }
  },

  // 🔒 Vérifier l'adresse IP contre les fraudes
  checkFraudulentIP: (req, res, next) => {
    const fraudulentIPs = []; // À remplir avec une liste noire ou API
    const clientIP = req.ip;

    if (fraudulentIPs.includes(clientIP)) {
      logSecurityEvent('FRAUDULENT_IP_BLOCKED', clientIP, req.user?.id);
      return res.status(403).json({
        success: false,
        message: "Accès refusé pour des raisons de sécurité"
      });
    }

    next();
  }
};

module.exports = paymentSecurity;