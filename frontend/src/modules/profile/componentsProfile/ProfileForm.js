// frontend/src/modules/profile/componentsProfile/ProfileForm.js
import React from "react";
import { Input, Button, Card } from "../../../Components/UI";
import "../stylesProfile/Profile.css";

const ProfileForm = ({ 
  formData, 
  handleChange, 
  handleDateChange,
  handleSubmit, 
  formatDateForInput, 
  onCancel,
  errors = {},
  saving = false
}) => {
  return (
    <form onSubmit={handleSubmit} className="profile-form">
      <Card className="form-section">
        <h3 className="section-title">Informations personnelles</h3>
        
        <div className="form-row">
          <Input
            label="Nom *"
            name="nom"
            type="text"
            value={formData.nom || ''}
            onChange={handleChange}
            error={errors.nom}
            required
            disabled={saving}
            placeholder="Votre nom"
          />
          <Input
            label="Prénom *"
            name="prenom"
            type="text"
            value={formData.prenom || ''}
            onChange={handleChange}
            error={errors.prenom}
            required
            disabled={saving}
            placeholder="Votre prénom"
          />
        </div>
        
        <Input
          label="Email *"
          type="email"
          value={formData.email || ''}
          disabled
          helpText="L'email ne peut pas être modifié"
          error={errors.email}
        />

        <Input
          label="Téléphone *"
          name="telephone"
          type="tel"
          value={formData.telephone || ''}
          onChange={handleChange}
          error={errors.telephone}
          placeholder="+33 1 23 45 67 89"
          disabled={saving}
          required
        />

        {/* Champ date corrigé */}
        <div className="form-field">
          <label className="form-label">
            Date de naissance
            {errors.date_naissance && (
              <span className="error-text"> - {errors.date_naissance}</span>
            )}
          </label>
          <input
            name="date_naissance"
            type="date"
            value={formatDateForInput(formData.date_naissance)}
            onChange={handleDateChange}
            disabled={saving}
            className={`form-input ${errors.date_naissance ? 'input-error' : ''}`}
            min="1900-01-01"
            max={new Date().toISOString().split('T')[0]}
          />
          {errors.date_naissance && (
            <div className="error-message">{errors.date_naissance}</div>
          )}
        </div>
      </Card>

      <Card className="form-section">
        <h3 className="section-title">Adresse</h3>
        
        <Input
          label="Adresse"
          name="adresse_postale"
          type="text"
          value={formData.adresse_postale || ''}
          onChange={handleChange}
          error={errors.adresse_postale}
          placeholder="Numéro et rue"
          disabled={saving}
        />

        <div className="form-row">
          <Input
            label="Ville"
            name="ville"
            type="text"
            value={formData.ville || ''}
            onChange={handleChange}
            error={errors.ville}
            disabled={saving}
            placeholder="Votre ville"
          />
          <Input
            label="Code postal"
            name="code_postal"
            type="text"
            value={formData.code_postal || ''}
            onChange={handleChange}
            error={errors.code_postal}
            placeholder="75000"
            disabled={saving}
          />
        </div>

        <div className="form-row">
          <Input
            label="Région"
            name="region"
            type="text"
            value={formData.region || ''}
            onChange={handleChange}
            error={errors.region}
            disabled={saving}
            placeholder="Votre région"
          />
          <Input
            label="Pays"
            name="country"
            type="text"
            value={formData.country || ''}
            onChange={handleChange}
            error={errors.country}
            disabled={saving}
            placeholder="Votre pays"
          />
        </div>
      </Card>

      <div className="form-actions">
        <Button 
          type="button" 
          variant="outline"
          onClick={onCancel}
          disabled={saving}
        >
          Annuler
        </Button>
        <Button 
          type="submit" 
          variant="primary"
          loading={saving}
          disabled={saving}
        >
          {saving ? "Enregistrement..." : "Enregistrer les modifications"}
        </Button>
      </div>
    </form>
  );
};

export default ProfileForm;