// ═══════════════════════════════════════════════════════
// serviceService.js  →  src/services/serviceService.js
// ═══════════════════════════════════════════════════════
const pool = require('../config/db');

// Obtener todos los servicios disponibles
const getAllServices = async () => {
    const [services] = await pool.query('SELECT * FROM Servicios');
    return services;
};

module.exports = {
    getAllServices
};