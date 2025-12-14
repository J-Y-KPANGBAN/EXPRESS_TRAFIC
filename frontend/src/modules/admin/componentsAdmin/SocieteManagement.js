// frontend/src/pages/Admin/components/SocieteManagement.js
import React, { useState, useEffect } from "react";
import { adminService } from '../../../api';
import { Alert, Button, Table, Loader,  Modal, Input, FormGroup } from "../../../Components/UI";

const SocieteManagement = () => {
  const [societes, setSocietes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    nom: "", adresse: "", contact: "", email: "", site_web: "", description: ""
  });

  useEffect(() => { fetchSocietes(); }, []);

  const fetchSocietes = async () => {
    try {
      const response = await adminService.getSocietes();
      setSocietes(response.data.data || []);
    } catch (err) {
      setError("Erreur chargement sociétés");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await adminService.createSociete(form);
      await fetchSocietes();
      setShowForm(false);
      setForm({ nom: "", adresse: "", contact: "", email: "", site_web: "", description: "" });
    } catch (err) {
      setError("Erreur création société");
    }
  };

  if (loading) return <Loader size="large" text="Chargement des sociétés..." />;

  return (
    <div className="admin-management">
      <div className="section-header">
        <h2>Gestion des Sociétés</h2>
        <Button variant="primary" onClick={() => setShowForm(true)}>
          + Nouvelle Société
        </Button>
      </div>

      {error && <Alert type="error" message={error} />}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Nouvelle Société">
        <form onSubmit={handleSubmit}>
          <FormGroup label="Nom" required><Input value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} required /></FormGroup>
          <FormGroup label="Adresse"><Input value={form.adresse} onChange={e => setForm({...form, adresse: e.target.value})} /></FormGroup>
          <FormGroup label="Contact"><Input value={form.contact} onChange={e => setForm({...form, contact: e.target.value})} /></FormGroup>
          <FormGroup label="Email"><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></FormGroup>
          <FormGroup label="Site web"><Input value={form.site_web} onChange={e => setForm({...form, site_web: e.target.value})} /></FormGroup>
          <FormGroup label="Description"><Input type="textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></FormGroup>
          <div className="form-actions">
            <Button type="submit" variant="primary">Créer</Button>
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Annuler</Button>
          </div>
        </form>
      </Modal>

      <Table
        columns={[
          { key: "id", label: "ID" }, { key: "nom", label: "Nom" }, { key: "adresse", label: "Adresse" },
          { key: "contact", label: "Contact" }, { key: "email", label: "Email" }, { key: "site_web", label: "Site Web" }
        ]}
        data={societes.map(s => ({
          id: s.id, nom: s.nom, adresse: s.adresse, contact: s.contact, 
          email: s.email, site_web: s.site_web || "Non renseigné"
        }))}
        emptyMessage="Aucune société trouvée"
      />
    </div>
  );
};

export default SocieteManagement;