import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAdmin } from "../../../Context/AdminContext";  // ← AdminContext pour ADMINS
import { Loader } from "../../UI";

const AdminProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAdmin();  // ← Utilise AdminContext
  const location = useLocation();

  if (loading) {
    return <Loader size="large" text="Vérification administrateur..." />;
  }

  if (!isAuthenticated) {
    sessionStorage.setItem("adminRedirectAfterLogin", location.pathname + location.search);
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default AdminProtectedRoute;