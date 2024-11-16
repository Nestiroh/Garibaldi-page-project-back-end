const express = require('express');
const router = express.Router();
const multimediaController = require('../controllers/logic_multimedia/multimediaController');
const { checkAdmin } = require('../middleware/checkAdmin');
const { verifyToken } = require('../middleware/auth')

// Subir nueva imagen (Solo administradores)
router.post('/add-image', verifyToken, checkAdmin, multimediaController.addImage);

// Eliminar imagen por id (Solo administradores)
router.delete('/delete-image/:id_foto', verifyToken, checkAdmin, multimediaController.deleteImage);

// Obtener todas las imágenes activas (para mostrarlas en el frontend)
router.get('/images', verifyToken, checkAdmin, multimediaController.getAllImages);

module.exports = router;

