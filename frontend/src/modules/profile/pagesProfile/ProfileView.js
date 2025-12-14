import React from "react";
import { Card, Badge } from "../../../Components/UI";

import "../stylesProfile/Profile.css";

// Dans ProfileView.js - AFFICHER LE NOM DU PAYS
const ProfileView = ({ profile }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "Non renseigné";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Date invalide";
      return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "Date invalide";
    }
  };

  const getTypeVariant = (type) => {
    switch (type) {
      case "admin": return "error";
      case "chauffeur": return "warning";
      case "client": return "success";
      default: return "info";
    }
  };

  return (
    <div className="profile-info">
      {/* SECTION — INFORMATIONS PERSONNELLES */}
      <Card className="info-section">
        <h3 className="section-title">Informations personnelles</h3>
        <div className="info-grid">
          <InfoItem
            label="Nom complet"
            value={`${profile.prenom} ${profile.nom}`}
          />
          <InfoItem label="Email" value={profile.email} />
          <InfoItem label="Téléphone" value={profile.telephone} />
          <InfoItem
            label="Date de naissance"
            value={formatDate(profile.date_naissance)}
          />
        </div>
      </Card>

      {/* SECTION — ADRESSE */}
      <Card className="info-section">
        <h3 className="section-title">Adresse</h3>
        <div className="info-grid">
          <InfoItem label="Adresse" value={profile.adresse_postale} />
          <InfoItem label="Ville" value={profile.ville} />
          <InfoItem label="Code postal" value={profile.code_postal} />
          <InfoItem label="Région" value={profile.region} />
          {/* ✅ AFFICHER LE NOM DU PAYS */}
          <InfoItem 
            label="Pays" 
            value={profile.country_name || "Non renseigné"} 
          />
        </div>
      </Card>

      {/* SECTION — COMPTE */}
      <Card className="info-section">
        <h3 className="section-title">Compte utilisateur</h3>
        <div className="info-grid">
          <InfoItem
            label="Numéro client"
            value={profile.numero_client}
            copyable
          />
          <InfoItem
            label="Date d'inscription"
            value={formatDate(profile.date_inscription)}
          />
          <InfoItem
            label="Type d'utilisateur"
            value={
              <Badge variant={getTypeVariant(profile.type_utilisateur)}>
                {profile.type_utilisateur}
              </Badge>
            }
          />
        </div>
      </Card>
    </div>
  );
};
// Composant InfoItem inchangé
const InfoItem = ({ label, value, copyable = false }) => {
  const handleCopy = () => {
    if (copyable && value) {
      navigator.clipboard.writeText(value);
      alert("📋 Copié !");
    }
  };

  return (
    <div className={`info-item ${copyable ? "copyable" : ""}`}>
      <label className="info-label">{label}</label>

      <div className="info-value-container">
        <span className="info-value">{value || "Non renseigné"}</span>

        {copyable && value && (
          <button
            className="copy-btn"
            onClick={handleCopy}
            title="Copier"
          >
            📋
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfileView;