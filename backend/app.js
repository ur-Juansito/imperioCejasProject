require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const { notFound, errorHandler } = require('./src/middlewares/errorHandler');

const app = express();
// Orígenes permitidos. Se normalizan (sin "/" final) porque el navegador envía el origen sin barra.
const normalizeOrigin = (origin) => String(origin).trim().replace(/\/+$/, '');
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map(normalizeOrigin)
  .filter(Boolean);
// localhost solo en desarrollo (o si se activa explícitamente con ALLOW_LOCALHOST_CORS=true)
const allowLocalhost = process.env.NODE_ENV !== 'production' || process.env.ALLOW_LOCALHOST_CORS === 'true';
const isLocalhost = (origin) => /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (
      !origin ||
      allowedOrigins.includes(normalizeOrigin(origin)) ||
      (allowLocalhost && isLocalhost(origin)) ||
      /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)
    ) {
      return callback(null, true);
    }
    const error = new Error('Origen no autorizado por CORS');
    error.statusCode = 403;
    return callback(error);
  }
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/api/health', (req, res) => res.json({ success: true, message: 'Éclat Studio API activa' }));

const authRoutes = require('./src/routes/authRoutes');
const serviceRoutes = require('./src/routes/serviceRoutes');
const appointmentRoutes = require('./src/routes/appointmentRoutes');
const professionalRoutes = require('./src/routes/professionalRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/professionals', professionalRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
