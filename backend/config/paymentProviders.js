//backend/config/paymentProviders.js
//config tous les paiements


module.exports = {
    stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
    },
    paypal: {
        clientId: process.env.PAYPAL_CLIENT_ID,
        clientSecret: process.env.PAYPAL_CLIENT_SECRET,
        environment: process.env.PAYPAL_ENVIRONMENT
    },
    mobileMoney: {
        // Configuration pour Orange Money, MTN Mobile Money, etc.
        apiKey: process.env.MOBILE_MONEY_API_KEY,
        provider: process.env.MOBILE_MONEY_PROVIDER
    }
};