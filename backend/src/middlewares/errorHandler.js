const logger = require('../utils/logger');
const response = require('../utils/response');

// Middleware para rutas no encontradas (404)
const notFound = (req, res, next) => {
    const error = new Error(`Ruta no encontrada - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

// Middleware general de manejo de errores
const errorHandler = (err, req, res, next) => {
    // Usamos el utilitario de logs
    logger.error('Error no controlado capturado por el middleware', err);

    const statusCode = err.statusCode || 500;
    const message = statusCode === 500 ? 'Error interno del servidor' : err.message;

    // Usamos el utilitario de respuestas
    return response.error(res, message, statusCode, err.message);
};

module.exports = {
    notFound,
    errorHandler
};