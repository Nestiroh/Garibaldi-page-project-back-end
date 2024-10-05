const express = require('express');
const router = express.Router();
const logRegController = require('../login_and_register/log-reg');

// Ruta para el registro
router.post('/register', logRegController.registerUser);

// Ruta para el login
router.post('/login', logRegController.loginUser);

module.exports = router;
