import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "../../../Context/UserContext";  // ← UserContext pour CLIENTS
import { Loader } from "../../UI";

const ProtectedPublic = ({ children }) => {
  const { isAuthenticated, loading } = useUser();
  const location = useLocation();

  if (loading) {
    return <Loader size="large" text="Vérification de l'authentification..." />;
  }

  if (!isAuthenticated) {
    sessionStorage.setItem("redirectAfterLogin", location.pathname + location.search);
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedPublic;