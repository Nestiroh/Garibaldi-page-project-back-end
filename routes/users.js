const express = require('express');
const router = express.Router();
const userController = require('../logic_user_control/userController');

// Ruta para obtener todos los usuarios
router.get('/show-users', userController.getUsers);

// Ruta para obtener un usuario por ID
router.get('/show-users/:id', userController.getUserById);

// Ruta para crear un nuevo usuario
router.post('/create-user', userController.createUser);

// Ruta para eliminar un usuario
router.delete('/delete-user/:id', userController.deleteUser);

module.exports = router;
