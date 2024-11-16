const express = require('express');
const router = express.Router();
const kitchenController = require('../controllers/logic_kitchen/kitchenController');
const { verifyToken } = require('../middleware/auth');


router.get('/orders/kitchen', verifyToken, kitchenController.getPendingOrdersForKitchen);

// Ruta para marcar una orden como completada
router.put('/orders/kitchen/:id_orden/complete', verifyToken, kitchenController.markOrderAsCompleted);

// Ruta para cambiar disponibilidad de un producto
router.put('/products/:id_producto/availability', verifyToken ,kitchenController.updateProductAvailability);

module.exports = router;
