const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const fail = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const listUsers = async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT u.id, u.email, u.rol, u.fecha_registro,
             COALESCE(cl.nombre_completo, p.nombre_completo, u.email) AS nombre,
             COALESCE(cl.telefono, '') AS telefono,
             p.especialidad
      FROM Usuarios u
      LEFT JOIN Clientes cl ON cl.usuario_id = u.id
      LEFT JOIN Profesionales p ON p.usuario_id = u.id
      ORDER BY u.fecha_registro DESC, u.id DESC
    `);
    res.json({ success: true, data: rows });
  } catch (error) { next(error); }
};

const createProfessional = async (req, res, next) => {
  let connection;
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const nombre = String(req.body.nombre_completo || '').trim();
    const especialidad = String(req.body.especialidad || '').trim();
    const password = req.body.password;

    if (nombre.length < 2 || nombre.length > 150) throw fail('Ingresa un nombre válido.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 100) throw fail('Ingresa un correo válido.');
    if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
      throw fail('La contraseña debe tener entre 8 y 72 caracteres.');
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [existing] = await connection.query('SELECT id FROM Usuarios WHERE email = ?', [email]);
    if (existing.length) throw fail('Ya existe una cuenta con ese correo.', 409);

    const hash = await bcrypt.hash(password, 12);
    const [userResult] = await connection.query(
      'INSERT INTO Usuarios (email, password, rol) VALUES (?, ?, "PROFESIONAL")',
      [email, hash]
    );
    const [professionalResult] = await connection.query(
      'INSERT INTO Profesionales (usuario_id, nombre_completo, especialidad) VALUES (?, ?, ?)',
      [userResult.insertId, nombre, especialidad || null]
    );

    await connection.commit();
    res.status(201).json({
      success: true,
      message: 'Profesional creado correctamente.',
      data: {
        usuario_id: userResult.insertId,
        profesional_id: professionalResult.insertId,
        email,
        nombre_completo: nombre,
        especialidad
      }
    });
  } catch (error) {
    if (connection) {
      try { await connection.rollback(); } catch (_) {}
    }
    if (error.code === 'ER_DUP_ENTRY') return next(fail('Ya existe una cuenta con ese correo.', 409));
    next(error);
  } finally {
    if (connection) connection.release();
  }
};

const deleteUser = async (req, res, next) => {
  let connection;
  try {
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId) || userId < 1) throw fail('Identificador de usuario inválido.');
    if (userId === Number(req.user.id)) throw fail('No puedes eliminar tu propia cuenta administrativa.', 403);

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [users] = await connection.query('SELECT id, rol FROM Usuarios WHERE id = ? FOR UPDATE', [userId]);
    if (!users.length) throw fail('El usuario no existe.', 404);

    if (users[0].rol === 'ADMIN') {
      const [[{ total }]] = await connection.query('SELECT COUNT(*) AS total FROM Usuarios WHERE rol = "ADMIN"');
      if (Number(total) <= 1) throw fail('No puedes eliminar el último administrador del sistema.', 409);
    }

    // Se eliminan primero los registros dependientes que no tienen ON DELETE CASCADE.
    const [clientRows] = await connection.query('SELECT id FROM Clientes WHERE usuario_id = ?', [userId]);
    const [professionalRows] = await connection.query('SELECT id FROM Profesionales WHERE usuario_id = ?', [userId]);
    const clientIds = clientRows.map(row => row.id);
    const professionalIds = professionalRows.map(row => row.id);

    if (clientIds.length) {
      await connection.query(`DELETE FROM Resenas WHERE cliente_id IN (${clientIds.map(() => '?').join(',')})`, clientIds);
      await connection.query(`DELETE FROM Citas WHERE cliente_id IN (${clientIds.map(() => '?').join(',')})`, clientIds);
    }
    if (professionalIds.length) {
      await connection.query(`DELETE FROM Resenas WHERE profesional_id IN (${professionalIds.map(() => '?').join(',')})`, professionalIds);
      await connection.query(`DELETE FROM Citas WHERE profesional_id IN (${professionalIds.map(() => '?').join(',')})`, professionalIds);
    }

    await connection.query('DELETE FROM Usuarios WHERE id = ?', [userId]);
    await connection.commit();
    res.json({ success: true, message: 'Usuario y sus registros asociados eliminados correctamente.' });
  } catch (error) {
    if (connection) {
      try { await connection.rollback(); } catch (_) {}
    }
    next(error);
  } finally {
    if (connection) connection.release();
  }
};


const listProfessionalsStatus = async (req,res,next) => {
  try {
    const [rows] = await pool.query(`SELECT p.id,p.nombre_completo,p.especialidad,
      COALESCE(p.disponible,1) AS disponible,
      COALESCE(p.estado_servicio,'DISPONIBLE') AS estado_servicio,
      u.email
      FROM Profesionales p LEFT JOIN Usuarios u ON u.id=p.usuario_id
      ORDER BY p.nombre_completo`);
    res.json({success:true,data:rows});
  } catch(error){next(error);}
};
const updateProfessionalAvailability = async(req,res,next) => {
  try {
    const id=Number(req.params.id);
    if(!Number.isInteger(id)||id<1) throw fail('Profesional inválido.');
    const disponible=req.body.disponible?1:0;
    const estado=['DISPONIBLE','ATENDIENDO','NO_DISPONIBLE'].includes(req.body.estado_servicio)
      ? req.body.estado_servicio : (disponible?'DISPONIBLE':'NO_DISPONIBLE');
    const [result]=await pool.query('UPDATE Profesionales SET disponible=?,estado_servicio=? WHERE id=?',[disponible,estado,id]);
    if(!result.affectedRows) throw fail('Profesional no encontrado.',404);
    res.json({success:true,message:'Estado del profesional actualizado.'});
  } catch(error){next(error);}
};
module.exports = { listUsers, createProfessional, deleteUser, listProfessionalsStatus, updateProfessionalAvailability };

