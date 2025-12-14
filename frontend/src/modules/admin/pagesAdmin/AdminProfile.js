// frontend/src/modules/admin/pagesAdmin/AdminProfile.js - VERSION CORRIGÉE
import React, { useState, useEffect } from "react";
import { useAdminProfile } from "../../../hooks/useAdminProfile";
import { Card, Button, Loader, Alert, Input, Badge } from "../../../Components/UI";
import '../stylesAdmin/AdminProfile.css';

const AdminProfile = () => {
  const {
    adminProfile,
    loading,
    saving,
    alert,
    updateAdminProfile,
    clearAlert
  } = useAdminProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    ville: '',
    region: '',
    adresse_postale: '',
    code_postal: '',
    country: 'France'
  });

  // 🎯 INITIALISATION DU FORMULAIRE
  useEffect(() => {
    if (adminProfile) {
      setFormData({
        nom: adminProfile.nom || '',
        prenom: adminProfile.prenom || '',
        email: adminProfile.email || '',
        telephone: adminProfile.telephone || '',
        ville: adminProfile.ville || '',
        region: adminProfile.region || '',
        adresse_postale: adminProfile.adresse_postale || '',
        code_postal: adminProfile.code_postal || '',
        country: adminProfile.country || 'France'
      });
    }
  }, [adminProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await updateAdminProfile(formData);
    if (success) {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    if (adminProfile) {
      setFormData({
        nom: adminProfile.nom || '',
        prenom: adminProfile.prenom || '',
        email: adminProfile.email || '',
        telephone: adminProfile.telephone || '',
        ville: adminProfile.ville || '',
        region: adminProfile.region || '',
        adresse_postale: adminProfile.adresse_postale || '',
        code_postal: adminProfile.code_postal || '',
        country: adminProfile.country || 'France'
      });
    }
    setIsEditing(false);
    clearAlert();
  };

  if (loading) {
    return (
      <div className="admin-profile-loading">
        <Loader size="large" text="Chargement du profil administrateur..." />
      </div>
    );
  }

  if (!adminProfile) {
    return (
      <Card className="error-card">
        <div className="error-content">
          <h2>Profil administrateur non disponible</h2>
          <p>Impossible de charger les informations du profil administrateur.</p>
          <Button 
            variant="primary" 
            onClick={() => window.location.reload()}
          >
            Réessayer
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="admin-profile-container">
      <div className="admin-profile-header">
        <div className="header-content">
          <h1>Profil Administrateur</h1>
          <Badge variant="admin" className="admin-badge">ADMIN</Badge>
        </div>
        <p>Gérez vos informations et paramètres d'administration</p>
      </div>

      {alert.show && (
        <Alert 
          type={alert.type} 
          message={alert.message}
          onClose={clearAlert}
          autoClose={alert.type === "success"}
        />
      )}

      <div className="admin-profile-content">
        {/* Carte Informations Personnelles */}
        <Card className="profile-section">
          <div className="section-header">
            <h2>Informations Personnelles</h2>
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

          {isEditing ? (
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="form-row">
                <Input
                  label="Nom"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  required
                  error={alert.errors?.nom}
                />
                <Input
                  label="Prénom"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  required
                  error={alert.errors?.prenom}
                />
              </div>

              <div className="form-row">
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  error={alert.errors?.email}
                />
                <Input
                  label="Téléphone"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  error={alert.errors?.telephone}
                />
              </div>

              <Input
                label="Adresse"
                name="adresse_postale"
                value={formData.adresse_postale}
                onChange={handleChange}
                fullWidth
                error={alert.errors?.adresse_postale}
              />

              <div className="form-row">
                <Input
                  label="Ville"
                  name="ville"
                  value={formData.ville}
                  onChange={handleChange}
                  error={alert.errors?.ville}
                />
                <Input
                  label="Région"
                  name="region"
                  value={formData.region}
                  onChange={handleChange}
                  error={alert.errors?.region}
                />
              </div>

              <div className="form-row">
                <Input
                  label="Code Postal"
                  name="code_postal"
                  value={formData.code_postal}
                  onChange={handleChange}
                  error={alert.errors?.code_postal}
                />
                <Input
                  label="Pays"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  error={alert.errors?.country}
                />
              </div>

              <div className="form-actions">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  variant="primary"
                  loading={saving}
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="profile-view">
              <div className="info-grid">
                <div className="info-item">
                  <label>Nom complet:</label>
                  <span>{adminProfile.prenom} {adminProfile.nom}</span>
                </div>
                <div className="info-item">
                  <label>Email:</label>
                  <span>{adminProfile.email}</span>
                </div>
                <div className="info-item">
                  <label>Téléphone:</label>
                  <span>{adminProfile.telephone || 'Non renseigné'}</span>
                </div>
                <div className="info-item">
                  <label>Adresse:</label>
                  <span>{adminProfile.adresse_postale || 'Non renseignée'}</span>
                </div>
                <div className="info-item">
                  <label>Ville:</label>
                  <span>{adminProfile.ville || 'Non renseignée'}</span>
                </div>
                <div className="info-item">
                  <label>Code Postal:</label>
                  <span>{adminProfile.code_postal || 'Non renseigné'}</span>
                </div>
                <div className="info-item">
                  <label>Région:</label>
                  <span>{adminProfile.region || 'Non renseignée'}</span>
                </div>
                <div className="info-item">
                  <label>Pays:</label>
                  <span>{adminProfile.country || 'Non renseigné'}</span>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Carte Informations Système */}
        <Card className="profile-section">
          <h2>Informations Système</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Numéro Client:</label>
              <span>{adminProfile.numero_client}</span>
            </div>
            <div className="info-item">
              <label>Date d'inscription:</label>
              <span>
                {adminProfile.date_inscription 
                  ? new Date(adminProfile.date_inscription).toLocaleDateString('fr-FR')
                  : 'Non disponible'
                }
              </span>
            </div>
            <div className="info-item">
              <label>Dernière connexion:</label>
              <span>
                {adminProfile.derniere_connexion 
                  ? new Date(adminProfile.derniere_connexion).toLocaleString('fr-FR')
                  : 'Jamais'
                }
              </span>
            </div>
            <div className="info-item">
              <label>Rôle:</label>
              <span className="role-badge admin">Administrateur</span>
            </div>
          </div>
        </Card>

        {/* Carte Actions Rapides */}
        <Card className="profile-section">
          <h2>Actions Rapides</h2>
          <div className="quick-actions">
            <Button 
              variant="primary" 
              onClick={() => window.location.href = '/admin/dashboard'}
            >
              📊 Tableau de bord
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/admin/users'}
            >
              👥 Gestion utilisateurs
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/admin/trajets'}
            >
              🚌 Gestion trajets
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminProfile;