import React, { createContext, useState, useContext, useEffect, useCallback } from "react";

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser doit être utilisé dans un UserProvider");
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 🔒 Déconnexion CLIENT
  const logout = useCallback(() => {
    console.log("🚪 Déconnexion CLIENT...");
    
    setUser(null);
    setIsAuthenticated(false);
    setLoading(false);
    
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    sessionStorage.removeItem("redirectAfterLogin");
    
    if (!window.location.pathname.includes('/login')) {
      setTimeout(() => {
        window.location.href = "/login";
      }, 150);
    }
  }, []);

  // 🔄 Mise à jour des données utilisateur - FONCTION MANQUANTE
  const updateUser = useCallback((newUserData) => {
    console.log("🔄 UserContext: Mise à jour des données utilisateur", newUserData);
    
    if (newUserData && typeof newUserData === 'object') {
      setUser(prevUser => ({
        ...prevUser,
        ...newUserData
      }));
      
      // Mettre à jour le localStorage
      try {
        const currentUser = localStorage.getItem("user");
        if (currentUser) {
          const parsedUser = JSON.parse(currentUser);
          const updatedUser = { ...parsedUser, ...newUserData };
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }
      } catch (error) {
        console.error("❌ Erreur mise à jour localStorage:", error);
      }
      
      return true;
    }
    return false;
  }, []);

  // 🔐 Vérification auth CLIENT - CORRIGÉE
  const checkAuthStatus = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      const savedUser = localStorage.getItem("user");

      if (!token || token === "undefined" || token === "null") {
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          
          // ✅ VÉRIFICATION PLUS FLEXIBLE - CORRECTION CRITIQUE
          if (parsedUser && parsedUser.id && parsedUser.email) {
            // Autoriser les clients ET les utilisateurs sans type défini (rétro-compatibilité)
            if (!parsedUser.type_utilisateur || parsedUser.type_utilisateur === 'client') {
              setUser(parsedUser);
              setIsAuthenticated(true);
              console.log("✅ UserContext: Utilisateur client chargé avec succès");
            } else {
              console.warn("❌ UserContext: Mauvais type utilisateur:", parsedUser.type_utilisateur);
              logout();
            }
          } else {
            console.warn("❌ UserContext: Données utilisateur incomplètes");
            logout();
          }
        } catch (parseError) {
          console.error("❌ UserContext: Erreur parsing user:", parseError);
          logout();
        }
      }
    } catch (error) {
      console.error("❌ UserContext: Erreur checkAuthStatus:", error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  // 🔐 Login CLIENT - CORRIGÉ
  const login = useCallback((userData, token, redirectPath = null) => {
    // ✅ VÉRIFICATION PLUS FLEXIBLE - CORRECTION CRITIQUE
    if (!userData || !token) {
      console.error("❌ UserContext: Données utilisateur ou token manquants");
      return false;
    }

    // Autoriser les clients ET les utilisateurs sans type défini
    if (userData.type_utilisateur && userData.type_utilisateur !== 'client') {
      console.error("❌ UserContext: Mauvais type utilisateur - Type:", userData.type_utilisateur);
      return false;
    }

    try {
      localStorage.setItem("authToken", token);
      localStorage.setItem("user", JSON.stringify(userData));
      
      setUser(userData);
      setIsAuthenticated(true);
      setLoading(false);

      // Redirection espace CLIENT
      const redirectTo = redirectPath || "/profile";
      setTimeout(() => {
        window.location.href = redirectTo;
      }, 300);

      return true;
    } catch (error) {
      console.error("❌ UserContext: Erreur lors du login:", error);
      logout();
      return false;
    }
  }, [logout]);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const value = {
    // État
    user,
    loading,
    isAuthenticated,
    
    // Actions
    login,
    logout,
    updateUser, // ✅ FONCTION AJOUTÉE
    
    // Utilitaires
    isClient: () => !user?.type_utilisateur || user.type_utilisateur === 'client',
    userId: user?.id,
    userEmail: user?.email
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;