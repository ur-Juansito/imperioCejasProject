// ═══════════════════════════════════════════════════════
// appointmentService.js  →  src/services/appointmentService.js
// ═══════════════════════════════════════════════════════
const pool = require('../config/db');

// Obtener todas las citas con sus relaciones (Servicios, Profesionales, Usuarios)
const getAllAppointments = async () => {
    const [citas] = await pool.query(`
        SELECT c.*, s.nombre as servicio_nombre, p.nombre_completo as profesional_nombre, u.email as cliente_email
        FROM Citas c
        JOIN Servicios s ON c.servicio_id = s.id
        JOIN Profesionales p ON c.profesional_id = p.id
        JOIN Usuarios u ON c.usuario_id = u.id
        ORDER BY c.fecha DESC, c.hora DESC
    `);
    return citas;
};

// Crear una nueva cita
const createAppointment = async (data) => {
    const { servicio_id, profesional_id, fecha, hora } = data;
    const usuario_id = data.usuario_id || 1;

    // Validación básica de campos obligatorios
    if (!servicio_id || !profesional_id || !fecha || !hora) {
        throw new Error('Todos los campos son obligatorios');
    }

    const [result] = await pool.query(
        'INSERT INTO Citas (usuario_id, servicio_id, profesional_id, fecha, hora) VALUES (?, ?, ?, ?, ?)',
        [usuario_id, servicio_id, profesional_id, fecha, hora]
    );

    return {
        appointmentId: result.insertId,
        usuario_id,
        servicio_id,
        profesional_id,
        fecha,
        hora
    };
};

// Eliminar una cita por su ID
const deleteAppointment = async (id) => {
    const [result] = await pool.query('DELETE FROM Citas WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
        throw new Error('La cita no fue encontrada');
    }

    return true;
};

module.exports = {
    getAllAppointments,
    createAppointment,
    deleteAppointment
};