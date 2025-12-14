import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";

import { Card, Button, Alert, Loader } from "../../Components/UI";
import { paymentService } from '../../api';

import "./PaiementPage.css";

const PaiementPage = () => {
  const { id } = useParams();
  const paymentId = id;
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState(null);
  const [payment, setPayment] = useState(null);
  const [redirecting, setRedirecting] = useState(false);
  const [redirectMessage, setRedirectMessage] = useState('');

  const searchParams = new URLSearchParams(location.search);
  const canceled = searchParams.get("canceled");

  // ✅ FONCTION DE REDIRECTION AMÉLIORÉE
  const handlePaymentInit = async () => {
    try {
      setPaying(true);
      setError(null);
      
      // Afficher le message de redirection
      setRedirecting(true);
      setRedirectMessage('Veuillez patienter, nous allons vous rediriger vers le site de paiement sécurisé...');

      console.log('🛒 PaiementPage - Création session Stripe pour paiement:', paymentId);
      
      // CORRECTION : Envoyer moins de métadonnées, juste les chemins nécessaires
      const res = await paymentService.createStripeCheckout(paymentId, {
        successPath: `/paiement/success/${paymentId}`,
        cancelPath: `/paiement/${paymentId}`
      });

      console.log('🔍 Réponse createStripeCheckout:', res);

      if (!res.data?.success || !res.data?.url) {
        throw new Error(
          res.data?.message ||
            "Erreur lors de la création de la session de paiement."
        );
      }

      console.log('🔄 PaiementPage - Redirection vers Stripe dans 3 secondes');
      
      // Redirection après 3 secondes pour laisser voir le message
      setTimeout(() => {
        if (res.data.url) {
          window.location.href = res.data.url;
        }
      }, 3000);

    } catch (err) {
      console.error("❌ PaiementPage - Erreur Stripe checkout:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Erreur création session Stripe"
      );
      setRedirecting(false);
    } finally {
      setPaying(false);
    }
  };

  // ✅ OPTIMISATION : Logique centralisée
  const loadStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!paymentId) {
        throw new Error("Identifiant de paiement manquant.");
      }

      console.log('🔧 PaiementPage - Chargement statut paiement:', paymentId);
      const res = await paymentService.getPaymentDetails(paymentId);

      console.log('📦 Réponse complète API:', res);

      if (!res.data?.success) {
        throw new Error(res.data?.message || "Erreur statut paiement");
      }

      // ✅ CORRECTION : Gestion des données de paiement
      const paymentData = res.data.data;
      console.log('✅ PaiementPage - Paiement chargé (complet):', paymentData);
      
      // Vérifier la structure des données
      if (!paymentData) {
        throw new Error("Aucune donnée de paiement reçue");
      }
      
      setPayment(paymentData);
    } catch (err) {
      console.error("❌ PaiementPage - Erreur statut paiement:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Erreur lors du chargement du paiement."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔧 PaiementPage - Monté avec ID:', paymentId);
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId]);

  // ✅ OPTIMISATION : Gestion des routes centralisée
  const goToReservations = () => navigate("/mes-reservations");
  const goToHome = () => navigate("/");

  // ✅ CORRECTION : Rendu conditionnel
  if (loading) {
    return (
      <div className="paiement-page-fullscreen">
        <Loader size={60} />
        <p style={{ marginTop: 15, color: "#555" }}>
          Chargement des informations de paiement...
        </p>
      </div>
    );
  }

  if (error && !payment) {
    return (
      <div className="paiement-page-fullscreen">
        <Card className="paiement-card">
          <h2>❌ Paiement introuvable</h2>
          <Alert type="error" message={error} />
          <div style={{ display: 'flex', gap: '10px', marginTop: 15, flexDirection: 'column' }}>
            <Button variant="outline" onClick={goToReservations}>
              Mes réservations
            </Button>
            <Button variant="primary" onClick={goToHome}>
              Retour à l'accueil
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="paiement-page-fullscreen">
        <Alert
          type="error"
          message="Paiement introuvable. Réessayez plus tard."
        />
      </div>
    );
  }

  // ✅ Rendu principal OPTIMISÉ
  // CORRECTION : Gestion des données de réservation
const r = payment.reservation || {};
const trajetDetails = payment.trajet || {};
  
  // ✅ CORRECTION : Extraction des valeurs avec fallback
  const villeDepart = r.ville_depart || "Non spécifié";
  const villeArrivee = r.ville_arrivee || "Non spécifié";
  const montant = r.montant_total || payment.amount || payment.montant || "0.00";
  const siegeNumero = r.siege_numero || "Non attribué";
  const method = payment.method || payment.methode || "Non spécifié";
  const status = payment.status || payment.etat_paiement || "en_attente";
  const codeReservation = r.code || r.code_reservation || "N/A";

  const formatDate = (dateString) => {
    if (!dateString) return "Non spécifié";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("fr-FR", {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="paiement-page-fullscreen">
      {/* ✅ FENÊTRE DE REDIRECTION AMÉLIORÉE */}
      {redirecting && (
        <div className="redirect-overlay">
          <div className="redirect-message">
            <div className="spinner">⏳</div>
            <h3>Redirection en cours</h3>
            <p>{redirectMessage}</p>
            <p className="redirect-countdown">
              Vous serez redirigé dans 3 secondes...
            </p>
          </div>
        </div>
      )}

      <Card className="paiement-card">
        <h2 className="paiement-title">💳 Paiement sécurisé</h2>
        <p className="paiement-subtitle">
          Vérifiez les détails de votre trajet puis cliquez sur "Payer" pour
          être redirigé vers la page de paiement Stripe.
        </p>

        {canceled && (
          <Alert
            type="warning"
            message="Le paiement a été annulé sur Stripe. Vous pouvez réessayer."
          />
        )}

        {error && <Alert type="error" message={error} />}

        <div className="paiement-recap">
  <div className="paiement-row">
    <span className="label">Code réservation</span>
    <span className="value">{r.code_reservation || r.code || payment.code_reservation || "N/A"}</span>
  </div>
  <div className="paiement-row">
    <span className="label">Trajet</span>
    <span className="value">
      {r.ville_depart || payment.ville_depart || "Non spécifié"} → 
      {r.ville_arrivee || payment.ville_arrivee || "Non spécifié"}
    </span>
  </div>
  <div className="paiement-row">
    <span className="label">Date</span>
    <span className="value">
      {formatDate(r.date_depart || payment.date_depart || r.date)}
    </span>
  </div>
  <div className="paiement-row">
    <span className="label">Siège</span>
    <span className="value">
      {r.siege_numero || r.seat || payment.seat || "Non attribué"}
    </span>
  </div>
  <div className="paiement-row">
    <span className="label">Montant</span>
    <span className="value montant">
      {parseFloat(r.montant_total || payment.amount || payment.montant || "0.00").toFixed(2)} €
    </span>
  </div>
</div>

        <div className="paiement-actions">
          {status !== "reussi" && status !== "paid" ? (
            <Button
              fullWidth
              variant="primary"
              loading={paying}
              onClick={handlePaymentInit}
              disabled={paying || redirecting}
            >
              {paying ? "Création de la session..." : "Payer maintenant (carte bancaire sécurisée)"}
            </Button>
          ) : (
            <Button
              fullWidth
              variant="success"
              onClick={goToReservations}
            >
              Voir mes voyages
            </Button>
          )}

          <Button
            fullWidth
            variant="outline"
            onClick={() => navigate(-1)}
            style={{ marginTop: 10 }}
          >
            Annuler et revenir
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PaiementPage;