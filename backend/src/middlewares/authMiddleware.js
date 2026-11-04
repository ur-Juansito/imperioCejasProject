const { verifyToken } = require('../utils/jwt');
const response = require('../utils/response');

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return response.error(res, 'No hay token o el formato es inválido (usa Bearer)', 401);
    }

    const token = authHeader.split(' ')[1];

    try {
        // Usamos la utilidad de JWT
        const decoded = verifyToken(token);
        req.user = decoded; 
        next();
    } catch (err) {
        return response.error(res, err.message, 403);
    }
};

module.exports = { verifyToken: authMiddleware };