import React, { useState } from 'react';
import { Button, Alert, Checkbox, Card } from "../../../Components/UI";
import { paymentService } from '../../../api';
import "./BilletOptions.css";

const BilletOptions = ({ paymentId, reservationCode, ticketUrl, className = "" }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [options, setOptions] = useState({
    email: true,
    sms: false,
    download: true
  });

  const handleOptionChange = (option) => {
    setOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  const handleSendBillet = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const promises = [];
      const actions = [];

      // 1. Téléchargement direct si demandé
      if (options.download) {
        actions.push('download');
        
        // Si on a déjà une URL de ticket, on l'ouvre
        if (ticketUrl) {
          window.open(ticketUrl, '_blank');
        } else {
          // Sinon, on appelle le service pour générer le ticket
          promises.push(
            paymentService.generateTicket(paymentId).then(response => {
              if (response.data?.success && response.data?.ticketUrl) {
                window.open(response.data.ticketUrl, '_blank');
              }
            }).catch(err => {
              throw new Error(`Téléchargement échoué: ${err.message}`);
            })
          );
        }
      }

      // 2. Envoi par email si demandé
      if (options.email) {
        actions.push('email');
        promises.push(
          paymentService.sendTicketByEmail(paymentId).catch(err => {
            throw new Error(`Envoi par email échoué: ${err.message}`);
          })
        );
      }

      // 3. Envoi par SMS si demandé (s'il existe, sinon on utilise l'envoi par email)
      if (options.sms) {
        actions.push('sms');
        promises.push(
          paymentService.sendTicketBySms(paymentId).catch(err => {
            throw new Error(`Envoi par SMS échoué: ${err.message}`);
          })
        );
      }

      // Exécuter toutes les promesses en parallèle
      if (promises.length > 0) {
        const results = await Promise.allSettled(promises);

        const errors = results
          .map((result, index) => {
            if (result.status === 'rejected') {
              return `- ${actions[index]}: ${result.reason.message}`;
            }
            return null;
          })
          .filter(error => error !== null);

        if (errors.length > 0) {
          throw new Error(`Certaines actions ont échoué :\n${errors.join('\n')}`);
        }
      }

      if (actions.length > 0) {
        setSuccess("Vos options d'envoi ont été traitées avec succès !");
      } else {
        setError("Veuillez sélectionner au moins une option.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={`billet-options-card ${className}`}>
      <div className="billet-options">
        <h3 className="billet-title">🎫 Recevoir mon billet</h3>
        <p className="billet-subtitle">
          Choisissez comment vous souhaitez recevoir votre billet professionnel :
        </p>
        
        <div className="options-list">
          <div className="option-item">
            <Checkbox
              checked={options.email}
              onChange={() => handleOptionChange('email')}
              label="📧 Recevoir par email"
            />
            <span className="option-description">
              Billet PDF envoyé à votre adresse email avec confirmation
            </span>
          </div>
          
          <div className="option-item">
            <Checkbox
              checked={options.sms}
              onChange={() => handleOptionChange('sms')}
              label="📱 Recevoir par SMS"
            />
            <span className="option-description">
              Rappel avec code réservation et instructions
            </span>
          </div>
          
          <div className="option-item">
            <Checkbox
              checked={options.download}
              onChange={() => handleOptionChange('download')}
              label="⬇️ Télécharger maintenant"
            />
            <span className="option-description">
              Téléchargement immédiat du billet PDF professionnel
            </span>
          </div>
        </div>

        {error && (
          <Alert type="error" message={error} />
        )}

        {success && (
          <Alert type="success" message={success} />
        )}

        <div className="billet-actions">
          <Button
            fullWidth
            variant="primary"
            loading={loading}
            onClick={handleSendBillet}
            className="confirm-button"
          >
            {loading ? 'Traitement en cours...' : 'Confirmer la réception'}
          </Button>

          <div className="additional-actions">
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(reservationCode);
                alert('📋 Code réservation copié !');
              }}
            >
              📋 Copier le code
            </Button>
            
            <Button
              variant="outline"
              onClick={() => window.print()}
            >
              🖨️ Imprimer le reçu
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default BilletOptions;