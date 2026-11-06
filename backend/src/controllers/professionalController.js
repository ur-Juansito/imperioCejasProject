const pool = require('../config/db');

// Lista pública de profesionales (no se expone usuario_id).
const getAllProfessionals = async (req, res, next) => {
    try {
        const [professionals] = await pool.query(
            'SELECT id, nombre_completo, especialidad FROM Profesionales ORDER BY nombre_completo'
        );
        res.status(200).json({ success: true, data: professionals });
    } catch (error) { next(error); }
};

module.exports = { getAllProfessionals };
