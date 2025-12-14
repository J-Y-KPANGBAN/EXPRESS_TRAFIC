// frontend/src/pages/Admin/components/ChauffeurManagement.js
import React, { useState, useEffect } from "react";
import { adminService } from '../../../api';
import { Button, Table, Loader, Badge, Modal, Input, FormGroup, Select } from "../../../Components/UI";

const ChauffeurManagement = () => {
  const [chauffeurs, setChauffeurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    nom: "", prenom: "", email: "", numero_telephone: "", numero_permis: "", 
    date_naissance: "", adresse: "", statut: "actif"
  });

  useEffect(() => { fetchChauffeurs(); }, []);

  const fetchChauffeurs = async () => {
    try {
      const response = await adminService.getChauffeurs();
      setChauffeurs(response.data.data || []);
    } catch (err) {
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusVariant = (statut) => {
    switch(statut) {
      case 'actif': return 'success';
      case 'congé': return 'warning';
      case 'inactif': return 'error';
      default: return 'default';
    }
  };

  if (loading) return <Loader size="large" text="Chargement des chauffeurs..." />;

  return (
    <div className="admin-management">
      <div className="section-header">
        <h2>Gestion des Chauffeurs</h2>
        <Button variant="primary" onClick={() => setShowForm(true)}>+ Nouveau Chauffeur</Button>
      </div>

      <Table
        columns={[
          { key: "info", label: "Chauffeur" },
          { key: "contact", label: "Contact" },
          { key: "permis", label: "Permis" },
          { key: "statut", label: "Statut" },
          { key: "embauche", label: "Date Embauche" }
        ]}
        data={chauffeurs.map(ch => ({
          info: <div><strong>{ch.prenom} {ch.nom}</strong><div className="text-muted">ID: {ch.id}</div></div>,
          contact: <div>{ch.email}<br/>{ch.numero_telephone}</div>,
          permis: ch.numero_permis,
          statut: <Badge variant={getStatusVariant(ch.statut)}>{ch.statut}</Badge>,
          embauche: new Date(ch.date_embauche).toLocaleDateString("fr-FR")
        }))}
        emptyMessage="Aucun chauffeur trouvé"
      />

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Nouveau Chauffeur" size="large">
        <form onSubmit={(e) => { e.preventDefault(); /* Implémenter création */ }}>
          <div className="form-grid">
            <FormGroup label="Nom" required><Input value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} required /></FormGroup>
            <FormGroup label="Prénom" required><Input value={form.prenom} onChange={e => setForm({...form, prenom: e.target.value})} required /></FormGroup>
            <FormGroup label="Email"><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></FormGroup>
            <FormGroup label="Téléphone"><Input value={form.numero_telephone} onChange={e => setForm({...form, numero_telephone: e.target.value})} /></FormGroup>
            <FormGroup label="Numéro permis" required><Input value={form.numero_permis} onChange={e => setForm({...form, numero_permis: e.target.value})} required /></FormGroup>
            <FormGroup label="Date naissance"><Input type="date" value={form.date_naissance} onChange={e => setForm({...form, date_naissance: e.target.value})} /></FormGroup>
            <FormGroup label="Statut">
              <Select value={form.statut} onChange={value => setForm({...form, statut: value})} 
                options={['actif', 'congé', 'inactif'].map(s => ({value: s, label: s}))} />
            </FormGroup>
          </div>
          <FormGroup label="Adresse"><Input type="textarea" value={form.adresse} onChange={e => setForm({...form, adresse: e.target.value})} /></FormGroup>
          <div className="form-actions">
            <Button type="submit" variant="primary">Créer</Button>
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Annuler</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ChauffeurManagement;