import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { adminService, countryService } from "../api";

export const useAdminSignup = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    mot_de_passe: "",
    confirm_mot_de_passe: "",
    telephone: "",
    adresse_postale: "",
    ville: "",
    code_postal: "",
    region: "",
    country: "France",
    date_naissance: "",
    code_admin: "",
    phone_code: "+33"
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState({ 
    show: false, 
    type: "", 
    message: "",
    errors: {}
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [countries, setCountries] = useState([]);
  const [apiStatus, setApiStatus] = useState("online");

  // 🎯 CHARGEMENT DES PAYS
  useEffect(() => {
    const loadCountries = async () => {
      try {
        const response = await countryService.getCountries();
        if (response.data) {
          setCountries(response.data.data || response.data || []);
        } else {
          setCountries([]);
        }
        setApiStatus("online");
      } catch (error) {
        console.error("❌ Erreur chargement pays:", error);
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

  // 🎯 GESTION DES CHAMPS
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Effacer l'erreur quand l'utilisateur corrige
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
    if (alert.show) {
      setAlert(prev => ({ ...prev, show: false }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    
    // Validation en temps réel
    if (name === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setErrors(prev => ({ ...prev, email: 'Format d\'email invalide' }));
    }
    
    if (name === 'telephone' && value && !/^[0-9+\-\s()]{10,}$/.test(value)) {
      setErrors(prev => ({ ...prev, telephone: 'Format de téléphone invalide' }));
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

  // 🎯 VALIDATION COMPLÈTE DU FORMULAIRE
  const validateForm = () => {
    const newErrors = {};

    // Code admin
    if (!formData.code_admin.trim()) {
      newErrors.code_admin = "Le code d'accès administrateur est obligatoire";
    }

    // Informations personnelles
    if (!formData.nom.trim()) newErrors.nom = "Le nom est obligatoire";
    if (!formData.prenom.trim()) newErrors.prenom = "Le prénom est obligatoire";
    if (!formData.email.trim()) newErrors.email = "L'email est obligatoire";
    if (!formData.telephone.trim()) newErrors.telephone = "Le téléphone est obligatoire";
    if (!formData.country) newErrors.country = "Le pays est obligatoire";
    if (!formData.adresse_postale.trim()) newErrors.adresse_postale = "L'adresse est obligatoire";
    if (!formData.ville.trim()) newErrors.ville = "La ville est obligatoire";
    if (!formData.code_postal.trim()) newErrors.code_postal = "Le code postal est obligatoire";
    if (!formData.mot_de_passe) newErrors.mot_de_passe = "Le mot de passe est obligatoire";
    if (!formData.confirm_mot_de_passe) newErrors.confirm_mot_de_passe = "La confirmation est obligatoire";

    // Date de naissance
    if (!formData.date_naissance) {
      newErrors.date_naissance = "La date de naissance est obligatoire";
    } else {
      const birthDate = new Date(formData.date_naissance);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < 18) {
        newErrors.date_naissance = "Vous devez avoir au moins 18 ans";
      }
    }

    // Validations avancées
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Format d'email invalide";
    }

    if (formData.mot_de_passe && formData.mot_de_passe.length < 8) {
      newErrors.mot_de_passe = "Le mot de passe doit contenir au moins 8 caractères";
    }

    if (formData.mot_de_passe !== formData.confirm_mot_de_passe) {
      newErrors.confirm_mot_de_passe = "Les mots de passe ne correspondent pas";
    }

    // Conditions
    if (!acceptedTerms) {
      newErrors.acceptedTerms = "Vous devez accepter les conditions d'utilisation";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 🎯 SOUMISSION DU FORMULAIRE
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setAlert({
        show: true,
        type: "error",
        message: "Veuillez corriger les erreurs dans le formulaire",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        nom: formData.nom.trim(),
        prenom: formData.prenom.trim(),
        email: formData.email.trim().toLowerCase(),
        telephone: formData.telephone.trim(),
        ville: formData.ville.trim(),
        adresse_postale: formData.adresse_postale.trim(),
        code_postal: formData.code_postal.trim(),
        region: formData.region.trim(),
        country: formData.country,
        date_naissance: formData.date_naissance,
        phone_code: formData.phone_code,
        mot_de_passe: formData.mot_de_passe,
        code_admin: formData.code_admin,
        type_utilisateur: "admin",
        conditions_acceptees: true
      };

      console.log("📤 Envoi données inscription admin:", payload);

      const response = await adminService.signup(payload);

      if (response.data.success) {
        setAlert({
          show: true,
          type: "success",
          message: "🎉 Compte administrateur créé avec succès ! Redirection...",
        });

        setTimeout(() => {
          navigate("/admin/login", {
            state: {
              message: "Compte administrateur créé avec succès !"
            }
          });
        }, 3000);
      } else {
        throw new Error(response.data.message || "Erreur lors de la création du compte admin");
      }
    } catch (error) {
      console.error("❌ Erreur création compte admin:", error);
      
      const errorMessage = error.response?.data?.message || error.message || "Erreur lors de la création du compte administrateur";

      setAlert({
        show: true,
        type: "error",
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🎯 RÉINITIALISER L'ALERTE
  const clearAlert = () => {
    setAlert({ show: false, type: "", message: "", errors: {} });
  };

  // 🛡️ CORRECTION CRITIQUE : Gestion sécurisée de la checkbox
  const handleTermsChange = (checked) => {
    setAcceptedTerms(checked);
    if (errors.acceptedTerms) {
      setErrors(prev => ({ ...prev, acceptedTerms: "" }));
    }
  };

  return {
    formData,
    errors,
    isSubmitting,
    alert,
    apiStatus,
    countries,
    acceptedTerms,
    handleChange,
    handleBlur,
    handleCountryChange,
    handleSubmit,
    setAlert: clearAlert,
    setAcceptedTerms: handleTermsChange, // ✅ CORRECTION CRITIQUE
    setFormData
  };
};