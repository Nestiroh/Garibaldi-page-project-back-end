const mysql = require('mysql2');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();


// Crear conexion de base de datos obivoo
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

// Exportar la conexión para usarla en otros archivos
module.exports = pool.promise(); 
