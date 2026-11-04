const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const register = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password || String(password).length < 8) {
      return res.status(400).json({ success: false, message: 'Ingresa un correo y una contraseña de al menos 8 caracteres.' });
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    const [existing] = await pool.query('SELECT id FROM Usuarios WHERE email = ?', [normalizedEmail]);
    if (existing.length) return res.status(409).json({ success: false, message: 'El correo electrónico ya está registrado.' });

    const hashedPassword = await bcrypt.hash(password, 12);
    // El registro público siempre crea CLIENTE. Los roles internos los asigna el administrador.
    const [result] = await pool.query(
      'INSERT INTO Usuarios (email, password, rol) VALUES (?, ?, ?)',
      [normalizedEmail, hashedPassword, 'CLIENTE']
    );
    res.status(201).json({ success: true, message: 'Cuenta creada correctamente.', userId: result.insertId });
  } catch (error) { next(error); }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Correo y contraseña son obligatorios.' });

    const [users] = await pool.query(
      'SELECT id, email, password, rol FROM Usuarios WHERE email = ?',
      [String(email).trim().toLowerCase()]
    );
    if (!users.length || !(await bcrypt.compare(password, users[0].password))) {
      return res.status(401).json({ success: false, message: 'Correo o contraseña incorrectos.' });
    }
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET debe configurarse con al menos 32 caracteres.');
    }

    const user = users[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );
    res.json({
      success: true,
      message: 'Inicio de sesión exitoso.',
      token,
      user: { id: user.id, email: user.email, rol: user.rol }
    });
  } catch (error) { next(error); }
};

module.exports = { register, login };
