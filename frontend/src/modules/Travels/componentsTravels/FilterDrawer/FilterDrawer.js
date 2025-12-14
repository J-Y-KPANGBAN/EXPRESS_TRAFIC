import React, { useState, useEffect, useCallback, memo } from "react";
import { Button, Select } from "../../../../Components/UI";
import "./FilterDrawer.css";

const FilterDrawer = memo(({ 
  open, 
  onClose,
  advancedFilters,
  sortBy,
  companies,
  onAdvancedFilterChange,
  onSortChange,
  onApplyFilters,
  onResetFilters
}) => {
  // États locaux pour une mise à jour rapide
  const [localSortBy, setLocalSortBy] = useState(sortBy);
  const [localAdvancedFilters, setLocalAdvancedFilters] = useState(advancedFilters);

  // Synchronisation avec les props
  useEffect(() => {
    setLocalSortBy(sortBy);
    setLocalAdvancedFilters(advancedFilters);
  }, [sortBy, advancedFilters, open]);

  // ✅ CORRECTION : Options de tri avec valeur par défaut
  const sortOptions = [
    { value: "", label: "Trier par..." },
    { value: "prix_croissant", label: "Prix (le plus bas)" },
    { value: "prix_decroissant", label: "Prix (le plus cher)" },
    { value: "depart_plus_tot", label: "Départ (le plus tôt)" },
    { value: "depart_plus_tard", label: "Départ (le plus tard)" },
    { value: "duree_croissante", label: "Durée (la moins longue)" },
  ];

  // ✅ CORRECTION : Filtres de correspondance
  const correspondenceOptions = [
    { value: "", label: "Tous les trajets" },
    { value: "direct", label: "Direct uniquement" },
    { value: "avec_arrets", label: "Avec arrêts" },
  ];

  const timePeriodOptions = [
    { value: "", label: "Toute la journée" },
    { value: "nuit", label: "Nuit (00h-6h)" },
    { value: "matin", label: "Matin (6h-12h)" },
    { value: "aprem", label: "Après-midi (12h-18h)" },
    { value: "soir", label: "Soir (18h-24h)" },
  ];

  const busTypeOptions = [
    { value: "", label: "Tous les types" },
    { value: "standard", label: "Standard" },
    { value: "premium", label: "Premium" },
    { value: "luxe", label: "Luxe" },
  ];

  const companyOptions = [
    { value: "", label: "Toutes les sociétés" },
    ...(companies || []).map((company) => ({ value: company, label: company })),
  ];

  // Gestionnaires optimisés avec useCallback
  const handleSortChange = useCallback((value) => {
    setLocalSortBy(value);
  }, []);

  // ✅ CORRECTION : Supprimé handleDirectFilterChange qui n'était pas utilisé

  const handleAdvancedChange = useCallback((name, value) => {
    setLocalAdvancedFilters(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleApply = useCallback(() => {
    // Appliquer tous les changements
    onSortChange(localSortBy);
    
    // Appliquer chaque filtre avancé
    Object.keys(localAdvancedFilters).forEach(key => {
      onAdvancedFilterChange({ name: key, value: localAdvancedFilters[key] });
    });
    
    onApplyFilters?.();
    onClose();
  }, [localSortBy, localAdvancedFilters, onSortChange, onAdvancedFilterChange, onApplyFilters, onClose]);

  const handleReset = useCallback(() => {
    setLocalSortBy("");
    setLocalAdvancedFilters({
      type_bus: "",
      heure_periode: "",
      societe: "",
      arrets: "",
    });
    onResetFilters();
  }, [onResetFilters]);

  const handleOverlayClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Empêcher le rendu si non ouvert
  if (!open) return null;

  return (
    <>
      <div className="drawer-overlay" onClick={handleOverlayClick}></div>

      <div className="drawer-panel open">
        <div className="drawer-header">
          <h2>Filtres & Tri</h2>
          <button className="drawer-close" onClick={onClose} aria-label="Fermer">
            ✖
          </button>
        </div>

        <div className="drawer-content">
          {/* ✅ CORRECTION : Section Tri avec Select */}
          <div className="filter-section">
            <h4 className="filter-section-title">Trier selon</h4>
            <Select
              name="sortBy"
              value={localSortBy || ""}
              options={sortOptions}
              onChange={(e) => handleSortChange(e.target.value)}
              className="filter-select"
            />
          </div>

          {/* ✅ Section Type de trajet avec arrêts */}
          <div className="filter-section">
            <h4 className="filter-section-title">Type de trajet</h4>
            <Select
              name="arrets"
              value={localAdvancedFilters.arrets || ""}
              options={correspondenceOptions}
              onChange={(e) => handleAdvancedChange("arrets", e.target.value)}
              className="filter-select"
            />
          </div>

          {/* Filtres avancés */}
          <div className="filter-section">
            <h4 className="filter-section-title">Filtres avancés</h4>
            <div className="advanced-filters-grid">
              
              {/* Période de départ */}
              <div className="filter-group">
                <label className="filter-label">Période de départ</label>
                <Select
                  name="heure_periode"
                  value={localAdvancedFilters.heure_periode || ""}
                  options={timePeriodOptions}
                  onChange={(e) => handleAdvancedChange("heure_periode", e.target.value)}
                  className="filter-select"
                />
              </div>

              {/* Société */}
              <div className="filter-group">
                <label className="filter-label">Société</label>
                <Select
                  name="societe"
                  value={localAdvancedFilters.societe || ""}
                  options={companyOptions}
                  onChange={(e) => handleAdvancedChange("societe", e.target.value)}
                  className="filter-select"
                />
              </div>

              {/* Type de bus */}
              <div className="filter-group">
                <label className="filter-label">Type de bus</label>
                <Select
                  name="type_bus"
                  value={localAdvancedFilters.type_bus || ""}
                  options={busTypeOptions}
                  onChange={(e) => handleAdvancedChange("type_bus", e.target.value)}
                  className="filter-select"
                />
              </div>

            </div>
          </div>

          {/* Boutons d'action */}
          <div className="drawer-actions">
            <Button
              variant="primary"
              onClick={handleApply}
              className="apply-filters-btn"
              fullWidth
            >
              ✅ Appliquer les filtres
            </Button>
            
            <Button
              variant="secondary"
              onClick={handleReset}
              className="reset-filters-btn"
              fullWidth
            >
              🔄 Réinitialiser
            </Button>
          </div>
        </div>
      </div>
    </>
  );
});

FilterDrawer.displayName = 'FilterDrawer';

export default FilterDrawer;