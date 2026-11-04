const logger = require('../utils/logger');
const response = require('../utils/response');

const errorHandler = (err, req, res, next) => {
    // Usamos el utilitario de logs
    logger.error('Error no controlado capturado por el middleware', err);

    const statusCode = err.statusCode || 500;
    const message = statusCode === 500 ? 'Error interno del servidor' : err.message;

    // Usamos el utilitario de respuestas
    return response.error(res, message, statusCode, err.message);
};

module.exports = { errorHandler };