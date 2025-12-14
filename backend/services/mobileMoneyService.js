// backend/services/mobileMoneyService.js
const axios = require('axios');
const { logSecurityEvent } = require("../utils/securityUtils");
const logger = require("../utils/logger");

class MobileMoneyService {
  constructor() {
    this.providers = {
      orange: {
        name: 'Orange Money',
        apiUrl: process.env.ORANGE_MONEY_API_URL,
        apiKey: process.env.ORANGE_MONEY_API_KEY,
        merchantCode: process.env.ORANGE_MERCHANT_CODE,
        // Documentation: https://developer.orange.com/apis/orange-money-marketplace/
      },
      mtn: {
        name: 'MTN Mobile Money',
        apiUrl: process.env.MTN_MONEY_API_URL,
        apiKey: process.env.MTN_MONEY_API_KEY,
        // Documentation: https://momodeveloper.mtn.com/
      },
      moov: {
        name: 'Moov Money',
        apiUrl: process.env.MOOV_MONEY_API_URL,
        apiKey: process.env.MOOV_MONEY_API_KEY,
      },
      wave: {
        name: 'Wave',
        apiUrl: process.env.WAVE_API_URL,
        apiKey: process.env.WAVE_API_KEY,
        // Documentation: https://www.wave.com/fr/api/
      }
    };
  }

  /* ============================================================
     💳 PROCESSUS PAIEMENT MOBILE MONEY
  ============================================================ */
  async processPayment(paymentData) {
    const { provider, phone, amount, currency, reference } = paymentData;
    const config = this.providers[provider];
    
    if (!config) {
      throw new Error(`Provider ${provider} non supporté`);
    }

    logger.info(`💸 Tentative paiement ${config.name} - ${phone} - ${amount} ${currency}`);

    try {
      // Simulation en développement - Remplacer par l'API réelle en production
      if (process.env.NODE_ENV !== 'production') {
        return await this.simulatePayment(provider, phone, amount, reference);
      }

      // Intégration réelle selon le provider
      switch (provider) {
        case 'orange':
          return await this.processOrangePayment(phone, amount, currency, reference, config);
        case 'mtn':
          return await this.processMTNPayment(phone, amount, currency, reference, config);
        case 'wave':
          return await this.processWavePayment(phone, amount, currency, reference, config);
        default:
          throw new Error(`Intégration ${provider} non implémentée`);
      }

    } catch (error) {
      logger.error(`❌ Erreur paiement ${config.name}:`, error);
      
      logSecurityEvent('MOBILE_MONEY_PAYMENT_FAILED', null, null, {
        provider,
        phone,
        amount,
        error: error.message
      });

      return {
        success: false,
        error: error.message,
        code: 'MOBILE_MONEY_ERROR'
      };
    }
  }

  /* ============================================================
     🟠 ORANGE MONEY - INTÉGRATION
  ============================================================ */
  async processOrangePayment(phone, amount, currency, reference, config) {
    // Exemple d'intégration Orange Money API
    const payload = {
      merchant_key: config.apiKey,
      currency: currency || 'XOF',
      order_id: reference,
      amount: amount.toString(),
      return_url: `${process.env.FRONTEND_URL}/paiement/callback`,
      cancel_url: `${process.env.FRONTEND_URL}/paiement/cancel`,
      notify_url: `${process.env.BACKEND_URL}/api/payments/mobile-money/webhook`,
      lang: 'FR',
      reference: reference
    };

    const response = await axios.post(`${config.apiUrl}/payment`, payload, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.status === 'SUCCESS') {
      return {
        success: true,
        transactionId: response.data.transaction_id,
        paymentUrl: response.data.payment_url,
        message: "Paiement Orange Money initié"
      };
    } else {
      throw new Error(response.data.message || 'Erreur Orange Money');
    }
  }

  /* ============================================================
     🔵 MTN MOBILE MONEY - INTÉGRATION
  ============================================================ */
  async processMTNPayment(phone, amount, currency, reference, config) {
    // Exemple d'intégration MTN Mobile Money API
    const payload = {
      amount: amount.toString(),
      currency: currency || 'XOF',
      externalId: reference,
      payer: {
        partyIdType: 'MSISDN',
        partyId: phone.replace('+', '')
      },
      payerMessage: 'Paiement ExpressTrafic',
      payeeNote: `Réservation ${reference}`
    };

    const response = await axios.post(`${config.apiUrl}/collection/v1_0/requesttopay`, payload, {
      headers: {
        'Authorization': `Bearer ${await this.getMTNToken(config)}`,
        'X-Reference-Id': reference,
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': config.apiKey
      }
    });

    return {
      success: true,
      transactionId: reference,
      message: "Paiement MTN Mobile Money initié"
    };
  }

  /* ============================================================
     🌊 WAVE - INTÉGRATION
  ============================================================ */
  async processWavePayment(phone, amount, currency, reference, config) {
    const payload = {
      amount: Math.round(amount * 100), // Conversion en centimes
      currency: currency || 'XOF',
      client_reference: reference,
      error_url: `${process.env.FRONTEND_URL}/paiement/error`,
      success_url: `${process.env.FRONTEND_URL}/paiement/success`
    };

    const response = await axios.post(`${config.apiUrl}/payments`, payload, {
      auth: {
        username: config.apiKey,
        password: '' // Wave utilise souvent l'API key comme username
      }
    });

    return {
      success: true,
      transactionId: response.data.id,
      paymentUrl: response.data.url,
      message: "Paiement Wave initié"
    };
  }

  /* ============================================================
     🔍 VÉRIFICATION TRANSACTION
  ============================================================ */
  async verifyTransaction(provider, transactionId) {
    try {
      const config = this.providers[provider];
      
      // Simulation en développement
      if (process.env.NODE_ENV !== 'production') {
        return await this.simulateVerification(provider, transactionId);
      }

      // Vérification réelle selon le provider
      switch (provider) {
        case 'orange':
          return await this.verifyOrangeTransaction(transactionId, config);
        case 'mtn':
          return await this.verifyMTNTransaction(transactionId, config);
        case 'wave':
          return await this.verifyWaveTransaction(transactionId, config);
        default:
          throw new Error(`Vérification ${provider} non implémentée`);
      }

    } catch (error) {
      logger.error(`❌ Erreur vérification transaction ${transactionId}:`, error);
      throw error;
    }
  }

  /* ============================================================
     🎯 SIMULATION (DÉVELOPPEMENT SEULEMENT)
  ============================================================ */
  async simulatePayment(provider, phone, amount, reference) {
    logger.info(`🎮 Simulation paiement ${provider} pour ${phone} - ${amount} - ${reference}`);
    
    // Simuler un délai de traitement
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 90% de succès en simulation
    const success = Math.random() > 0.1;
    
    if (success) {
      const transactionId = `MM_${provider.toUpperCase()}_${Date.now()}`;
      
      logger.success(`✅ Paiement ${provider} simulé - Transaction: ${transactionId}`);
      
      return {
        success: true,
        transactionId,
        message: `Paiement ${this.providers[provider].name} simulé avec succès`
      };
    } else {
      throw new Error(`Échec de paiement ${provider} simulé`);
    }
  }

  async simulateVerification(provider, transactionId) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      status: 'completed',
      transactionId,
      amount: 100, // Montant simulé
      currency: 'XOF',
      provider: provider
    };
  }

  /* ============================================================
     🔐 MÉTHODES D'AUTHENTIFICATION
  ============================================================ */
  async getMTNToken(config) {
    // Implémentation de l'obtention du token MTN
    const response = await axios.post(`${config.apiUrl}/collection/token/`, {}, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${config.apiKey}:`).toString('base64')}`,
        'Ocp-Apim-Subscription-Key': config.apiKey
      }
    });
    
    return response.data.access_token;
  }

  // Méthodes de vérification pour chaque provider
  async verifyOrangeTransaction(transactionId, config) {
    const response = await axios.get(`${config.apiUrl}/payment/${transactionId}`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`
      }
    });
    
    return {
      status: response.data.status === 'SUCCESS' ? 'completed' : 'failed',
      transactionId,
      amount: parseFloat(response.data.amount),
      currency: response.data.currency
    };
  }

  async verifyMTNTransaction(transactionId, config) {
    const response = await axios.get(`${config.apiUrl}/collection/v1_0/requesttopay/${transactionId}`, {
      headers: {
        'Authorization': `Bearer ${await this.getMTNToken(config)}`,
        'Ocp-Apim-Subscription-Key': config.apiKey
      }
    });
    
    return {
      status: response.data.status === 'SUCCESSFUL' ? 'completed' : 'failed',
      transactionId,
      amount: parseFloat(response.data.amount),
      currency: response.data.currency
    };
  }

  async verifyWaveTransaction(transactionId, config) {
    const response = await axios.get(`${config.apiUrl}/payments/${transactionId}`, {
      auth: {
        username: config.apiKey,
        password: ''
      }
    });
    
    return {
      status: response.data.state === 'processed' ? 'completed' : 'failed',
      transactionId,
      amount: response.data.amount / 100, // Conversion depuis centimes
      currency: response.data.currency
    };
  }
}

module.exports = new MobileMoneyService();