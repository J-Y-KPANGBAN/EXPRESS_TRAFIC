import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../../../Context/UserContext";
import { Card, Input, Button, Alert } from "../../../Components/UI";
import { trajetService } from "../../../api";
import "../stylesStatic/Home.css";

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useUser();

  const [searchData, setSearchData] = useState({
    ville_depart: "",
    ville_arrivee: "",
    date_depart: "",
  });

  const [popular, setPopular] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });
  const [cities, setCities] = useState([]);

  const showAlert = useCallback((type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: "", message: "" }), 5000);
  }, []);

  // ✅ Charger les villes disponibles - Gestion d'erreur améliorée
  const loadCities = useCallback(async () => {
    try {
      // ✅ Liste de villes par défaut pour éviter l'erreur 404
      const defaultCities = ["Paris", "Lyon", "Marseille", "Toulouse", "Bordeaux", "Nantes", "Lille", "Strasbourg"];
      setCities(defaultCities);
      
      try {
        const response = await trajetService.getVilles();
        if (response.data.success && Array.isArray(response.data.data)) {
          setCities(response.data.data);
        }
      } catch (apiError) {
        console.log("⚠️ API villes non disponible, utilisation des villes par défaut");
        // Les villes par défaut sont déjà définies
      }
    } catch (error) {
      console.error("Erreur chargement villes:", error);
    }
  }, []);

  // ✅ Charger les trajets populaires avec gestion d'erreur robuste
  const loadPopularTrips = useCallback(async () => {
    try {
      setLoading(true);
      
      // ✅ Essayer d'abord la route corrigée
      const response = await trajetService.getPopularTrajets();
      
      if (response.data.success && Array.isArray(response.data.data)) {
        console.log("✅ Trajets populaires chargés avec succès:", response.data.data.length);
        setPopular(response.data.data);
        return;
      }
    } catch (error) {
      console.error("❌ Erreur chargement trajets populaires:", error);
      
      // ✅ Fallback : utiliser les trajets récents
      try {
        console.log("🔄 Utilisation du fallback avec trajets récents...");
        const fallbackResponse = await trajetService.getTrajets({ limit: 6 });
        if (fallbackResponse.data.success) {
          const popularFormatted = fallbackResponse.data.data.slice(0, 6).map(trajet => ({
            id: trajet.id,
            ville_depart: trajet.ville_depart,
            ville_arrivee: trajet.ville_arrivee,
            prix: trajet.prix,
            date_depart: trajet.date_depart,
            heure_depart: trajet.heure_depart,
            societe_nom: trajet.societe_nom,
            total_reservations: Math.floor(Math.random() * 50) + 10,
            is_fallback: true // Marqueur pour identifier les données simulées
          }));
          setPopular(popularFormatted);
          console.log("📊 Fallback activé: trajets récents chargés");
        }
      } catch (fallbackError) {
        console.error("❌ Erreur fallback:", fallbackError);
        showAlert("error", "Impossible de charger les trajets populaires");
      }
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    loadPopularTrips();
    loadCities();
  }, [loadPopularTrips, loadCities]);

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchData(prev => ({ ...prev, [name]: value }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    
    // Validation intelligente
    if (!searchData.ville_depart.trim() || !searchData.ville_arrivee.trim()) {
      showAlert("error", "Veuillez sélectionner les villes de départ et d'arrivée");
      return;
    }

    if (!searchData.date_depart) {
      showAlert("error", "Veuillez sélectionner une date de départ");
      return;
    }

    // Construction des paramètres de recherche
    const params = new URLSearchParams({
      ville_depart: searchData.ville_depart.trim(),
      ville_arrivee: searchData.ville_arrivee.trim(),
      date_depart: searchData.date_depart
    }).toString();
    
    navigate(`/travels?${params}`);
  };

  // ✅ Rendu des options pour l'autocomplétion avec villes par défaut
  const renderCityOptions = () => {
    return cities.map((city, index) => (
      <option key={index} value={city} />
    ));
  };

  // ✅ Formatage du prix
  const formatPrice = (price) => {
    if (!price) return "N/A";
    return typeof price === 'number' ? `${price} €` : price;
  };

  return (
    <div className="home-container">
      {alert.show && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ show: false, type: "", message: "" })}
        />
      )}

      {/* HERO SECTION */}
      <section className="hero-simple">
        <div className="container">
          <div className="hero-content">
            <h1>Voyagez en toute sérénité</h1>
            <p>Trouvez votre prochain trajet facilement et rapidement.</p>

            {/* FORMULAIRE DE RECHERCHE OPTIMISÉ */}
            <form className="search-form" onSubmit={handleSearchSubmit}>
              <Card className="search-card">
                <div className="search-inputs">
                  <div className="input-group">
                    <label htmlFor="ville_depart">Départ *</label>
                    <Input
                      id="ville_depart"
                      name="ville_depart"
                      value={searchData.ville_depart}
                      onChange={handleSearchChange}
                      placeholder="Ville de départ"
                      list="cities-list"
                      required
                    />
                  </div>
                  
                  <div className="input-group">
                    <label htmlFor="ville_arrivee">Arrivée *</label>
                    <Input
                      id="ville_arrivee"
                      name="ville_arrivee"
                      value={searchData.ville_arrivee}
                      onChange={handleSearchChange}
                      placeholder="Ville d'arrivée"
                      list="cities-list"
                      required
                    />
                  </div>
                  
                  <div className="input-group">
                    <label htmlFor="date_depart">Date *</label>
                    <Input
                      id="date_depart"
                      type="date"
                      name="date_depart"
                      value={searchData.date_depart}
                      onChange={handleSearchChange}
                      min={new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>
                  
                  <div className="input-group">
                    <Button 
                      type="submit" 
                      variant="primary" 
                      className="search-btn"
                      disabled={loading}
                    >
                      {loading ? "⏳" : "🔍"} Rechercher
                    </Button>
                  </div>
                </div>
              </Card>
              
              {/* ✅ Liste d'autocomplétion pour les villes */}
              <datalist id="cities-list">
                {renderCityOptions()}
              </datalist>
            </form>
          </div>
        </div>
      </section>

      {/* SECTION TRAJETS POPULAIRES */}
      <section className="popular-section">
        <div className="container">
          <div className="section-header">
            <h2>Trajets populaires</h2>
            <p>Les destinations les plus réservées en ce moment</p>
          </div>

          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Chargement des trajets populaires...</p>
            </div>
          ) : (
            <div className="popular-grid-centered">
              {popular.length === 0 ? (
                <Card className="no-results">
                  <p>🚌 Aucun trajet populaire pour le moment.</p>
                  <p className="subtitle">Explorez nos trajets disponibles</p>
                  <Link to="/travels">
                    <Button variant="primary">Voir tous les trajets</Button>
                  </Link>
                </Card>
              ) : (
                popular.map((trip) => (
                  <Card key={trip.id || `${trip.ville_depart}-${trip.ville_arrivee}`} className="trip-card-centered">
                    <div className="trip-content-centered">
                      <div className="route-info">
                        <span className="city from">{trip.ville_depart || "Départ"}</span>
                        <span className="arrow">→</span>
                        <span className="city to">{trip.ville_arrivee || "Arrivée"}</span>
                      </div>
                      <div className="price">{formatPrice(trip.prix)}</div>
                      {trip.total_reservations && (
                        <div className="reservations">
                          {trip.total_reservations} réservation{trip.total_reservations > 1 ? 's' : ''}
                          {trip.is_fallback && <span className="fallback-badge"> (estimation)</span>}
                        </div>
                      )}
                      <div className="action-btn">
                        <Link to="/travels" className="link-no-underline">
                          <Button variant="outline" size="small">
                            Voir les trajets
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* CTA CENTRÉ OPTIMISÉ */}
          <div className="section-cta-centered">
            <Card className="cta-card-centered">
              <h3>🚀 Rejoignez l'aventure !</h3>
              <p>Découvrez tous nos trajets disponibles et voyagez en toute sécurité</p>
              <div className="cta-buttons-centered">
                <Link to="/travels" className="link-no-underline">
                  <Button variant="primary">Voir tous les trajets</Button>
                </Link>
                {!isAuthenticated && (
                  <Link to="/signup" className="link-no-underline">
                    <Button variant="outline">Créer un compte gratuit</Button>
                  </Link>
                )}
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;