const db = require('../../config/db');

// Obtener órdenes pendientes para la cocina 
exports.getPendingOrdersForKitchen = async (req, res) => {
    try {
        // Llamada al procedimiento almacenado
        const [result] = await db.query('CALL GetPendingOrdersForKitchen()');

        // MySQL devuelve un array anidado al usar CALL
        const orders = result[0];

        // Responder con la lista de órdenes
        res.status(200).json(orders);
    } catch (error) {
        console.error('Error al obtener órdenes pendientes:', error);
        res.status(500).json({ error: 'Error al obtener órdenes pendientes' });
    }
};



// Marcar una orden como completada
exports.markOrderAsCompleted = async (req, res) => {
    const { id_orden } = req.params; 


    // Validación de id_orden
    if (!id_orden) {
        return res.status(400).json({ error: 'El id_orden es requerido' });
    }

    try {
        const [result] = await db.query(`
            UPDATE ordenes 
            SET estado = 'Completado' 
            WHERE id_orden = ? AND estado = 'Preparación'
        `, [id_orden]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Orden no encontrada o ya completada' });
        }

        res.status(200).json({ message: 'Orden marcada como completada' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al marcar la orden como completada' });
    }
};



// Cambiar disponibilidad de un producto
exports.updateProductAvailability = async (req, res) => {
    const { id_producto } = req.params;
    const { disponible } = req.body;

    try {
        const [result] = await db.query(`
            UPDATE productos 
            SET disponible = ? 
            WHERE id_producto = ?
        `, [disponible, id_producto]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.status(200).json({ message: 'Disponibilidad del producto actualizada' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar disponibilidad del producto' });
    }
};
