const express = require('express');
const router = express.Router();
const commentController = require('../logic_comments/comments');
const { checkAdmin } = require('../middleware/checkAdmin');
const { verifyToken } = require('../middleware/auth')

// Ruta para crear un comentario (solo usuarios registrados)
router.post('/comments', verifyToken, commentController.createComment);

// Ruta para listar comentarios
router.get('/comments', verifyToken, commentController.listComments);

// Ruta para cambiar el estado de un comentario (solo administradores)
router.patch('/comments/:id_comentario', verifyToken, checkAdmin, commentController.changeCommentStatus);

module.exports = router;
