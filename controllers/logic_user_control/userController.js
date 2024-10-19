const db = require('../../config/db'); // Conexión a la base de datos
const argon2 = require('argon2');//Declaracion para el hasheo de contraseñas

//Obtener todos los usuarios
exports.getUsers = async (req, res) => {
    try {
        const [users] = await db.query(`
            SELECT  nombre, email, telefono, rol 
            FROM usuarios 
            WHERE rol IN ('Cocina', 'Caja', 'Bar', 'Mesero', 'Administrador')
        `);
        res.status(200).json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener los usuarios' });
    }
};


//Obtener un usuario por ID 
exports.getUserById = async (req, res) => {
    try {
        const [user] = await db.query('SELECT id_usuario, nombre, email, telefono, rol FROM usuarios WHERE id_usuario = ?', [req.params.id]);
        if (user.length === 0) return res.status(404).send('Usuario no encontrado');
        res.status(200).json(user[0]);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el usuario' });
    }
};

//Crear un nuevo usuario
exports.createUser = async (req, res) => {
    const { nombre, email, telefono, contrasena, rol } = req.body; // Cambié contrasena_encriptada a contrasena para más claridad

    if (!nombre || !email || !telefono || !contrasena || !rol) {
        return res.status(400).send('Todos los campos son obligatorios.');
    }

    try {
        const contrasena_encriptada = await argon2.hash(contrasena);//Hasheo

        const result = await db.query(
            'INSERT INTO usuarios (nombre, email, telefono, contrasena_encriptada, rol, confirmado) VALUES (?, ?, ?, ?, ?, ?)',
            [nombre, email, telefono, contrasena_encriptada, rol, 1]
        );
        
        const newUser = {
            id_usuario: result[0].insertId,
            nombre,
            email,
            telefono,
            rol,
            confirmado : 1
        };

        res.status(201).json(newUser);
    } catch (error) {
        console.error(error); 
        res.status(500).json({ error: 'Error al crear el usuario' });
    }
};

//Eliminar un usuario
exports.deleteUser = async (req, res) => {
    try {
        const result = await db.query('DELETE FROM usuarios WHERE email = ?', [req.params.email]);

        if (result[0].affectedRows === 0) {
            return res.status(404).send('Usuario no encontrado');
        }

        res.status(200).json({ message: 'Usuario eliminado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el usuario' });
    }
};

// Editar usuario
exports.updateUser = async (req, res) => {
    const { email } = req.params; // Usamos email de los parámetros de la URL
    const { nombre, nuevo_email, telefono, rol } = req.body; // nuevo_email para actualizar el email del usuario

    if (!nombre || !nuevo_email || !telefono || !rol) {
        return res.status(400).send('Todos los campos son obligatorios.');
    }

    try {
        const result = await db.query(
            'UPDATE usuarios SET nombre = ?, email = ?, telefono = ?, rol = ? WHERE email = ?',
            [nombre, nuevo_email, telefono, rol, email]
        );

        if (result[0].affectedRows === 0) {
            return res.status(404).send('Usuario no encontrado');
        }

        res.status(200).json({ message: 'Usuario actualizado con éxito' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar el usuario' });
    }
};
