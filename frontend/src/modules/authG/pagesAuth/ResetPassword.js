// frontend/src/modules/authG/pagesAuth/ResetPassword.js
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Input, Button, Card, Alert } from "../../../Components/UI";
import { userService } from '../../../api';
import "../stylesAuth/Login.css";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({
    show: false,
    type: "",
    message: "",
  });
  const [isValidToken, setIsValidToken] = useState(true);

  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setIsValidToken(false);
      setAlert({
        show: true,
        type: "error",
        message: "Lien de réinitialisation invalide ou expiré.",
      });
    }
  }, [searchParams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (alert.show) {
      setAlert({ show: false, type: "", message: "" });
    }
  };

  const validatePassword = (password) => {
    if (password.length < 8) {
      return "Le mot de passe doit contenir au moins 8 caractères";
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre";
    }
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert({ show: false, type: "", message: "" });

    // Validation
    const passwordError = validatePassword(formData.newPassword);
    if (passwordError) {
      setAlert({
        show: true,
        type: "error",
        message: passwordError,
      });
      setLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setAlert({
        show: true,
        type: "error",
        message: "Les mots de passe ne correspondent pas",
      });
      setLoading(false);
      return;
    }

    try {
      console.log("📤 Réinitialisation du mot de passe avec token:", token.substring(0, 10) + "...");
      
      const response = await userService.confirmPasswordReset(token, formData.newPassword);
      console.log("📨 Réponse API:", response.data);

      if (response.data.success) {
        setAlert({
          show: true,
          type: "success",
          message: "Votre mot de passe a été réinitialisé avec succès ! Redirection vers la connexion...",
        });

        // Redirection après 3 secondes
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        setAlert({
          show: true,
          type: "error",
          message: response.data.message || "La réinitialisation a échoué. Veuillez réessayer.",
        });
      }
    } catch (err) {
      console.error("❌ Erreur réinitialisation:", err);
      
      let errorMessage = "Une erreur est survenue lors de la réinitialisation.";
      
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

  if (!isValidToken) {
    return (
      <div className="auth-container">
        <Card className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Lien invalide</h1>
            <p className="auth-subtitle">
              Le lien de réinitialisation est invalide ou a expiré.
            </p>
          </div>
          <div className="auth-footer">
            <p>
              <span onClick={() => navigate("/forgot-password")} className="auth-link">
                Demander un nouveau lien
              </span>
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <Card className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Nouveau mot de passe</h1>
          <p className="auth-subtitle">Créez un nouveau mot de passe sécurisé</p>
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
            label="Nouveau mot de passe"
            type="password"
            name="newPassword"
            placeholder="Votre nouveau mot de passe"
            value={formData.newPassword}
            onChange={handleChange}
            disabled={loading}
            required
            helpText="Minimum 8 caractères avec majuscule, minuscule et chiffre"
            autoComplete="new-password"
            autoFocus
          />

          <Input
            label="Confirmer le mot de passe"
            type="password"
            name="confirmPassword"
            placeholder="Confirmez votre nouveau mot de passe"
            value={formData.confirmPassword}
            onChange={handleChange}
            disabled={loading}
            required
            autoComplete="new-password"
          />

          <Button
            type="submit"
            variant="primary"
            size="large"
            loading={loading}
            disabled={loading}
            fullWidth
            className="auth-btn"
          >
            {loading ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
          </Button>
        </form>

        <div className="auth-footer">
          <p>
            <span onClick={() => navigate("/login")} className="auth-link">
              ← Retour à la connexion
            </span>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default ResetPassword;