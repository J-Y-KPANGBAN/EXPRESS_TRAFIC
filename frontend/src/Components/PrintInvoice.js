// Components/PrintInvoice.js
import React from 'react';

const PrintInvoice = React.forwardRef(({ 
  reservation, 
  user, 
  trajet, 
  payment 
}, ref) => {
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div ref={ref} style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '600px',
      margin: '0 auto',
      color: '#333',
      backgroundColor: 'white'
    }}>
      <h1 style={{ textAlign: 'center', color: '#2c5aa0' }}>Reçu de Paiement</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <p><strong>Date:</strong> {new Date().toLocaleDateString('fr-FR')}</p>
        <p><strong>Référence:</strong> {payment.reference}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Détails de la réservation</h3>
        <p><strong>Code:</strong> {reservation.code_reservation}</p>
        <p><strong>Trajet:</strong> {trajet.ville_depart} → {trajet.ville_arrivee}</p>
        <p><strong>Date du trajet:</strong> {formatDate(trajet.date_depart)}</p>
        <p><strong>Siège:</strong> N° {reservation.siege_numero}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Détails du paiement</h3>
        <p><strong>Méthode:</strong> {payment.method}</p>
        <p><strong>Montant:</strong> {payment.amount} €</p>
        <p><strong>Statut:</strong> {payment.status === 'reussi' ? 'Payé' : payment.status}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Client</h3>
        <p>{user.prenom} {user.nom}</p>
        <p>{user.email}</p>
        <p>{user.telephone}</p>
      </div>

      <div style={{ textAlign: 'center', fontSize: '12px', color: '#666', borderTop: '1px solid #ddd', paddingTop: '15px' }}>
        <p>Merci pour votre confiance !</p>
        <p>ExpressTrafic - contact@expresstrafic.com</p>
      </div>
    </div>
  );
});

PrintInvoice.displayName = 'PrintInvoice';

export default PrintInvoice;