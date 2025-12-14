// backend/config/security.js
const helmet = require('helmet');
const cors = require('cors');

exports.securityMiddleware = [
  // Headers de sécurité
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"]
      }
    },
    crossOriginEmbedderPolicy: false
  }),

  // CORS configuré
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }),

  // Protection contre les attaques
  express.json({ limit: '10mb' }),
  express.urlencoded({ extended: true, limit: '10mb' })
];