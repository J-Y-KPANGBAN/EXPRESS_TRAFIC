import React from 'react';
import './LoadingAuth.css';

export const AuthError = ({ title, message, onRetry, onLogout }) => {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      // Redirection VERS LA PAGE DE CONNEXION
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      // Déconnexion et redirection vers l'accueil
      localStorage.removeItem('token');
      window.location.href = '/';
    }
  };

  return (
    <div className="auth-error-container">
      <div className="auth-error-content">
        <div className="auth-error-icon">⚠️</div>
        <h2>{title || "Problème d'authentification"}</h2>
        <p>{message || "Session expirée ou invalide"}</p>
        
        <div className="auth-error-actions">
          <button 
            className="auth-retry-btn"
            onClick={handleRetry}
          >
            Se connecter
          </button>
          
          <button 
            className="auth-logout-btn"
            onClick={handleLogout}
          >
            Réessayer
          </button>
        </div>
        
        <div className="auth-redirect-info">
          <p>Vous allez être redirigé vers la page de connexion...</p>
        </div>
      </div>
    </div>
  );
};

const LoadingAuth = ({ message = "Vérification de votre session..." }) => {
  return (
    <div className="loading-auth-container">
      <div className="loading-auth-content">
        <div className="loading-spinner"></div>
        <p>{message}</p>
      </div>
    </div>
  );
};

export default LoadingAuth;