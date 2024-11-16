const express = require('express');
const router = express.Router();
const barController = require('../controllers/logic_bar/barController');
const { verifyToken } = require('../middleware/auth');


// Ruta para obtener órdenes pendientes para el bar (solo bebidas)
router.get('/orders/bar', verifyToken, barController.getPendingOrdersForBar);

// Ruta para marcar una orden como completada en el bar
router.put('/orders/bar/:id_orden/complete', verifyToken, barController.markOrderAsCompleted);

module.exports = router;