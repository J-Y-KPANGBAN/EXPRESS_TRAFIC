// backend/config/stripe.js
const logger = require("../utils/logger");

if (!process.env.STRIPE_SECRET_KEY) {
  logger.warning("⚠️ STRIPE_SECRET_KEY manquant dans .env (Stripe désactivé)");
}

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY || "");

module.exports = stripe;
