// ═══════════════════════════════════════════════════════
// authService.js  →  src/services/authService.js
// ═══════════════════════════════════════════════════════
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db'); // Tu conexión a MySQL

// Servicio de Registro
exports.register = async (data) => {
    // 1. Verificar si el usuario ya existe por su email
    const [existing] = await pool.query('SELECT * FROM Usuarios WHERE email = ?', [data.email]);
    if (existing.length > 0) {
        throw new Error('El correo electrónico ya está registrado');
    }

    // 2. Encriptar la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    // 3. Insertar el nuevo usuario en la base de datos
    const [result] = await pool.query(
        'INSERT INTO Usuarios (email, password, rol) VALUES (?, ?, ?)',
        [data.email, hashedPassword, data.rol || 'CLIENTE']
    );

    return {
        userId: result.insertId,
        email: data.email,
        rol: data.rol || 'CLIENTE'
    };
};

// Servicio de Login
exports.login = async (email, password) => {
    // 1. Buscar el usuario por email
    const [users] = await pool.query('SELECT * FROM Usuarios WHERE email = ?', [email]);
    if (users.length === 0) {
        throw new Error('Credenciales inválidas');
    }

    const user = users[0];

    // 2. Validar la contraseña
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
        throw new Error('Credenciales inválidas');
    }

    // 3. Generar el Token JWT
    const token = jwt.sign(
        { 
            id: user.id, 
            email: user.email, 
            rol: user.rol 
        },
        process.env.JWT_SECRET || 'secreto_super_seguro',
        { 
            expiresIn: process.env.JWT_EXPIRES_IN || '8h' 
        }
    );

    // 4. Retornar el token y los datos del usuario (sin contraseña)
    return {
        token,
        user: {
            id: user.id,
            email: user.email,
            rol: user.rol,
        }
    };
};