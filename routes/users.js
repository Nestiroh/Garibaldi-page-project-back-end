const express = require('express');
const router = express.Router();
const userController = require('../controllers/logic_user_control/userController');
const { verifyToken } = require('../middleware/auth')
const { checkAdmin } = require('../middleware/checkAdmin');

// Ruta para obtener todos los usuarios
router.get('/show-users', verifyToken, checkAdmin, userController.getUsers);

// Ruta para obtener un usuario por ID
router.get('/show-users/:id', verifyToken, checkAdmin, userController.getUserById);

// Ruta para crear un nuevo usuario
router.post('/create-user', verifyToken, userController.createUser);

// Ruta para eliminar usuario por email
router.delete('/delete-user/:email', verifyToken, checkAdmin, userController.deleteUser);

//Ruta para editar un usuario
router.put('/update-user/:email', verifyToken, checkAdmin, userController.updateUser);

module.exports = router;
