import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { reservationService } from '../../api';
import { Card, Loader, Alert, Button } from "../../Components/UI";
import "./MyReservations.css";

const MyReservations = () => {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState({
    encours: [],
    historique: [],
    archives: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [activeTab, setActiveTab] = useState("encours");

  const loadReservations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await reservationService.getMyReservations();
      
      console.log('📡 Réponse API réservations:', response.data);
      
      if (response.data.success) {
        // ✅ CORRECTION : Gérer différentes structures de données
        let allReservations = [];
        
        if (Array.isArray(response.data.data)) {
          // Si l'API retourne un tableau simple
          allReservations = response.data.data;
        } else if (response.data.data && typeof response.data.data === 'object') {
          // Si l'API retourne un objet avec des propriétés
          if (response.data.data.encours || response.data.data.historique || response.data.data.archives) {
            // L'API retourne déjà les données séparées
            setReservations({
              encours: response.data.data.encours || [],
              historique: response.data.data.historique || [],
              archives: response.data.data.archives || []
            });
            setLoading(false);
            return;
          } else {
            // Sinon, traiter comme un tableau d'objets
            allReservations = Object.values(response.data.data);
          }
        }
        
        // ✅ Filtrer et organiser les réservations
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const reservationsEncours = [];
        const reservationsHistorique = [];
        const reservationsArchives = [];
        
        allReservations.forEach(reservation => {
          // Ne pas afficher les réservations non confirmées
          if (reservation.etat_reservation === 'pending' || reservation.etat_reservation === 'annulee') {
            // Direct en archives si annulé
            if (reservation.etat_reservation === 'annulee') {
              reservationsArchives.push(reservation);
            }
            return;
          }
          
          // Seulement les réservations confirmées
          if (reservation.etat_reservation === 'confirmee') {
            const reservationDate = new Date(reservation.date_depart);
            reservationDate.setHours(0, 0, 0, 0);
            
            // Voyages à venir (date future)
            if (reservationDate >= today) {
              reservationsEncours.push(reservation);
            } 
            // Historique (date passée récente - moins de 30 jours)
            else {
              const diffTime = today - reservationDate;
              const diffDays = diffTime / (1000 * 60 * 60 * 24);
              
              if (diffDays <= 30) {
                reservationsHistorique.push(reservation);
              } else {
                // Archives (plus de 30 jours)
                reservationsArchives.push(reservation);
              }
            }
          }
        });
        
        setReservations({
          encours: reservationsEncours,
          historique: reservationsHistorique,
          archives: reservationsArchives
        });
        
        console.log('✅ Réservations organisées:', {
          total: allReservations.length,
          encours: reservationsEncours.length,
          historique: reservationsHistorique.length,
          archives: reservationsArchives.length
        });
      }
    } catch (err) {
      console.error("❌ Erreur chargement réservations:", err);
      setError(err.message || "Impossible de charger vos réservations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
    } catch {
      return dateString;
    }
  };

  const getStatusConfig = (reservation) => {
    const today = new Date();
    const voyageDate = new Date(reservation.date_depart);
    
    if (voyageDate < today) {
      return { label: 'Terminé', variant: 'info', icon: '✅' };
    }
    
    const statusConfig = {
      'confirmee': { label: 'Confirmé', variant: 'success', icon: '✅' },
      'en_attente': { label: 'En attente', variant: 'warning', icon: '⏳' },
      'annulee': { label: 'Annulé', variant: 'error', icon: '❌' },
      'paid': { label: 'Payé', variant: 'success', icon: '✅' }
    };
    
    return statusConfig[reservation.etat_reservation] || 
           { label: reservation.etat_reservation, variant: 'info', icon: '📝' };
  };

  const handleDownloadTicket = async (reservation, e) => {
    e.stopPropagation();
    try {
      if (reservation.ticket_pdf_url) {
        // Ouvrir le PDF dans un nouvel onglet
        const fullUrl = reservation.ticket_pdf_url.startsWith('http') 
          ? reservation.ticket_pdf_url 
          : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${reservation.ticket_pdf_url}`;
        
        window.open(fullUrl, "_blank");
      } else {
        // Générer le ticket si pas encore disponible
        const response = await reservationService.generateTicket(reservation.id);
        if (response.data.success && response.data.data.ticketUrl) {
          window.open(response.data.data.ticketUrl, "_blank");
        } else {
          alert("Billet disponible après confirmation du paiement");
        }
      }
    } catch (error) {
      console.error("❌ Erreur téléchargement:", error);
      alert("Billet disponible après confirmation du paiement");
    }
  };

  const handleReservationClick = (reservation) => {
    setSelectedReservation(
      selectedReservation?.id === reservation.id ? null : reservation
    );
  };

  const tabs = [
    { id: "encours", label: `Voyages à venir (${reservations.encours.length})`, icon: "🚌" },
    { id: "historique", label: `Historique (${reservations.historique.length})`, icon: "📚" },
    { id: "archives", label: `Archives (${reservations.archives.length})`, icon: "📦" },
  ];

  const currentReservations = reservations[activeTab] || [];

  if (loading) {
    return (
      <div className="reservations-container">
        <div className="reservations-loading">
          <Loader size="large" text="Chargement de vos réservations..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reservations-container">
        <Alert type="error" message={error} onClose={() => setError("")} />
        <Button onClick={loadReservations} style={{ marginTop: 15 }}>
          Réessayer
        </Button>
      </div>
    );
  }
  // Formatage amélioré de la date
const formatDateTime = (dateString, timeString) => {
  const date = new Date(dateString);
  const options = { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  };
  return `${date.toLocaleDateString('fr-FR', options)} à ${timeString?.substring(0, 5)}`;
};

// Couleur dynamique selon le statut
const getStatusColor = (status) => {
  const colors = {
    'confirmee': '#28a745',
    'en_attente': '#ffc107',
    'annulee': '#dc3545',
    'termine': '#6c757d'
  };
  return colors[status] || '#6c757d';
};

 return (
  <div className="reservation-history">
    {/* Header */}
    <div className="reservation-header">
      <div className="header-top">
        <Button 
          variant="outline" 
          onClick={() => navigate("/profile")}
          className="back-button"
        >
          ← Retour au profil
        </Button>
        <h1>Mes réservations</h1>
        <div style={{ width: 150 }} /> {/* Spacer pour alignement */}
      </div>
      <p>Consultez et gérez l'ensemble de vos voyages</p>
    </div>

    {/* Onglets */}
    <div className="reservations-tabs">
      <div className="tabs-container">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>

    {/* Liste des réservations */}
    {currentReservations.length === 0 ? (
      <div className="no-reservations">
        <div className="empty-state">
          <div className="empty-icon">
            {activeTab === "encours" ? "✈️" : 
             activeTab === "historique" ? "📋" : "📦"}
          </div>
          <h3>
            {activeTab === "encours" ? "Aucun voyage planifié" :
             activeTab === "historique" ? "Historique vide" :
             "Aucune archive"}
          </h3>
          <p>
            {activeTab === "encours" ? 
             "Vous n'avez pas de voyage à venir. Réservez votre prochain trajet !" :
             activeTab === "historique" ? 
             "Vos voyages récents apparaîtront ici." :
             "Les voyages de plus de 30 jours sont archivés ici."}
          </p>
          {activeTab === "encours" && (
            <Button 
              variant="primary" 
              onClick={() => navigate("/travels")}
              className="btn-primary"
            >
              Réserver un voyage
            </Button>
          )}
        </div>
      </div>
    ) : (
      <div className="reservations-list">
        {currentReservations.map((reservation, index) => {
          const statusConfig = getStatusConfig(reservation);
          const isSelected = selectedReservation?.id === reservation.id;
          const isArchive = activeTab === "archives";
          
          return (
            <div 
              key={reservation.id} 
              className={`reservation-card ${isSelected ? 'expanded' : ''} ${isArchive ? 'archive' : ''}`}
            >
              {/* En-tête de la carte */}
              <div 
                className="card-header" 
                onClick={() => !isArchive && handleReservationClick(reservation)}
              >
                <div className="card-header-content">
                  <div className="reservation-badge">
                    <span className="icon">📋</span>
                    Réservation #{reservation.code_reservation?.slice(0, 8)}
                  </div>
                  
                  <div className="route-info">
                    <div className="route-cities">
                      <span className="city-departure">{reservation.ville_depart}</span>
                      <span className="route-arrow">→</span>
                      <span className="city-arrival">{reservation.ville_arrivee}</span>
                    </div>
                  </div>
                  
                  <div className="route-details">
                    <div className="route-detail">
                      <span className="icon">📅</span>
                      <span>{formatDate(reservation.date_depart)}</span>
                    </div>
                    <div className="route-detail">
                      <span className="icon">🕒</span>
                      <span>{reservation.heure_depart?.substring(0, 5)}</span>
                    </div>
                    <div className="route-detail">
                      <span className="icon">💺</span>
                      <span>Siège {reservation.siege_numero}</span>
                    </div>
                  </div>
                </div>
                
                <div className="card-price-status">
                  <div className="reservation-price">
                    {reservation.montant_total || reservation.prix} €
                  </div>
                  <div className={`status-badge ${reservation.etat_reservation}`}>
                    {statusConfig.label}
                  </div>
                </div>
                
                {!isArchive && (
                  <div className={`expand-icon ${isSelected ? 'expanded' : ''}`}>
                    ▼
                  </div>
                )}
              </div>
              
              {/* Détails étendus */}
              {isSelected && (
                <div className="reservation-details">
                  <div className="details-header">
                    <h3>📋 Détails de la réservation</h3>
                    <Button 
                      variant="ghost" 
                      size="small"
                      onClick={() => setSelectedReservation(null)}
                    >
                      Réduire
                    </Button>
                  </div>
                  
                  <div className="details-grid">
                    <div className="detail-card">
                      <span className="detail-label">Code réservation</span>
                      <span className="detail-value code">{reservation.code_reservation}</span>
                    </div>
                    
                    <div className="detail-card">
                      <span className="detail-label">Trajet complet</span>
                      <span className="detail-value">
                        {reservation.ville_depart} → {reservation.ville_arrivee}
                      </span>
                    </div>
                    
                    <div className="detail-card">
                      <span className="detail-label">Date et heure</span>
                      <span className="detail-value">
                        {formatDate(reservation.date_depart)} à {reservation.heure_depart?.substring(0, 5)}
                      </span>
                    </div>
                    
                    <div className="detail-card">
                      <span className="detail-label">Siège attribué</span>
                      <span className="detail-value seat">N° {reservation.siege_numero}</span>
                    </div>
                    
                    <div className="detail-card">
                      <span className="detail-label">Montant total</span>
                      <span className="detail-value price">{reservation.montant_total || reservation.prix} €</span>
                    </div>
                    
                    {reservation.methode_paiement && (
                      <div className="detail-card">
                        <span className="detail-label">Méthode de paiement</span>
                        <span className="detail-value">{reservation.methode_paiement}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="details-actions">
                    <Button
                      variant="primary"
                      onClick={(e) => handleDownloadTicket(reservation, e)}
                      disabled={reservation.etat_reservation !== 'confirmee'}
                      className="btn-ticket"
                    >
                      <span>📥</span>
                      Télécharger le billet
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Action supplémentaire si besoin
                        alert(`Détails complets envoyés pour la réservation ${reservation.code_reservation}`);
                      }}
                    >
                      📧 Recevoir par email
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    )}
  </div>
);
};

export default MyReservations;