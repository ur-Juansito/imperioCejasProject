const { verifyToken: decodeToken } = require('../utils/jwt');
const response = require('../utils/response');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return response.error(res, 'Debes iniciar sesión para continuar', 401);
  }

  try {
    req.user = decodeToken(authHeader.slice(7));
    next();
  } catch (error) {
    return response.error(res, 'La sesión es inválida o ha expirado', 401);
  }
};

module.exports = { verifyToken: authMiddleware };
