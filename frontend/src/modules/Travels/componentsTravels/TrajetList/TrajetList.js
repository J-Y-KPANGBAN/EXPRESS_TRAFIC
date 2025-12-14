import React, { useState } from "react";
import { Card, Button, Modal, Alert } from "../../../../Components/UI";
import { useUser } from "../../../../Context/UserContext";
import ReservationForm from "../../../shared/ReservationForm";
import "./TrajetList.css";

const TrajetList = ({ 
  trajets, 
  loading, 
  currentPage, 
  totalPages, 
  totalItems, 
  onPageChange,
  searchDate,
  onDateChange 
}) => {
  const [selectedTrajet, setSelectedTrajet] = useState(null);
  const [showEquipments, setShowEquipments] = useState({});
  const { isAuthenticated } = useUser();

  // Toggle pour afficher/masquer les équipements
  const toggleEquipment = (trajetId) => {
    setShowEquipments(prev => ({
      ...prev,
      [trajetId]: !prev[trajetId]
    }));
  };

  // Formatage des dates en dd/mm/yyyy
  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Date invalide";
      return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
    } catch (error) {
      return "Format invalide";
    }
  };

  const formatShortDate = (dateString, showYear = false) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      const dayNames = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];
      const dayName = dayNames[date.getDay()];
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      if (showYear) {
        const year = date.getFullYear();
        return `${dayName},${day}/${month}/${year}`;
      }
      return `${dayName},${day}/${month}`;
    } catch (error) {
      return "";
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    try {
      const str = String(timeString);
      if (str.includes(":")) {
        return str.substring(0, 5);
      }
      return str;
    } catch (error) {
      return "";
    }
  };

  // Formatage de la durée
  const formatDuree = (duree) => {
    if (!duree) return "";
    try {
      const str = String(duree);
      if (str.includes(":")) {
        const parts = str.split(":");
        if (parts.length === 3) {
          return `${parts[0]}h${parts[1]}`;
        }
        return str;
      }
      return duree;
    } catch (error) {
      return duree || "";
    }
  };

  // Formatage des équipements depuis JSON string ou array
  const formatEquipments = (equipments) => {
    if (!equipments) return [];
    
    try {
      if (typeof equipments === 'string') {
        if (equipments.startsWith('[') && equipments.endsWith(']')) {
          const parsed = JSON.parse(equipments);
          return Array.isArray(parsed) ? parsed : [equipments];
        }
        return [equipments];
      } else if (Array.isArray(equipments)) {
        return equipments;
      }
      return [];
    } catch (error) {
      console.error("Erreur formatage équipements:", error);
      return [equipments];
    }
  };

  const getBusTypeDisplay = (type) => {
    const types = {
      standard: "Standard",
      premium: "Premium",
      luxe: "Luxe",
      Standard: "Standard",
      Premium: "Premium",
      Luxe: "Luxe",
    };
    return types[type] || type || "Standard";
  };

  // Navigation par date
  const navigateDate = (direction) => {
    if (!searchDate) return;
    try {
      const currentDate = new Date(searchDate);
      if (isNaN(currentDate.getTime())) return;
      const newDate = new Date(currentDate);
      if (direction === 'prev') {
        newDate.setDate(currentDate.getDate() - 1);
      } else {
        newDate.setDate(currentDate.getDate() + 1);
      }
      const formattedDate = newDate.toISOString().split('T')[0];
      onDateChange(formattedDate);
    } catch (error) {
      console.error("❌ Erreur navigation date:", error);
    }
  };

  // Calcul des dates pour navigation
  const getNavigationDates = () => {
    if (!searchDate) return { prev: "", current: "", next: "" };
    try {
      const currentDate = new Date(searchDate);
      if (isNaN(currentDate.getTime())) return { prev: "", current: "", next: "" };
      const prevDate = new Date(currentDate);
      prevDate.setDate(currentDate.getDate() - 1);
      const nextDate = new Date(currentDate);
      nextDate.setDate(currentDate.getDate() + 1);
      return {
        prev: formatShortDate(prevDate),
        current: formatShortDate(currentDate, true),
        next: formatShortDate(nextDate)
      };
    } catch (error) {
      return { prev: "", current: "", next: "" };
    }
  };

  // Pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  // Informations sur les arrêts
  const getArretsInfo = (trajet) => {
    if (!trajet.arrets || !Array.isArray(trajet.arrets)) {
      return { count: 0, summary: "Direct", nomsArrets: [] };
    }
    const count = trajet.arrets.length;
    const nomsArrets = trajet.arrets.map(arret => arret.nom_arret).filter(Boolean);
    return {
      count,
      summary: count === 0 ? "Direct" : count === 1 ? "1 arrêt" : `${count} arrêts`,
      nomsArrets
    };
  };

  if (loading) {
    return (
      <Card className="loading-container">
        <p className="loading-message">Chargement des trajets...</p>
      </Card>
    );
  }

  if (!Array.isArray(trajets) || trajets.length === 0) {
    const dates = getNavigationDates();
    return (
      <div>
        {searchDate && (
          <div className="date-navigation">
            <button 
              className="date-nav-btn prev"
              onClick={() => navigateDate('prev')}
            >
              {dates.prev || "..."}
            </button>
            <div className="current-date highlighted">
              {dates.current || formatShortDate(searchDate, true)}
            </div>
            <button 
              className="date-nav-btn next"
              onClick={() => navigateDate('next')}
            >
              {dates.next || "..."}
            </button>
          </div>
        )}
        <Card className="no-results-container">
          <p className="no-results">Aucun trajet disponible pour ces critères</p>
          <p className="no-results-subtitle">
            Essayez de modifier vos filtres de recherche
          </p>
        </Card>
      </div>
    );
  }

  const pageNumbers = getPageNumbers();
  const dates = getNavigationDates();

  return (
    <div className="trajet-list">
      {/* Navigation par date */}
      {searchDate && (
        <div className="date-navigation">
          <button 
            className="date-nav-btn prev"
            onClick={() => navigateDate('prev')}
          >
            {dates.prev || "..."}
          </button>
          <div className="current-date highlighted">
            {dates.current || formatShortDate(searchDate, true)}
          </div>
          <button 
            className="date-nav-btn next"
            onClick={() => navigateDate('next')}
          >
            {dates.next || "..."}
          </button>
        </div>
      )}

      {/* Liste des trajets */}
      <div className="trajets-grid">
        {trajets.map((trajet) => {
          const arretsInfo = getArretsInfo(trajet);
          const equipments = formatEquipments(trajet.equipements);
          const showEquipment = showEquipments[trajet.id];
          
          return (
            <Card key={trajet.id} className="trajet-card">
              <div className="trajet-content">
                
                {/* Colonne Itinéraire */}
                <div className="trajet-column itinerary">
                  <div className="cities">
                    <span className="city-depart">{trajet.ville_depart || "Départ"}</span>
                    <span className="arrow">→</span>
                    <span className="city-arrivee">{trajet.ville_arrivee || "Arrivée"}</span>
                  </div>
                  <div className="company">{trajet.societe_nom || "Société"}</div>
                  <div className="trajet-info">
                    <span className="duree">{formatDuree(trajet.duree)}</span>
                    {arretsInfo.count > 0 && (
                      <span className="arrets-count"> • {arretsInfo.summary}</span>
                    )}
                  </div>
                  
                  {/* ✅ CORRECTION : Section Équipements avec toggle - TOUJOURS VISIBLE */}
                  {equipments.length > 0 && (
                    <div className="equipements-section">
                      <button 
                        className="equipements-toggle"
                        onClick={() => toggleEquipment(trajet.id)}
                      >
                        Équipements {showEquipment ? "▼" : "▶"}
                      </button>
                      {showEquipment && (
                        <div className="equipements-list">
                          {equipments.map((equipment, index) => (
                            <span key={index} className="equipment-item">
                              {equipment}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Colonne Date/Heure */}
                <div className="trajet-column datetime">
                  <div className="date-time">
                    <span className="date">{formatDate(trajet.date_depart)}</span>
                    <span className="time">{formatTime(trajet.heure_depart)}</span>
                  </div>
                  {trajet.heure_arrivee && (
                    <div className="arrival-info">
                      Arrivée: {formatTime(trajet.heure_arrivee)}
                    </div>
                  )}
                </div>

                {/* Colonne Prix */}
                <div className="trajet-column price-bus">
                  <div className="price-type">
                    <span className="price">
                      {trajet.prix ? Number(trajet.prix).toFixed(2) + " €" : "N/C"}
                    </span>
                    <span className="bus-type">{getBusTypeDisplay(trajet.type_bus)}</span>
                  </div>
                  {trajet.capacite && (
                    <div className="capacity">
                      {trajet.places_disponibles || trajet.capacite} place{trajet.places_disponibles !== 1 ? "s" : ""} dispo.
                    </div>
                  )}
                </div>

                {/* Colonne Action */}
                <div className="trajet-column action">
                  <Button
                    variant="primary"
                    onClick={() => setSelectedTrajet(trajet)}
                    className="reserve-btn"
                    disabled={!trajet.id}
                  >
                    Réserver
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination-container">
          <div className="pagination">
            <button
              className="pagination-btn prev-next"
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
            >
              ⬅️ Précédent
            </button>
            <div className="pagination-info">
              Page {currentPage} sur {totalPages}
            </div>
            <div className="pagination-numbers">
              {pageNumbers.map(number => (
                <button
                  key={number}
                  className={`pagination-btn ${currentPage === number ? 'active' : ''}`}
                  onClick={() => onPageChange(number)}
                >
                  {number}
                </button>
              ))}
            </div>
            <button
              className="pagination-btn prev-next"
              disabled={currentPage === totalPages}
              onClick={() => onPageChange(currentPage + 1)}
            >
              Suivant ➡️
            </button>
          </div>
        </div>
      )}

      {/* Modal de réservation */}
      {selectedTrajet && (
        <Modal open={true} onClose={() => setSelectedTrajet(null)}>
          {!isAuthenticated ? (
            <div style={{ padding: "10px 15px", textAlign: "center" }}>
              <Alert
                type="warning"
                message="Veuillez vous connecter pour réserver ce trajet."
              />
              <Button
                variant="primary"
                onClick={() => (window.location.href = "/login")}
                style={{ marginTop: "18px" }}
              >
                Se connecter
              </Button>
            </div>
          ) : (
            <ReservationForm
              trajetId={selectedTrajet.id}
              trajetDetails={selectedTrajet}
              onCancel={() => setSelectedTrajet(null)}
            />
          )}
        </Modal>
      )}
    </div>
  );
};

export default TrajetList;