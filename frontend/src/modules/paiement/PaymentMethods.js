//frontend/src/modules/paiement/PaymentMethods.js
import React from 'react';
import './PaymentMethods.css';

const PaymentMethods = ({ selectedMethod, onMethodSelect }) => {
  const paymentMethods = [
    {
      id: 'stripe',
      name: 'Carte Bancaire',
      icon: '💳',
      description: 'Visa, Mastercard, CB',
      supported: true
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: '🔵',
      description: 'Paiement sécurisé PayPal',
      supported: true
    },
    {
      id: 'orange_money',
      name: 'Orange Money',
      icon: '🟠',
      description: 'Paiement mobile Orange',
      supported: true
    },
    {
      id: 'mtn_money',
      name: 'MTN Mobile Money',
      icon: '🟡',
      description: 'Paiement mobile MTN',
      supported: true
    },
    {
      id: 'wave',
      name: 'Wave',
      icon: '🌊',
      description: 'Paiement par Wave',
      supported: true
    }
  ];

  return (
    <div className="payment-methods">
      <h3>Choisissez votre moyen de paiement</h3>
      
      <div className="methods-grid">
        {paymentMethods.map(method => (
          <div
            key={method.id}
            className={`method-card ${selectedMethod === method.id ? 'selected' : ''} ${!method.supported ? 'disabled' : ''}`}
            onClick={() => method.supported && onMethodSelect(method.id)}
          >
            <div className="method-icon">{method.icon}</div>
            <div className="method-info">
              <div className="method-name">{method.name}</div>
              <div className="method-description">{method.description}</div>
            </div>
            {!method.supported && (
              <div className="coming-soon">Bientôt disponible</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaymentMethods;