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
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Mostrar Imagen</title>
                </head>
                <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #ffffff;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #464646; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
                        <div style="text-align: center; padding: 20px; background-color: #f9af3a; color: #000000; border-radius: 10px;">
                            <h1>¡Cuenta Creada!</h1>
                        </div>
                        <div style="color: #ffffff; padding: 20px; text-align: center;">
                            <p>Hola Bienvenido,</p>
                            <p>Gracias por crear una cuenta con nosotros. Por favor, confirma tu correo electrónico haciendo clic en el botón a continuación:</p>
                            <a href="${process.env.BASE_URL}/api/confirm?token=${token}" style="display: inline-block; padding: 10px 20px; margin: 20px 0; text-align: center; color: #000000; background-color: #f9af3a; text-decoration: none; border-radius: 5px;">Confirmar Correo</a>
                            <p>Si no creaste esta cuenta, puedes ignorar este correo.</p>
                            <p>Gracias</p>
                            <table width="100%" style="margin-top: 20px;">
                                <tr>
                                    <td align="center">
                                        <img src="https://i.imgur.com/bmD0gz4.png" alt="Logo 1" style="width: 20%; max-width: 100px; height: auto; margin-right: 10px;">
                                        <img src="https://i.imgur.com/JAqLNW0.png" alt="Logo 2" style="width: 50%; max-width: 200px; height: auto;">
                                    </td>
                                </tr>
                            </table>
                        </div>
                        <div style="color: #ffffff; text-align: center; padding-top: 20px; background-color: #464646; border-radius: 0 0 10px 10px;">
                            <p>© Copyright El Gran Garibaldi</p>
                        </div>
                    </div>
                </body>
                </html>
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
                    body { font-family: Arial, sans-serif; background-color: #000000; color: #ffffff; text-align: center; padding: 50px; }
                    h1 { color: #000000; background-color: #f9af3a; padding: 3%; border-radius: 15em; }
                    p { font-size: 30px; }
                    a { color: #f9af3a; text-decoration: none; }
                    div { background-color: #000000; }
                    .button {
                        margin: 0;
                        height: auto;
                        background: transparent;
                        padding: 0;
                        border: none;
                        cursor: pointer;
                        --border-right: 6px;
                        --text-stroke-color: rgba(255,255,255,0.6);
                        --animation-color: #f9af3a;
                        --fs-size: 2em;
                        letter-spacing: 3px;
                        text-decoration: none;
                        font-size: var(--fs-size);
                        font-family: "Arial";
                        position: relative;
                        text-transform: uppercase;
                        color: transparent;
                        -webkit-text-stroke: 1px var(--text-stroke-color);
                    }
                    .hover-text {
                        position: absolute;
                        box-sizing: border-box;
                        content: attr(data-text);
                        color: var(--animation-color);
                        width: 0%;
                        inset: 0;
                        border-right: var(--border-right) solid var(--animation-color);
                        overflow-x: auto;
                        white-space: nowrap;
                        transition: 0.5s;
                        -webkit-text-stroke: 1px var(--animation-color);
                        scrollbar-width: none;
                    }
                    .button:hover .hover-text {
                        width: 100%;
                        filter: drop-shadow(0 0 23px var(--animation-color));
                    }
                </style>
            </head>
            <body>
                <h1>¡Cuenta Confirmada!</h1>
                <div class="background-form">
                    <p>Hola ${nombre},</p>
                    <p>Tu cuenta ha sido confirmada con éxito. Ahora puedes disfrutar de todos los beneficios y funcionalidades de nuestra página, haciendo clic en el botón para iniciar sesión.</p>
                    <a href="http://26.253.156.252/login" class="button" data-text="Iniciar Sesión">
                        <span class="actual-text">&nbsp;Iniciar Sesión&nbsp;</span>
                        <span aria-hidden="true" class="hover-text">&nbsp;Iniciar Sesión&nbsp;</span>
                    </a>
                </div>
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

