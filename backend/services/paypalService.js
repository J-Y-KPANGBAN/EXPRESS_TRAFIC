// backend/services/paypalService.js
const axios = require('axios');
const { logSecurityEvent } = require("../utils/securityUtils");
const logger = require("../utils/logger");

class PayPalService {
  constructor() {
    this.baseURL = process.env.PAYPAL_ENVIRONMENT === 'live' 
      ? 'https://api.paypal.com' 
      : 'https://api.sandbox.paypal.com';
    
    this.clientId = process.env.PAYPAL_CLIENT_ID;
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  }

  /* ============================================================
     🔐 OBTENTION DU TOKEN D'ACCÈS
  ============================================================ */
  async getAccessToken() {
    try {
      const response = await axios.post(`${this.baseURL}/v1/oauth2/token`, 
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          auth: {
            username: this.clientId,
            password: this.clientSecret
          }
        }
      );

      return response.data.access_token;
    } catch (error) {
      logger.error('❌ Erreur obtention token PayPal:', error.response?.data || error.message);
      throw new Error('Impossible de se connecter à PayPal');
    }
  }

  /* ============================================================
     💳 CRÉATION D'UNE COMMANDE
  ============================================================ */
  async createOrder(amount, currency = 'EUR') {
    try {
      const accessToken = await this.getAccessToken();

      const orderData = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value: amount.toString()
            },
            description: 'Réservation ExpressTrafic - Service de transport'
          }
        ],
        application_context: {
          brand_name: 'ExpressTrafic',
          landing_page: 'BILLING',
          user_action: 'PAY_NOW',
          return_url: `${process.env.FRONTEND_URL}/paiement/paypal/success`,
          cancel_url: `${process.env.FRONTEND_URL}/paiement/cancel`
        }
      };

      const response = await axios.post(
        `${this.baseURL}/v2/checkout/orders`,
        orderData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.success(`✅ Commande PayPal créée: ${response.data.id}`);

      return {
        success: true,
        orderId: response.data.id,
        approvalUrl: response.data.links.find(link => link.rel === 'approve').href
      };

    } catch (error) {
      logger.error('❌ Erreur création commande PayPal:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la création de la commande PayPal',
        code: 'PAYPAL_ORDER_ERROR'
      };
    }
  }

  /* ============================================================
     ✅ CAPTURE DU PAIEMENT
  ============================================================ */
  async captureOrder(orderID) {
    try {
      const accessToken = await this.getAccessToken();

      const response = await axios.post(
        `${this.baseURL}/v2/checkout/orders/${orderID}/capture`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          }
        }
      );

      const capture = response.data.purchase_units[0].payments.captures[0];

      logger.success(`✅ Paiement PayPal capturé: ${capture.id}`);

      return {
        success: true,
        captureId: capture.id,
        status: capture.status,
        amount: parseFloat(capture.amount.value),
        currency: capture.amount.currency_code
      };

    } catch (error) {
      logger.error('❌ Erreur capture commande PayPal:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la capture du paiement PayPal',
        code: 'PAYPAL_CAPTURE_ERROR'
      };
    }
  }

  /* ============================================================
     🔍 VÉRIFICATION D'UNE COMMANDE
  ============================================================ */
  async verifyOrder(orderID) {
    try {
      const accessToken = await this.getAccessToken();

      const response = await axios.get(
        `${this.baseURL}/v2/checkout/orders/${orderID}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      const order = response.data;
      const status = order.status;

      return {
        success: true,
        orderId: orderID,
        status: status,
        isPaid: status === 'COMPLETED',
        details: order
      };

    } catch (error) {
      logger.error('❌ Erreur vérification commande PayPal:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la vérification de la commande PayPal'
      };
    }
  }

  /* ============================================================
     ↩️ REMBOURSEMENT
  ============================================================ */
  async refundPayment(captureId, amount = null, note = 'Remboursement ExpressTrafic') {
    try {
      const accessToken = await this.getAccessToken();

      const refundData = {
        note_to_payer: note,
        ...(amount && {
          amount: {
            value: amount.toString(),
            currency_code: 'EUR'
          }
        })
      };

      const response = await axios.post(
        `${this.baseURL}/v2/payments/captures/${captureId}/refund`,
        refundData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          }
        }
      );

      logger.success(`✅ Remboursement PayPal effectué: ${response.data.id}`);

      return {
        success: true,
        refundId: response.data.id,
        status: response.data.status
      };

    } catch (error) {
      logger.error('❌ Erreur remboursement PayPal:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors du remboursement PayPal'
      };
    }
  }

  /* ============================================================
     🌍 GESTION MULTI-DEVISES
  ============================================================ */
  getSupportedCurrencies() {
    return [
      'AUD', 'BRL', 'CAD', 'CNY', 'CZK', 'DKK', 'EUR', 'HKD', 'HUF', 'INR',
      'ILS', 'JPY', 'MYR', 'MXN', 'TWD', 'NZD', 'NOK', 'PHP', 'PLN', 'GBP',
      'RUB', 'SGD', 'SEK', 'CHF', 'THB', 'USD', 'XOF', 'XAF'
    ];
  }

  /* ============================================================
     📊 VÉRIFICATION DISPONIBILITÉ PAYPAL
  ============================================================ */
  async checkAvailability() {
    try {
      await this.getAccessToken();
      return { available: true, message: 'PayPal opérationnel' };
    } catch (error) {
      return { 
        available: false, 
        message: 'PayPal indisponible',
        error: error.message 
      };
    }
  }
}

module.exports = new PayPalService();