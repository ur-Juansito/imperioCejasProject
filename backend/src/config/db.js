const mysql = require('mysql2/promise');

// 1. Definir el pool de conexiones primero
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false // Necesario para la conexión segura en Aiven
  }
});

// 2. Exportar la variable después de ser declarada
module.exports = pool;