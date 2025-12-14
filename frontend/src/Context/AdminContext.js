import React, { createContext, useState, useContext, useEffect, useCallback } from "react";

const AdminContext = createContext();

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin doit être utilisé dans un AdminProvider");
  }
  return context;
};

export const AdminProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 🔒 Déconnexion ADMIN
  const logout = useCallback(() => {
    console.log("🚪 Déconnexion ADMIN...");
    
    setAdmin(null);
    setIsAuthenticated(false);
    setLoading(false);
    
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
    sessionStorage.removeItem("adminRedirectAfterLogin");
    
    if (!window.location.pathname.includes('/admin/login')) {
      setTimeout(() => {
        window.location.href = "/admin/login";
      }, 150);
    }
  }, []);

  // 🔐 Vérification auth ADMIN - CORRIGÉE
  const checkAuthStatus = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const savedAdmin = localStorage.getItem("admin");

      if (!token || token === "undefined" || token === "null") {
        setAdmin(null);
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      if (savedAdmin) {
        try {
          const parsedAdmin = JSON.parse(savedAdmin);
          // ✅ VÉRIFICATION PLUS FLEXIBLE - CORRECTION CRITIQUE
          if (parsedAdmin && parsedAdmin.id && parsedAdmin.email) {
            if (parsedAdmin.type_utilisateur === 'admin') {
              setAdmin(parsedAdmin);
              setIsAuthenticated(true);
              console.log("✅ AdminContext: Administrateur chargé avec succès");
            } else {
              console.warn("❌ AdminContext: Mauvais type utilisateur pour admin:", parsedAdmin.type_utilisateur);
              logout();
            }
          } else {
            console.warn("❌ AdminContext: Données admin incomplètes");
            logout();
          }
        } catch (parseError) {
          console.error("❌ AdminContext: Erreur parsing admin:", parseError);
          logout();
        }
      }
    } catch (error) {
      console.error("❌ AdminContext: Erreur checkAuthStatus:", error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  // 🔐 Login ADMIN - CORRIGÉ
  const login = useCallback((adminData, token, redirectPath = null) => {
    // ✅ VÉRIFICATION PLUS FLEXIBLE - CORRECTION CRITIQUE
    if (!adminData || !token) {
      console.error("❌ AdminContext: Données admin ou token manquants");
      return false;
    }

    if (adminData.type_utilisateur !== 'admin') {
      console.error("❌ AdminContext: Données admin invalides - Type:", adminData.type_utilisateur);
      return false;
    }

    try {
      localStorage.setItem("adminToken", token);
      localStorage.setItem("admin", JSON.stringify(adminData));
      
      setAdmin(adminData);
      setIsAuthenticated(true);
      setLoading(false);

      // Redirection espace ADMIN
      const redirectTo = redirectPath || "/admin/dashboard";
      setTimeout(() => {
        window.location.href = redirectTo;
      }, 300);

      return true;
    } catch (error) {
      console.error("❌ AdminContext: Erreur lors du login admin:", error);
      logout();
      return false;
    }
  }, [logout]);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const value = {
    // État
    admin,
    loading,
    isAuthenticated,
    
    // Actions
    login,
    logout,
    
    // Utilitaires
    isAdmin: () => admin?.type_utilisateur === 'admin',
    adminId: admin?.id,
    adminEmail: admin?.email
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};

export default AdminContext;