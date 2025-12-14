import React from "react";
import { Card, Input, Button, Radio } from "../../../../Components/UI";
import "./SearchForm.css";

const SearchForm = ({
  filters,
  tripType,
  passengers,
  cities,
  onFilterChange,
  onTripTypeChange,
  onPassengersChange,
  onSwapCities,
  onSearch,
  onReset,
}) => {
  const handleSearch = (e) => {
    e.preventDefault();
    
    // Validation des champs obligatoires
    if ((!filters.ville_depart && !filters.arret_depart) || 
        (!filters.ville_arrivee && !filters.arret_arrivee) || 
        !filters.date_depart) {
      alert("Veuillez remplir tous les champs obligatoires : Départ, Arrivée et Date");
      return;
    }
    
    onSearch();
  };

  const incrementPassengers = () => {
    if (passengers < 100) {
      onPassengersChange(passengers + 1);
    }
  };

  const decrementPassengers = () => {
    if (passengers > 1) {
      onPassengersChange(passengers - 1);
    }
  };

  return (
    <Card className="expedia-search-container">
      {/* ------- ROW 1 : TYPES DE TRAJET -------- */}
      <div className="expedia-top-row">
        <Radio
          name="tripType"
          value={tripType}
          inline
          options={[
            { value: "aller-retour", label: "Aller-retour" },
            { value: "aller", label: "Aller simple" },
          ]}
          onChange={(val) => onTripTypeChange(val)}
        />
      </div>

      {/* ------- ROW 2 : FORMULAIRE -------- */}
      <div className="expedia-grid">
        {/* DEPART - Ville ou Arrêt */}
        <div className="expedia-field">
          <label className="expedia-label">De (Ville ou Arrêt)</label>
          <Input
            name="ville_depart"
            placeholder="Ville de départ ou arrêt"
            value={filters.ville_depart}
            onChange={(e) =>
              onFilterChange({ name: "ville_depart", value: e.target.value })
            }
            list="villes-et-arrets-list"
            required
          />
        </div>

        {/* SWAP */}
        <button type="button" className="expedia-swap" onClick={onSwapCities}>
          ↔
        </button>

        {/* ARRIVEE - Ville ou Arrêt */}
        <div className="expedia-field">
          <label className="expedia-label">Vers (Ville ou Arrêt)</label>
          <Input
            name="ville_arrivee"
            placeholder="Ville d'arrivée ou arrêt"
            value={filters.ville_arrivee}
            onChange={(e) =>
              onFilterChange({ name: "ville_arrivee", value: e.target.value })
            }
            list="villes-et-arrets-list"
            required
          />
        </div>

        {/* DATE ALLER */}
        <div className="expedia-field">
          <label className="expedia-label">Date aller</label>
          <Input
            type="date"
            name="date_depart"
            value={filters.date_depart}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) =>
              onFilterChange({ name: "date_depart", value: e.target.value })
            }
            required
          />
        </div>

        {/* DATE RETOUR */}
        {tripType === "aller-retour" && (
          <div className="expedia-field">
            <label className="expedia-label">Date retour</label>
            <Input
              type="date"
              name="date_retour"
              value={filters.date_retour}
              min={filters.date_depart}
              onChange={(e) =>
                onFilterChange({ name: "date_retour", value: e.target.value })
              }
            />
          </div>
        )}

        {/* PASSAGERS - INCREMENTEUR */}
        <div className="expedia-field">
          <label className="expedia-label">Passagers</label>
          <div className="passenger-increment">
            <button 
              type="button" 
              className="passenger-btn"
              onClick={decrementPassengers}
              disabled={passengers <= 1}
            >
              −
            </button>
            <span className="passenger-count">{passengers}</span>
            <button 
              type="button" 
              className="passenger-btn"
              onClick={incrementPassengers}
              disabled={passengers >= 100}
            >
              +
            </button>
          </div>
        </div>

        {/* BOUTON */}
        <Button variant="primary" className="expedia-btn" onClick={handleSearch}>
          Explorer
        </Button>
      </div>

      {/* AUTOCOMPLÉTION - Villes et Arrêts */}
      <datalist id="villes-et-arrets-list">
        {cities.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
    </Card>
  );
};

export default SearchForm;