// frontend/src/modules/authG/pagesAuth/ForgotPassword.js
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Input, Button, Card, Alert } from "../../../Components/UI";
import { userService } from '../../../api';
import "../stylesAuth/Login.css";

const ForgotPassword = () => {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({
    show: false,
    type: "",
    message: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert({ show: false, type: "", message: "" });

    // Validation email
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setAlert({
        show: true,
        type: "error",
        message: "Veuillez entrer une adresse email valide",
      });
      setLoading(false);
      return;
    }

    try {
      console.log("📤 Demande de réinitialisation pour:", email);
      
      const response = await userService.requestPasswordReset(email);
      console.log("📨 Réponse API:", response.data);

      if (response.data.success) {
        setIsSubmitted(true);
        setAlert({
          show: true,
          type: "success",
          message: "Un email de réinitialisation a été envoyé à votre adresse. Vérifiez votre boîte de réception (et vos spams).",
        });
      } else {
        setAlert({
          show: true,
          type: "error",
          message: response.data.message || "Une erreur est survenue. Veuillez réessayer.",
        });
      }
    } catch (err) {
      console.error("❌ Erreur réinitialisation:", err);
      
      let errorMessage = "Une erreur est survenue lors de la demande de réinitialisation.";
      
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
          <h1 className="auth-title">Mot de passe oublié</h1>
          <p className="auth-subtitle">
            {isSubmitted 
              ? "Vérifiez votre email" 
              : "Entrez votre email pour réinitialiser votre mot de passe"}
          </p>
        </div>

        {alert.show && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert({ show: false, type: "", message: "" })}
          />
        )}

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="auth-form">
            <Input
              label="Adresse email"
              type="email"
              name="email"
              placeholder="exemple@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              autoComplete="email"
              autoFocus
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
              {loading ? "Envoi en cours..." : "Réinitialiser le mot de passe"}
            </Button>
          </form>
        ) : (
          <div className="success-message">
            <div className="success-icon">✅</div>
            <p className="success-text">
              Si un compte existe avec cette adresse email, vous recevrez un lien de réinitialisation.
            </p>
            <p className="success-note">
              <small>
                💡 <strong>Conseil :</strong> Vérifiez également votre dossier de courrier indésirable.
              </small>
            </p>
          </div>
        )}

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

export default ForgotPassword;