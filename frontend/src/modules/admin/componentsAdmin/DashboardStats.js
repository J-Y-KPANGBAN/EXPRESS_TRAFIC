// frontend/src/modules/admin/componentsAdmin/DashboardStats.js
import React from "react";
import { Card, Grid, Badge } from "../../../Components/UI";

import "../stylesAdmin/AdminSignupForm.css";

const DashboardStats = ({ stats }) => {
  // Sécurisation : si stats est null/undefined → objet vide
  const safeStats = stats || {};

  const utilisateurs = safeStats.kpis?.utilisateurs || {};
  const reservations = safeStats.kpis?.reservations || {};
  const finances = safeStats.kpis?.finances || {};
  const trajets = safeStats.kpis?.trajets || {};
  const topTrajets = safeStats.operationnel?.top_trajets || [];

  // Construire une répartition "par statut" à partir des champs renvoyés
  const reservationsParStatut = [
    { etat_reservation: "confirmées", count: reservations.confirmees || 0 },
    { etat_reservation: "en attente", count: reservations.en_attente || 0 },
    { etat_reservation: "annulées", count: reservations.annulees || 0 },
  ].filter((item) => item.count > 0);

  const statCards = [
    {
      title: "👥 Utilisateurs",
      value: utilisateurs.total ?? 0,
      variant: "info",
      description: "Utilisateurs inscrits",
    },
    {
      title: "🎫 Réservations",
      value: reservations.total ?? 0,
      variant: "success",
      description: "Réservations totales",
    },
    {
      title: "💰 Chiffre d'affaires",
      value: `${finances.chiffre_affaires ?? 0} €`,
      variant: "warning",
      description: "CA sur la période",
    },
    {
      title: "🚌 Trajets à venir",
      value: trajets.a_venir ?? 0,
      variant: "primary",
      description: "Trajets futurs",
    },
  ];

  return (
    <div className="dashboard-stats">
      <div className="section-header">
        <h2>Tableau de Bord</h2>
        <Badge variant="info">Mis à jour maintenant</Badge>
      </div>

      <Grid cols={4} gap="medium">
        {statCards.map((stat, index) => (
          <Card key={index} variant={stat.variant} className="stat-card">
            <div className="stat-content">
              <h3>{stat.title}</h3>
              <p className="stat-value">{stat.value}</p>
              <p className="stat-description">{stat.description}</p>
            </div>
          </Card>
        ))}
      </Grid>

      <div className="stats-charts">
        <Card className="chart-card">
          <h3>📊 Réservations par statut</h3>
          <div className="chart-container">
            {reservationsParStatut.length > 0 ? (
              reservationsParStatut.map((reservation) => (
                <div
                  key={reservation.etat_reservation}
                  className="chart-item"
                >
                  <span className="status-label">
                    {reservation.etat_reservation}
                  </span>
                  <Badge variant="default">{reservation.count}</Badge>
                </div>
              ))
            ) : (
              <p className="no-data">Aucune donnée disponible</p>
            )}
          </div>
        </Card>

        <Card className="chart-card">
          <h3>🚀 Top trajets</h3>
          <div className="chart-container">
            {topTrajets.length > 0 ? (
              topTrajets.map((trajet) => (
                <div key={trajet.id} className="trajet-item">
                  <span className="route">
                    {trajet.ville_depart} → {trajet.ville_arrivee}
                  </span>
                  <Badge variant="info">
                    {trajet.reservations_count || 0} rés.
                  </Badge>
                </div>
              ))
            ) : (
              <p className="no-data">Aucun trajet trouvé</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardStats;
