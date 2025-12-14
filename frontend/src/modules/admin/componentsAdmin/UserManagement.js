// frontend/src/pages/Admin/components/UserManagement.js
import React, { useState, useEffect } from "react";
import { adminService } from '../../../api';
import { 
  Alert, 
  Button, 
  Table,  
  Badge, 
  Modal, 
  Select,
  Card,
  Grid
} from "../../../Components/UI";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filters, setFilters] = useState({
    type_utilisateur: '',
    statut: '',
    page: 1,
    limit: 20
  });

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await adminService.getUsers(filters);
      setUsers(response.data.data);
    } catch (err) {
      console.error("Erreur:", err);
      setError("Erreur lors du chargement des utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  const updateUserStatus = async (userId, newStatus) => {
    try {
      await adminService.updateUserStatus(userId, newStatus);
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, statut: newStatus } : user
      ));
    } catch (err) {
      setError("Erreur lors de la mise à jour du statut");
    }
  };

  const getStatusVariant = (statut) => {
    switch (statut?.toLowerCase()) {
      case 'actif': return 'success';
      case 'inactif': return 'warning';
      case 'suspendu': return 'error';
      default: return 'default';
    }
  };

  const getUserTypeVariant = (type) => {
    switch (type?.toLowerCase()) {
      case 'admin': return 'error';
      case 'client': return 'info';
      case 'conducteur': return 'warning';
      default: return 'default';
    }
  };

  return (
    <div className="user-management">
      <div className="section-header">
        <div className="header-title">
          <h2>Gestion des Utilisateurs</h2>
          <Badge variant="info" count={users.length}>
            Utilisateurs
          </Badge>
        </div>
        
        <div className="header-actions">
          <Select
            value={filters.type_utilisateur}
            onChange={(value) => setFilters(prev => ({...prev, type_utilisateur: value}))}
            options={[
              { value: '', label: 'Tous les types' },
              { value: 'client', label: 'Clients' },
              { value: 'admin', label: 'Administrateurs' },
              { value: 'conducteur', label: 'Chauffeurs' }
            ]}
          />
          <Select
            value={filters.statut}
            onChange={(value) => setFilters(prev => ({...prev, statut: value}))}
            options={[
              { value: '', label: 'Tous les statuts' },
              { value: 'actif', label: 'Actifs' },
              { value: 'inactif', label: 'Inactifs' },
              { value: 'suspendu', label: 'Suspendus' }
            ]}
          />
          <Button variant="secondary" icon="refresh" onClick={fetchUsers}>
            Actualiser
          </Button>
        </div>
      </div>

      {error && <Alert type="error" message={error} />}

      <Card>
        <Table
          columns={[
            { key: "utilisateur", label: "Utilisateur" },
            { key: "contact", label: "Contact" },
            { key: "localisation", label: "Localisation" },
            { key: "type", label: "Type" },
            { key: "statut", label: "Statut" },
            { key: "inscription", label: "Inscription" },
            { key: "actions", label: "Actions" }
          ]}
          data={users.map(user => ({
            utilisateur: (
              <div className="user-info">
                <div className="user-name">
                  {user.prenom_anonymise} {user.nom_anonymise}
                </div>
                <div className="user-id text-muted">
                  ID: {user.id} • {user.numero_client}
                </div>
              </div>
            ),
            contact: (
              <div className="contact-info">
                <div>{user.email}</div>
                <div className="text-muted">{user.telephone_anonymise}</div>
              </div>
            ),
            localisation: (
              <div className="location-info">
                {user.ville && <div>{user.ville}</div>}
                {user.code_postal && <div className="text-muted">{user.code_postal}</div>}
              </div>
            ),
            type: (
              <Badge variant={getUserTypeVariant(user.type_utilisateur)}>
                {user.type_utilisateur}
              </Badge>
            ),
            statut: (
              <Select
                value={user.statut}
                onChange={(value) => updateUserStatus(user.id, value)}
                options={[
                  { value: 'actif', label: 'Actif' },
                  { value: 'inactif', label: 'Inactif' },
                  { value: 'suspendu', label: 'Suspendu' }
                ]}
                size="small"
              />
            ),
            inscription: new Date(user.date_inscription).toLocaleDateString("fr-FR"),
            actions: (
              <div className="action-buttons">
                <Button 
                  variant="outline" 
                  size="small"
                  onClick={() => setSelectedUser(user)}
                >
                  Détails
                </Button>
              </div>
            )
          }))}
          emptyMessage="Aucun utilisateur trouvé"
        />
      </Card>

      {/* Modal Détails Utilisateur */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title={`Détails Utilisateur - ${selectedUser?.numero_client}`}
        size="large"
      >
        {selectedUser && (
          <div className="user-details">
            <Grid cols={2} gap="medium">
              <div>
                <h4>Informations Personnelles</h4>
                <div className="detail-row">
                  <strong>Nom:</strong> {selectedUser.nom_anonymise}
                </div>
                <div className="detail-row">
                  <strong>Prénom:</strong> {selectedUser.prenom_anonymise}
                </div>
                <div className="detail-row">
                  <strong>Email:</strong> {selectedUser.email}
                </div>
                <div className="detail-row">
                  <strong>Téléphone:</strong> {selectedUser.telephone_anonymise}
                </div>
              </div>
              
              <div>
                <h4>Compte & Statut</h4>
                <div className="detail-row">
                  <strong>Type:</strong>
                  <Badge variant={getUserTypeVariant(selectedUser.type_utilisateur)}>
                    {selectedUser.type_utilisateur}
                  </Badge>
                </div>
                <div className="detail-row">
                  <strong>Statut:</strong>
                  <Badge variant={getStatusVariant(selectedUser.statut)}>
                    {selectedUser.statut}
                  </Badge>
                </div>
                <div className="detail-row">
                  <strong>Inscription:</strong> 
                  {new Date(selectedUser.date_inscription).toLocaleDateString("fr-FR")}
                </div>
                <div className="detail-row">
                  <strong>Dernière connexion:</strong>
                  {selectedUser.derniere_connexion 
                    ? new Date(selectedUser.derniere_connexion).toLocaleDateString("fr-FR")
                    : 'Jamais'
                  }
                </div>
              </div>
            </Grid>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserManagement;