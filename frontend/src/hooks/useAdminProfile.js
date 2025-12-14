// frontend/src/hooks/useAdminProfile.js - VERSION AMÉLIORÉE
import { useState, useEffect, useCallback } from "react";
import { useUser } from "../Context/UserContext";

import { adminService } from "../api";

export const useAdminProfile = () => {
  const { user, updateUser } = useUser();
  
  const [adminProfile, setAdminProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState({ 
    show: false, 
    type: "", 
    message: "",
    errors: {}
  });

  // 🎯 CHARGEMENT PROFIL ADMIN
  const loadAdminProfile = useCallback(async () => {
    if (!user || user.type_utilisateur !== 'admin') {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log("🔄 Chargement profil admin...");
      
      const response = await adminService.getAdminProfile();
      
      if (response.data.success) {
        const profileData = response.data.data;
        setAdminProfile(profileData);
        
        // 🚀 Mettre à jour le contexte utilisateur
        updateUser({
          ...user,
          ...profileData
        });
        
        console.log("✅ Profil admin chargé:", profileData);
      } else {
        throw new Error(response.data.message || "Erreur chargement profil");
      }
    } catch (error) {
      console.error("❌ Erreur chargement profil admin:", error);
      
      setAlert({
        show: true,
        type: "error",
        message: error.response?.data?.message || 
                "Erreur lors du chargement du profil administrateur",
        errors: error.response?.data?.errors || {}
      });
    } finally {
      setLoading(false);
    }
  }, [user, updateUser]);

  // 🎯 MISE À JOUR PROFIL ADMIN
  const updateAdminProfile = async (formData) => {
    if (!user || user.type_utilisateur !== 'admin') {
      setAlert({
        show: true,
        type: "error",
        message: "Accès non autorisé"
      });
      return false;
    }

    try {
      setSaving(true);
      console.log("🔄 Mise à jour profil admin:", formData);
      
      const response = await adminService.updateAdminProfile(formData);
      
      if (response.data.success) {
        // 🚀 Recharger les données fraîches
        await loadAdminProfile();
        
        setAlert({
          show: true,
          type: "success",
          message: "Profil administrateur mis à jour avec succès"
        });
        
        console.log("✅ Profil admin mis à jour");
        return true;
      } else {
        throw new Error(response.data.message || "Erreur mise à jour");
      }
    } catch (error) {
      console.error("❌ Erreur mise à jour profil admin:", error);
      
      setAlert({
        show: true,
        type: "error",
        message: error.response?.data?.message || 
                "Erreur lors de la mise à jour du profil",
        errors: error.response?.data?.errors || {}
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  // 🎯 RÉINITIALISER LES ALERTES
  const clearAlert = () => {
    setAlert({ show: false, type: "", message: "", errors: {} });
  };

  // 🔄 CHARGEMENT AUTOMATIQUE
  useEffect(() => {
    if (user && user.type_utilisateur === 'admin') {
      loadAdminProfile();
    } else {
      setLoading(false);
    }
  }, [user, loadAdminProfile]);

  return {
    adminProfile,
    loading,
    saving,
    alert,
    loadAdminProfile,
    updateAdminProfile,
    clearAlert
  };
};