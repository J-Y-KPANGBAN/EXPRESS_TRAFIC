import React, { useState, useEffect } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";

// 🔥 UTILISER useAdmin POUR LES ADMINS
import { useAdmin } from "../../../Context/AdminContext"; // ← NOUVEAU CONTEXTE ADMIN
import { adminService } from '../../../api';
import { Card, Grid, Loader, Sidebar, Navbar, Alert } from "../../../Components/UI";

// Composants Admin
import DashboardStats from "../componentsAdmin/DashboardStats";
import TrajetManagement from "../componentsAdmin/TrajetManagement";
import ReservationManagement from "../componentsAdmin/ReservationManagement";
import BusManagement from "../componentsAdmin/BusManagement";
import UserManagement from "../componentsAdmin/UserManagement";
import AvisManagement from "../componentsAdmin/AvisManagement";
import ContactManagement from "../componentsAdmin/ContactManagement";
import SystemSettings from "../componentsAdmin/SystemSettings";
import FinancialReports from "../componentsAdmin/FinancialReports";
import SocieteManagement from "../componentsAdmin/SocieteManagement";
import ChauffeurManagement from "../componentsAdmin/ChauffeurManagement";

// Styles
import '../stylesAdmin/AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  
  // 🔥 UTILISER LE CONTEXTE ADMIN
  const { admin, logout } = useAdmin();

  const menuItems = [
    { path: "/admin", icon: "📊", label: "Tableau de Bord", component: DashboardStats },
    { path: "/admin/trajets", icon: "🚌", label: "Gestion Trajets", component: TrajetManagement },
    { path: "/admin/reservations", icon: "🎫", label: "Réservations", component: ReservationManagement },
    { path: "/admin/bus", icon: "🚍", label: "Flotte Bus", component: BusManagement },
    { path: "/admin/utilisateurs", icon: "👥", label: "Utilisateurs", component: UserManagement },
    { path: "/admin/avis", icon: "⭐", label: "Avis Clients", component: AvisManagement },
    { path: "/admin/contacts", icon: "📧", label: "Messages", component: ContactManagement },
    { path: "/admin/finances", icon: "💰", label: "Rapports Financiers", component: FinancialReports },
    { path: "/admin/parametres", icon: "⚙️", label: "Paramètres", component: SystemSettings }
  ];

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await adminService.getDashboardStats();
      setStats(response.data.data);
    } catch (err) {
      console.error("Erreur chargement dashboard:", err);
      setError("Erreur lors du chargement des statistiques");
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPageTitle = () => {
    const currentItem = menuItems.find(item => 
      location.pathname === item.path || location.pathname.startsWith(item.path + '/')
    );
    return currentItem ? currentItem.label : "Tableau de Bord";
  };

  if (loading && !stats) {
    return (
      <div className="admin-dashboard-loading">
        <Loader size="large" text="Chargement du dashboard..." />
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Sidebar Navigation */}
      <Sidebar 
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        items={menuItems}
        currentPath={location.pathname}
        onNavigate={(path) => navigate(path)}
        onLogout={logout} // ← DÉCONNEXION ADMIN
      />

      {/* Main Content */}
      <div className={`admin-main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        
        {/* Top Navigation Bar */}
        <Navbar 
          title={getCurrentPageTitle()}
          userInfo={{
            name: admin ? `${admin.prenom} ${admin.nom}` : "Administrateur",
            role: "Admin",
            email: admin?.email
          }}
          onRefresh={fetchDashboardStats}
        />

        {/* Error Display */}
        {error && (
          <Alert type="error" message={error} onClose={() => setError(null)} />
        )}

        {/* Dashboard Content */}
        <div className="dashboard-content">
          <Routes>
            <Route path="/" element={<DashboardStats stats={stats} />} />
            <Route path="/trajets" element={<TrajetManagement />} />
            <Route path="/trajets/*" element={<TrajetManagement />} />
            <Route path="/reservations" element={<ReservationManagement />} />
            <Route path="/bus" element={<BusManagement />} />
            <Route path="/utilisateurs" element={<UserManagement />} />
            <Route path="/avis" element={<AvisManagement />} />
            <Route path="/contacts" element={<ContactManagement />} />
            <Route path="/finances" element={<FinancialReports />} />
            <Route path="/parametres" element={<SystemSettings />} />
          </Routes>
        </div>

        {/* Quick Stats Footer */}
        {stats && location.pathname === "/admin" && (
  <div className="dashboard-footer">
    <Grid cols={4} gap="small">
      <Card variant="outline" className="footer-stat">
        <div className="footer-stat-content">
          <span className="stat-label">Clients actifs (30j)</span>
          <span className="stat-value">
            {stats.kpis?.utilisateurs?.actifs_30j ?? 0}
          </span>
        </div>
      </Card>
      <Card variant="outline" className="footer-stat">
        <div className="footer-stat-content">
          <span className="stat-label">Réservations aujourd'hui</span>
          <span className="stat-value">
            {stats.kpis?.reservations?.aujourdhui ?? 0}
          </span>
        </div>
      </Card>
      <Card variant="outline" className="footer-stat">
        <div className="footer-stat-content">
          <span className="stat-label">CA du jour</span>
          <span className="stat-value">
            {stats.kpis?.finances?.ca_aujourdhui ?? 0} €
          </span>
        </div>
      </Card>
      <Card variant="outline" className="footer-stat">
        <div className="footer-stat-content">
          <span className="stat-label">Chauffeurs actifs</span>
          <span className="stat-value">
            {stats.operationnel?.performance_chauffeurs?.length ?? 0}
          </span>
        </div>
      </Card>
    </Grid>
  </div>
)}

      </div>
    </div>
  );
};

export default AdminDashboard;