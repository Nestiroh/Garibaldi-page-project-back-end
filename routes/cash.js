const express = require('express');
const router = express.Router();
const cashController = require('../controllers/logic_cash/cashController');
const { verifyToken } = require('../middleware/auth');

// Ruta para ver el total acumulado y pedidos de una mesa
router.get('/cash/tables/:id_mesa', verifyToken, cashController.getOrdersForTable);

// Ruta para confirmar el pago de una mesa
router.put('/cash/tables/:id_mesa/confirm', verifyToken, cashController.confirmPayment);

module.exports = router;
