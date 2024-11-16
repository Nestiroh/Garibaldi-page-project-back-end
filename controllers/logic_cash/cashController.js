const db = require('../../config/db');

// Ver pedidos y total acumulado para una mesa con estado de pago y orden
exports.getOrdersForTable = async (req, res) => {
    const { id_mesa } = req.params;  // Aquí id_mesa representa el numero_mesa

    try {
        // Obtener detalles de pedidos por mesa utilizando numero_mesa en vez de id_mesa
        const [orders] = await db.query(`
            SELECT 
                o.id_orden,
                o.id_mesa,
                p.nombre_producto, 
                d.cantidad, 
                p.precio, 
                (d.cantidad * p.precio) AS total_producto,
                o.estado AS estado_orden,
                c.estado_pago AS estado_pago
            FROM 
                ordenes o
            JOIN 
                detalles_orden d ON o.id_orden = d.id_orden
            JOIN 
                productos p ON d.id_producto = p.id_producto
            LEFT JOIN 
                caja c ON o.id_mesa = c.id_mesa
            WHERE 
                o.id_mesa = (SELECT id_mesa FROM mesas WHERE numero_mesa = ?) 
                AND o.estado IN ('Preparación', 'Servido')  -- Ajustar los estados deseados
        `, [id_mesa]);

        // Calcular el total acumulado para la mesa
        const total = orders.reduce((sum, order) => sum + (order.total_producto || 0), 0);

        res.status(200).json({ orders, total });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener los pedidos y el total acumulado' });
    }
};


// Confirmar el pago de una mesa y eliminar registros de pedidos usando numero_mesa
exports.confirmPayment = async (req, res) => {
    const { id_mesa } = req.params;  // Aquí id_mesa representa numero_mesa

    try {
        // Cambiar el estado de pago a "Pagado" usando numero_mesa
        const [result] = await db.query(`
            UPDATE caja 
            SET estado_pago = 'Pagado'
            WHERE id_mesa = (SELECT id_mesa FROM mesas WHERE numero_mesa = ?) 
            AND estado_pago = 'pendiente'
        `, [id_mesa]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'No se encontró un pedido pendiente para esta mesa' });
        }

        // Eliminar registros relacionados en detalles_orden y ordenes usando numero_mesa
        await db.query(`
            DELETE FROM detalles_orden 
            WHERE id_orden IN (SELECT id_orden FROM ordenes WHERE id_mesa = (SELECT id_mesa FROM mesas WHERE numero_mesa = ?))
        `, [id_mesa]);
        
        await db.query(`
            DELETE FROM ordenes 
            WHERE id_mesa = (SELECT id_mesa FROM mesas WHERE numero_mesa = ?)
        `, [id_mesa]);

        await db.query(`
            DELETE FROM caja 
            WHERE id_mesa = (SELECT id_mesa FROM mesas WHERE numero_mesa = ?)
        `, [id_mesa]);

        res.status(200).json({ message: 'Pago confirmado y registros eliminados para la mesa' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al confirmar el pago' });
    }
};


