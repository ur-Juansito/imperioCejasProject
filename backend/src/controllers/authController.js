const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+()\-\s]{7,20}$/;

const fail = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const signToken = (user) => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET debe configurarse con al menos 32 caracteres.');
  }
  return jwt.sign(
    { id: user.id, email: user.email, rol: user.rol },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
};

// Nombre para mostrar en la interfaz (Clientes / Profesionales). Si falla, usa el correo.
const displayName = async (executor, user) => {
  try {
    const table = user.rol === 'CLIENTE' ? 'Clientes' : user.rol === 'PROFESIONAL' ? 'Profesionales' : null;
    if (!table) return user.email.split('@')[0];
    const [rows] = await executor.query(`SELECT nombre_completo FROM ${table} WHERE usuario_id = ? LIMIT 1`, [user.id]);
    return rows[0]?.nombre_completo || user.email.split('@')[0];
  } catch (_) {
    return user.email.split('@')[0];
  }
};

const publicUser = async (executor, user) => ({
  id: user.id,
  email: user.email,
  rol: user.rol,
  nombre: await displayName(executor, user)
});

/**
 * POST /api/auth/register
 * Registro público: SIEMPRE crea un CLIENTE (Usuarios + Clientes en una transacción).
 * Los roles ADMIN / PROFESIONAL se asignan con `npm run create-user` o desde la base de datos.
 */
const register = async (req, res, next) => {
  let connection;
  try {
    const { email, password, nombre_completo, telefono } = req.body;

    const normalizedEmail = String(email || '').trim().toLowerCase();
    const name = String(nombre_completo || '').trim();
    const phone = String(telefono || '').trim();

    if (name.length < 2) throw fail('Ingresa tu nombre completo.');
    if (!EMAIL_RE.test(normalizedEmail) || normalizedEmail.length > 100) throw fail('Ingresa un correo electrónico válido.');
    if (phone && !PHONE_RE.test(phone)) throw fail('El teléfono solo puede contener números, espacios, + y guiones.');
    if (typeof password !== 'string' || password.length < 8) throw fail('La contraseña debe tener al menos 8 caracteres.');
    if (password.length > 72) throw fail('La contraseña no puede superar los 72 caracteres.');

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [existing] = await connection.query('SELECT id FROM Usuarios WHERE email = ?', [normalizedEmail]);
    if (existing.length) throw fail('El correo electrónico ya está registrado.', 409);

    const hashedPassword = await bcrypt.hash(password, 12);
    const [result] = await connection.query(
      'INSERT INTO Usuarios (email, password, rol) VALUES (?, ?, ?)',
      [normalizedEmail, hashedPassword, 'CLIENTE']
    );
    await connection.query(
      'INSERT INTO Clientes (usuario_id, nombre_completo, telefono) VALUES (?, ?, ?)',
      [result.insertId, name, phone || null]
    );
    await connection.commit();

    const user = { id: result.insertId, email: normalizedEmail, rol: 'CLIENTE' };
    res.status(201).json({
      success: true,
      message: 'Cuenta creada correctamente.',
      token: signToken(user),            // el usuario queda con la sesión iniciada
      user: { ...user, nombre: name }
    });
  } catch (error) {
    if (connection) { try { await connection.rollback(); } catch (_) { /* sin transacción activa */ } }
    // Carrera: dos registros simultáneos con el mismo correo (índice UNIQUE)
    if (error.code === 'ER_DUP_ENTRY') return next(fail('El correo electrónico ya está registrado.', 409));
    next(error);
  } finally {
    if (connection) connection.release();
  }
};

/** POST /api/auth/login */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw fail('Correo y contraseña son obligatorios.');

    const [users] = await pool.query(
      'SELECT id, email, password, rol FROM Usuarios WHERE email = ?',
      [String(email).trim().toLowerCase()]
    );
    const user = users[0];
    // bcrypt.compare devuelve false si el hash guardado no es un hash bcrypt válido
    // (por ejemplo, los hashes de "ejemplo" del script SQL inicial).
    if (!user || !(await bcrypt.compare(String(password), user.password))) {
      throw fail('Correo o contraseña incorrectos.', 401);
    }

    res.json({
      success: true,
      message: 'Inicio de sesión exitoso.',
      token: signToken(user),
      user: await publicUser(pool, user)
    });
  } catch (error) { next(error); }
};

module.exports = { register, login };
