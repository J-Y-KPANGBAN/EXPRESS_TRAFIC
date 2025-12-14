import React from 'react';
import { useCart } from '../../Context/CartContext';
import { Card, Button} from '../UI';
import './CartPage.css';

const CartPage = () => {
  const { items, total, removeFromCart, updateQuantity, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="cart-empty">
        <Card>
          <div className="empty-cart-message">
            <h2>🛒 Votre panier est vide</h2>
            <p>Ajoutez des trajets à votre panier pour continuer</p>
            <Button onClick={() => window.location.href = '/travels'}>
              Rechercher des trajets
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-header">
        <h1>Mon Panier</h1>
        <p>{items.length} trajet(s) sélectionné(s)</p>
      </div>

      <div className="cart-content">
        <div className="cart-items">
          {items.map(item => (
            <CartItem 
              key={item.id}
              item={item}
              onRemove={removeFromCart}
              onUpdateQuantity={updateQuantity}
            />
          ))}
        </div>

        <div className="cart-summary">
          <Card>
            <h3>Récapitulatif</h3>
            <div className="summary-row">
              <span>Sous-total:</span>
              <span>{total.toFixed(2)} €</span>
            </div>
            <div className="summary-row">
              <span>Frais de service:</span>
              <span>{(total * 0.05).toFixed(2)} €</span>
            </div>
            <div className="summary-row total">
              <span>Total:</span>
              <span>{(total * 1.05).toFixed(2)} €</span>
            </div>
            
            <Button variant="primary" fullWidth>
              Procéder au paiement
            </Button>
            
            <Button variant="outline" fullWidth onClick={clearCart}>
              Vider le panier
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

const CartItem = ({ item, onRemove, onUpdateQuantity }) => {
  return (
    <Card className="cart-item">
      <div className="item-info">
        <div className="route">
          <strong>{item.ville_depart} → {item.ville_arrivee}</strong>
        </div>
        <div className="details">
          <span>Date: {new Date(item.date_depart).toLocaleDateString('fr-FR')}</span>
          <span>Siège: N° {item.siege_numero}</span>
          <span>Arrêt: {item.arret_depart} → {item.arret_arrivee}</span>
        </div>
      </div>
      
      <div className="item-controls">
        <div className="quantity-controls">
          <button 
            onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
            disabled={item.quantity <= 1}
          >
            −
          </button>
          <span>{item.quantity}</span>
          <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}>
            +
          </button>
        </div>
        
        <div className="price">
          {(item.prix * item.quantity).toFixed(2)} €
        </div>
        
        <button 
          onClick={() => onRemove(item.id)}
          className="remove-btn"
        >
          🗑️
        </button>
      </div>
    </Card>
  );
};

export default CartPage;