require('dotenv').config();
const http = require('http'); 
const app = require('./app');
const pool = require('./src/config/db'); // El pool con mysql2/promise

const PORT = process.env.PORT || 4000;

// 1. Crea el servidor HTTP usando la app de Express
const httpServer = http.createServer(app); 

// Función asíncrona para arrancar todo en orden
async function startServer() {
    try {
        // 2. Verificar la conexión a MySQL usando Promesas (Evita que se congele)
        const connection = await pool.getConnection();
        console.log("✅ Conectado exitosamente a la Base de Datos MySQL (Aiven)");
        connection.release(); // Libera la conexión de prueba

        // 3. Levantar el servidor HTTP (Con '0.0.0.0' para el escáner de Render)
        const server = httpServer.listen(PORT, '0.0.0.0', () => {
            console.log(`Servidor ejecutándose en modo: ${process.env.NODE_ENV || 'development'}`);
            console.log(`API REST escuchando en el puerto: ${PORT}`);
        });

        // 4. Manejo de cierre limpio del proceso
        process.on('SIGINT', async () => {
            console.log('\nCerrando servidor de forma limpia...');
            try {
                await pool.end();
                console.log('💾 Pool de conexiones de MySQL cerrado.');
            } catch (dbErr) {
                console.error('Error al cerrar el pool de MySQL:', dbErr.message);
            }

            server.close(() => {
                console.log('🛑 Servidor HTTP cerrado. Proceso terminado.');
                process.exit(0);
            });
        });

    } catch (err) {
        console.error("❌ ERROR CRÍTICO: No se pudo conectar a la base de datos MySQL en Aiven.");
        console.error("Detalles:", err.message);
        process.exit(1); // Detiene la app si falla la conexión inicial
    }
}

// Arranca la inicialización
startServer();