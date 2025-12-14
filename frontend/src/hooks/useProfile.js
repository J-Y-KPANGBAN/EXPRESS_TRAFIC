import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "../Context/UserContext";
import { userService } from '../api';
import { Toast } from "../Components/UI";

export const useProfile = () => {
  const { user, updateUser, logout } = useUser();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nom: "", prenom: "", email: "", telephone: "", date_naissance: "",
    adresse_postale: "", ville: "", code_postal: "", country: "", region: ""
  });

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: "", message: "", errors: {} });
  const [hasLoaded, setHasLoaded] = useState(false);

  // ✅ UTILISER useRef POUR LES VARIABLES QUI CHANGENT FRÉQUEMMENT
  const loadingRef = useRef(loading);
  const hasLoadedRef = useRef(hasLoaded);
  const profileRef = useRef(profile);

  // ✅ METTRE À JOUR LES REFS QUAND LES STATES CHANGENT
  useEffect(() => {
    loadingRef.current = loading;
    hasLoadedRef.current = hasLoaded;
    profileRef.current = profile;
  }, [loading, hasLoaded, profile]);

  /* ===========================================================
     📌 1. Chargement du profil - VERSION CORRIGÉE
  ============================================================*/
  const loadProfile = useCallback(async (forceRefresh = false) => {
    // ✅ UTILISER LES REFS POUR LES CONDITIONS
    if (loadingRef.current && !forceRefresh) {
      console.log("⏳ Chargement déjà en cours...");
      return;
    }

    if (hasLoadedRef.current && !forceRefresh && profileRef.current) {
      console.log("📦 Utilisation des données en cache");
      return;
    }

    if (!user || !user.id) {
      console.warn("⚠️ Aucun utilisateur connecté pour charger le profil");
      setLoading(false);
      setHasLoaded(true);
      return;
    }

    try {
      setLoading(true);
      setAlert({ show: false, type: "", message: "", errors: {} });

      console.log("🔄 Chargement du profil pour l'utilisateur:", user.id);

      const response = await userService.getProfile();
      console.log("📊 Réponse API profil COMPLÈTE:", response.data);

      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || "Erreur de réponse API");
      }

      const profileData = response.data.data || response.data.user || response.data;
      console.log("📝 Données brutes du profil:", profileData);

      if (profileData) {
        const formattedData = {
          id: profileData.id || user?.id,
          nom: profileData.nom || "",
          prenom: profileData.prenom || "",
          email: profileData.email || "",
          telephone: profileData.telephone || "",
          date_naissance: profileData.date_naissance || "",
          adresse_postale: profileData.adresse_postale || "",
          ville: profileData.ville || "",
          code_postal: profileData.code_postal || "",
          country: profileData.country || "",
          country_name: profileData.country_name || "",
          region: profileData.region || "",
          numero_client: profileData.numero_client || "",
          date_inscription: profileData.date_inscription || "",
          type_utilisateur: profileData.type_utilisateur || "client",
          derniere_connexion: profileData.derniere_connexion || ""
        };

        console.log("🎯 Données formatées pour affichage:", formattedData);
        
        setProfile(formattedData);
        setFormData(formattedData);
        setHasLoaded(true);

        // ✅ VÉRIFICATION CRITIQUE QUE updateUser EXISTE
        if (typeof updateUser === 'function') {
          updateUser(formattedData);
        } else {
          console.error("❌ updateUser n'est pas une fonction dans le contexte");
        }
      } else {
        throw new Error("Aucune donnée de profil reçue");
      }
    } catch (error) {
      console.error("❌ Erreur chargement profil:", error);
      
      let errorMessage = "Erreur lors du chargement du profil.";
      
      if (error.response?.status === 401) {
        errorMessage = "Session expirée. Veuillez vous reconnecter.";
        if (typeof logout === 'function') {
          logout();
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setAlert({
        show: true,
        type: "error",
        message: errorMessage,
        errors: {}
      });
    } finally {
      setLoading(false);
    }
  }, [user, updateUser, logout]);

  /* ===========================================================
     📌 2. Effet de chargement
  ============================================================*/
  useEffect(() => {
    let mounted = true;

    const initializeProfile = async () => {
      if (mounted && user && !hasLoaded && !loading) {
        const timeoutId = setTimeout(() => {
          if (mounted) {
            loadProfile();
          }
        }, 50);
        
        return () => clearTimeout(timeoutId);
      }
    };

    initializeProfile();

    return () => {
      mounted = false;
    };
  }, [user, hasLoaded, loading, loadProfile]);

  /* ===========================================================
     📌 3. Rafraîchissement manuel
  ============================================================*/
  const refreshProfile = useCallback(() => {
    setHasLoaded(false);
    loadProfile(true);
  }, [loadProfile]);

  /* ===========================================================
     📌 4. Gestion des inputs
  ============================================================*/
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (alert.errors[name]) {
      setAlert(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          [name]: ""
        }
      }));
    }
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /* ===========================================================
     📌 5. Validation
  ============================================================*/
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nom?.trim()) newErrors.nom = "Le nom est obligatoire";
    if (!formData.prenom?.trim()) newErrors.prenom = "Le prénom est obligatoire";
    if (!formData.telephone?.trim()) newErrors.telephone = "Le téléphone est obligatoire";

    // Validation date si fournie
    if (formData.date_naissance) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(formData.date_naissance)) {
        newErrors.date_naissance = "Format de date invalide (YYYY-MM-DD)";
      }
    }

    return newErrors;
  };

  /* ===========================================================
     📌 6. Soumission du formulaire
  ============================================================*/
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    console.log("🔍 Erreurs de validation:", validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setAlert({
        show: true,
        type: "error",
        message: "Veuillez corriger les erreurs ci-dessous",
        errors: validationErrors
      });
      return;
    }

    setSaving(true);
    setAlert({ show: false, type: "", message: "", errors: {} });

    try {
      const payload = {
        nom: formData.nom.trim(),
        prenom: formData.prenom.trim(),
        email: formData.email.trim(),
        telephone: formData.telephone.trim(),
        date_naissance: formData.date_naissance ? 
          (formData.date_naissance.includes('T') ? 
           formData.date_naissance.split('T')[0] : 
           formData.date_naissance) : null,
        adresse_postale: formData.adresse_postale?.trim() || null,
        ville: formData.ville?.trim() || null,
        code_postal: formData.code_postal?.trim() || null,
        country: formData.country?.trim() || null,
        region: formData.region?.trim() || null
      };

      console.log("📤 Envoi des données formatées:", payload);
      
      const response = await userService.updateProfile(payload);
      console.log("✅ Réponse mise à jour:", response.data);

      if (!response.data.success) {
        throw new Error(response.data.message || "Erreur serveur");
      }

      await loadProfile(true);

      setAlert({
        show: true,
        type: "success",
        message: "Profil mis à jour avec succès !",
        errors: {}
      });

      Toast.show({
        type: "success",
        message: "Profil mis à jour",
        duration: 3000
      });

      setIsEditing(false);
    } catch (error) {
      console.error("❌ Erreur update profil :", error);
      const message = error.response?.data?.message || "Erreur lors de la mise à jour du profil.";

      setAlert({
        show: true,
        type: "error",
        message,
        errors: {}
      });

      Toast.show({
        type: "error",
        message,
        duration: 5000
      });
    } finally {
      setSaving(false);
    }
  };

  /* ===========================================================
     📌 7. Autres fonctions
  ============================================================*/
  const handleCancel = () => {
    setIsEditing(false);
    setAlert({ show: false, type: "", message: "", errors: {} });
    
    if (profile) {
      setFormData({
        nom: profile.nom || "",
        prenom: profile.prenom || "",
        email: profile.email || "",
        telephone: profile.telephone || "",
        date_naissance: profile.date_naissance || "",
        adresse_postale: profile.adresse_postale || "",
        ville: profile.ville || "",
        code_postal: profile.code_postal || "",
        country: profile.country || "",
        region: profile.region || ""
      });
    }
  };

  const hideAlert = () => {
    setAlert({ show: false, type: "", message: "", errors: {} });
  };

  // ✅ FONCTION DE FORMATAGE DE DATE SÉCURISÉE
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    
    try {
      // Gérer les dates au format YYYY-MM-DD
      if (typeof dateString === 'string' && dateString.includes('-')) {
        return dateString.split('T')[0]; // Retourne YYYY-MM-DD
      }
      
      // Gérer les objets Date
      if (dateString instanceof Date) {
        return dateString.toISOString().split('T')[0];
      }
      
      return "";
    } catch (error) {
      console.error("❌ Erreur formatage date:", error);
      return "";
    }
  };

  return {
    profile: profile || user,
    isEditing,
    setIsEditing,
    formData,
    loading,
    saving,
    alert,
    handleChange,
    handleDateChange,
    handleSubmit,
    formatDateForInput,
    hideAlert,
    handleCancel,
    refreshProfile
  };
};

export default useProfile;