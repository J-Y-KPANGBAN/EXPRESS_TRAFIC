import React, { useState, useEffect } from "react";

import { adminService } from '../../../api';
import { Alert, Button, Table, Loader, Badge } from "../../../Components/UI";

import '../stylesAdmin/AdminSignupForm.css';


const AvisManagement = () => {
  const [avis, setAvis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAvis();
  }, []);

  const fetchAvis = async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await adminService.getAvis();
      setAvis(response.data.data || []);
    } catch (err) {
      console.error("Erreur:", err);
      setError("Erreur lors du chargement des avis.");
    } finally {
      setLoading(false);
    }
  };

  const getTypeVariant = (type) => {
    switch (type?.toLowerCase()) {
      case "positif": return "success";
      case "négatif": 
      case "negatif": return "error";
      case "neutre": return "warning";
      default: return "default";
    }
  };

  if (loading) {
    return (
      <div className="admin-management">
        <Loader size="large" text="Chargement des avis..." />
      </div>
    );
  }

  return (
    <div className="admin-management">
      <div className="section-header">
        <div className="header-title">
          <h2>Gestion des Avis</h2>
          <Badge variant="info" count={avis.length}>
            Avis
          </Badge>
        </div>
        <Button variant="secondary" icon="refresh" onClick={fetchAvis}>
          Actualiser
        </Button>
      </div>

      {error && <Alert type="error" message={error} />}

      <Table
        columns={[
          { key: "utilisateur", label: "Utilisateur" },
          { key: "trajet", label: "Trajet" },
          { key: "note", label: "Note" },
          { key: "commentaire", label: "Commentaire" },
          { key: "type", label: "Type" },
          { key: "date", label: "Date" }
        ]}
        data={avis.map(avis => ({
          utilisateur: (
            <div className="user-info">
              <div className="user-name">
                {avis.prenom} {avis.nom}
              </div>
              <div className="user-id text-muted">
                ID: {avis.utilisateur_id}
              </div>
            </div>
          ),
          trajet: `${avis.ville_depart} → ${avis.ville_arrivee}`,
          note: (
            <div className="rating-cell">
              <div className="rating-stars">
                {"★".repeat(avis.note)}
                {"☆".repeat(5 - avis.note)}
              </div>
              <div className="rating-number">
                {avis.note}/5
              </div>
            </div>
          ),
          commentaire: avis.commentaire || <em className="no-comment">Aucun commentaire</em>,
          type: (
            <Badge variant={getTypeVariant(avis.type_avis)}>
              {avis.type_avis}
            </Badge>
          ),
          date: new Date(avis.date_creation).toLocaleDateString("fr-FR")
        }))}
        emptyMessage="Aucun avis trouvé"
      />
    </div>
  );
};

export default AvisManagement;