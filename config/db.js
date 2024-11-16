const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config();

// Crear conexion de base de datos
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10, // Límite de conexiones
    queueLimit: 0,       // Sin límite de cola
    connectTimeout: 10000 // Tiempo de espera para conexión en ms (10 segundos)
});

// Exportar la conexión para usarla en otros archivos
module.exports = pool.promise(); 
