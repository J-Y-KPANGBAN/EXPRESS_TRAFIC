import React, { useState, useEffect } from "react";

import { adminService } from '../../../api';
import { Alert, Button, Table, Loader, Badge, Modal, Input, FormGroup } from "../../../Components/UI";

import '../stylesAdmin/AdminSignupForm.css';

const TrajetManagement = () => {
  const [trajets, setTrajets] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    ville_depart: "",
    ville_arrivee: "",
    date_depart: "",
    heure_depart: "",
    duree: "",
    prix: "",
    bus_id: "",
    places_total: "",
    description: "",
    conditions_annulation: "",
  });

  useEffect(() => {
    fetchTrajets();
  }, []);

  const fetchTrajets = async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await adminService.getTrajets();
      setTrajets(response.data.data || []);
    } catch (err) {
      console.error("Erreur:", err);
      setError("Erreur lors du chargement des trajets.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await adminService.createTrajet(form);
      await fetchTrajets();
      setShowForm(false);
      setForm({
        ville_depart: "", ville_arrivee: "", date_depart: "", heure_depart: "",
        duree: "", prix: "", bus_id: "", places_total: "", description: "", conditions_annulation: ""
      });
    } catch (err) {
      console.error("Erreur:", err);
      setError("Erreur lors de la création du trajet.");
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  if (loading) {
    return (
      <div className="admin-management">
        <Loader size="large" text="Chargement des trajets..." />
      </div>
    );
  }

  return (
    <div className="admin-management">
      <div className="section-header">
        <div className="header-title">
          <h2>Gestion des Trajets</h2>
          <Badge variant="info" count={trajets.length}>
            Trajets
          </Badge>
        </div>
        <Button variant="primary" onClick={() => setShowForm(true)}>
          + Nouveau Trajet
        </Button>
      </div>

      {error && <Alert type="error" message={error} />}

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Créer un Nouveau Trajet"
        size="large"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <FormGroup label="Ville de départ" required>
              <Input
                name="ville_depart"
                value={form.ville_depart}
                onChange={handleChange}
                placeholder="Ex: Paris"
                required
              />
            </FormGroup>

            <FormGroup label="Ville d'arrivée" required>
              <Input
                name="ville_arrivee"
                value={form.ville_arrivee}
                onChange={handleChange}
                placeholder="Ex: Lyon"
                required
              />
            </FormGroup>

            <FormGroup label="Date de départ" required>
              <Input
                type="date"
                name="date_depart"
                value={form.date_depart}
                onChange={handleChange}
                required
              />
            </FormGroup>

            <FormGroup label="Heure de départ" required>
              <Input
                type="time"
                name="heure_depart"
                value={form.heure_depart}
                onChange={handleChange}
                required
              />
            </FormGroup>

            <FormGroup label="Durée (heures)" required>
              <Input
                type="number"
                name="duree"
                value={form.duree}
                onChange={handleChange}
                placeholder="Ex: 4"
                min="1"
                required
              />
            </FormGroup>

            <FormGroup label="Prix (€)" required>
              <Input
                type="number"
                name="prix"
                value={form.prix}
                onChange={handleChange}
                placeholder="Ex: 45"
                min="1"
                step="0.01"
                required
              />
            </FormGroup>

            <FormGroup label="Nombre de places" required>
              <Input
                type="number"
                name="places_total"
                value={form.places_total}
                onChange={handleChange}
                placeholder="Ex: 50"
                min="1"
                required
              />
            </FormGroup>

            <FormGroup label="ID Bus" required>
              <Input
                type="number"
                name="bus_id"
                value={form.bus_id}
                onChange={handleChange}
                placeholder="Ex: 1"
                min="1"
                required
              />
            </FormGroup>
          </div>

          <FormGroup label="Description">
            <Input
              type="textarea"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Description du trajet..."
              rows="3"
            />
          </FormGroup>

          <div className="form-actions">
            <Button type="submit" variant="primary">
              Créer le trajet
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
              Annuler
            </Button>
          </div>
        </form>
      </Modal>

      <Table
        columns={[
          { key: "id", label: "ID" },
          { key: "trajet", label: "Trajet" },
          { key: "date_heure", label: "Date/Heure" },
          { key: "duree", label: "Durée" },
          { key: "prix", label: "Prix" },
          { key: "places", label: "Places" },
          { key: "bus", label: "Bus" }
        ]}
        data={trajets.map(trajet => ({
          id: trajet.id,
          trajet: (
            <div className="route-info">
              <strong>{trajet.ville_depart} → {trajet.ville_arrivee}</strong>
            </div>
          ),
          date_heure: (
            <div className="datetime-info">
              <div>{new Date(trajet.date_depart).toLocaleDateString("fr-FR")}</div>
              <div className="text-muted">{trajet.heure_depart}</div>
            </div>
          ),
          duree: `${trajet.duree}h`,
          prix: `${trajet.prix} €`,
          places: (
            <Badge 
              variant={trajet.places_disponibles > 10 ? "success" : 
                      trajet.places_disponibles > 0 ? "warning" : "error"}
            >
              {trajet.places_disponibles}/{trajet.places_total}
            </Badge>
          ),
          bus: trajet.numero_immatriculation || `Bus #${trajet.bus_id}`
        }))}
        emptyMessage="Aucun trajet trouvé"
      />
    </div>
  );
};

export default TrajetManagement;