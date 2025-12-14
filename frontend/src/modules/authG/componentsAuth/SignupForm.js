import React from "react";
import { Link } from "react-router-dom";

import FormSection from "./FormSection";
import { Input, Button, Select, Checkbox , Calendar} from "../../../Components/UI";

const SignupForm = ({
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
  return (
    <form onSubmit={handleSubmit} noValidate className="signup-form-container">
      {/* Informations personnelles */}
      <FormSection title="Informations personnelles">
        <div className="form-row">
          <Input
            label="Nom *"
            name="nom"
            type="text"
            placeholder="Votre nom"
            value={formData.nom}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.nom}
            disabled={apiStatus === 'offline'}
            required
          />

          <Input
            label="Prénom *"
            name="prenom"
            type="text"
            placeholder="Votre prénom"
            value={formData.prenom}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.prenom}
            disabled={apiStatus === 'offline'}
            required
          />
        </div>

        {/* ✅ CORRECTION : Champ texte avec format jj/mm/aaaa */}
        <Calendar
  label="Date de naissance"
  value={formData.date_naissance}
  onChange={(value) => setFormData({...formData, date_naissance: value})}
  required={true}
  error={errors.date_naissance}
/>
      </FormSection>

      {/* Coordonnées */}
      <FormSection title="Coordonnées">
        <Input
          label="Email *"
          name="email"
          type="email"
          placeholder="votre@email.com"
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.email}
          disabled={apiStatus === 'offline'}
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
            disabled={apiStatus === 'offline' || countries.length === 0}
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
            label="Téléphone *"
            name="telephone"
            type="tel"
            placeholder="+33 1 23 45 67 89"
            value={formData.telephone}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.telephone}
            disabled={apiStatus === 'offline'}
            required
          />
        </div>
      </FormSection>

      {/* Adresse */}
      <FormSection title="Adresse">
        <Input
          label="Adresse postale *"
          name="adresse_postale"
          type="text"
          placeholder="Numéro et rue"
          value={formData.adresse_postale}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.adresse_postale}
          disabled={apiStatus === 'offline'}
          required
        />

        <div className="form-row">
          <Input
            label="Ville *"
            name="ville"
            type="text"
            placeholder="Votre ville"
            value={formData.ville}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.ville}
            disabled={apiStatus === 'offline'}
            required
          />

          <Input
            label="Code postal"
            name="code_postal"
            type="text"
            placeholder="75000"
            value={formData.code_postal}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.code_postal}
            disabled={apiStatus === 'offline'}
          />
        </div>

        <Input
          label="Région"
          name="region"
          type="text"
          placeholder="Votre région (ex: Île-de-France)"
          value={formData.region}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.region}
          disabled={apiStatus === 'offline'}
          helpText="Facultatif"
        />
      </FormSection>

      {/* Sécurité */}
      <FormSection title="Sécurité du compte">
        <div className="form-row">
          <Input
            label="Mot de passe *"
            name="mot_de_passe"
            type="password"
            placeholder="Minimum 8 caractères"
            value={formData.mot_de_passe}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.mot_de_passe}
            disabled={apiStatus === 'offline'}
            helpText="Doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre"
            required
          />

          <Input
            label="Confirmation *"
            name="confirm_mot_de_passe"
            type="password"
            placeholder="Retapez votre mot de passe"
            value={formData.confirm_mot_de_passe}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.confirm_mot_de_passe}
            disabled={apiStatus === 'offline'}
            required
          />
        </div>
      </FormSection>

      {/* Conditions */}
      <FormSection>
        <Checkbox
          label={
            <span>
              J'accepte les <Link to="/terms" target="_blank" className="link">conditions d'utilisation</Link> *
            </span>
          }
          checked={acceptedTerms}
          onChange={(checked) => setAcceptedTerms(checked)}
          disabled={apiStatus === 'offline'}
          error={errors.acceptedTerms}
        />
      </FormSection>

      <Button
        type="submit"
        variant="primary"
        size="large"
        loading={isSubmitting}
        disabled={isSubmitting || apiStatus === 'offline'}
        fullWidth
        className="submit-btn"
      >
        {apiStatus === 'offline' 
          ? 'Service indisponible' 
          : isSubmitting 
            ? 'Création du compte...' 
            : 'Créer mon compte'
        }
      </Button>
    </form>
  );
};

export default SignupForm;