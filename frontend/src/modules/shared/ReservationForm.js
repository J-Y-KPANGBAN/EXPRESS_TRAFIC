import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { reservationService, paymentService} from '../../api';
import { Input, Select, Button, Alert, Card } from "../../Components/UI";
import "./ReservationForm.css";


function ReservationForm({ trajetId, trajetDetails, onSuccess, onCancel }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    siege_numero: "",
    moyen_paiement: "",
    arret_depart: "",
    arret_arrivee: ""
  });

  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(3);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prixCalcule, setPrixCalcule] = useState(0);

  // Liste des arrêts disponibles
  const [arretsDisponibles, setArretsDisponibles] = useState([]);

  // Initialisation des arrêts
  useEffect(() => {
    if (trajetDetails) {
      // Prix par défaut (trajet complet)
      setPrixCalcule(Number(trajetDetails.prix) || 0);
      
      // Construction de la liste des arrêts
      const arrets = [];
      
      // Ajout du point de départ
      arrets.push({
        id: 'depart',
        nom_arret: trajetDetails.ville_depart,
        prix_arret: 0,
        ordre: 0,
        type: 'depart'
      });

      // Ajout des arrêts intermédiaires
      if (trajetDetails.arrets && Array.isArray(trajetDetails.arrets)) {
        trajetDetails.arrets.forEach((arret, index) => {
          arrets.push({
            id: `arret_${index}`,
            nom_arret: arret.nom_arret,
            prix_arret: Number(arret.prix_arret) || 0,
            ordre: index + 1,
            type: 'arret'
          });
        });
      }

      // Ajout du point d'arrivée
      arrets.push({
        id: 'arrivee',
        nom_arret: trajetDetails.ville_arrivee,
        prix_arret: Number(trajetDetails.prix) || 0,
        ordre: arrets.length,
        type: 'arrivee'
      });

      setArretsDisponibles(arrets);
      
      // Définir les valeurs par défaut
      setFormData(prev => ({
        ...prev,
        arret_depart: trajetDetails.ville_depart,
        arret_arrivee: trajetDetails.ville_arrivee
      }));
    }
  }, [trajetDetails]);

  // Calcul du prix dynamique
  useEffect(() => {
  if (formData.arret_depart && formData.arret_arrivee && arretsDisponibles.length > 0) {
    const depart = arretsDisponibles.find(a => a.nom_arret === formData.arret_depart);
    const arrivee = arretsDisponibles.find(a => a.nom_arret === formData.arret_arrivee);
    
    if (depart && arrivee && depart.ordre <= arrivee.ordre) {
      const nouveauPrix = arrivee.prix_arret - depart.prix_arret;
      setPrixCalcule(Math.max(0, nouveauPrix));
    }
  }
}, [formData.arret_depart, formData.arret_arrivee, arretsDisponibles]);
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) setError(null);
  };

  // Validation de la sélection des arrêts
  const validerSelectionArrets = () => {
    if (!formData.arret_depart || !formData.arret_arrivee) {
      return { valide: false, message: "Veuillez sélectionner les arrêts de départ et d'arrivée" };
    }

    const depart = arretsDisponibles.find(a => a.nom_arret === formData.arret_depart);
    const arrivee = arretsDisponibles.find(a => a.nom_arret === formData.arret_arrivee);

    if (!depart || !arrivee) {
      return { valide: false, message: "Arrêts sélectionnés invalides" };
    }

    if (depart.ordre >= arrivee.ordre) {
      return { valide: false, message: "L'arrêt d'arrivée doit être après l'arrêt de départ" };
    }

    return { valide: true };
  };

  const handleReserve = async (e) => {
    e.preventDefault();

    if (isSubmitting) {
      console.log("⏳ Réservation déjà en cours...");
      return;
    }

    // VALIDATION RENFORCÉE
    if (!formData.siege_numero || !formData.moyen_paiement) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    // VALIDATION DES ARRÊTS
    const validationArrets = validerSelectionArrets();
    if (!validationArrets.valide) {
      setError(validationArrets.message);
      return;
    }

    // VALIDATION DU PRIX
    if (prixCalcule <= 0) {
      setError("Le prix calculé est invalide");
      return;
    }

    setIsSubmitting(true);
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log("🎫 Création réservation pour trajet:", trajetId);
      console.log("💰 Prix calculé:", prixCalcule);
      console.log("📍 Arrêts:", {
        depart: formData.arret_depart,
        arrivee: formData.arret_arrivee
      });

      // 1) Créer la réservation avec les nouveaux champs
      const response = await reservationService.reserverTrajet(trajetId, {
        trajet_id: trajetId,
        siege_numero: formData.siege_numero,
        moyen_paiement: formData.moyen_paiement,
        arret_depart: formData.arret_depart,
        arret_arrivee: formData.arret_arrivee,
        prix_calcule: prixCalcule
      });

      console.log("📦 Réponse réservation:", response.data);

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Erreur lors de la réservation");
      }

      const reservationId = response.data.reservation_id || response.data.id;
      const code = response.data.code_reservation;

      if (!reservationId) {
        throw new Error("ID de réservation manquant");
      }

      // 2) Initier le paiement avec le prix calculé
      console.log("💰 Initiation paiement pour réservation:", reservationId);
      const payResp = await paymentService.initiatePayment(
        reservationId,
        formData.moyen_paiement,
        prixCalcule
      );

      console.log("📦 Réponse paiement:", payResp.data);

      if (!payResp.data?.success) {
        throw new Error(payResp.data?.message || "Erreur lors de l'initiation du paiement");
      }

      const { paymentId, redirectUrl } = payResp.data;

      // Message de succès
      setSuccess({
        title: "🎫 Réservation enregistrée",
        message: `Votre réservation de ${formData.arret_depart} à ${formData.arret_arrivee} a été créée. Prix: ${prixCalcule}€ - Code: ${code}`,
        paymentId: paymentId
      });

      // Animation & redirection
      setRedirecting(true);
      let timer = 3;

      const interval = setInterval(() => {
        timer--;
        setSecondsLeft(timer);
        if (timer === 0) {
          clearInterval(interval);
          setIsSubmitting(false);
        }
      }, 1000);

      // Redirection
      setTimeout(() => {
        if (redirectUrl) {
          window.location.href = redirectUrl;
        } else {
          navigate(`/paiement/${paymentId}`);
        }
      }, 3000);

    } catch (err) {
      console.error("❌ Erreur réservation:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Une erreur est survenue. Veuillez réessayer."
      );
      setIsSubmitting(false);
    } finally {
      setLoading(false);
    }
  };

 const paiementOptions = [
  { value: "", label: "Choisir un moyen de paiement" },
  { value: "MP002", label: "💳 Visa" },                // ID au lieu de texte
  { value: "MP003", label: "💳 Mastercard" },          // ID au lieu de texte
  { value: "MP001", label: "📱 Mobile Money" },        // ID au lieu de texte
  { value: "MP004", label: "🔵 PayPal" },              // ID au lieu de texte
  { value: "MP005", label: "💳 Carte bancaire" },      // ID au lieu de texte
];

  return (
    <div className="reservation-form-container">
      <Card className="reservation-form-card slide-in">
        <h2 className="titre-reservation">Réserver un siège</h2>

        {/* Détails du trajet */}
        {trajetDetails && (
          <div className="trajet-info">
            <h4>Détails du trajet:</h4>
            <p><strong>De:</strong> {trajetDetails.ville_depart}</p>
            <p><strong>À:</strong> {trajetDetails.ville_arrivee}</p>
            <p><strong>Date:</strong> {new Date(trajetDetails.date_depart).toLocaleDateString('fr-FR')}</p>
            <p><strong>Prix total:</strong> {trajetDetails.prix} €</p>
          </div>
        )}

        {error && <Alert type="error" message={error} />}

        {success && (
          <Alert
            type="success"
            message={
              <div className="success-msg">
                <strong>{success.title}</strong>
                <br />
                {success.message}
                {redirecting && (
                  <div className="redirect-countdown">
                    Redirection vers le paiement dans {secondsLeft} seconde(s)...
                    <div className="loader-mini"></div>
                  </div>
                )}
              </div>
            }
          />
        )}

        {!success && (
          <form onSubmit={handleReserve} className="reservation-form">
            {/* Sélection des arrêts */}
            {arretsDisponibles.length > 0 && (
              <div className="arrets-selection">
                <h4>Sélectionnez votre trajet</h4>
                
                <Select
                  label="Arrêt de départ"
                  name="arret_depart"
                  value={formData.arret_depart}
                  onChange={handleChange}
                  options={[
                    { value: "", label: "Choisir l'arrêt de départ" },
                    ...arretsDisponibles
                      .filter(arret => arret.type !== 'arrivee')
                      .map(arret => ({
                        value: arret.nom_arret,
                        label: `${arret.nom_arret} ${arret.prix_arret > 0 ? `(${arret.prix_arret}€)` : ''}`
                      }))
                  ]}
                  required
                  disabled={loading || isSubmitting}
                />

                <Select
                  label="Arrêt d'arrivée"
                  name="arret_arrivee"
                  value={formData.arret_arrivee}
                  onChange={handleChange}
                  options={[
                    { value: "", label: "Choisir l'arrêt d'arrivée" },
                    ...arretsDisponibles
                      .filter(arret => {
                        const depart = arretsDisponibles.find(a => a.nom_arret === formData.arret_depart);
                        return depart && arret.ordre > depart.ordre;
                      })
                      .map(arret => ({
                        value: arret.nom_arret,
                        label: `${arret.nom_arret} ${arret.prix_arret > 0 ? `(${arret.prix_arret}€)` : ''}`
                      }))
                  ]}
                  required
                  disabled={loading || isSubmitting || !formData.arret_depart}
                />

                {/* Affichage du prix calculé */}
                <div className="prix-calcule">
                  <strong>Prix de votre trajet: {prixCalcule} €</strong>
                  {prixCalcule < Number(trajetDetails.prix) && (
                    <span className="economie">
                      Économie: {Number(trajetDetails.prix) - prixCalcule} €
                    </span>
                  )}
                </div>
              </div>
            )}

            <Input
              label="Numéro de siège"
              type="number"
              name="siege_numero"
              value={formData.siege_numero}
              onChange={handleChange}
              placeholder="Ex: 12"
              min="1"
              max="60"
              required
              disabled={loading || isSubmitting}
            />

            <Select
              label="Moyen de paiement"
              name="moyen_paiement"
              value={formData.moyen_paiement}
              onChange={handleChange}
              options={paiementOptions}
              required
              disabled={loading || isSubmitting}
            />

            <div className="form-actions">
              <Button
                type="submit"
                variant="primary"
                loading={loading || isSubmitting}
                disabled={loading || isSubmitting}
                fullWidth
              >
                {loading || isSubmitting ? "Traitement..." : `Payer ${prixCalcule} €`}
              </Button>

              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  fullWidth
                  disabled={loading || isSubmitting}
                >
                  Annuler
                </Button>
              )}
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}

export default ReservationForm;