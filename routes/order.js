const express = require('express');
const router = express.Router();
const orderController = require('../controllers/logic_orders/orderController');

const { verifyToken } = require('../middleware/auth')

// Ruta para crear un nuevo pedido
router.post('/orders', verifyToken, orderController.createOrder);

// Ruta para obtener pedidos pendientes
router.get('/orders/pending', verifyToken, orderController.getPendingOrders);

module.exports = router;
