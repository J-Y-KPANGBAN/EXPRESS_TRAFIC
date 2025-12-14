import React, { useState, useEffect } from "react";

import { adminService } from '../../../api';
import { Alert, Button, Table, Loader, Badge, Tooltip } from "../../../Components/UI";

import '../stylesAdmin/AdminSignupForm.css';

const BusManagement = () => {
  const [bus, setBus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBus();
  }, []);

  const fetchBus = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.getBus();
      setBus(response.data.data || []);
    } catch (err) {
      console.error("Erreur:", err);
      setError("Erreur lors du chargement des bus");
    } finally {
      setLoading(false);
    }
  };

  const getStatusVariant = (statut) => {
    switch (statut?.toLowerCase()) {
      case "actif": return "success";
      case "en maintenance": return "warning";
      case "hors service": return "error";
      default: return "default";
    }
  };

  const getTypeVariant = (type) => {
    switch (type?.toLowerCase()) {
      case "standard": return "default";
      case "premium": return "info";
      case "luxe": return "warning";
      case "vip": return "success";
      default: return "default";
    }
  };

  const parseEquipments = (equipements) => {
    if (!equipements) return [];
    try {
      return typeof equipements === "string" 
        ? JSON.parse(equipements) 
        : equipements;
    } catch {
      return [];
    }
  };

  if (loading) {
    return (
      <div className="admin-management">
        <Loader size="large" text="Chargement des bus..." />
      </div>
    );
  }

  return (
    <div className="admin-management">
      <div className="section-header">
        <div className="header-title">
          <h2>Gestion des Bus</h2>
          <Badge variant="info" count={bus.length}>
            Bus
          </Badge>
        </div>
        <Button variant="secondary" icon="refresh" onClick={fetchBus}>
          Actualiser
        </Button>
      </div>

      {error && <Alert type="error" message={error} />}

      <Table
        columns={[
          { key: "immatriculation", label: "Immatriculation" },
          { key: "type", label: "Type" },
          { key: "capacite", label: "Capacité" },
          { key: "chauffeur", label: "Chauffeur" },
          { key: "societe", label: "Société" },
          { key: "statut", label: "Statut" },
          { key: "equipements", label: "Équipements" }
        ]}
        data={bus.map(bus => ({
          immatriculation: (
            <div className="bus-info">
              <div className="bus-plate">{bus.numero_immatriculation}</div>
              <div className="bus-details text-muted">
                {bus.annee_fabrication} • {bus.couleur}
              </div>
            </div>
          ),
          type: (
            <Badge variant={getTypeVariant(bus.type_bus)}>
              {bus.type_bus}
            </Badge>
          ),
          capacite: (
            <div className="capacity-cell">
              <span className="capacity-number">{bus.capacite}</span>
              <span className="capacity-label">places</span>
            </div>
          ),
          chauffeur: (
            <div className="driver-cell">
              {bus.chauffeur_prenom ? (
                <>
                  <div className="driver-name">
                    {bus.chauffeur_prenom} {bus.chauffeur_nom}
                  </div>
                  <div className="driver-id text-muted">
                    ID: {bus.chauffeur_id}
                  </div>
                </>
              ) : (
                <span className="no-driver">Non assigné</span>
              )}
            </div>
          ),
          societe: bus.societe_nom,
          statut: (
            <Badge variant={getStatusVariant(bus.statut)}>
              {bus.statut}
            </Badge>
          ),
          equipements: (
            <div className="equipments-cell">
              <div className="equipments-list">
                {parseEquipments(bus.equipements).map((equipment, index) => (
                  <Tooltip key={index} content={equipment}>
                    <span className="equipment-tag">
                      {equipment}
                    </span>
                  </Tooltip>
                ))}
                {parseEquipments(bus.equipements).length === 0 && (
                  <span className="no-equipment">Aucun équipement</span>
                )}
              </div>
            </div>
          )
        }))}
        emptyMessage="Aucun bus trouvé"
      />
    </div>
  );
};

export default BusManagement;