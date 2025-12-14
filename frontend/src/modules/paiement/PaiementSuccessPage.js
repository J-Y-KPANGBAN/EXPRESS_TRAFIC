import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useReactToPrint } from 'react-to-print';

import { Card, Button, Alert, Loader } from "../../Components/UI";
import { paymentService } from '../../api';
import BilletOptions from "./components/BilletOptions";
import { formatDate, formatTime } from "../../utils/dateFormatter";
import PrintReceipt from "../../Components/PrintReceipt";
import PrintInvoice from "../../Components/PrintInvoice";

import "./PaiementSuccessPage.css";

const PaiementSuccessPage = () => {
  const { id: paymentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [payment, setPayment] = useState(null);
  const [showProcessing, setShowProcessing] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Déplacer les refs et fonctions d'impression à l'intérieur du composant
  const ticketPrintRef = useRef();
  const invoicePrintRef = useRef();

  // Créez deux fonctions d'impression séparées
  const handlePrintTicket = useReactToPrint({
    content: () => ticketPrintRef.current,
    documentTitle: `Ticket-${payment?.reservation?.code_reservation || 'ExpressTrafic'}`,
    pageStyle: `
      @page { 
        margin: 10mm;
        size: A4;
      }
      @media print {
        body * {
          visibility: hidden;
        }
        #ticket-content, #ticket-content * {
          visibility: visible;
        }
        #ticket-content {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        .no-print {
          display: none !important;
        }
      }
    `,
    onBeforeGetContent: () => {
      console.log("🖨️ Début de l'impression du ticket...");
      setIsPrinting(true);
      return Promise.resolve();
    },
    onAfterPrint: () => {
      console.log("✅ Impression du ticket terminée");
      setIsPrinting(false);
    },
    onPrintError: (error) => {
      console.error("❌ Erreur d'impression du ticket:", error);
      setIsPrinting(false);
    }
  });

  const handlePrintInvoice = useReactToPrint({
    content: () => invoicePrintRef.current,
    documentTitle: `Reçu-${payment?.reservation?.code_reservation || 'ExpressTrafic'}`,
    pageStyle: `
      @page { 
        margin: 10mm;
        size: A4;
      }
      @media print {
        body * {
          visibility: hidden;
        }
        #receipt-content, #receipt-content * {
          visibility: visible;
        }
        #receipt-content {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        .no-print {
          display: none !important;
        }
      }
    `,
    onBeforeGetContent: () => {
      console.log("🖨️ Début de l'impression du reçu...");
      setIsPrinting(true);
      return Promise.resolve();
    },
    onAfterPrint: () => {
      console.log("✅ Impression du reçu terminée");
      setIsPrinting(false);
    },
    onPrintError: (error) => {
      console.error("❌ Erreur d'impression du reçu:", error);
      setIsPrinting(false);
    }
  });

  const searchParams = new URLSearchParams(location.search);
  const sessionId = searchParams.get("session_id");

  // Debug: Vérifier que la ref fonctionne
  useEffect(() => {
    if (ticketPrintRef.current) {
      console.log("✅ Référence d'impression du ticket initialisée:", ticketPrintRef.current);
    }
    if (invoicePrintRef.current) {
      console.log("✅ Référence d'impression du reçu initialisée:", invoicePrintRef.current);
    }
  }, []);

  console.log('🔧 PaiementSuccessPage - Paramètres:', {
    paymentId,
    sessionId,
    search: location.search
  });

  const confirmPayment = async () => {
    try {
      setShowProcessing(true);

      if (!paymentId) throw new Error("Identifiant de paiement invalide");
      if (!sessionId) throw new Error("Session Stripe manquante");

      console.log('✅ PaiementSuccessPage - Confirmation paiement:', { paymentId, sessionId });
      
      // Simuler un délai de traitement pour montrer le message
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // CORRECTION : Utiliser paymentService.confirmPayment
      const res = await paymentService.confirmPayment(paymentId, sessionId);

      if (!res.data?.success) {
        throw new Error(
          res.data?.message || "Impossible de confirmer le paiement."
        );
      }

      console.log('✅ PaiementSuccessPage - Paiement confirmé avec succès');
      
    } catch (err) {
      console.error("❌ PaiementSuccessPage - Erreur confirmPayment:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Erreur lors de la confirmation du paiement."
      );
    } finally {
      setShowProcessing(false);
    }
  };

  const loadPayment = async () => {
    try {
      console.log('📊 PaiementSuccessPage - Chargement statut paiement:', paymentId);
      // CORRECTION : Utiliser paymentService.getPaymentDetails
      const res = await paymentService.getPaymentDetails(paymentId);

      if (!res.data?.success) {
        throw new Error("Paiement introuvable");
      }

      setPayment(res.data.data);
      console.log('✅ PaiementSuccessPage - Paiement chargé:', res.data.data);
    } catch (err) {
      console.error("❌ PaiementSuccessPage - Erreur loadPayment:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Impossible de charger les informations du paiement."
      );
    }
  };

  useEffect(() => {
    const run = async () => {
      console.log('🚀 PaiementSuccessPage - Début processus confirmation');
      await confirmPayment();
      await loadPayment();
      setLoading(false);
      console.log('🏁 PaiementSuccessPage - Processus terminé');
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId, sessionId]);

  // ✅ FENÊTRE DE TRAITEMENT AMÉLIORÉE
  if (showProcessing) {
    return (
      <div className="processing-overlay" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}>
        <div className="processing-message" style={{
          background: 'white',
          padding: '25px',
          borderRadius: '12px',
          textAlign: 'center',
          maxWidth: '350px',
          width: '90%',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          border: '2px solid #27ae60'
        }}>
          <div className="spinner" style={{ 
            fontSize: '35px', 
            marginBottom: '15px',
            animation: 'spin 1s linear infinite'
          }}>⏳</div>
          <h3 style={{ 
            margin: '0 0 10px 0',
            color: '#27ae60',
            fontSize: '18px'
          }}>Traitement en cours</h3>
          <p style={{ 
            margin: '0 0 15px 0',
            color: '#555',
            fontSize: '14px',
            lineHeight: '1.4'
          }}>
            Validation de votre paiement et génération de votre billet...
          </p>
          <p style={{ 
            fontSize: '12px', 
            color: '#888', 
            marginTop: '10px',
            fontStyle: 'italic'
          }}>
            Cette opération peut prendre quelques secondes
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="paiement-page-fullscreen">
        <Loader size={60} />
        <p style={{ marginTop: 15, color: "#555" }}>
          Validation du paiement sécurisé...
        </p>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="paiement-page-fullscreen">
        <Card className="paiement-card">
          <h2>⚠️ Erreur lors du paiement</h2>

          <Alert type="error" message={error || "Paiement introuvable"} />

          <div className="error-actions">
            <Button
              variant="outline"
              onClick={() => navigate("/historique")}
            >
              Mes réservations
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate("/")}
            >
              Retour à l'accueil
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const r = payment.reservation || {};

  // Préparer les données pour le reçu
  const reservationData = {
    code_reservation: r.code_reservation,
    siege_numero: r.seat || r.siege_numero, 
    montant_total: payment.montant
  };

  const userData = {
    nom: r.user_nom,
    prenom: r.user_prenom,
    email: r.user_email,
    telephone: r.user_telephone || ''
  };

  const trajetData = {
    ville_depart: r.ville_depart,
    ville_arrivee: r.ville_arrivee,
    date_depart: r.date_depart,
    heure_depart: r.heure_depart,
    duree: r.duree
  };

  const paymentMethod = payment.methode_paiement || 'Carte bancaire';

  return (
    <div className="paiement-page-fullscreen">
      <Card className="paiement-card success-card">
        
        {/* EN-TÊTE DE SUCCÈS */}
        <div className="success-header">
          <div className="success-icon">🎉</div>
          <h2 className="success-title">Paiement Confirmé !</h2>
          <p className="success-subtitle">
            Votre réservation a été validée avec succès. Votre billet professionnel est prêt.
          </p>
        </div>

        <Alert
          type="success"
          message="✅ Votre paiement a été validé et votre billet a été généré."
        />

        {/* RÉCAPITULATIF DU TRAJET */}
        <div className="recap-section">
          <h3 className="recap-title">📋 Détails de votre réservation</h3>
          
          <div className="recap-grid">
            <div className="recap-item">
              <span className="recap-label">Code réservation</span>
              <span className="recap-value highlight">{r.code_reservation}</span>
            </div>
            
            <div className="recap-item">
              <span className="recap-label">Trajet</span>
              <span className="recap-value journey">
                {r.ville_depart} → {r.ville_arrivee}
              </span>
            </div>
            
            <div className="recap-item">
              <span className="recap-label">Date de voyage</span>
              <span className="recap-value">{formatDate(r.date_depart)}</span>
            </div>
            
            <div className="recap-item">
              <span className="recap-label">Heure de départ</span>
              <span className="recap-value">{formatTime(r.heure_depart)}</span>
            </div>
            
            <div className="recap-item">
              <span className="recap-label">Siège attribué</span>
              <span className="recap-value seat">N° {r.seat || r.siege_numero}</span>
            </div>
            
            <div className="recap-item">
              <span className="recap-label">Montant payé</span>
              <span className="recap-value amount">{payment.montant} €</span>
            </div>

            <div className="recap-item">
              <span className="recap-label">Méthode de paiement</span>
              <span className="recap-value">{paymentMethod}</span>
            </div>
          </div>
        </div>

        {/* BOUTONS D'IMPRESSION - CORRIGÉ */}
        <div className="print-section no-print">
          <Button
            fullWidth
            variant="primary"
            onClick={handlePrintTicket}
            disabled={isPrinting || !payment?.reservation}
          >
            {isPrinting ? '🖨 Impression en cours...' : '🖨 Imprimer le ticket'}
          </Button>
          
          <Button
            fullWidth
            variant="outline"
            onClick={handlePrintInvoice}
            disabled={isPrinting || !payment?.reservation}
            style={{ marginTop: '10px' }}
          >
            🧾 Imprimer le reçu
          </Button>
        </div>

        {/* OPTIONS DE BILLET PROFESSIONNEL */}
        <BilletOptions 
          paymentId={paymentId}
          reservationCode={r.code_reservation}
          ticketUrl={r.ticket_pdf_url}
        />

        {/* ACTIONS SUPPLEMENTAIRES */}
        <div className="additional-actions no-print">
          <Button
            fullWidth
            variant="outline"
            onClick={() => navigate("/historique")}
            className="action-button"
          >
            📚 Voir mes voyages
          </Button>
          
          <div className="quick-actions">
            <Button
              variant="ghost"
              onClick={() => navigate("/travels")}
            >
              🔍 Nouvelle recherche
            </Button>
            
            <Button
              variant="ghost"
              onClick={() => navigate("/contact")}
            >
              💬 Assistance
            </Button>
          </div>
        </div>

      </Card>

      {/* COMPOSANT POUR L'IMPRESSION - VERSION CORRIGÉE */}
      <div style={{ display: 'none' }}>
        {/* Contenu du ticket */}
        <div id="ticket-content">
          <PrintReceipt 
            ref={ticketPrintRef}
            reservation={reservationData}
            user={userData}
            trajet={trajetData}
            paymentMethod={paymentMethod}
          />
        </div>
        
        {/* Contenu du reçu */}
        <div id="receipt-content">
          <PrintInvoice 
            ref={invoicePrintRef}
            reservation={reservationData}
            user={userData}
            trajet={trajetData}
            payment={{
              reference: payment.reference,
              method: payment.method || payment.methode_paiement,
              amount: payment.montant,
              status: payment.status
            }}
          />
        </div>
      </div>

      {/* ✅ AJOUT DU STYLE POUR L'ANIMATION DU SPINNER */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PaiementSuccessPage;