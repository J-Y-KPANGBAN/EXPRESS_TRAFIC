// backend/services/generateCode.js
const QRCode = require('qrcode');
const crypto = require('crypto');
const logger = require('../utils/logger');

class QRCodeService {
  
  constructor() {
    this.secretKey = process.env.QR_CODE_SECRET || 'express-trafic-qr-secret-2024';
  }

  /* ============================================================
     🔐 GÉNÉRER UN QR CODE SÉCURISÉ
  ============================================================ */
  async generateSecureQRCode(reservationData) {
    try {
      const qrPayload = this.createSecurePayload(reservationData);
      const qrDataUrl = await QRCode.toDataURL(JSON.stringify(qrPayload), {
        width: 300,
        margin: 2,
        errorCorrectionLevel: 'H', // Haute correction d'erreur
        color: {
          dark: '#2c5aa0', // Bleu ExpressTrafic
          light: '#FFFFFF'
        }
      });

      logger.success(`✅ QR Code généré pour réservation: ${reservationData.code_reservation}`);

      return {
        success: true,
        qrDataUrl,
        payload: qrPayload,
        reservationId: reservationData.id
      };

    } catch (error) {
      logger.error(`❌ Erreur génération QR Code: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /* ============================================================
     📝 CRÉER UN PAYLOAD SÉCURISÉ
  ============================================================ */
  createSecurePayload(reservationData) {
    const timestamp = new Date().toISOString();
    
    // Données de base
    const payload = {
      // Métadonnées
      version: '2.0',
      type: 'transport_ticket',
      issuer: 'ExpressTrafic',
      timestamp: timestamp,
      
      // Données réservation
      reservation: {
        id: reservationData.id,
        code: reservationData.code_reservation,
        status: reservationData.etat_reservation,
        amount: reservationData.montant_total,
        currency: 'EUR'
      },
      
      // Données passager
      passenger: {
        firstName: reservationData.user_prenom,
        lastName: reservationData.user_nom,
        email: reservationData.user_email
      },
      
      // Données trajet
      journey: {
        from: reservationData.ville_depart,
        to: reservationData.ville_arrivee,
        date: reservationData.date_depart,
        time: reservationData.heure_depart,
        duration: reservationData.duree,
        seat: reservationData.siege_numero
      },
      
      // Données véhicule
      vehicle: {
        busId: reservationData.bus_id,
        plate: reservationData.numero_immatriculation,
        type: reservationData.type_bus
      },
      
      // Sécurité
      security: {
        checksum: this.generateChecksum(reservationData, timestamp),
        signature: this.generateSignature(reservationData, timestamp)
      }
    };

    return payload;
  }

  /* ============================================================
     🔒 GÉNÉRER UN CHECKSUM
  ============================================================ */
  generateChecksum(reservationData, timestamp) {
    const dataString = [
      reservationData.id,
      reservationData.code_reservation,
      reservationData.user_email,
      reservationData.ville_depart,
      reservationData.ville_arrivee,
      timestamp
    ].join('|');

    return crypto
      .createHash('md5')
      .update(dataString)
      .digest('hex')
      .substring(0, 8)
      .toUpperCase();
  }

  /* ============================================================
     ✍️ GÉNÉRER UNE SIGNATURE
  ============================================================ */
  generateSignature(reservationData, timestamp) {
    const signatureData = {
      reservationId: reservationData.id,
      code: reservationData.code_reservation,
      timestamp: timestamp,
      passenger: `${reservationData.user_prenom} ${reservationData.user_nom}`
    };

    const hmac = crypto.createHmac('sha256', this.secretKey);
    return hmac
      .update(JSON.stringify(signatureData))
      .digest('hex')
      .substring(0, 16)
      .toUpperCase();
  }

  /* ============================================================
     🔍 VALIDER UN QR CODE
  ============================================================ */
  validateQRCode(qrData) {
    try {
      const payload = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;

      // Vérifier la structure de base
      if (!payload.version || !payload.security || !payload.reservation) {
        return { valid: false, reason: 'Structure invalide' };
      }

      // Vérifier la signature
      const expectedSignature = this.generateSignature(
        {
          id: payload.reservation.id,
          code_reservation: payload.reservation.code,
          user_prenom: payload.passenger.firstName,
          user_nom: payload.passenger.lastName
        },
        payload.timestamp
      );

      if (payload.security.signature !== expectedSignature) {
        return { valid: false, reason: 'Signature invalide' };
      }

      // Vérifier la date d'expiration (QR valide 24h)
      const qrDate = new Date(payload.timestamp);
      const now = new Date();
      const diffHours = (now - qrDate) / (1000 * 60 * 60);

      if (diffHours > 24) {
        return { valid: false, reason: 'QR Code expiré' };
      }

      logger.success(`✅ QR Code validé: ${payload.reservation.code}`);

      return {
        valid: true,
        payload: payload,
        reservationCode: payload.reservation.code
      };

    } catch (error) {
      logger.error(`❌ Erreur validation QR Code: ${error.message}`);
      return { valid: false, reason: 'Erreur de parsing' };
    }
  }

  /* ============================================================
     📱 GÉNÉRER POUR SCANNER MOBILE
  ============================================================ */
  async generateMobileQRCode(reservationData, options = {}) {
    const {
      size = 300,
      includeInstructions = true,
      format = 'data_url' // 'data_url' ou 'svg'
    } = options;

    try {
      const securePayload = this.createSecurePayload(reservationData);
      
      let qrResult;
      if (format === 'svg') {
        qrResult = await QRCode.toString(JSON.stringify(securePayload), {
          type: 'svg',
          width: size,
          margin: 1,
          errorCorrectionLevel: 'Q'
        });
      } else {
        qrResult = await QRCode.toDataURL(JSON.stringify(securePayload), {
          width: size,
          margin: 2,
          errorCorrectionLevel: 'H'
        });
      }

      const result = {
        success: true,
        qrCode: qrResult,
        reservationCode: reservationData.code_reservation,
        payload: securePayload
      };

      if (includeInstructions) {
        result.instructions = this.getScanInstructions();
      }

      return result;

    } catch (error) {
      logger.error(`❌ Erreur génération QR mobile: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /* ============================================================
     📋 INSTRUCTIONS DE SCAN
  ============================================================ */
  getScanInstructions() {
    return {
      fr: {
        title: 'Comment utiliser votre QR Code',
        steps: [
          'Présentez ce QR Code au chauffeur à l\'embarquement',
          'Assurez-vous que l\'écran est propre et bien visible',
          'Maintenez une distance de 10-15 cm du scanner',
          'Évitez les reflets et la lumière directe'
        ],
        troubleshooting: [
          'Problème de scan ? Montrez votre pièce d\'identité',
          'QR Code endommagé ? Contactez le service client'
        ]
      },
      en: {
        title: 'How to use your QR Code',
        steps: [
          'Present this QR Code to the driver at boarding',
          'Make sure the screen is clean and clearly visible',
          'Hold 10-15 cm away from the scanner',
          'Avoid glare and direct light'
        ],
        troubleshooting: [
          'Scanning issue? Show your ID card',
          'QR Code damaged? Contact customer service'
        ]
      }
    };
  }

  /* ============================================================
     📊 STATISTIQUES SCAN
  ============================================================ */
  async recordScan(scanData) {
    try {
      const { reservationCode, scannerId, location, timestamp } = scanData;
      
      // Ici vous pourriez enregistrer en base de données
      logger.info(`📱 QR Code scanné: ${reservationCode} par ${scannerId} à ${location}`);

      return {
        success: true,
        scanned: true,
        reservationCode,
        timestamp: timestamp || new Date().toISOString()
      };

    } catch (error) {
      logger.error(`❌ Erreur enregistrement scan: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new QRCodeService();