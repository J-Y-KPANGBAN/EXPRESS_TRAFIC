import React, { useState, useEffect } from "react";

import { adminService } from '../../../api';
import { Alert, Button, Table, Loader, Badge, Modal, Select } from "../../../Components/UI";

import '../stylesAdmin/AdminSignupForm.css';

const ReservationManagement = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await adminService.getReservations();
      setReservations(response.data.data || []);
    } catch (err) {
      console.error("Erreur:", err);
      setError("Erreur lors du chargement des réservations.");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await adminService.updateReservationStatus(id, status);
      setReservations(prev => 
        prev.map(r => r.id === id ? { ...r, etat_reservation: status } : r)
      );
    } catch (err) {
      console.error("Erreur:", err);
      setError("Erreur lors de la mise à jour du statut.");
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case "confirmée": return "success";
      case "en_attente": return "warning";
      case "annulée": return "error";
      case "terminée": return "info";
      default: return "default";
    }
  };

  if (loading) {
    return (
      <div className="admin-management">
        <Loader size="large" text="Chargement des réservations..." />
      </div>
    );
  }

  return (
    <div className="admin-management">
      <div className="section-header">
        <div className="header-title">
          <h2>Gestion des Réservations</h2>
          <Badge variant="info" count={reservations.length}>
            Réservations
          </Badge>
        </div>
        <Button variant="secondary" icon="refresh" onClick={fetchReservations}>
          Actualiser
        </Button>
      </div>

      {error && <Alert type="error" message={error} />}

      <Table
        columns={[
          { key: "reference", label: "Référence" },
          { key: "utilisateur", label: "Utilisateur" },
          { key: "trajet", label: "Trajet" },
          { key: "date", label: "Date" },
          { key: "siege", label: "Siège" },
          { key: "prix", label: "Prix" },
          { key: "statut", label: "Statut" },
          { key: "actions", label: "Actions" }
        ]}
        data={reservations.map(reservation => ({
          reference: (
            <div className="reference-code">
              {reservation.code_reservation}
            </div>
          ),
          utilisateur: (
            <div className="user-info">
              <div className="user-name">
                {reservation.prenom} {reservation.nom}
              </div>
              <div className="user-email text-muted">
                {reservation.email}
              </div>
            </div>
          ),
          trajet: (
            <div className="route-info">
              {reservation.ville_depart} → {reservation.ville_arrivee}
            </div>
          ),
          date: new Date(reservation.date_reservation).toLocaleDateString("fr-FR"),
          siege: reservation.siege_numero,
          prix: `${reservation.prix} €`,
          statut: (
            <Badge variant={getStatusVariant(reservation.etat_reservation)}>
              {reservation.etat_reservation}
            </Badge>
          ),
          actions: (
            <div className="action-buttons">
              <Select
                value={reservation.etat_reservation}
                onChange={(value) => updateStatus(reservation.id, value)}
                options={[
                  { value: "confirmée", label: "Confirmée" },
                  { value: "en_attente", label: "En attente" },
                  { value: "annulée", label: "Annulée" },
                  { value: "terminée", label: "Terminée" }
                ]}
                size="small"
              />
              <Button 
                variant="outline" 
                size="small"
                onClick={() => setSelectedReservation(reservation)}
              >
                Détails
              </Button>
            </div>
          )
        }))}
        emptyMessage="Aucune réservation trouvée"
      />

      <Modal
        isOpen={!!selectedReservation}
        onClose={() => setSelectedReservation(null)}
        title="Détails de la Réservation"
        size="medium"
      >
        {selectedReservation && (
          <div className="reservation-details">
            <div className="detail-section">
              <h4>Informations Réservation</h4>
              <div className="detail-row">
                <strong>Référence :</strong> {selectedReservation.code_reservation}
              </div>
              <div className="detail-row">
                <strong>Date :</strong> {new Date(selectedReservation.date_reservation).toLocaleDateString("fr-FR")}
              </div>
              <div className="detail-row">
                <strong>Siège :</strong> {selectedReservation.siege_numero}
              </div>
              <div className="detail-row">
                <strong>Prix :</strong> {selectedReservation.prix} €
              </div>
              <div className="detail-row">
                <strong>Statut :</strong>
                <Badge variant={getStatusVariant(selectedReservation.etat_reservation)}>
                  {selectedReservation.etat_reservation}
                </Badge>
              </div>
            </div>

            <div className="detail-section">
              <h4>Utilisateur</h4>
              <div className="detail-row">
                <strong>Nom :</strong> {selectedReservation.prenom} {selectedReservation.nom}
              </div>
              <div className="detail-row">
                <strong>Email :</strong> {selectedReservation.email}
              </div>
            </div>

            <div className="detail-section">
              <h4>Trajet</h4>
              <div className="detail-row">
                <strong>Itinéraire :</strong> {selectedReservation.ville_depart} → {selectedReservation.ville_arrivee}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReservationManagement;