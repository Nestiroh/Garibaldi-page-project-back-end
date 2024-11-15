const db = require('../../config/db');

// Crear una nueva orden
exports.createOrder = async (req, res) => {
    const { numero_mesa, productos } = req.body;
    const id_mesero = req.user.id_usuario;

    if (!numero_mesa || !productos || productos.length === 0) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios y debe haber al menos un producto en la orden.' });
    }

    try {
        // Validar disponibilidad de los productos en el pedido
        const idsProductos = productos.map(p => p.id_producto);
        const [availableProducts] = await db.query(`
            SELECT id_producto, precio 
            FROM productos 
            WHERE id_producto IN (?) AND disponible = 1
        `, [idsProductos]);

        const unavailableProducts = idsProductos.filter(id => !availableProducts.some(p => p.id_producto === id));

        if (unavailableProducts.length > 0) {
            return res.status(400).json({ error: `Los productos con IDs ${unavailableProducts.join(', ')} no están disponibles.` });
        }

        // Calcular el total de la orden
        let totalOrden = 0;
        productos.forEach(p => {
            const productoInfo = availableProducts.find(ap => ap.id_producto === p.id_producto);
            totalOrden += productoInfo.precio * p.cantidad;
        });

        // Insertar la orden en la tabla ordenes
        const [result] = await db.query(`
            INSERT INTO ordenes (id_mesa, id_mesero, id_usuario, fecha_orden, estado) 
            VALUES ((SELECT id_mesa FROM mesas WHERE numero_mesa = ?), ?, ?, NOW(), 'Preparación')
        `, [numero_mesa, id_mesero, req.user.id_usuario]);

        const id_orden = result.insertId;

        // Insertar los detalles de la orden
        const detallesOrden = productos.map(p => [
            id_orden,
            p.id_producto,
            p.cantidad,
            p.comentarios || ''
        ]);


        await db.query(`
            INSERT INTO detalles_orden (id_orden, id_producto, cantidad, comentarios) 
            VALUES ?
        `, [detallesOrden]);

        // Actualizar el total acumulado en caja
        await db.query(`
            INSERT INTO caja (id_mesa, total, estado_pago) 
            VALUES ((SELECT id_mesa FROM mesas WHERE numero_mesa = ?), ?, 'Pendiente')
            ON DUPLICATE KEY UPDATE total = total + VALUES(total)
        `, [numero_mesa, totalOrden]);

        res.status(201).json({ message: 'Orden creada y total acumulado actualizado en caja.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear la orden' });
    }
};

// Obtener órdenes pendientes
exports.getPendingOrders = async (req, res) => {
    try {
        // Consulta para obtener órdenes en estado de "Preparación"
        const [orders] = await db.query(`
            SELECT o.id_orden, 
                   m.numero_mesa, 
                   o.id_mesero, 
                   o.fecha_orden, 
                   o.estado, 
                   d.id_producto, 
                   p.nombre_producto,  
                   d.cantidad, 
                   d.comentarios
            FROM ordenes o
            JOIN mesas m ON o.id_mesa = m.id_mesa
            JOIN detalles_orden d ON o.id_orden = d.id_orden
            JOIN productos p ON d.id_producto = p.id_producto  -- JOIN con productos para obtener el nombre
            WHERE o.estado = 'Preparación'
            ORDER BY o.fecha_orden ASC
        `);

        res.status(200).json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener órdenes pendientes' });
    }
};

// Obtener todos los productos disponibles
exports.getAllProducts = async (req, res) => {
    try {
        // Consulta para obtener el id, nombre y tipo de todos los productos disponibles
        const [products] = await db.query(`
            SELECT id_producto AS id, nombre_producto, tipo 
            FROM productos
            WHERE disponible = 1
        `);

        // Responder con la lista de productos
        res.status(200).json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener los productos' });
    }
};

