exports.success = (res, message, data = null, statusCode = 200) => {
    const response = {
        success: true,
        message
    };
    
    if (data !== null) {
        response.data = data;
    }

    return res.status(statusCode).json(response);
};

exports.error = (res, message, statusCode = 500, details = null) => {
    const response = {
        success: false,
        error: message
    };

    // Solo enviamos los detalles del error en entorno de desarrollo
    if (details && process.env.NODE_ENV === 'development') {
        response.details = details;
    }

    return res.status(statusCode).json(response);
};