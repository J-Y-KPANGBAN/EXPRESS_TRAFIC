import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./PaiementTransitionPage.css";

export default function PaiementTransitionPage() {
  const { id } = useParams();   // 🔥 correction ici
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => {
      navigate(`/paiement/${id}`);
    }, 3000);
  }, [navigate, id]);

  return (
    <div className="transition-wrapper">
      <div className="transition-card">
        <h2>🎉 Réservation effectuée !</h2>
        <p className="text">
          Veuillez patienter... Nous vous redirigeons vers la page de paiement.
        </p>

        <div className="loader"></div>
      </div>
    </div>
  );
}
