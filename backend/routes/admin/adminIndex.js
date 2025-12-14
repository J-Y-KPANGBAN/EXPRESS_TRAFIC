// backend/routes/admin/adminIndex.js - VERSION CORRIGÉE
const express = require("express");
const router = express.Router();
const { auth, requireAdmin } = require("../../middleware/auth");

// Import des routes SÉCURISÉES
const adminAuthRoutes = require("./adminAuthRoutes");
const adminAvisRoutes = require("./adminAvisRoutes");
const adminBusRoutes = require("./adminBusRoutes");
const adminChauffeursRoutes = require("./adminChauffeursRoutes");
const adminContactsRoutes = require("./adminContactsRoutes");
const adminDashboardRoutes = require("./adminDashboardRoutes");
const adminNotificationsRoutes = require("./adminNotificationsRoutes");
const adminPaiementsRoutes = require("./adminPaiementsRoutes");
const adminReductionsRoutes = require("./adminReductionsRoutes");
const adminReportsRoutes = require("./adminReportsRoutes");
const adminReservationsRoutes = require("./adminReservationsRoutes");
const adminServiceFeesRoutes = require("./adminServiceFeesRoutes");
const adminSystemRoutes = require("./adminSystemRoutes");
const adminTrajetsRoutes = require("./adminTrajetsRoutes");
const adminUserRoutes = require("./adminUserRoutes");
const adminArretsRoutes = require("./adminArretsRoutes");
const adminDocumentsRoutes = require("./adminDocumentsRoutes");
const adminSocietesRoutes = require("./adminSocietesRoutes");

// 🟢 ROUTES PUBLIQUES ADMIN (login/signup) - SANS PROTECTION
router.use("/auth", adminAuthRoutes);

// 🔴 PROTECTION GLOBALE POUR TOUTES LES AUTRES ROUTES ADMIN
router.use(auth, requireAdmin);

// 🛡️ MONTAGE DES ROUTES AVEC VÉRIFICATION
const routes = [
  // { path: "/auth", router: adminAuthRoutes }, // ← SUPPRIMÉ (déjà monté au-dessus)
  { path: "/avis", router: adminAvisRoutes },
  { path: "/bus", router: adminBusRoutes },
  { path: "/chauffeurs", router: adminChauffeursRoutes },
  { path: "/contacts", router: adminContactsRoutes },
  { path: "/dashboard", router: adminDashboardRoutes },
  { path: "/notifications", router: adminNotificationsRoutes },
  { path: "/paiements", router: adminPaiementsRoutes },
  { path: "/reductions", router: adminReductionsRoutes },
  { path: "/reports", router: adminReportsRoutes },
  { path: "/reservations", router: adminReservationsRoutes },
  { path: "/service-fees", router: adminServiceFeesRoutes },
  { path: "/system", router: adminSystemRoutes },
  { path: "/trajets", router: adminTrajetsRoutes },
  { path: "/users", router: adminUserRoutes },
  { path: "/arrets", router: adminArretsRoutes },
  { path: "/documents", router: adminDocumentsRoutes },
  { path: "/societes", router: adminSocietesRoutes }
];

// 🔒 MONTAGE DYNAMIQUE AVEC GESTION D'ERREURS
routes.forEach(({ path, router }) => {
  try {
    router.use((err, req, res, next) => {
      console.error(`❌ Erreur dans la route admin ${path}:`, err);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur admin",
        code: "ADMIN_ROUTE_ERROR"
      });
    });
    
    router.use((req, res, next) => {
      // Log des accès admin
      console.log(`🔐 Accès admin à ${req.method} ${path}${req.path} - User: ${req.user.id}`);
      next();
    });
    
    router.use((req, res, next) => {
      // Headers de sécurité pour toutes les réponses admin
      res.setHeader('X-Admin-Access', 'true');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      next();
    });
    
    router.use(path, router);
  } catch (error) {
    console.error(`❌ Erreur montage route admin ${path}:`, error);
  }
});

// 🏥 ROUTE DE SANTÉ ADMIN SÉCURISÉE
router.get("/health", (req, res) => {
  const healthCheck = {
    success: true,
    message: "API Admin opérationnelle et sécurisée",
    timestamp: new Date().toISOString(),
    version: "2.1.0",
    admin: {
      id: req.user.id,
      role: req.user.role,
      permissions: req.user.permissions || []
    },
    system: {
      node: process.version,
      platform: process.platform,
      uptime: process.uptime()
    }
  };

  // 🔒 Masquer les informations sensibles en production
  if (process.env.NODE_ENV === 'production') {
    delete healthCheck.system;
    delete healthCheck.admin.permissions;
  }

  res.json(healthCheck);
});

// 🔒 MIDDLEWARE DE GESTION DES ROUTES NON TROUVÉES
router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route admin non trouvée",
    code: "ADMIN_ROUTE_NOT_FOUND",
    available_routes: routes.map(r => r.path)
  });
});

// 🔒 MIDDLEWARE DE GESTION D'ERREURS GLOBAL
router.use((err, req, res, next) => {
  console.error("❌ Erreur globale admin:", err);
  
  // Ne pas exposer les détails d'erreur en production
  const errorResponse = {
    success: false,
    message: "Erreur interne du serveur admin",
    code: "ADMIN_INTERNAL_ERROR"
  };

  if (process.env.NODE_ENV === 'development') {
    errorResponse.error = err.message;
    errorResponse.stack = err.stack;
  }

  res.status(500).json(errorResponse);
});

module.exports = router;