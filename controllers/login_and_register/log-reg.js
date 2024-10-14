const db = require('../../config/db'); 
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const secretKey = process.env.JWT_SECRET;
const transporter = require('../../config/email'); 

// Registro de un nuevo usuario (con confirmación por correo)
exports.registerUser = async (req, res) => {
    const { nombre, email, telefono, contrasena } = req.body;

    if (!nombre || !email || !telefono || !contrasena) {
        return res.status(400).send('Todos los campos son obligatorios.');
    }

    try {
        // Hashear la contraseña
        const contrasena_encriptada = await argon2.hash(contrasena);

        // Generar token de confirmación (sin crear la cuenta aún)
        const token = jwt.sign(
            { nombre, email, telefono, contrasena_encriptada },
            secretKey,
            { expiresIn: '1d' } // El token expira en 1 día
        );

        // Enviar correo de confirmación
        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: email,
            subject: 'Confirma tu cuenta en Garibaldi',
            html: `
                <h1>Bienvenido a Garibaldi</h1>
                <p>Haz clic en el enlace para confirmar tu cuenta:</p>
                <a href="${process.env.BASE_URL}/api/confirm?token=${token}">Confirmar cuenta</a>
            `
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: 'Correo de confirmación enviado. Por favor, revisa tu correo electrónico.' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error al registrar el usuario.' });
    }
};

// Confirmar la cuenta de usuario
exports.confirmUser = async (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).json({ error: 'Token de confirmación no proporcionado.' });
    }

    try {
        // Verificar el token
        const decoded = jwt.verify(token, secretKey);
        const { nombre, email, telefono, contrasena_encriptada } = decoded;

        // Crear el usuario en la base de datos
        const query = `
            INSERT INTO usuarios (nombre, email, telefono, contrasena_encriptada, confirmado)
            VALUES (?, ?, ?, ?, 1)
        `;
        const result = await db.query(query, [nombre, email, telefono, contrasena_encriptada]);
        const htmlResponse = `
            <html>
                <head>
                    <title>Cuenta Confirmada</title>
                    <style>
                        body { font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333; text-align: center; padding: 50px; }
                        h1 { color: #4CAF50; }
                        p { font-size: 18px; }
                        a { color: #4CAF50; text-decoration: none; }
                    </style>
                </head>
                <body>
                    <h1>¡Cuenta Confirmada!</h1>
                    <p>Hola ${nombre},</p>
                    <p>Tu cuenta ha sido confirmada con éxito. Ahora puedes iniciar sesión.</p>
                    <p><a href="http://26.25.146.33/login">Iniciar sesión</a></p>
                </body>
            </html>
        `;
        res.status(200).send(htmlResponse);
        
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error al confirmar la cuenta.' });
    }
};

// Login de usuario (Luego de validar que se confirmo la cuenta)
exports.loginUser = async (req, res) => {
    const { email, contrasena } = req.body;

    try {
        const [user] = await db.query('SELECT id_usuario, nombre, email, telefono, contrasena_encriptada, rol, confirmado FROM usuarios WHERE email = ?', [email]);

        if (user.length === 0) return res.status(401).json({ error: 'Credenciales incorrectas' });

        // Verificar si la cuenta está confirmada
        if (!user[0].confirmado) {
            return res.status(403).json({ error: 'Debes confirmar tu cuenta antes de iniciar sesión.' });
        }

        const validPassword = await argon2.verify(user[0].contrasena_encriptada, contrasena);
        if (!validPassword) return res.status(401).json({ error: 'Credenciales incorrectas' });

        // Generar el token JWT
        const token = jwt.sign(
            { id_usuario: user[0].id_usuario, email: user[0].email, rol: user[0].rol },
            secretKey,
            { expiresIn: '1h' } // Tiempo de expiración del token
        );

        
        res.status(200).json({ token, rol: user[0].rol });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
};

