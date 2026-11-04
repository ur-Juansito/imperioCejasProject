const jwt = require('jsonwebtoken');

exports.generateToken = (payload, expiresIn = process.env.JWT_EXPIRES_IN || '8h') => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

exports.verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        throw new Error('Token inválido o expirado');
    }
};