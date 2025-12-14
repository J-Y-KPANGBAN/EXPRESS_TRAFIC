// frontend/src/modules/authG/pagesAuth/Login.js - VERSION CORRIGÉE
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input, Button, Card, Alert } from "../../../Components/UI";
import { userService } from '../../../api';
import { useUser } from "../../../Context/UserContext";
import "../stylesAuth/Login.css";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useUser();

  const [formData, setFormData] = useState({
    email: "",
    mot_de_passe: "",
  });

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({
    show: false,
    type: "",
    message: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (alert.show) {
      setAlert({ show: false, type: "", message: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert({ show: false, type: "", message: "" });

    try {
      console.log("📤 Tentative de connexion avec:", formData.email);
      
      const response = await userService.login(formData);
      console.log("📨 RÉPONSE API LOGIN COMPLÈTE:", response);

      let userData, token;

      if (response.data) {
        userData = response.data.user;
        token = response.data.token;
      } else if (response.user) {
        userData = response.user;
        token = response.token;
      } else {
        throw new Error("Structure de réponse API invalide");
      }

      console.log("👤 Données utilisateur extraites:", userData);
      console.log("🔑 Token extrait - Longueur:", token?.length);

      if (userData && token) {
        const completeUserData = {
          ...userData,
          telephone: userData.telephone || "",
          numero_client: userData.numero_client || `CLT-${userData.id}`,
          type_utilisateur: userData.type_utilisateur || "client"
        };

        console.log("✅ Données utilisateur complètes:", completeUserData);

        const loginSuccess = login(completeUserData, token, "/profile");
        
        if (loginSuccess) {
          setAlert({
            show: true,
            type: "success",
            message: "Connexion réussie ! Redirection...",
          });
        } else {
          throw new Error("Échec de la connexion dans le contexte");
        }
      } else {
        throw new Error("Données utilisateur ou token manquants");
      }
      
    } catch (err) {
      console.error("❌ Erreur détaillée login:", err);
      
      let errorMessage = "Email ou mot de passe incorrect.";
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setAlert({
        show: true,
        type: "error",
        message: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <Card className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Connexion</h1>
          <p className="auth-subtitle">Accédez à votre espace personnel</p>
        </div>

        {alert.show && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert({ show: false, type: "", message: "" })}
          />
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <Input
            label="Adresse email"
            type="email"
            name="email"
            placeholder="exemple@email.com"
            value={formData.email}
            onChange={handleChange}
            disabled={loading}
            required
            autoComplete="email"
          />

          <Input
            label="Mot de passe"
            type="password"
            name="mot_de_passe"
            placeholder="Votre mot de passe"
            value={formData.mot_de_passe}
            onChange={handleChange}
            disabled={loading}
            required
            autoComplete="current-password"
          />

          {/* ✅ AJOUT DU LIEN "MOT DE PASSE OUBLIÉ" */}
          <div className="forgot-password-link">
            <button 
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="forgot-password-btn"
              disabled={loading}
            >
              Mot de passe oublié ?
            </button>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="large"
            loading={loading}
            disabled={loading}
            fullWidth
            className="auth-btn"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </Button>
        </form>

        <div className="auth-footer">
          <p>
            Pas encore de compte ?{" "}
            <span onClick={() => navigate("/signup")} className="auth-link">
              Créer un compte
            </span>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Login;