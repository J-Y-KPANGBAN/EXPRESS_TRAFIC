// backend/utils/logger.js
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};

const timestamp = () => new Date().toISOString();

// ✅ CORRECTION : Export direct sans objet
const logger = {
  info: (msg) => {
    console.log(`${colors.cyan}[INFO] ${timestamp()} › ${msg}${colors.reset}`);
  },

  success: (msg) => {
    console.log(`${colors.green}[SUCCESS] ${timestamp()} › ${msg}${colors.reset}`);
  },

  warning: (msg) => {
    console.warn(`${colors.yellow}[WARNING] ${timestamp()} › ${msg}${colors.reset}`);
  },

  warn: (msg) => {
    console.warn(`${colors.yellow}[WARNING] ${timestamp()} › ${msg}${colors.reset}`);
  },

  error: (msg, error = null) => {
    if (error) {
      console.error(`${colors.red}[ERROR] ${timestamp()} › ${msg}`, error);
    } else {
      console.error(`${colors.red}[ERROR] ${timestamp()} › ${msg}${colors.reset}`);
    }
  }
};

// ✅ EXPORT DIRECT (sans {})
module.exports = logger;