const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/logic_reservations/reservationController');
const { checkAdmin } = require('../middleware/checkAdmin');
const { verifyToken } = require('../middleware/auth');

// Ruta para crear una reserva
router.post('/reservations', verifyToken, reservationController.createReservation);

// Ruta para ver las reservaciones (Administrador)
router.get('/reservations', verifyToken, checkAdmin, reservationController.getReservations);

module.exports = router;

