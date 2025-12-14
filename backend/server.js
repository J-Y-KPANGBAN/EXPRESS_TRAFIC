// C:\Users\Jean-YvesDG\Downloads\ExpressTrafic\backend\server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const logger = require("./utils/logger");
const path = require('path');
const app = express();

// Nettoyage automatique des réservations expirées
require('./services/reservationCleanupService');
// ============================================
// 🌍 1. CORS SÉCURISÉ - DOIT ÊTRE EN PREMIER !
// ============================================
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  "https://checkout.stripe.com",
];

const corsOptions = {
  origin: function (origin, callback) {
    // Autoriser les requêtes sans origine (comme Postman, curl) en développement
    if (!origin && process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // Vérifier si l'origine est dans la liste autorisée
    if (allowedOrigins.includes(origin) || !origin) {
      return callback(null, true);
    }
    
    logger.warn("⛔ ORIGIN REFUSÉ: " + origin);
    return callback(new Error("CORS non autorisé"), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-CSRF-Token', 
    'X-Requested-With',
    'X-Content-Type-Options',
    'X-Frame-Options',
    'X-XSS-Protection'
  ],
  optionsSuccessStatus: 200
};

// Appliquer CORS
app.use(cors(corsOptions));

// ============================================
// 🧩 2. MIDDLEWARE GLOBAUX
// ============================================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Logger des requêtes
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// Sécurité
const { securityHeaders } = require("./middleware/securityMiddleware");
app.use(securityHeaders);

// Sanitization
const { sanitizeInput } = require("./middleware/sanitize");
app.use(sanitizeInput);

// ============================================
// 📁 3. SERVIR FICHIERS STATIQUES
// ============================================
app.use('/tickets', express.static(path.join(__dirname, 'tickets')));
app.use('/invoices', express.static(path.join(__dirname, 'invoices')));

// ============================================
// 🚦 4. MONTER LES ROUTES
// ============================================
logger.info("Chargement des routes...");

// Routes publiques
const publicRoutes = require('./routes/public/publicIndex');
// Routes admin
const adminRoutes = require('./routes/admin/adminIndex');

// Monter les routes
app.use('/api', publicRoutes); // Routes publiques sous /api
app.use('/api/admin', adminRoutes); // Routes admin sous /api/admin

logger.success("Toutes les routes chargées avec succès");

// ============================================
// 🔧 5. ROUTES DE TEST
// ============================================
app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "🚀 API Transport Platform fonctionne parfaitement !",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    service: "Transport Platform API",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// 🧪 ROUTES DE TEST SERVICES
// ============================================
app.get("/api/test-sms-fr", async (req, res) => {
  try {
    const smsService = require("./services/smsService");
    
    const result = await smsService.sendSMS(
      "+33749714572",
      "🎫 Test ExpressTrafic - Service SMS fonctionne ! " + new Date().toLocaleTimeString('fr-FR')
    );
    
    res.json({ 
      success: true, 
      message: "Test SMS vers France lancé",
      votre_numero: "+33749714572",
      result 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// 🐛 ROUTES DE DÉBOGAGE POUR LE DÉVELOPPEMENT
// ============================================

// ✅ Route de test d'inscription
app.post("/api/debug/signup-test", async (req, res) => {
  try {
    console.log('🧪 TEST SIGNUP - Données reçues:', req.body);
    
    // Simuler une réponse réussie
    res.json({
      success: true,
      message: 'Test signup réussi - Route fonctionne',
      receivedData: req.body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erreur test signup:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur test signup',
      error: error.message
    });
  }
});

// ✅ Route de test email unique
app.get("/api/debug/email", async (req, res) => {
  try {
    const emailService = require("./services/emailService");
    
    const result = await emailService.sendMail(
      "kpangbanyvr@gmail.com",
      "🎉 Test Email ExpressTrafic - " + new Date().toLocaleString('fr-FR'),
      `
        <div style="font-family: Arial; padding: 20px; background: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
            <h1 style="color: #2c5aa0;">✅ Test Email Réussi!</h1>
            <p><strong>Date:</strong> ${new Date().toLocaleString('fr-FR')}</p>
            <p><strong>Service:</strong> ${process.env.MAIL_HOST || process.env.EMAIL_HOST}</p>
            <p><strong>Utilisateur:</strong> ${process.env.MAIL_USER || process.env.EMAIL_USER}</p>
            <hr>
            <p>Si vous recevez cet email, votre configuration SMTP est opérationnelle.</p>
          </div>
        </div>
      `
    );
    
    res.json({
      success: true,
      message: "Test email envoyé",
      config: {
        host: process.env.MAIL_HOST || process.env.EMAIL_HOST,
        user: process.env.MAIL_USER || process.env.EMAIL_USER,
        port: process.env.MAIL_PORT || process.env.EMAIL_PORT
      },
      result: {
        messageId: result.messageId,
        response: result.response
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      note: "L'application continue de fonctionner sans email"
    });
  }
});

// ✅ Route de test complète d'inscription
app.post("/api/debug/full-signup-test", async (req, res) => {
  try {
    console.log('🧪 FULL SIGNUP TEST - Données:', req.body);
    
    // Simuler le processus complet d'inscription
    const {
      nom, prenom, email, mot_de_passe, telephone, 
      ville, adresse_postale, date_naissance, country
    } = req.body;

    // Validation basique
    const required = ['nom', 'prenom', 'email', 'mot_de_passe', 'telephone', 'ville', 'adresse_postale', 'date_naissance', 'country'];
    const missing = required.filter(field => !req.body[field]);

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Champs manquants: ${missing.join(', ')}`
      });
    }

    // Simuler succès
    res.json({
      success: true,
      message: 'Test d\'inscription complet réussi',
      data: {
        userId: Math.floor(Math.random() * 1000),
        email: email,
        type_utilisateur: 'client'
      },
      debug: {
        date_received: date_naissance,
        date_formatted: date_naissance.includes('/') ? 
          (() => {
            const [day, month, year] = date_naissance.split('/');
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          })() : date_naissance
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur test inscription',
      error: error.message
    });
  }
});

// ✅ Route de debug Twilio
app.get("/api/debug/twilio", async (req, res) => {
  try {
    const smsService = require("./services/smsService");
    const result = await smsService.sendSMS(
      "+33749714572",
      "🔧 Debug Twilio - " + new Date().toLocaleString('fr-FR')
    );
    
    res.json({
      success: true,
      message: "Test Twilio avec numéro français",
      config: {
        twilioPhone: process.env.TWILIO_PHONE,
        hasConfig: !!process.env.TWILIO_SID
      },
      result
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ❌ 6. GESTIONNAIRE 404
// ============================================
app.use((req, res) => {
  logger.error(`Route non trouvée: ${req.method} ${req.originalUrl}`);
  return res.status(404).json({
    success: false,
    message: "Route non trouvée",
    path: req.originalUrl,
  });
});

// ============================================
// 💥 7. GESTIONNAIRE D'ERREURS GLOBAL
// ============================================
app.use((err, req, res, next) => {
  const status = err.status || 500;
  logger.error("🔥 Erreur globale détectée:");
  logger.error(err);

  return res.status(status).json({
    success: false,
    message: err.message || "Erreur interne du serveur",
    error: process.env.NODE_ENV === "development" ? err : undefined,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// ============================================
// 🚀 8. LANCEMENT DU SERVEUR
// ============================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.success(`Serveur démarré sur port ${PORT}`);
  logger.info(`Frontend: ${process.env.FRONTEND_URL || "http://localhost:3000"}`);
  logger.info(`Mode: ${process.env.NODE_ENV || 'development'}`);
});