const pool = require('../config/db');
const getAllProfessionals = async (req, res, next) => {
    try {
        const [professionals] = await pool.query('SELECT * FROM Profesionales WHERE activo = TRUE');
        res.status(200).json({ success: true, data: professionals });
    } catch (error) { next(error); }
};
module.exports = { getAllProfessionals };
