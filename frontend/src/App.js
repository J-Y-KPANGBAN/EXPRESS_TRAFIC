import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route} from "react-router-dom";

// 🔥 NOUVEAUX CONTEXTS SÉPARÉS
import { UserProvider } from "./Context/UserContext";           // ← CLIENTS uniquement
import { AdminProvider } from "./Context/AdminContext";         // ← ADMINS uniquement
import { CartProvider } from "./Context/CartContext";           // ← PANIER

// 🔥 NOUVELLES ROUTES PROTÉGÉES SÉPARÉES
import ProtectedPublic from "./Components/common/ProtectedRoute/ProtectedPublic";      // ← CLIENTS
import AdminProtectedRoute from "./Components/common/ProtectedRoute/AdminProtectedRoute"; // ← ADMINS

// Layout
import Header from "./Components/common/Header/Header";
import Footer from "./Components/common/Footer/Footer";

// 🛒 PANIER - CHEMIN CORRIGÉ
import CartPage from "./Components/CartPage/CartPage"; // ← CHEMIN CORRIGÉ

// Pages communes
import PaiementPage from "./modules/paiement/PaiementPage";
import PaiementSuccessPage from "./modules/paiement/PaiementSuccessPage";

// Alerte globale UI
import Alert from "./Components/UI/Alert/Alert";

// AUTH CLIENTS
import Login from "./modules/authG/pagesAuth/Login";
import Signup from "./modules/authG/pagesAuth/Signup";
//password forgot
import ResetPassword from "./modules/authG/pagesAuth/ResetPassword";
import ForgotPassword from "./modules/authG/pagesAuth/ForgotPassword";

// Profil utilisateur CLIENT
import Profile from "./modules/profile/pagesProfile/Profile";

// Pages statiques
import Home from "./modules/static/pagesStatic/Home";
import Contact from "./modules/static/pagesStatic/Contact";
import About from "./modules/static/pagesStatic/About";
import FAQ from "./modules/static/pagesStatic/FAQ";
import FormulaireTransport from "./modules/static/pagesStatic/FormulaireTransport";
import MentionsLegales from "./modules/static/pagesStatic/MentionsLegales";
import PrivacyPolicy from "./modules/static/pagesStatic/PrivacyPolicy";
import Terms from "./modules/static/pagesStatic/Terms";

// Pages trajets
import Travels from "./modules/Travels/pagesTravels/Travels";

// Réservations CLIENTS
import MyReservations from "./modules/reservations/MyReservations";

// ADMIN - TOUS LES COMPOSANTS
import AdminSignup from "./modules/admin/pagesAdmin/AdminSignup";
import AdminLogin from "./modules/admin/pagesAdmin/AdminLogin";
import AdminDashboard from "./modules/admin/pagesAdmin/AdminDashboard";
import AdminProfile from "./modules/admin/pagesAdmin/AdminProfile";

// API
import { checkAPIHealth } from "./api/apiService";

// Styles globaux
import "./stylesApp/Style.css";

// Loader global
const GlobalLoader = () => (
  <div className="global-loader">
    <div className="loader-spinner"></div>
    <p>Chargement de l'application...</p>
  </div>
);

// 404
const PageNotFound = () => (
  <div className="page-not-found">
    <h2>Page non trouvée</h2>
    <p>La page que vous recherchez n'existe pas.</p>
    <a href="/" className="link-home">⬅ Retour à l'accueil</a>
  </div>
);

// 🔥 COMPOSANT ROUTES AVEC CONTEXTE SÉPARÉ
const AppRoutes = ({ apiStatus, alert, handleAlertClose }) => {
  return (
    <>
      {/* Alerte globale */}
      {alert.show && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={handleAlertClose}
          autoClose={false}
        />
      )}

      <Header apiStatus={apiStatus} />

      <main className="main-content">
        <Routes>
          {/* ==================== */}
          {/* ROUTES PUBLIQUES (SANS AUTH) */}
          {/* ==================== */}
          
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          {/* ✅ AJOUT DES ROUTES POUR RÉINITIALISATION DE MOT DE PASSE */}
<Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/reset-password" element={<ResetPassword />} />
<Route path="/travels" element={<Travels />} />
<Route path="/contact" element={<Contact />} />
          <Route path="/travels" element={<Travels />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/transport-form" element={<FormulaireTransport />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/mentions-legales" element={<MentionsLegales />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />

          {/* ==================== */}
          {/* ROUTES ADMIN PUBLIQUES (login/signup) */}
          {/* ==================== */}
          
          <Route path="/admin/signup" element={<AdminSignup />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* ==================== */}
          {/* ROUTES PROTÉGÉES CLIENTS (ProtectedPublic) */}
          {/* ==================== */}
          
          <Route 
            path="/profile" 
            element={
              <ProtectedPublic>
                <Profile />
              </ProtectedPublic>
            } 
          />
          <Route 
            path="/paiement/:id" 
            element={
              <ProtectedPublic>
                <PaiementPage />
              </ProtectedPublic>
            } 
          />
          <Route 
            path="/paiement/success/:id" 
            element={
              <ProtectedPublic>
                <PaiementSuccessPage />
              </ProtectedPublic>
            } 
          />
          <Route 
            path="/mes-reservations" 
            element={
              <ProtectedPublic>
                <MyReservations />
              </ProtectedPublic>
            } 
          />
         
          <Route 
            path="/panier" 
            element={
              <ProtectedPublic>
                <CartPage />
              </ProtectedPublic>
            } 
          />

          {/* ==================== */}
          {/* ROUTES ADMIN PROTÉGÉES (AdminProtectedRoute) */}
          {/* ==================== */}
          
          <Route 
            path="/admin/dashboard/*" 
            element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            } 
          />
          <Route 
            path="/admin/profile" 
            element={
              <AdminProtectedRoute>
                <AdminProfile />
              </AdminProtectedRoute>
            } 
          />

          {/* ==================== */}
          {/* ROUTES ADMIN SPÉCIFIQUES PROTÉGÉES */}
          {/* ==================== */}
          
          <Route 
            path="/admin/trajets" 
            element={
              <AdminProtectedRoute>
                <AdminDashboard activeTab="trajets" />
              </AdminProtectedRoute>
            } 
          />
          <Route 
            path="/admin/reservations" 
            element={
              <AdminProtectedRoute>
                <AdminDashboard activeTab="reservations" />
              </AdminProtectedRoute>
            } 
          />
          <Route 
            path="/admin/utilisateurs" 
            element={
              <AdminProtectedRoute>
                <AdminDashboard activeTab="utilisateurs" />
              </AdminProtectedRoute>
            } 
          />
          <Route 
            path="/admin/bus" 
            element={
              <AdminProtectedRoute>
                <AdminDashboard activeTab="bus" />
              </AdminProtectedRoute>
            } 
          />
          <Route 
            path="/admin/societes" 
            element={
              <AdminProtectedRoute>
                <AdminDashboard activeTab="societes" />
              </AdminProtectedRoute>
            } 
          />
          <Route 
            path="/admin/chauffeurs" 
            element={
              <AdminProtectedRoute>
                <AdminDashboard activeTab="chauffeurs" />
              </AdminProtectedRoute>
            } 
          />
          <Route 
            path="/admin/avis" 
            element={
              <AdminProtectedRoute>
                <AdminDashboard activeTab="avis" />
              </AdminProtectedRoute>
            } 
          />
          <Route 
            path="/admin/contacts" 
            element={
              <AdminProtectedRoute>
                <AdminDashboard activeTab="contacts" />
              </AdminProtectedRoute>
            } 
          />
          <Route 
            path="/admin/finances" 
            element={
              <AdminProtectedRoute>
                <AdminDashboard activeTab="finances" />
              </AdminProtectedRoute>
            } 
          />
          <Route 
            path="/admin/parametres" 
            element={
              <AdminProtectedRoute>
                <AdminDashboard activeTab="parametres" />
              </AdminProtectedRoute>
            } 
          />

          {/* ==================== */}
          {/* 404 - TOUJOURS EN DERNIER */}
          {/* ==================== */}
          
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </main>

      <Footer />
    </>
  );
};

function App() {
  const [alert, setAlert] = useState({
    show: false,
    type: "warning",
    message: "",
  });

  const [apiStatus, setApiStatus] = useState("checking");

  useEffect(() => {
    checkAPIStatus();
  }, []);

  const checkAPIStatus = async () => {
    try {
      const result = await checkAPIHealth();

      if (result?.status === "online") {
        setApiStatus("online");
        setAlert(prev => ({ ...prev, show: false }));
      } else {
        setApiStatus("offline");
        setAlert({
          show: true,
          type: "warning",
          message: "Le serveur est temporairement indisponible. Certaines fonctionnalités peuvent être limitées.",
        });
      }
    } catch (error) {
      console.error("Erreur checkAPIHealth:", error);
      setApiStatus("error");
      setAlert({
        show: true,
        type: "warning",
        message: "Impossible de contacter le serveur. Vérifiez votre connexion ou réessayez plus tard.",
      });
    }
  };

  const handleAlertClose = () => {
    setAlert(prev => ({ ...prev, show: false }));
  };

  return (
    // 🔥 CONTEXTS IMBRIQUÉS - CHAQUE CONTEXTE GÈRE SON PROPRE AUTH
    <UserProvider>      {/* ← Gère uniquement les CLIENTS */}
      <AdminProvider>   {/* ← Gère uniquement les ADMINS */}
        <CartProvider>  {/* ← Gère le PANIER */}
          <Router>
            <div className="App">
              <AppRoutes 
                apiStatus={apiStatus}
                alert={alert}
                handleAlertClose={handleAlertClose}
              />
            </div>
          </Router>
        </CartProvider>
      </AdminProvider>
    </UserProvider>
  );
}

export default App;