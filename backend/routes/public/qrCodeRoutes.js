// backend/routes/public/qrCodeRoutes.js
const express = require('express');
const router = express.Router();
const qrCodeService = require('../../services/generateCode');
const { auth, requireAdmin} = require('../../middleware/auth'); // ⬅️ IMPORT DIRECT

/* ============================================================
     🔍 VALIDER UN QR CODE (POUR CHAUFFEURS + ADMIN)
  ============================================================ */
router.post('/validate', auth, async (req, res) => {
  try {
    const { qrData, scannerId, location } = req.body;

    if (!qrData) {
      return res.status(400).json({
        success: false,
        error: 'Données QR Code manquantes',
        code: 'QR_DATA_MISSING'
      });
    }

    // Valider le QR Code
    const validationResult = qrCodeService.validateQRCode(qrData);

    if (!validationResult.valid) {
      return res.status(400).json({
        success: false,
        error: `QR Code invalide: ${validationResult.reason}`,
        code: 'QR_INVALID'
      });
    }

    // Enregistrer le scan (seulement si valide)
    await qrCodeService.recordScan({
      reservationCode: validationResult.reservationCode,
      scannerId: scannerId || `chauffeur_${req.user.id}`,
      location: location || 'embarquement',
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      valid: true,
      reservation: validationResult.payload.reservation,
      passenger: validationResult.payload.passenger,
      journey: validationResult.payload.journey,
      message: 'Billet validé avec succès ✅'
    });

  } catch (error) {
    console.error('❌ Erreur validation QR Code:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la validation du QR Code',
      code: 'QR_VALIDATION_ERROR'
    });
  }
});

/* ============================================================
     📱 OBTENIR SON QR CODE (CLIENTS)
  ============================================================ */
router.get('/reservation/:reservationId', auth, async (req, res) => {
  try {
    const { reservationId } = req.params;
    
    // Récupérer les données de réservation
    const reservationService = require('../../services/reservationService');
    const reservation = await reservationService.getReservationById(reservationId);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: 'Réservation non trouvée',
        code: 'RESERVATION_NOT_FOUND'
      });
    }

    // Vérifier que l'utilisateur a accès à cette réservation
    if (reservation.utilisateur_id !== req.user.id && req.user.type_utilisateur !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Accès non autorisé à cette réservation',
        code: 'UNAUTHORIZED_ACCESS'
      });
    }

    // Vérifier que la réservation est confirmée
    if (reservation.etat_reservation !== 'confirmee') {
      return res.status(400).json({
        success: false,
        error: 'La réservation doit être confirmée pour avoir un QR Code',
        code: 'RESERVATION_NOT_CONFIRMED'
      });
    }

    // Générer le QR Code mobile
    const qrResult = await qrCodeService.generateMobileQRCode(reservation, {
      size: 300,
      includeInstructions: true,
      format: 'data_url'
    });

    if (!qrResult.success) {
      throw new Error(qrResult.error);
    }

    res.json({
      success: true,
      qrCode: qrResult.qrCode,
      reservation: {
        id: reservation.id,
        code: reservation.code_reservation,
        from: reservation.ville_depart,
        to: reservation.ville_arrivee,
        date: reservation.date_depart,
        time: reservation.heure_depart,
        seat: reservation.siege_numero,
        status: reservation.etat_reservation
      },
      instructions: qrResult.instructions,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur génération QR Code:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération du QR Code',
      code: 'QR_GENERATION_ERROR'
    });
  }
});

/* ============================================================
     📧 GÉNÉRER QR CODE POUR EMAIL (ADMIN)
  ============================================================ */
router.post('/admin/generate', auth, requireAdmin, async (req, res) => {
  try {
    const { reservationId } = req.body;

    const reservationService = require('../../services/reservationService');
    const reservation = await reservationService.getReservationById(reservationId);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: 'Réservation non trouvée'
      });
    }

    const qrResult = await qrCodeService.generateSecureQRCode(reservation);

    if (!qrResult.success) {
      throw new Error(qrResult.error);
    }

    res.json({
      success: true,
      qrCode: qrResult.qrDataUrl,
      reservationCode: reservation.code_reservation,
      payload: qrResult.payload
    });

  } catch (error) {
    console.error('❌ Erreur génération QR Code admin:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur génération QR Code'
    });
  }
});

module.exports = router;