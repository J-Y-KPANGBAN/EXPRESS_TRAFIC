import React, { useState, useEffect } from "react";

import { adminService } from '../../../api';
import { Alert, Button, Table, Loader, Badge, Modal, Select } from "../../../Components/UI";

import '../stylesAdmin/AdminSignupForm.css';


const ContactManagement = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await adminService.getContacts();
      setContacts(response.data.data || []);
    } catch (err) {
      console.error("Erreur:", err);
      setError("Erreur lors du chargement des messages.");
    } finally {
      setLoading(false);
    }
  };

  const updateContactStatus = async (id, statut) => {
    try {
      await adminService.updateContactStatus(id, statut);
      setContacts(prev => prev.map(c => c.id === id ? { ...c, statut } : c));
    } catch (err) {
      console.error("Erreur:", err);
      setError("Erreur lors de la mise à jour du statut.");
    }
  };

  const getStatusVariant = (statut) => {
    switch (statut?.toLowerCase()) {
      case "nouveau": return "warning";
      case "lu": return "info";
      case "repondu": return "success";
      case "resolu": return "default";
      default: return "default";
    }
  };

  if (loading) {
    return (
      <div className="admin-management">
        <Loader size="large" text="Chargement des messages..." />
      </div>
    );
  }

  return (
    <div className="admin-management">
      <div className="section-header">
        <div className="header-title">
          <h2>Gestion des Messages</h2>
          <Badge variant="info" count={contacts.length}>
            Messages
          </Badge>
        </div>
        <Button variant="secondary" icon="refresh" onClick={fetchContacts}>
          Actualiser
        </Button>
      </div>

      {error && <Alert type="error" message={error} />}

      <Table
        columns={[
          { key: "expediteur", label: "Expéditeur" },
          { key: "contact", label: "Contact" },
          { key: "sujet", label: "Sujet" },
          { key: "message", label: "Message" },
          { key: "statut", label: "Statut" },
          { key: "actions", label: "Actions" }
        ]}
        data={contacts.map(contact => ({
          expediteur: (
            <div className="user-info">
              <strong>{contact.firstName} {contact.lastName}</strong>
            </div>
          ),
          contact: (
            <div className="contact-info">
              <div>{contact.email}</div>
              <div className="text-muted">{contact.telephone || "Non renseigné"}</div>
            </div>
          ),
          sujet: contact.sujet,
          message: (
            <div className="message-preview">
              {contact.message.length > 100 
                ? `${contact.message.substring(0, 100)}...` 
                : contact.message
              }
              {contact.message.length > 100 && (
                <Button 
                  variant="text" 
                  size="small"
                  onClick={() => setSelectedContact(contact)}
                >
                  Voir plus
                </Button>
              )}
            </div>
          ),
          statut: (
            <Badge variant={getStatusVariant(contact.statut)}>
              {contact.statut}
            </Badge>
          ),
          actions: (
            <Select
              value={contact.statut}
              onChange={(value) => updateContactStatus(contact.id, value)}
              options={[
                { value: "nouveau", label: "Nouveau" },
                { value: "lu", label: "Lu" },
                { value: "repondu", label: "Répondu" },
                { value: "resolu", label: "Résolu" }
              ]}
              size="small"
            />
          )
        }))}
        emptyMessage="Aucun message trouvé"
      />

      <Modal
        isOpen={!!selectedContact}
        onClose={() => setSelectedContact(null)}
        title={`Message de ${selectedContact?.firstName} ${selectedContact?.lastName}`}
      >
        {selectedContact && (
          <div className="message-details">
            <div className="detail-row">
              <strong>Email:</strong> {selectedContact.email}
            </div>
            <div className="detail-row">
              <strong>Téléphone:</strong> {selectedContact.telephone || "Non renseigné"}
            </div>
            <div className="detail-row">
              <strong>Sujet:</strong> {selectedContact.sujet}
            </div>
            <div className="message-content">
              <strong>Message:</strong>
              <div className="message-text">{selectedContact.message}</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ContactManagement;