const response = require('../utils/response');

const checkRole = (rolesPermitidos) => {
    return (req, res, next) => {
        // 1. Capa de seguridad: Asegurarnos de que el verifyToken ya pasó por aquí
        if (!req.user) {
            return response.error(res, 'Usuario no autenticado', 401);
        }

        // 2. Convertir a array si solo se pasó un string (para mayor flexibilidad)
        const roles = Array.isArray(rolesPermitidos) ? rolesPermitidos : [rolesPermitidos];

        // 3. Verificar si el rol del usuario está dentro de los permitidos
        if (!roles.includes(req.user.rol)) {
            return response.error(res, 'Acceso prohibido: permisos insuficientes', 403);
        }

        next();
    };
};

module.exports = { checkRole };
