const db = require('../config/db'); // Conexión a la base de datos
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET;

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

    try {
        // Buscar al usuario por email
        const [user] = await db.query('SELECT id_usuario, nombre, email, telefono, contrasena_encriptada, rol FROM usuarios WHERE email = ?', [email]);

        if (user.length === 0) return res.status(401).json({ error: 'Credenciales incorrectas' });

        // Verificar la contraseña
        const validPassword = await argon2.verify(user[0].contrasena_encriptada, contrasena);
        if (!validPassword) return res.status(401).json({ error: 'Credenciales incorrectas' });

        // Generar el token JWT
        const token = jwt.sign(
            { id_usuario: user[0].id_usuario, email: user[0].email, rol: user[0].rol },
            secretKey,
            { expiresIn: '1h' } // TIEMPO DE EXPIRACION DEL TOKEN
        );

        res.status(200).json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
};
