const db = require('../config/db'); // Conexión a la base de datos

// Lógica para crear un comentario
exports.createComment = async (req, res) => {
    const { titulo, calificacion, comentario } = req.body;

    // El id_usuario se extrae del token decodificado
    const id_usuario = req.user.id_usuario;

    // Validar que todos los campos requeridos estén presentes
    if (!titulo || !calificacion || !comentario) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    // Validar que la calificación esté entre 1 y 5
    if (calificacion < 1 || calificacion > 5) {
        return res.status(400).json({ error: 'La calificación debe estar entre 1 y 5.' });
    }

    try {
        const query = `
            INSERT INTO comentarios (id_usuario, titulo, calificacion, comentario)
            VALUES (?, ?, ?, ?)
        `;
        await db.query(query, [id_usuario, titulo, calificacion, comentario]);

        res.status(201).json({ message: 'Comentario creado exitosamente.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear el comentario' });
    }
};


// Lógica para listar comentarios
exports.listComments = async (req, res) => {
    const { estado } = req.query; // Estado 

    // Selección de columnas específicas para usuarios normales
    let query = 'SELECT calificacion, titulo, comentario, fecha_comentario FROM comentarios WHERE estado = ?'; 
    let params = ['Aprobado']; // Por defecto, los usuarios normales ven solo los aprobados

    // Si el usuario es administrador, puede ver todos los comentarios o filtrarlos por estado
    if (req.user.rol === 'Administrador') {
        if (estado) {
            query = `
                SELECT id_comentario, id_usuario, titulo, calificacion, comentario, fecha_comentario, estado 
                FROM comentarios WHERE estado = ?`; // Selección completa de campos para administradores que filtran por estado
            params = [estado];
        } else {
            query = `
                SELECT id_comentario, id_usuario, titulo, calificacion, comentario, fecha_comentario, estado 
                FROM comentarios`; // Selección completa de campos para administradores que ven todos los comentarios
            params = [];
        }
    }

    try {
        const [comments] = await db.query(query, params);
        res.status(200).json(comments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al listar los comentarios' });
    }
};



// Lógica para aprobar o rechazar un comentario
exports.changeCommentStatus = async (req, res) => {
    const { id_comentario } = req.params;
    const { estado } = req.body; // Estado: 'Aprobado' o 'Rechazado'

    if (!['Aprobado', 'Rechazado'].includes(estado)) {
        return res.status(400).json({ error: 'Estado inválido.' });
    }

    try {
        const query = `
            UPDATE comentarios SET estado = ? WHERE id_comentario = ?
        `;
        await db.query(query, [estado, id_comentario]);

        res.status(200).json({ message: 'Estado del comentario actualizado exitosamente.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar el estado del comentario' });
    }
};
