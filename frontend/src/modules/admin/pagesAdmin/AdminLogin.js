import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAdmin } from "../../../Context/AdminContext"; // ← UTILISER AdminContext
import { adminService } from '../../../api';
import { Alert, Button, Input, Card } from "../../../Components/UI";
import '../stylesAdmin/AdminAuth.css';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: "",
    mot_de_passe: "",
    code_admin: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAdmin(); // ← UTILISER useAdmin
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email?.trim() || !formData.mot_de_passe?.trim() || !formData.code_admin?.trim()) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Format d'email invalide");
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("📤 Tentative connexion admin:", { 
        email: formData.email,
        code_admin_present: !!formData.code_admin 
      });

      const response = await adminService.login({
        email: formData.email.trim(),
        mot_de_passe: formData.mot_de_passe,
        code_admin: formData.code_admin
      });

      console.log("✅ Réponse connexion admin:", response.data);

      if (response.data.success) {
        const { user, token } = response.data;

        // ✅ Vérification que c'est bien un admin
        if (user.type_utilisateur !== "admin") {
          setError("❌ Accès réservé aux administrateurs uniquement");
          return;
        }

        // ✅ UTILISER LE ADMINCONTEXT POUR LA CONNEXION
        const loginSuccess = login(user, token);
        
        if (loginSuccess) {
          setError("");
          // La redirection est gérée par le AdminContext
        } else {
          throw new Error("Échec de la connexion dans le contexte admin");
        }
        
      } else {
        throw new Error(response.data.message || "Identifiants administrateur incorrects");
      }
    } catch (err) {
      console.error("❌ Erreur connexion admin détaillée:", err);
      
      const errorMessage = err.response?.data?.message 
        || err.message 
        || "Erreur de connexion. Vérifiez vos identifiants administrateur.";
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-auth-container">
      <Card className="admin-auth-card">
        <div className="admin-auth-header">
          <div className="admin-icon">⚙️</div>
          <h1>Connexion Administrateur</h1>
          <p className="subtitle">Accès réservé au personnel autorisé</p>
        </div>

        {error && (
          <Alert type="error" message={error} />
        )}

        <form onSubmit={handleSubmit} className="admin-auth-form">
          <Input
            label="Email administrateur"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="admin@transport.com"
            required
            disabled={loading}
            autoComplete="username"
          />

          <Input
            label="Mot de passe administrateur"
            type="password"
            name="mot_de_passe"
            value={formData.mot_de_passe}
            onChange={handleChange}
            placeholder="Votre mot de passe admin"
            required
            disabled={loading}
            autoComplete="current-password"
          />

          <Input
            label="Code d'accès administrateur"
            type="password"
            name="code_admin"
            value={formData.code_admin}
            onChange={handleChange}
            placeholder="Code admin sécurisé"
            required
            disabled={loading}
            autoComplete="off"
            helperText="Code requis pour l'accès administrateur"
          />

          <Button
            type="submit"
            variant="primary"
            size="large"
            loading={loading}
            disabled={loading}
            fullwidth="true"
          >
            {loading ? "Connexion..." : "Se connecter en tant qu'admin"}
          </Button>
        </form>

        <div className="admin-auth-footer">
          <p>
            Besoin d'un accès administrateur ?{" "}
            <Link to="/admin/signup" className="admin-link">
              Créer un compte admin
            </Link>
          </p>
          <div className="security-notice">
            <span>🔒</span>
            <span>Page sécurisée - Accès restreint au personnel autorisé</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminLogin;