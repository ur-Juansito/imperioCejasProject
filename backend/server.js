require('dotenv').config();
const http = require('http');
const app = require('./app');
const pool = require('./src/config/db');

const PORT = Number(process.env.PORT || 4000);
const httpServer = http.createServer(app);

async function startServer() {
  try {
    const connection = await pool.getConnection();
    console.log('Conexión con MySQL establecida.');
    connection.release();

    const server = httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`Imperio de las Cejas API escuchando en el puerto ${PORT}`);
    });

    const shutdown = async () => {
      console.log('Cerrando servidor...');
      server.close(async () => {
        await pool.end();
        process.exit(0);
      });
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('No se pudo iniciar el servidor o conectar con MySQL:', error.message);
    process.exit(1);
  }
}

startServer();
