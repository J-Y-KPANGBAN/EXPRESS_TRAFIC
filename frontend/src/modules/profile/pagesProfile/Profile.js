// frontend/src/modules/profile/pagesProfile/Profile.js - VERSION CORRIGÉE
import React, { useEffect } from "react";
import { Button, Card, Loader, Alert } from "../../../Components/UI";
import { useProfile } from "../../../hooks/useProfile";
import { useUser } from "../../../Context/UserContext";
import { useNavigate } from "react-router-dom";

import ProfileForm from "../componentsProfile/ProfileForm";
import ProfileView from "./ProfileView";

import "../stylesProfile/Profile.css";

const Profile = () => {
  const { isAuthenticated, loading: userLoading, user } = useUser();
  const navigate = useNavigate();
  
  const {
    profile,
    isEditing,
    setIsEditing,
    formData,
    loading: profileLoading,
    saving,
    alert,
    handleChange,
    handleDateChange,
    handleSubmit,
    formatDateForInput,
    hideAlert,
    handleCancel,
    refreshProfile
  } = useProfile();

  // ✅ REDIRECTION INTELLIGENTE
  useEffect(() => {
    // Attendre que le chargement soit terminé
    if (!userLoading) {
      if (!isAuthenticated) {
        console.log("🔐 Redirection vers login - Utilisateur non authentifié");
        sessionStorage.setItem("redirectAfterLogin", "/profile");
        navigate("/login");
      } else {
        console.log("✅ Utilisateur authentifié:", user?.email);
      }
    }
  }, [isAuthenticated, userLoading, navigate, user]);

  // ✅ COMBINER LES CHARGEMENTS
  const loading = userLoading || profileLoading;

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-loading">
          <Loader size="large" text="Chargement de votre profil..." />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="profile-container">
        <Card className="error-card">
          <div className="error-content">
            <h2>Accès non autorisé</h2>
            <p>Veuillez vous connecter pour accéder à votre profil.</p>
            <div className="error-actions">
              <Button 
                variant="primary" 
                onClick={() => navigate("/login")}
              >
                Se connecter
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!profile && !loading) {
    return (
      <div className="profile-container">
        <Card className="error-card">
          <div className="error-content">
            <h2>Profil non trouvé</h2>
            <p>Nous n'avons pas pu charger vos informations.</p>
            <div className="error-actions">
              <Button variant="primary" onClick={refreshProfile}>
                Réessayer
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate("/")}
              >
                Retour à l'accueil
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* HEADER */}
      <Card className="profile-card">
        <div className="profile-header">
          <div className="header-content">
            <h1>Mon Profil</h1>
            <p>Gérez vos informations personnelles</p>
          </div>

          {!isEditing && (
            <Button
              variant="primary"
              onClick={() => setIsEditing(true)}
              disabled={loading}
            >
              Modifier le profil
            </Button>
          )}
        </div>

        {/* ALERT */}
        {alert.show && (
          <Alert 
            type={alert.type} 
            message={alert.message} 
            onClose={hideAlert} 
            autoClose={alert.type === "success"}
          />
        )}

        {/* CONTENT */}
        <div className="profile-content">
          {isEditing ? (
            <ProfileForm
              formData={formData}
              handleChange={handleChange}
              handleDateChange={handleDateChange}
              handleSubmit={handleSubmit}
              formatDateForInput={formatDateForInput}
              onCancel={handleCancel}
              errors={alert.errors}
              saving={saving}
            />
          ) : (
            <ProfileView profile={profile} />
          )}
        </div>
      </Card>

      {/* SECTION DOCUMENTS & VOYAGES */}
 {/* SECTION MES RÉSERVATIONS */}
<div className="profile-documents">
  <Card className="documents-card">
    <h2 className="documents-title">Mes réservations</h2>
    
    <div className="documents-actions">
      <DocumentAction
        icon="📚"
        title="Gérer mes réservations"
        description="Voyages à venir, historique et archives"
        onClick={() => navigate("/mes-reservations")}
      />
    </div>
  </Card>
</div>
    </div>
  );
};

// COMPOSANT POUR LES ACTIONS
const DocumentAction = ({ icon, title, description, onClick }) => (
  <button 
    onClick={onClick} 
    className="document-action"
    type="button"
  >
    <div className="action-content">
      <div className="action-icon">{icon}</div>
      <div className="action-text">
        <div className="action-title">{title}</div>
        <div className="action-description">{description}</div>
      </div>
    </div>
    <div className="action-arrow">→</div>
  </button>
);

export default Profile;