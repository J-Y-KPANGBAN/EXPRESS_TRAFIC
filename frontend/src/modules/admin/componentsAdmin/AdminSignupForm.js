// frontend/src/modules/admin/componentsAdmin/AdminSignupForm.js - VERSION COMPLÈTE
import React from "react";
import { Link } from "react-router-dom";
import { Input, Button, Select, Checkbox, Calendar } from "../../../Components/UI";
import '../stylesAdmin/AdminSignupForm.css';


const AdminSignupForm = ({
  formData,
  errors,
  isSubmitting,
  apiStatus,
  countries,
  acceptedTerms,
  handleChange,
  handleBlur,
  handleCountryChange,
  handleSubmit,
  setAcceptedTerms,
  setFormData
}) => {
  const disabled = apiStatus === "offline" || isSubmitting;

  return (
    <form onSubmit={handleSubmit} noValidate className="admin-signup-form">
      {/* 🔐 CODE ADMIN */}
      <div className="form-section">
        <h3>🔐 Code d'accès administrateur</h3>
        <Input
          label="Code d'autorisation *"
          name="code_admin"
          type="password"
          placeholder="Code administrateur secret"
          value={formData.code_admin}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.code_admin}
          disabled={disabled}
          required
        />
        <p className="admin-code-help">
          Ce code est obligatoire pour créer un compte administrateur.
        </p>
      </div>

      {/* 👤 INFORMATIONS PERSONNELLES */}
      <div className="form-section">
        <h3>👤 Informations personnelles</h3>
        <div className="form-row">
          <Input
            label="Nom *"
            name="nom"
            placeholder="Votre nom"
            value={formData.nom}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.nom}
            disabled={disabled}
            required
          />

          <Input
            label="Prénom *"
            name="prenom"
            placeholder="Votre prénom"
            value={formData.prenom}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.prenom}
            disabled={disabled}
            required
          />
        </div>

        <Calendar
          label="Date de naissance *"
          value={formData.date_naissance}
          onChange={(value) => setFormData({...formData, date_naissance: value})}
          required={true}
          error={errors.date_naissance}
        />
      </div>

      {/* 📞 COORDONNÉES */}
      <div className="form-section">
        <h3>📞 Coordonnées professionnelles</h3>
        <Input
          label="Email professionnel *"
          name="email"
          type="email"
          placeholder="admin@entreprise.com"
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.email}
          disabled={disabled}
          required
        />

        <div className="form-row">
          <Select
            label="Pays *"
            name="country"
            value={formData.country}
            onChange={handleCountryChange}
            onBlur={handleBlur}
            error={errors.country}
            disabled={disabled || countries.length === 0}
            options={[
              { value: '', label: countries.length === 0 ? 'Chargement...' : 'Choisir un pays' },
              ...countries.map(country => ({
                value: country.name,
                label: `${country.name} (${country.code})`
              }))
            ]}
            required
          />

          <Input
            label="Téléphone professionnel *"
            name="telephone"
            type="tel"
            placeholder="+33 1 23 45 67 89"
            value={formData.telephone}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.telephone}
            disabled={disabled}
            required
          />
        </div>
      </div>

      {/* 🏢 ADRESSE PROFESSIONNELLE */}
      <div className="form-section">
        <h3>🏢 Adresse professionnelle</h3>
        <Input
          label="Adresse postale *"
          name="adresse_postale"
          placeholder="Numéro et rue de l'entreprise"
          value={formData.adresse_postale}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.adresse_postale}
          disabled={disabled}
          required
        />

        <div className="form-row">
          <Input
            label="Ville *"
            name="ville"
            placeholder="Ville"
            value={formData.ville}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.ville}
            disabled={disabled}
            required
          />

          <Input
            label="Code postal"
            name="code_postal"
            placeholder="75000"
            value={formData.code_postal}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.code_postal}
            disabled={disabled}
          />

          <Input
            label="Région"
            name="region"
            placeholder="Région"
            value={formData.region}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.region}
            disabled={disabled}
          />
        </div>
      </div>

      {/* 🔒 SÉCURITÉ RENFORCÉE */}
      <div className="form-section">
        <h3>🔒 Sécurité renforcée</h3>
        <div className="form-row">
          <Input
            label="Mot de passe administrateur *"
            name="mot_de_passe"
            type="password"
            placeholder="Minimum 12 caractères"
            value={formData.mot_de_passe}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.mot_de_passe}
            disabled={disabled}
            required
          />

          <Input
            label="Confirmation *"
            name="confirm_mot_de_passe"
            type="password"
            placeholder="Confirmez le mot de passe"
            value={formData.confirm_mot_de_passe}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.confirm_mot_de_passe}
            disabled={disabled}
            required
          />
        </div>
      </div>

      {/* ✔ VALIDATION */}
      <div className="form-section">
        <Checkbox
          label={
            <span>
              J'accepte les <Link to="/terms" target="_blank" className="link">conditions d'utilisation administrateur</Link> *
            </span>
          }
          checked={acceptedTerms}
          onChange={(checked) => setAcceptedTerms(checked)}
          disabled={disabled}
          error={errors.acceptedTerms}
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="large"
        loading={isSubmitting}
        disabled={disabled}
        fullWidth
        className="admin-submit-btn"
      >
        {disabled
          ? "Service indisponible"
          : isSubmitting
          ? "Création du compte admin..."
          : "🚀 Créer le compte administrateur"}
      </Button>
    </form>
  );
};

export default AdminSignupForm;