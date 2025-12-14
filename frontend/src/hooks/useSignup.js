// frontend/src/hooks/useSignup.js - VERSION OPTIMISÉE
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { userService, countryService } from "../api/apiService";

export const useSignup = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nom: "", prenom: "", email: "", mot_de_passe: "", confirm_mot_de_passe: "",
    telephone: "", ville: "", adresse_postale: "", code_postal: "", region: "",
    date_naissance: "", country: "", phone_code: "+33"
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countries, setCountries] = useState([]);
  const [apiStatus, setApiStatus] = useState("online");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Formatage automatique de la date
  const formatDateInput = (value) => {
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 4) return numbers.slice(0, 2) + '/' + numbers.slice(2);
    return numbers.slice(0, 2) + '/' + numbers.slice(2, 4) + '/' + numbers.slice(4, 8);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    let formattedValue = value;
    
    // Formatage date automatique
    if (name === 'date_naissance') {
      formattedValue = formatDateInput(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));

    // Effacer l'erreur quand l'utilisateur tape
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    
    // Validation en temps réel
    if (name === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setErrors(prev => ({ ...prev, email: 'Format d\'email invalide' }));
    }
    
    if (name === 'mot_de_passe' && value && value.length < 8) {
      setErrors(prev => ({ ...prev, mot_de_passe: 'Minimum 8 caractères' }));
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

  // Validation complète du formulaire
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

  const handleSubmit = async (e, setAlert) => {
    e.preventDefault();
    
    const formErrors = validateForm();
    setErrors(formErrors);

    if (Object.keys(formErrors).length > 0) {
      setAlert({
        show: true,
        type: "error",
        message: "Veuillez corriger les erreurs dans le formulaire"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Conversion date pour l'API
      const submitData = {
        ...formData,
        date_naissance: formData.date_naissance ? 
          (formData.date_naissance.includes('/') ? 
            (() => {
              const [day, month, year] = formData.date_naissance.split('/');
              return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            })() : 
            formData.date_naissance) : 
          null,
        conditions_acceptees: true
      };
      
      const response = await userService.signup(submitData);
      
      if (response.data.success) {
        setAlert({
          show: true,
          type: "success",
          message: "Compte créé avec succès ! Redirection..."
        });

        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        throw new Error(response.data.message || "La création du compte a échoué");
      }
    } catch (error) {
      console.error('❌ Erreur inscription:', error);
      setAlert({
        show: true,
        type: "error",
        message: error.response?.data?.message || error.message || "Erreur lors de la création du compte"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Chargement des pays
  useEffect(() => {
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

    loadCountries();
  }, []);

  return {
    formData,
    errors,
    isSubmitting,
    countries,
    apiStatus,
    acceptedTerms,
    handleChange,
    handleBlur,
    handleCountryChange,
    handleSubmit,
    setAcceptedTerms,
    setFormData
  };
};

export default useSignup;