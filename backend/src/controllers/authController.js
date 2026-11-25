const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const emailService = require('../services/emailService');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+()\-\s]{7,20}$/;

// Almacén en memoria de códigos de recuperación temporales (expiran en 15 minutos)
const recoveryStore = new Map();

// Limpieza periódica de códigos expirados cada 10 minutos
setInterval(() => {
  const now = Date.now();
  for (const [email, record] of recoveryStore.entries()) {
    if (record.expiresAt < now) {
      recoveryStore.delete(email);
    }
  }
}, 10 * 60 * 1000).unref();

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

    const normalizedEmail = String(email).trim().toLowerCase();
    const [users] = await pool.query(
      'SELECT id, email, password, rol FROM Usuarios WHERE email = ?',
      [normalizedEmail]
    );
    const user = users[0];
    // bcrypt.compare devuelve false si el hash guardado no es un hash bcrypt válido
    // (por ejemplo, los hashes de "ejemplo" del script SQL inicial).
    if (!user || !(await bcrypt.compare(String(password), user.password))) {
      throw fail('Correo o contraseña incorrectos.', 401);
    }

    // Si el usuario que inicia sesión es un trabajador (rol PROFESIONAL),
    // se notifica de inmediato al administrador por correo electrónico.
    if (user.rol === 'PROFESIONAL') {
      (async () => {
        try {
          const [admins] = await pool.query("SELECT email FROM Usuarios WHERE rol = 'ADMIN'");
          const adminEmails = admins.map((a) => a.email);
          const workerName = await displayName(pool, user);
          const rawIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
          const ipAddress = Array.isArray(rawIp) ? rawIp[0] : String(rawIp).split(',')[0].trim();
          const userAgent = req.headers['user-agent'] || 'Navegador web';

          await emailService.sendWorkerLoginNotification({
            adminEmails,
            workerName,
            workerEmail: user.email,
            workerRole: user.rol,
            loginTime: new Date(),
            ipAddress,
            userAgent
          });
        } catch (mailErr) {
          console.error('[authController] Error al notificar inicio de sesión del trabajador:', mailErr.message);
        }
      })();
    }

    res.json({
      success: true,
      message: 'Inicio de sesión exitoso.',
      token: signToken(user),
      user: await publicUser(pool, user)
    });
  } catch (error) { next(error); }
};

/**
 * POST /api/auth/forgot-password
 * Comprueba que el correo exista y genera un código de recuperación enviado por correo.
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail || !EMAIL_RE.test(normalizedEmail)) {
      throw fail('Ingresa un correo electrónico válido.');
    }

    const [users] = await pool.query(
      'SELECT id, email, rol FROM Usuarios WHERE email = ?',
      [normalizedEmail]
    );

    if (!users.length) {
      throw fail('No existe ninguna cuenta registrada con este correo electrónico.', 404);
    }

    const user = users[0];
    const userName = await displayName(pool, user);

    // Generar código numérico de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutos

    recoveryStore.set(normalizedEmail, { code, expiresAt, attempts: 0 });

    // Enviar código por correo electrónico
    await emailService.sendPasswordRecoveryCode({
      email: normalizedEmail,
      code,
      userName
    });

    const isDevOrNoSmtp = process.env.NODE_ENV !== 'production' || !process.env.SMTP_HOST;

    res.json({
      success: true,
      message: 'Hemos comprobado tu correo. Te enviamos un código de verificación de 6 dígitos.',
      email: normalizedEmail,
      // Se incluye el código solo si no hay SMTP configurado para facilitar pruebas inmediatas
      ...(isDevOrNoSmtp ? { devCode: code } : {})
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/verify-code
 * Valida si el código de 6 dígitos es correcto antes de cambiar la contraseña.
 */
const verifyRecoveryCode = async (req, res, next) => {
  try {
    const { email, code } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const cleanCode = String(code || '').trim();

    const record = recoveryStore.get(normalizedEmail);
    if (!record || Date.now() > record.expiresAt) {
      throw fail('El código ha expirado o no ha sido solicitado. Solicita uno nuevo.', 400);
    }

    if (record.code !== cleanCode) {
      record.attempts = (record.attempts || 0) + 1;
      if (record.attempts >= 5) {
        recoveryStore.delete(normalizedEmail);
        throw fail('Demasiados intentos fallidos. Solicita un nuevo código.', 429);
      }
      throw fail('El código de verificación es incorrecto.', 400);
    }

    res.json({
      success: true,
      message: 'Código verificado correctamente.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/reset-password
 * Restablece la contraseña del usuario comprobando el correo y el código.
 */
const resetPassword = async (req, res, next) => {
  try {
    const { email, code, newPassword } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const cleanCode = String(code || '').trim();

    if (!normalizedEmail || !cleanCode || !newPassword) {
      throw fail('El correo, código y la nueva contraseña son obligatorios.');
    }

    const record = recoveryStore.get(normalizedEmail);
    if (!record || Date.now() > record.expiresAt) {
      throw fail('El código de recuperación ha expirado o no es válido. Solicita uno nuevo.', 400);
    }

    if (record.code !== cleanCode) {
      record.attempts = (record.attempts || 0) + 1;
      if (record.attempts >= 5) {
        recoveryStore.delete(normalizedEmail);
        throw fail('Demasiados intentos fallidos. Solicita un nuevo código.', 429);
      }
      throw fail('El código de verificación es incorrecto.', 400);
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      throw fail('La nueva contraseña debe tener al menos 8 caracteres.');
    }
    if (newPassword.length > 72) {
      throw fail('La contraseña no puede superar los 72 caracteres.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const [result] = await pool.query(
      'UPDATE Usuarios SET password = ? WHERE email = ?',
      [hashedPassword, normalizedEmail]
    );

    if (result.affectedRows === 0) {
      throw fail('No se encontró el usuario para actualizar la contraseña.', 404);
    }

    // Limpiar el código usado
    recoveryStore.delete(normalizedEmail);

    res.json({
      success: true,
      message: 'Tu contraseña ha sido restablecida correctamente. Ya puedes iniciar sesión.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  verifyRecoveryCode,
  resetPassword
};
