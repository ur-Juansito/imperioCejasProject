const pool = require('../config/db');

const getAllAppointments = async (req, res, next) => {
    try {
        const [citas] = await pool.query(`
            SELECT c.*, s.nombre as servicio_nombre, p.nombre_completo as profesional_nombre, u.email as cliente_email
            FROM Citas c
            JOIN Servicios s ON c.servicio_id = s.id
            JOIN Profesionales p ON c.profesional_id = p.id
            JOIN Usuarios u ON c.usuario_id = u.id
            ORDER BY c.fecha DESC, c.hora DESC
        `);
        res.status(200).json({ success: true, data: citas });
    } catch (error) { next(error); }
};

const createAppointment = async (req, res, next) => {
    try {
        const { servicio_id, profesional_id, fecha, hora } = req.body;
        const usuario_id = req.body.usuario_id || 1;
        if (!servicio_id || !profesional_id || !fecha || !hora) {
            return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
        }
        const [result] = await pool.query(
            'INSERT INTO Citas (usuario_id, servicio_id, profesional_id, fecha, hora) VALUES (?, ?, ?, ?, ?)',
            [usuario_id, servicio_id, profesional_id, fecha, hora]
        );
        res.status(201).json({ success: true, message: 'Cita agendada', appointmentId: result.insertId });
    } catch (error) { next(error); }
};

const deleteAppointment = async (req, res, next) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM Citas WHERE id = ?', [id]);
        res.status(200).json({ success: true, message: 'Cita eliminada' });
    } catch (error) { next(error); }
};

module.exports = { getAllAppointments, createAppointment, updateAppointment: (req,res)=>res.json({success:true}), deleteAppointment };
