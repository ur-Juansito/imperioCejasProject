// ═══════════════════════════════════════════════════════
// professionalService.js  →  src/services/professionalService.js
// ═══════════════════════════════════════════════════════
const pool = require('../config/db');

// Obtener todos los profesionales que estén activos
const getAllProfessionals = async () => {
    const [professionals] = await pool.query('SELECT * FROM Profesionales WHERE activo = TRUE');
    return professionals;
};

module.exports = {
    getAllProfessionals
};