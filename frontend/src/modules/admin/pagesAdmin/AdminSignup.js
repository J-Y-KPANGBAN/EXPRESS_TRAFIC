import React from "react";
import { Link } from "react-router-dom";
import { useAdminSignup } from "../../../hooks/useAdminSignup";
import { Alert, Card, Button, Input, Checkbox } from "../../../Components/UI";
import '../stylesAdmin/AdminAuth.css';

const AdminSignup = () => {
  const {
    formData,
    errors,
    isSubmitting,
    alert,
    setAlert,
    apiStatus,
    countries,
    acceptedTerms,
    handleChange,
    handleBlur,
    handleCountryChange,
    handleSubmit,
    setAcceptedTerms // ✅ Maintenant cette fonction est sécurisée
  } = useAdminSignup();

  return (
    <div className="admin-auth-container">
      <Card className="admin-auth-card">
        {/* 🎯 EN-TÊTE ADMIN */}
        <div className="admin-auth-header">
          <div className="admin-icon">⚙️</div>
          <h1>Créer un compte Administrateur</h1>
          <p className="admin-subtitle">Accès réservé au personnel autorisé</p>

          {apiStatus === "offline" && (
            <Alert 
              type="warning" 
              message="⚠️ Mode hors ligne — Certaines fonctionnalités peuvent être limitées" 
            />
          )}
        </div>

        {/* 🛡️ ALERTES */}
        {alert.show && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert()}
            autoClose={alert.type === "success"}
          />
        )}

        {/* 📝 FORMULAIRE D'INSCRIPTION ADMIN */}
        <form onSubmit={handleSubmit} className="admin-auth-form">
          
          {/* 🔐 SECTION CODE ADMIN */}
          <div className="form-section">
            <h3 className="section-title">Accès Administrateur</h3>
            <Input
              label="Code d'accès administrateur"
              type="password"
              name="code_admin"
              value={formData.code_admin}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Entrez le code d'accès sécurisé"
              required
              error={errors.code_admin}
              disabled={isSubmitting}
              helperText="Code requis pour la création de compte administrateur"
            />
          </div>

          {/* 👤 SECTION INFORMATIONS PERSONNELLES */}
          <div className="form-section">
            <h3 className="section-title">Informations Personnelles</h3>
            <div className="form-row">
              <Input
                label="Nom"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Votre nom"
                required
                error={errors.nom}
                disabled={isSubmitting}
              />
              <Input
                label="Prénom"
                name="prenom"
                value={formData.prenom}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Votre prénom"
                required
                error={errors.prenom}
                disabled={isSubmitting}
              />
            </div>

            <div className="form-row">
              <Input
                label="Date de naissance"
                type="date"
                name="date_naissance"
                value={formData.date_naissance}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                error={errors.date_naissance}
                disabled={isSubmitting}
                max={new Date().toISOString().split('T')[0]}
              />
              <Input
                label="Téléphone"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="+33 6 12 34 56 78"
                required
                error={errors.telephone}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* 📧 SECTION COORDONNÉES */}
          <div className="form-section">
            <h3 className="section-title">Coordonnées</h3>
            <Input
              label="Email professionnel"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="admin@transport.com"
              required
              error={errors.email}
              disabled={isSubmitting}
              helperText="Utilisez une adresse email professionnelle"
            />

            <Input
              label="Adresse postale"
              name="adresse_postale"
              value={formData.adresse_postale}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="123 Avenue des Champs-Élysées"
              required
              error={errors.adresse_postale}
              disabled={isSubmitting}
              fullwidth="true" // ✅ Correction du warning React
            />

            <div className="form-row">
              <Input
                label="Ville"
                name="ville"
                value={formData.ville}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Paris"
                required
                error={errors.ville}
                disabled={isSubmitting}
              />
              <Input
                label="Code Postal"
                name="code_postal"
                value={formData.code_postal}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="75008"
                required
                error={errors.code_postal}
                disabled={isSubmitting}
              />
            </div>

            <div className="form-row">
              <Input
                label="Région"
                name="region"
                value={formData.region}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Île-de-France"
                error={errors.region}
                disabled={isSubmitting}
              />
              
              <div className="form-group">
                <label className="input-label">Pays *</label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleCountryChange}
                  disabled={isSubmitting}
                  className={`form-select ${errors.country ? 'error' : ''}`}
                >
                  <option value="">Sélectionnez un pays</option>
                  {countries.map((country) => (
                    <option key={country.name} value={country.name}>
                      {country.name} {country.code ? `(${country.code})` : ''}
                    </option>
                  ))}
                </select>
                {errors.country && <div className="error-message">{errors.country}</div>}
              </div>
            </div>
          </div>

          {/* 🔒 SECTION SÉCURITÉ */}
          <div className="form-section">
            <h3 className="section-title">Sécurité</h3>
            <div className="form-row">
              <Input
                label="Mot de passe administrateur"
                type="password"
                name="mot_de_passe"
                value={formData.mot_de_passe}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Minimum 8 caractères"
                required
                error={errors.mot_de_passe}
                disabled={isSubmitting}
                helpertext="Majuscule, minuscule, chiffre et 8 caractères minimum" // ✅ Correction du warning
              />
              <Input
                label="Confirmer le mot de passe"
                type="password"
                name="confirm_mot_de_passe"
                value={formData.confirm_mot_de_passe}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Identique au mot de passe"
                required
                error={errors.confirm_mot_de_passe}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* ✅ SECTION CONDITIONS - VERSION CORRIGÉE */}
          <div className="form-section">
            <Checkbox
              label={
                <span>
                  J'accepte les <Link to="/terms" className="link">conditions d'utilisation</Link> et la <Link to="/privacy-policy" className="link">politique de confidentialité</Link>
                </span>
              }
              checked={acceptedTerms}
              onChange={(e) => {
                // 🛡️ CORRECTION CRITIQUE : Gestion sécurisée
                if (e && e.target) {
                  setAcceptedTerms(e.target.checked);
                } else {
                  // Fallback sécurisé
                  setAcceptedTerms(!acceptedTerms);
                }
              }}
              disabled={isSubmitting}
              error={errors.acceptedTerms}
            />
          </div>

          {/* 🚀 BOUTON DE SOUMISSION */}
          <Button
            type="submit"
            variant="primary"
            size="large"
            loading={isSubmitting}
            disabled={isSubmitting}
            fullwidth="true" // ✅ Correction du warning React
            className="submit-button"
          >
            {isSubmitting ? "Création du compte admin..." : "Créer le compte administrateur"}
          </Button>
        </form>

        {/* 🔗 PIED DE PAGE */}
        <div className="admin-auth-footer">
          <p>
            Déjà un compte administrateur ?{" "}
            <Link to="/admin/login" className="admin-link">
              Se connecter
            </Link>
          </p>

          <div className="security-notice">
            <span className="security-icon">🔒</span>
            <span className="security-text">
              Page sécurisée — Réservée à la création de comptes administrateurs
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminSignup;