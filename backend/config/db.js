// backend/config/db.js
const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "transport_platform",
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  timezone: 'Z',

  // Strong stability
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  acquireTimeout: 60000
});

// Test connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error("❌ MySQL connection error:", err.message);
  } else {
    console.log("✅ MySQL connected successfully");
    connection.release();
  }
});

// Auto-reconnect protection
pool.on("error", (err) => {
  console.error("❌ MySQL pool error:", err.code);

  if (err.code === "PROTOCOL_CONNECTION_LOST") {
    console.log("🔁 Reconnecting MySQL...");
  } else {
    throw err;
  }
});

module.exports = pool.promise();
