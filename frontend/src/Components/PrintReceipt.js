import React from 'react';

const PrintReceipt = React.forwardRef(({ 
  reservation, 
  user, 
  trajet, 
  paymentMethod 
}, ref) => {
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.substring(0, 5);
  };

  // Vérifier que les données sont présentes
  if (!reservation || !user || !trajet) {
    return (
      <div ref={ref} style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Données manquantes pour l'impression</h2>
        <p>Veuillez réessayer ou contacter le support.</p>
      </div>
    );
  }

  return (
    <div ref={ref} style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '600px',
      margin: '0 auto',
      color: '#333',
      backgroundColor: 'white'
    }}>
      {/* En-tête */}
      <div style={{ 
        textAlign: 'center', 
        borderBottom: '2px solid #2c5aa0',
        paddingBottom: '15px',
        marginBottom: '20px'
      }}>
        <h1 style={{ 
          color: '#2c5aa0', 
          margin: '0 0 5px 0',
          fontSize: '24px'
        }}>
          ExpressTrafic
        </h1>
        <h2 style={{ 
          color: '#333',
          margin: '0',
          fontSize: '18px',
          fontWeight: 'normal'
        }}>
          Ticket de Voyage
        </h2>
        <p style={{ 
          margin: '5px 0 0 0',
          color: '#666',
          fontSize: '12px'
        }}>
          Émis le {new Date().toLocaleDateString('fr-FR')}
        </p>
      </div>

      {/* Code de réservation */}
      <div style={{
        textAlign: 'center',
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '2px dashed #2c5aa0'
      }}>
        <div style={{
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#2c5aa0',
          marginBottom: '5px'
        }}>
          CODE RÉSERVATION
        </div>
        <div style={{
          fontSize: '22px',
          fontWeight: 'bold',
          letterSpacing: '3px',
          color: '#333'
        }}>
          {reservation.code_reservation}
        </div>
      </div>

      {/* Informations du voyage */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ 
          color: '#2c5aa0',
          borderBottom: '1px solid #eee',
          paddingBottom: '8px',
          fontSize: '16px',
          marginBottom: '15px'
        }}>
          Informations du Voyage
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          fontSize: '14px'
        }}>
          <div><strong>Départ:</strong></div>
          <div>{trajet.ville_depart}</div>
          
          <div><strong>Destination:</strong></div>
          <div>{trajet.ville_arrivee}</div>
          
          <div><strong>Date:</strong></div>
          <div>{formatDate(trajet.date_depart)}</div>
          
          <div><strong>Heure:</strong></div>
          <div>{formatTime(trajet.heure_depart)}</div>
          
          <div><strong>Siège:</strong></div>
          <div><strong>N° {reservation.seat || reservation.siege_numero}</strong></div>
        </div>
      </div>

      {/* Informations du passager */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ 
          color: '#2c5aa0',
          borderBottom: '1px solid #eee',
          paddingBottom: '8px',
          fontSize: '16px',
          marginBottom: '15px'
        }}>
          Informations du Passager
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          fontSize: '14px'
        }}>
          <div><strong>Nom:</strong></div>
          <div>{user.prenom} {user.nom}</div>
          
          <div><strong>Email:</strong></div>
          <div>{user.email}</div>
        </div>
      </div>

      {/* Détails de paiement */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3 style={{ 
          color: '#2c5aa0',
          margin: '0 0 10px 0',
          fontSize: '16px'
        }}>
          Détails de Paiement
        </h3>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '14px' }}><strong>Méthode:</strong> {paymentMethod}</div>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '14px' }}><strong>Montant:</strong></div>
            <div style={{ 
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#28a745'
            }}>
              {reservation.montant_total} €
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div style={{
        border: '1px solid #ffc107',
        backgroundColor: '#fff3cd',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px',
        fontSize: '12px'
      }}>
        <h4 style={{ 
          margin: '0 0 8px 0', 
          color: '#856404',
          fontSize: '14px'
        }}>
          📋 Instructions Importantes
        </h4>
        <ul style={{ margin: 0, paddingLeft: '15px' }}>
          <li>Présentez ce ticket au chauffeur avant l'embarquement</li>
          <li>Arrivez au moins 15 minutes avant le départ</li>
          <li>Ayez une pièce d'identité avec vous</li>
          <li>Conservez ce ticket jusqu'à la fin du voyage</li>
        </ul>
      </div>

      {/* Contact */}
      <div style={{
        textAlign: 'center',
        fontSize: '11px',
        color: '#666',
        borderTop: '1px solid #ddd',
        paddingTop: '15px'
      }}>
        <div style={{ marginBottom: '5px' }}>
          <strong>Service client:</strong> +33 1 23 45 67 89 • 
          <strong> Email:</strong> contact@expresstrafic.com
        </div>
        <div style={{ fontStyle: 'italic' }}>
          www.expresstrafic.com
        </div>
      </div>
    </div>
  );
});

PrintReceipt.displayName = 'PrintReceipt';

export default PrintReceipt;