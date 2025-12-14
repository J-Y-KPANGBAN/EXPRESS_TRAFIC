import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom"; // Retirer navigate si non utilisé
import { trajetService } from '../../../api';
import { Alert, Card, Button } from "../../../Components/UI";
import SearchForm from "../componentsTravels/SearchForm/SearchForm";
import TrajetList from "../componentsTravels/TrajetList/TrajetList";
import FilterDrawer from "../componentsTravels/FilterDrawer/FilterDrawer";
import "../stylesTravels/Travels.css";

// Déplacer parseDuree en dehors du composant
const parseDuree = (duree) => {
  if (!duree) return 0;
  if (typeof duree === 'number') return duree;
  
  const match = duree.toString().match(/(\d+)[h:](\d+)/);
  if (match) {
    return parseInt(match[1]) * 60 + parseInt(match[2]);
  }
  
  const simpleMatch = duree.toString().match(/(\d+)h/);
  if (simpleMatch) {
    return parseInt(simpleMatch[1]) * 60;
  }
  
  return 0;
};

const Travels = () => {
  const location = useLocation();
  
  const [trajets, setTrajets] = useState([]);
  const [filteredTrajets, setFilteredTrajets] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [loading, setLoading] = useState(false);

  // Récupération des paramètres d'URL
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

  // États des filtres
  const [filters, setFilters] = useState({
    ville_depart: searchParams.get('ville_depart') || "",
    ville_arrivee: searchParams.get('ville_arrivee') || "",
    date_depart: searchParams.get('date_depart') || "",
    date_retour: "",
  });

  const [tripType, setTripType] = useState("aller");
  const [passengers, setPassengers] = useState(1);
  const [advancedFilters, setAdvancedFilters] = useState({
    type_bus: "",
    heure_periode: "",
    societe: "",
    arrets: "",
    prix_min: "",
    prix_max: "",
  });

  const [sortBy, setSortBy] = useState("depart_plus_tot");
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  // ✅ CORRECTION : Suppression des setters non utilisés
  const [cities] = useState([]);
  const [companies] = useState([]);

  const [alert, setAlert] = useState({
    show: false,
    type: "",
    message: "",
  });

  const showAlert = useCallback((type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: "", message: "" }), 5000);
  }, []);

  // 🔹 RECHERCHE INTELLIGENTE
 // Recherche avec arrêts et filtres intelligents
const loadTrajets = useCallback(async (searchFilters = {}) => {
  try {
    setLoading(true);
    
    const searchParams = {
      ...filters,
      ...searchFilters,
      ...Object.fromEntries(
        Object.entries({
          ...filters,
          ...searchFilters
        }).filter(([_, value]) => value !== "" && value != null)
      )
    };

    let response;

    // Recherche intelligente selon les critères
    if (searchParams.ville_depart || searchParams.ville_arrivee || searchParams.date_depart) {
      response = await trajetService.searchTrajetsAvecArrets(searchParams);
    } else {
      response = await trajetService.getTrajets(searchParams);
    }
    
    const data = response?.data?.data || [];
    setTrajets(data);
    setFilteredTrajets(data);
    
  } catch (error) {
    console.error("❌ Erreur recherche trajets:", error);
    showAlert("error", "Erreur lors de la recherche des trajets");
  } finally {
    setLoading(false);
  }
}, [filters, showAlert]);

  // 🔹 CHARGEMENT INITIAL
  useEffect(() => {
    const hasSearchParams = 
      searchParams.get('ville_depart') || 
      searchParams.get('ville_arrivee') || 
      searchParams.get('date_depart');

    if (hasSearchParams) {
      console.log("🔄 Chargement initial avec paramètres URL");
      loadTrajets();
    } else {
      loadTrajets({ recent: true });
    }
  }, [loadTrajets, searchParams]);

  // 🔹 FILTRAGE ET TRI OPTIMISÉ
  const applyFiltersAndSort = useCallback(() => {
    let filtered = [...trajets];

    // FILTRES PRINCIPAUX
    if (filters.ville_depart) {
      const searchTerm = filters.ville_depart.toLowerCase().trim();
      filtered = filtered.filter((t) =>
        t.ville_depart?.toLowerCase().includes(searchTerm) ||
        t.arrets?.some(a => a.nom_arret?.toLowerCase().includes(searchTerm))
      );
    }

    if (filters.ville_arrivee) {
      const searchTerm = filters.ville_arrivee.toLowerCase().trim();
      filtered = filtered.filter((t) =>
        t.ville_arrivee?.toLowerCase().includes(searchTerm) ||
        t.arrets?.some(a => a.nom_arret?.toLowerCase().includes(searchTerm))
      );
    }

    if (filters.date_depart) {
      filtered = filtered.filter((t) => {
        if (!t.date_depart) return false;
        
        const trajetDate = new Date(t.date_depart);
        const filterDate = new Date(filters.date_depart);
        
        if (isNaN(trajetDate.getTime()) || isNaN(filterDate.getTime())) {
          return false;
        }
        
        return trajetDate.toISOString().split('T')[0] === filterDate.toISOString().split('T')[0];
      });
    }

    // FILTRES AVANCÉS
    if (advancedFilters.type_bus) {
      filtered = filtered.filter((t) => 
        t.type_bus?.toLowerCase() === advancedFilters.type_bus.toLowerCase()
      );
    }

    if (advancedFilters.societe) {
      filtered = filtered.filter((t) => 
        t.societe_nom?.toLowerCase() === advancedFilters.societe.toLowerCase()
      );
    }

    if (advancedFilters.prix_min) {
      filtered = filtered.filter((t) => 
        Number(t.prix) >= Number(advancedFilters.prix_min)
      );
    }

    if (advancedFilters.prix_max) {
      filtered = filtered.filter((t) => 
        Number(t.prix) <= Number(advancedFilters.prix_max)
      );
    }

    // FILTRE PAR PÉRIODE HORAIRE
    if (advancedFilters.heure_periode) {
      filtered = filtered.filter((t) => {
        const heureDepart = t.heure_depart;
        if (!heureDepart) return false;

        try {
          const [heures, minutes] = heureDepart.split(':').map(Number);
          const heureTotal = heures + minutes / 60;

          switch (advancedFilters.heure_periode) {
            case "nuit": return heureTotal >= 0 && heureTotal < 6;
            case "matin": return heureTotal >= 6 && heureTotal < 12;
            case "aprem": return heureTotal >= 12 && heureTotal < 18;
            case "soir": return heureTotal >= 18 && heureTotal < 24;
            default: return true;
          }
        } catch (error) {
          return false;
        }
      });
    }

    // FILTRE PAR ARRÊTS
    if (advancedFilters.arrets) {
      filtered = filtered.filter((t) => {
        const hasArrets = t.arrets && Array.isArray(t.arrets) && t.arrets.length > 0;
        
        switch (advancedFilters.arrets) {
          case "direct":
            return !hasArrets;
          case "avec_arrets":
            return hasArrets;
          default:
            return true;
        }
      });
    }

    // TRI INTELLIGENT
    if (sortBy) {
      filtered.sort((a, b) => {
        switch (sortBy) {
          case "prix_croissant":
            return (Number(a.prix) || 0) - (Number(b.prix) || 0);
          
          case "prix_decroissant":
            return (Number(b.prix) || 0) - (Number(a.prix) || 0);
          
          case "depart_plus_tot":
            return (a.heure_depart || "").localeCompare(b.heure_depart || "");
          
          case "depart_plus_tard":
            return (b.heure_depart || "").localeCompare(a.heure_depart || "");
          
          case "duree_croissante":
            return (parseDuree(a.duree) || 0) - (parseDuree(b.duree) || 0);
          
          case "duree_decroissante":
            return (parseDuree(b.duree) || 0) - (parseDuree(a.duree) || 0);
          
          default:
            return 0;
        }
      });
    }

    setFilteredTrajets(filtered);
    setCurrentPage(1);
    
  }, [trajets, filters, advancedFilters, sortBy]);

  // APPLICATION AUTOMATIQUE DES FILTRES
  useEffect(() => {
    if (trajets.length > 0) {
      applyFiltersAndSort();
    }
  }, [trajets, filters, advancedFilters, sortBy, applyFiltersAndSort]);

  // RÉINITIALISATION DES FILTRES
  const resetFilters = useCallback(() => {
    setFilters({
      ville_depart: "",
      ville_arrivee: "",
      date_depart: "",
      date_retour: "",
    });

    setTripType("aller");
    setPassengers(1);
    setAdvancedFilters({ 
      type_bus: "", 
      heure_periode: "", 
      societe: "",
      arrets: "",
      prix_min: "",
      prix_max: ""
    });
    setSortBy("depart_plus_tot");
    setShowFilterDrawer(false);

    setFilteredTrajets(trajets);
    setCurrentPage(1);

    showAlert("success", "Filtres réinitialisés");
  }, [trajets, showAlert]);

  // GESTION DU CHANGEMENT DE DATE
  const handleDateChange = useCallback((newDate) => {
    setFilters(prev => ({ ...prev, date_depart: newDate }));
  }, []);

  // PAGINATION
  const currentTrajets = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredTrajets.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredTrajets, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredTrajets.length / itemsPerPage);

  const handlePageChange = useCallback((pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleApplyFilters = useCallback(() => {
    applyFiltersAndSort();
    setShowFilterDrawer(false);
    showAlert("success", "Filtres appliqués avec succès");
  }, [applyFiltersAndSort, showAlert]);

  // LANCER UNE NOUVELLE RECHERCHE
  const handleSearch = useCallback(() => {
    loadTrajets();
  }, [loadTrajets]);

  return (
    <div className="travels-container">
      <Card className="travels-header">
        <h1>Rechercher un trajet</h1>
        <p>Trouvez le trajet parfait pour votre voyage</p>
      </Card>

      {alert.show && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ show: false, type: "", message: "" })}
        />
      )}

      <div className="travels-content">
        {/* Formulaire de recherche principal */}
        <div className="search-section">
          <SearchForm
            filters={filters}
            tripType={tripType}
            passengers={passengers}
            cities={cities}
            onFilterChange={({ name, value }) => setFilters(prev => ({ ...prev, [name]: value }))}
            onTripTypeChange={setTripType}
            onPassengersChange={setPassengers}
            onSwapCities={() => setFilters(prev => ({
              ...prev,
              ville_depart: prev.ville_arrivee,
              ville_arrivee: prev.ville_depart,
            }))}
            onSearch={handleSearch}
            onReset={resetFilters}
          />
        </div>

        {/* Barre de contrôle */}
        <div className="controls-bar">
          <div className="filter-results-badge">
            {filteredTrajets.length} trajet{filteredTrajets.length > 1 ? 's' : ''} trouvé{filteredTrajets.length > 1 ? 's' : ''}
            {totalPages > 1 && ` • Page ${currentPage}/${totalPages}`}
          </div>
          
          <Button 
            variant="outline"
            onClick={() => setShowFilterDrawer(true)}
            className="filters-toggle-btn"
          >
            🎛️ Filtres & Tri
          </Button>
        </div>

        {/* Liste des trajets */}
        <div className="trajets-section">
          <TrajetList 
            trajets={currentTrajets} 
            loading={loading}
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredTrajets.length}
            onPageChange={handlePageChange}
            searchDate={filters.date_depart}
            onDateChange={handleDateChange}
          />
        </div>

        {/* Panneau de filtres avancés */}
        <FilterDrawer
          open={showFilterDrawer}
          onClose={() => setShowFilterDrawer(false)}
          advancedFilters={advancedFilters}
          sortBy={sortBy}
          companies={companies}
          onAdvancedFilterChange={({ name, value }) => setAdvancedFilters(prev => ({ ...prev, [name]: value }))}
          onSortChange={setSortBy}
          onApplyFilters={handleApplyFilters}
          onResetFilters={resetFilters}
        />
      </div>
    </div>
  );
};

export default Travels;