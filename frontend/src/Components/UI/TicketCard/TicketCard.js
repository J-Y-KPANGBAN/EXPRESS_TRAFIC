import React from 'react';
import { Card, Badge } from '..';
import './TicketCard.css';

const TicketCard = ({ reservation, onDownload, onViewDetails }) => {
  const getStatusVariant = (status) => {
    const variants = {
      'confirmee': 'success',
      'en_attente': 'warning', 
      'annulee': 'error',
      'termine': 'info'
    };
    return variants[status] || 'default';
  };

  return (
    <Card className="ticket-card">
      <div className="ticket-header">
        <div className="ticket-code">
          #{reservation.code_reservation}
        </div>
        <Badge variant={getStatusVariant(reservation.etat_reservation)}>
          {reservation.etat_reservation}
        </Badge>
      </div>
      
      <div className="ticket-route">
        <span className="from">{reservation.ville_depart}</span>
        <span className="arrow">→</span>
        <span className="to">{reservation.ville_arrivee}</span>
      </div>
      
      <div className="ticket-details">
        <div className="detail">
          <span>Date:</span>
          <span>{new Date(reservation.date_depart).toLocaleDateString('fr-FR')}</span>
        </div>
        <div className="detail">
          <span>Siège:</span>
          <span>N° {reservation.siege_numero}</span>
        </div>
        <div className="detail">
          <span>Prix:</span>
          <span className="price">{reservation.montant_total} €</span>
        </div>
      </div>
      
      <div className="ticket-actions">
        <button onClick={() => onDownload(reservation)} className="btn-download">
          📥 Télécharger
        </button>
        <button onClick={() => onViewDetails(reservation)} className="btn-details">
          👁️ Détails
        </button>
      </div>
    </Card>
  );
};

export default TicketCard;