// ═══════════════════════════════════════════════════════
// authController.js  →  src/controllers/authController.js
// ═══════════════════════════════════════════════════════
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Registrar un nuevo usuario
const register = async (req, res, next) => {
    try {
        const { email, password, rol } = req.body;

        // 1. Verificar si el usuario ya existe en la base de datos
        const [existingUser] = await pool.query('SELECT * FROM Usuarios WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'El correo electrónico ya está registrado' 
            });
        }

        // 2. Encriptar la contraseña de forma segura
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Insertar el nuevo usuario
        const [result] = await pool.query(
            'INSERT INTO Usuarios (email, password, rol) VALUES (?, ?, ?)',
            [email, hashedPassword, rol || 'CLIENTE']
        );

        return res.status(201).json({ 
            success: true, 
            message: 'Usuario registrado exitosamente', 
            userId: result.insertId 
        });

    } catch (error) {
        next(error);
    }
};

// Iniciar sesión
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // 1. Buscar el usuario por su email
        const [users] = await pool.query('SELECT * FROM Usuarios WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Credenciales inválidas' 
            });
        }

        const user = users[0];

        // 2. Validar la contraseña
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ 
                success: false, 
                message: 'Credenciales inválidas' 
            });
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

        // 4. Responder con el token y los datos del usuario (excluyendo el password)
        return res.status(200).json({ 
            success: true, 
            message: 'Inicio de sesión exitoso', 
            token, 
            user: { 
                id: user.id, 
                email: user.email, 
                rol: user.rol 
            } 
        });

    } catch (error) {
        next(error);
    }
};

module.exports = { 
    register, 
    login 
};