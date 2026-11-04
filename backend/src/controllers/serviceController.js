const pool = require('../config/db');
const getAllServices = async (req, res, next) => {
    try {
        const [services] = await pool.query('SELECT * FROM Servicios');
        res.status(200).json({ success: true, data: services });
    } catch (error) { next(error); }
};
module.exports = { getAllServices };
