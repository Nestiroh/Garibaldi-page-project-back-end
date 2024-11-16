const express = require('express');
const router = express.Router();
const logRegController = require('../controllers/login_and_register/log-reg');

// Ruta para el registro
router.post('/register', logRegController.registerUser);

//Ruta para confirmar el registro
router.get('/confirm', logRegController.confirmUser);

// Ruta para el login
router.post('/login', logRegController.loginUser);

module.exports = router;
