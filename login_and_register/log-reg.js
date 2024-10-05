const db = require('../config/db'); // Conexión a la base de datos
const argon2 = require('argon2');

// Registro de un nuevo usuario
exports.registerUser = async (req, res) => {
    const { nombre, email, telefono, contrasena } = req.body;

    if (!nombre || !email || !telefono || !contrasena) {
        return res.status(400).send('Todos los campos son obligatorios.');
    }

    try {
        // Hashear la contraseña
        const contrasena_encriptada = await argon2.hash(contrasena);

        const query = `
            INSERT INTO usuarios (nombre, email, telefono, contrasena_encriptada)
            VALUES (?, ?, ?, ?)
        `;

        const result = await db.query(query, [nombre, email, telefono, contrasena_encriptada]);

        res.status(201).json({
            id_usuario: result[0].insertId,
            nombre,
            email,
            telefono,
            rol: 'default'
        });
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error al registrar el usuario' });
    }
};

// Login de usuario
exports.loginUser = async (req, res) => {
    const { email, contrasena } = req.body;
    if (!email || !contrasena) {
        return res.status(400).send('Email y contraseña son obligatorios.');
    }

    try {
        // Busqueda de usuario por email
        const query = `SELECT id_usuario, nombre, email, telefono, contrasena_encriptada, rol FROM usuarios WHERE email = ?`;
        const [user] = await db.query(query, [email]);
        if (user.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const usuario = user[0];

        // Verificacion de contrasena
        const contrasenaValida = await argon2.verify(usuario.contrasena_encriptada, contrasena);
        if (!contrasenaValida) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        res.status(200).json({
            id_usuario: usuario.id_usuario,
            nombre: usuario.nombre,
            email: usuario.email,
            telefono: usuario.telefono,
            rol: usuario.rol
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
};
