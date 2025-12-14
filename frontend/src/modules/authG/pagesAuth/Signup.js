// frontend/src/modules/authG/pagesAuth/Signup.js - VERSION CORRIGÉE
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SignupForm from "../componentsAuth/SignupForm";
import { Alert } from "../../../Components/UI";
import { userService, countryService } from '../../../api';
import '../stylesAuth/Signup.css';

const Signup = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    nom: "", prenom: "", email: "", mot_de_passe: "", confirm_mot_de_passe: "",
    telephone: "", country: "", phone_code: "+33", ville: "", code_postal: "",
    region: "", adresse_postale: "", date_naissance: ""
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countries, setCountries] = useState([]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [apiStatus, setApiStatus] = useState("online");

  // Charger les pays
  useEffect(() => {
    loadCountries();
  }, []);

  const loadCountries = async () => {
    try {
      const response = await countryService.getCountries();
      if (response.data?.success) {
        setCountries(response.data.data || []);
        setApiStatus("online");
      }
    } catch (error) {
      console.error("Erreur chargement pays:", error);
      setApiStatus("offline");
      // Données de secours
      setCountries([
        { name: 'France', code: '+33' },
        { name: 'Belgique', code: '+32' },
        { name: 'Suisse', code: '+41' },
        { name: 'Canada', code: '+1' }
      ]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    // Validation en temps réel
    if (name === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setErrors(prev => ({ ...prev, email: 'Format d\'email invalide' }));
    }
  };

  const handleCountryChange = (e) => {
    const selectedCountryName = e.target.value;
    const selectedCountry = countries.find(c => c.name === selectedCountryName);
    setFormData(prev => ({
      ...prev,
      country: selectedCountryName,
      phone_code: selectedCountry ? selectedCountry.code : '+33'
    }));
  };

  // Fonction de validation
  const validateForm = () => {
    const newErrors = {};

    // Validation des champs obligatoires
    if (!formData.nom?.trim()) newErrors.nom = 'Le nom est obligatoire';
    if (!formData.prenom?.trim()) newErrors.prenom = 'Le prénom est obligatoire';
    if (!formData.email?.trim()) newErrors.email = 'L\'email est obligatoire';
    if (!formData.mot_de_passe) newErrors.mot_de_passe = 'Le mot de passe est obligatoire';
    if (!formData.telephone?.trim()) newErrors.telephone = 'Le téléphone est obligatoire';
    if (!formData.country?.trim()) newErrors.country = 'Le pays est obligatoire';
    if (!formData.ville?.trim()) newErrors.ville = 'La ville est obligatoire';
    if (!formData.adresse_postale?.trim()) newErrors.adresse_postale = 'L\'adresse est obligatoire';
    if (!formData.date_naissance) newErrors.date_naissance = 'La date de naissance est obligatoire';

    // Validation email
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    // Validation mot de passe
    if (formData.mot_de_passe) {
      if (formData.mot_de_passe.length < 8) {
        newErrors.mot_de_passe = 'Minimum 8 caractères';
      }
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.mot_de_passe)) {
        newErrors.mot_de_passe = 'Doit contenir majuscule, minuscule et chiffre';
      }
    }

    // Validation confirmation mot de passe
    if (formData.mot_de_passe !== formData.confirm_mot_de_passe) {
      newErrors.confirm_mot_de_passe = 'Les mots de passe ne correspondent pas';
    }

    // Validation date de naissance
    if (formData.date_naissance) {
      if (!/^\d{2}\/\d{2}\/\d{4}$/.test(formData.date_naissance)) {
        newErrors.date_naissance = 'Format invalide. Utilisez jj/mm/aaaa';
      } else {
        const [day, month, year] = formData.date_naissance.split('/').map(Number);
        const birthDate = new Date(year, month - 1, day);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();

        if (birthDate.getDate() !== day || birthDate.getMonth() !== month - 1 || birthDate.getFullYear() !== year) {
          newErrors.date_naissance = 'Date de naissance invalide';
        } else if (age < 18) {
          newErrors.date_naissance = 'Vous devez avoir au moins 18 ans';
        } else if (age > 120) {
          newErrors.date_naissance = 'Date de naissance invalide';
        }
      }
    }

    // Validation conditions
    if (!acceptedTerms) {
      newErrors.acceptedTerms = 'Vous devez accepter les conditions d\'utilisation';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    
    // Validation des données
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Conversion jj/mm/aaaa → YYYY-MM-DD
      let formattedDate = formData.date_naissance;
      if (formData.date_naissance && formData.date_naissance.includes('/')) {
        const [day, month, year] = formData.date_naissance.split('/');
        formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }

      const submitData = {
        ...formData,
        date_naissance: formattedDate,
        conditions_acceptees: true,
        phone_code: formData.phone_code || '+33'
      };

      console.log('📤 Données envoyées à l\'API:', submitData);

      // ✅ CORRECTION : Utilisez userService.signup (maintenant importé)
      const response = await userService.signup(submitData);
      const result = response.data;

      console.log('📨 Réponse API:', response.status, result);

      if (result.success) {
        // Succès - redirection vers la page de connexion
        navigate('/login', { 
          state: { 
            message: 'Compte créé avec succès ! Vous pouvez maintenant vous connecter.' 
          } 
        });
      } else {
        // Erreur API - afficher le message spécifique
        setSubmitError(result.message || 'Erreur lors de la création du compte');
        console.error('❌ Erreur API:', result.message);
      }
    } catch (error) {
      console.error('❌ Erreur réseau:', error);
      
      // ✅ CORRECTION : Meilleure gestion des erreurs
      if (error.response) {
        // Erreur API avec réponse
        setSubmitError(error.response.data.message || 'Erreur lors de la création du compte');
      } else if (error.request) {
        // Pas de réponse du serveur
        setSubmitError('Erreur de connexion au serveur');
      } else {
        // Autre erreur
        setSubmitError('Erreur inattendue');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <div className="signup-card">
          <div className="signup-header-centered">
            <div className="signup-icon">👤</div>
            <h1 className="signup-title">Créer un compte</h1>
            <p className="signup-subtitle">Rejoignez notre communauté</p>
          </div>

          {submitError && (
            <Alert 
              type="error" 
              message={submitError}
              onClose={() => setSubmitError("")}
            />
          )}

          {apiStatus === 'offline' && (
            <Alert 
              type="warning" 
              message="Mode hors ligne activé - Certaines fonctionnalités peuvent être limitées"
            />
          )}

          <SignupForm
            formData={formData}
            errors={errors}
            isSubmitting={isSubmitting}
            apiStatus={apiStatus}
            countries={countries}
            acceptedTerms={acceptedTerms}
            handleChange={handleChange}
            handleBlur={handleBlur}
            handleCountryChange={handleCountryChange}
            handleSubmit={handleSubmit}
            setAcceptedTerms={setAcceptedTerms}
            setFormData={setFormData}
          />

          <div className="signup-footer">
            <p>Déjà inscrit ? <a href="/login" className="signup-link">Se connecter</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;