const checkRole = (rolesPermitidos) => {
    return (req, res, next) => {
        // 1. Capa de seguridad: Asegurarnos de que el verifyToken ya pasó por aquí
        if (!req.user) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }

        // 2. Convertir a array si solo se pasó un string (para mayor flexibilidad)
        const roles = Array.isArray(rolesPermitidos) ? rolesPermitidos : [rolesPermitidos];

        // 3. Verificar si el rol del usuario está dentro de los permitidos
        if (!roles.includes(req.user.rol)) {
            return res.status(403).json({ error: 'Acceso prohibido: Permisos insuficientes' });
        }

        next();
    };
};

module.exports = { checkRole };