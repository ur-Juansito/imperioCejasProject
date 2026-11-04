const pool = require('../config/db');

const ACTIVE_STATES = ['PENDIENTE', 'CONFIRMADA'];

const fail = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const dateParts = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date;
};

const bogotaToday = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: process.env.APP_TIMEZONE || 'America/Bogota',
  year: 'numeric', month: '2-digit', day: '2-digit'
}).format(new Date());

const weekdayNumber = (date) => ((date.getUTCDay() + 6) % 7) + 1; // lunes=1 ... domingo=7
const timeToMinutes = (value) => {
  const match = String(value).match(/^(\d{2}):(\d{2})(?::\d{2})?$/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : NaN;
};
const minutesToTime = (minutes) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

const getProfessionalId = async (userId) => {
  const [rows] = await pool.query(
    'SELECT id FROM Profesionales WHERE usuario_id = ? AND activo = TRUE LIMIT 1',
    [userId]
  );
  return rows[0]?.id || null;
};

const getAllAppointments = async (req, res, next) => {
  try {
    const role = req.user.rol;
    let where = '';
    let params = [];

    if (role === 'CLIENTE') {
      where = 'WHERE c.usuario_id = ?';
      params = [req.user.id];
    } else if (role === 'PROFESIONAL') {
      const professionalId = await getProfessionalId(req.user.id);
      if (!professionalId) throw fail('Tu usuario no está vinculado a un perfil profesional. Contacta al administrador.', 403);
      where = 'WHERE c.profesional_id = ?';
      params = [professionalId];
    } else if (role !== 'ADMIN') {
      throw fail('No tienes permiso para consultar las citas', 403);
    }

    const [appointments] = await pool.query(`
      SELECT c.id, c.usuario_id, c.servicio_id, c.profesional_id,
             DATE_FORMAT(c.fecha, '%Y-%m-%d') AS fecha,
             TIME_FORMAT(c.hora, '%H:%i') AS hora,
             c.estado, c.created_at,
             s.nombre AS servicio_nombre, s.precio AS servicio_precio,
             s.duracion_minutos,
             p.nombre_completo AS profesional_nombre,
             u.email AS cliente_email
      FROM Citas c
      JOIN Servicios s ON s.id = c.servicio_id
      JOIN Profesionales p ON p.id = c.profesional_id
      JOIN Usuarios u ON u.id = c.usuario_id
      ${where}
      ORDER BY c.fecha DESC, c.hora DESC
    `, params);

    res.json({ success: true, data: appointments });
  } catch (error) { next(error); }
};

const getAvailability = async (req, res, next) => {
  try {
    const { servicio_id, profesional_id, fecha } = req.query;
    const date = dateParts(fecha);
    if (!servicio_id || !profesional_id || !date) {
      throw fail('Debes indicar servicio, profesional y una fecha válida (AAAA-MM-DD).');
    }
    if (fecha < bogotaToday()) throw fail('No puedes consultar horarios de una fecha pasada.');

    const [services] = await pool.query(
      'SELECT duracion_minutos FROM Servicios WHERE id = ?',
      [servicio_id]
    );
    if (!services.length) throw fail('El servicio seleccionado no existe.', 404);
    const duration = Number(services[0].duracion_minutos || 30);

    const [professionals] = await pool.query(
      'SELECT id FROM Profesionales WHERE id = ? AND activo = TRUE',
      [profesional_id]
    );
    if (!professionals.length) throw fail('El profesional no está disponible.', 404);

    const day = weekdayNumber(date);
    const [schedules] = await pool.query(
      `SELECT TIME_FORMAT(hora_inicio, '%H:%i') AS hora_inicio,
              TIME_FORMAT(hora_fin, '%H:%i') AS hora_fin
       FROM Horarios
       WHERE profesional_id = ? AND dia_semana = ? AND activo = TRUE
       ORDER BY hora_inicio`,
      [profesional_id, day]
    );
    if (!schedules.length) {
      return res.json({ success: true, data: { slots: [], message: 'El profesional no tiene horarios configurados para ese día.' } });
    }

    const [bookings] = await pool.query(
      `SELECT TIME_FORMAT(c.hora, '%H:%i') AS hora, s.duracion_minutos
       FROM Citas c
       JOIN Servicios s ON s.id = c.servicio_id
       WHERE c.profesional_id = ? AND c.fecha = ?
         AND c.estado IN ('PENDIENTE', 'CONFIRMADA')`,
      [profesional_id, fecha]
    );

    const now = new Date();
    const localNow = new Date(now.toLocaleString('en-US', { timeZone: process.env.APP_TIMEZONE || 'America/Bogota' }));
    const isToday = fecha === bogotaToday();
    const currentMinutes = isToday ? localNow.getHours() * 60 + localNow.getMinutes() : -1;

    const slots = [];
    for (const schedule of schedules) {
      const start = timeToMinutes(schedule.hora_inicio);
      const end = timeToMinutes(schedule.hora_fin);
      for (let minute = start; minute + duration <= end; minute += 30) {
        if (isToday && minute <= currentMinutes) continue;
        const overlaps = bookings.some((booking) => {
          const bookedStart = timeToMinutes(booking.hora);
          const bookedEnd = bookedStart + Number(booking.duracion_minutos || 30);
          return minute < bookedEnd && minute + duration > bookedStart;
        });
        if (!overlaps) slots.push(minutesToTime(minute));
      }
    }

    res.json({ success: true, data: { slots: [...new Set(slots)].sort() } });
  } catch (error) { next(error); }
};

const createAppointment = async (req, res, next) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const { servicio_id, profesional_id, fecha, hora } = req.body;
    const date = dateParts(fecha);
    if (!servicio_id || !profesional_id || !date || !/^([01]\d|2[0-3]):[0-5]\d$/.test(String(hora || ''))) {
      throw fail('Selecciona un servicio, profesional, fecha y horario válidos.');
    }
    if (fecha < bogotaToday()) throw fail('No puedes reservar una fecha pasada.');
    if (fecha === bogotaToday()) {
      const now = new Date();
      const localNow = new Date(now.toLocaleString('en-US', { timeZone: process.env.APP_TIMEZONE || 'America/Bogota' }));
      const currentMinutes = localNow.getHours() * 60 + localNow.getMinutes();
      if (timeToMinutes(hora) <= currentMinutes) throw fail('Selecciona una hora futura.');
    }

    await connection.beginTransaction();

    // Serializa las reservas para un mismo profesional y evita dos solicitudes simultáneas.
    const [professionalRows] = await connection.query(
      'SELECT id FROM Profesionales WHERE id = ? AND activo = TRUE FOR UPDATE',
      [profesional_id]
    );
    if (!professionalRows.length) throw fail('El profesional no existe o está inactivo.', 404);

    const [serviceRows] = await connection.query(
      'SELECT id, duracion_minutos FROM Servicios WHERE id = ?',
      [servicio_id]
    );
    if (!serviceRows.length) throw fail('El servicio seleccionado no existe.', 404);
    const duration = Number(serviceRows[0].duracion_minutos || 30);

    const day = weekdayNumber(date);
    const [schedules] = await connection.query(
      `SELECT id FROM Horarios
       WHERE profesional_id = ? AND dia_semana = ? AND activo = TRUE
         AND hora_inicio <= ? AND hora_fin >= ADDTIME(?, SEC_TO_TIME(? * 60))
       LIMIT 1`,
      [profesional_id, day, hora, hora, duration]
    );
    if (!schedules.length) throw fail('Ese horario está fuera de la jornada del profesional.');

    const [conflicts] = await connection.query(
      `SELECT c.id
       FROM Citas c
       JOIN Servicios s ON s.id = c.servicio_id
       WHERE c.profesional_id = ? AND c.fecha = ?
         AND c.estado IN ('PENDIENTE', 'CONFIRMADA')
         AND ADDTIME(c.hora, SEC_TO_TIME(s.duracion_minutos * 60)) > ?
         AND c.hora < ADDTIME(?, SEC_TO_TIME(? * 60))
       LIMIT 1`,
      [profesional_id, fecha, hora, hora, duration]
    );
    if (conflicts.length) throw fail('Ese horario acaba de ser ocupado. Selecciona otro.');

    const [result] = await connection.query(
      `INSERT INTO Citas (usuario_id, servicio_id, profesional_id, fecha, hora, estado)
       VALUES (?, ?, ?, ?, ?, 'PENDIENTE')`,
      [req.user.id, servicio_id, profesional_id, fecha, hora]
    );

    await connection.commit();
    res.status(201).json({
      success: true,
      message: 'Solicitud enviada. Tu cita está pendiente de aprobación profesional.',
      data: { id: result.insertId, estado: 'PENDIENTE' }
    });
  } catch (error) {
    if (connection) {
      try { await connection.rollback(); } catch (_) { /* conexión ya cerrada o transacción no iniciada */ }
    }
    next(error);
  } finally {
    if (connection) connection.release();
  }
};

const changeAppointmentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action } = req.params;
    const user = req.user;
    const [rows] = await pool.query(
      `SELECT c.id, c.estado, c.usuario_id, c.profesional_id, p.usuario_id AS profesional_usuario_id
       FROM Citas c JOIN Profesionales p ON p.id = c.profesional_id
       WHERE c.id = ?`,
      [id]
    );
    if (!rows.length) throw fail('La cita no existe.', 404);
    const appointment = rows[0];

    let nextState;
    if (action === 'confirmar' || action === 'confirm') {
      if (!['ADMIN', 'PROFESIONAL'].includes(user.rol)) throw fail('Sólo un profesional puede aprobar citas.', 403);
      if (user.rol === 'PROFESIONAL' && Number(appointment.profesional_usuario_id) !== Number(user.id)) {
        throw fail('No puedes aprobar citas de otro profesional.', 403);
      }
      if (appointment.estado !== 'PENDIENTE') throw fail('Sólo se pueden aprobar citas pendientes.');
      nextState = 'CONFIRMADA';
    } else if (action === 'rechazar' || action === 'reject') {
      if (!['ADMIN', 'PROFESIONAL'].includes(user.rol)) throw fail('Sólo un profesional puede rechazar solicitudes.', 403);
      if (user.rol === 'PROFESIONAL' && Number(appointment.profesional_usuario_id) !== Number(user.id)) {
        throw fail('No puedes rechazar citas de otro profesional.', 403);
      }
      if (appointment.estado !== 'PENDIENTE') throw fail('Sólo se pueden rechazar citas pendientes.');
      nextState = 'CANCELADA';
    } else if (action === 'cancelar' || action === 'cancel') {
      if (user.rol === 'CLIENTE' && Number(appointment.usuario_id) !== Number(user.id)) {
        throw fail('No puedes cancelar una cita que no te pertenece.', 403);
      }
      if (!['CLIENTE', 'PROFESIONAL', 'ADMIN'].includes(user.rol)) throw fail('No tienes permiso para cancelar citas.', 403);
      if (!ACTIVE_STATES.includes(appointment.estado)) throw fail('Esta cita ya no se puede cancelar.');
      if (user.rol === 'PROFESIONAL' && Number(appointment.profesional_usuario_id) !== Number(user.id)) {
        throw fail('No puedes cancelar citas de otro profesional.', 403);
      }
      nextState = 'CANCELADA';
    } else if (action === 'atendida' || action === 'complete') {
      if (!['ADMIN', 'PROFESIONAL'].includes(user.rol)) throw fail('Sólo un profesional puede finalizar una cita.', 403);
      if (user.rol === 'PROFESIONAL' && Number(appointment.profesional_usuario_id) !== Number(user.id)) {
        throw fail('No puedes finalizar citas de otro profesional.', 403);
      }
      if (appointment.estado !== 'CONFIRMADA') throw fail('Sólo se pueden marcar como atendidas las citas confirmadas.');
      nextState = 'COMPLETADA';
    } else {
      throw fail('Acción de cita no válida.');
    }

    await pool.query('UPDATE Citas SET estado = ? WHERE id = ?', [nextState, id]);
    res.json({ success: true, message: `Estado de la cita actualizado: ${nextState}`, data: { id: Number(id), estado: nextState } });
  } catch (error) { next(error); }
};

module.exports = { getAllAppointments, getAvailability, createAppointment, changeAppointmentStatus };
