// backend/middleware/security/index.js
const requireEmailVerified = require('./requireEmailVerified');
const antiBruteForce = require('./antiBruteForce');

module.exports = {
  requireEmailVerified,
  antiBruteForce
};