const db = require('../../config/db');

// Crear una nueva orden
exports.createOrder = async (req, res) => {
    const { id_mesa, id_usuario, productos } = req.body;
    const id_mesero = req.user.id_usuario; // Suponiendo que el id del mesero se obtiene del token de autenticación

    // Validar los datos de entrada
    if (!id_mesa || !id_usuario || !productos || productos.length === 0) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios y debe haber al menos un producto en la orden.' });
    }

    try {
        // Insertar la orden en la tabla `ordenes`
        const [result] = await db.query(
            'INSERT INTO ordenes (id_mesa, id_mesero, id_usuario, fecha_orden, estado) VALUES (?, ?, ?, NOW(), ?)',
            [id_mesa, id_mesero, id_usuario, 'Preparación']
        );

        const id_orden = result.insertId;

        // Insertar los detalles de la orden en la tabla `detalles_orden`
        const detallePromesas = productos.map(producto => {
            return db.query(
                'INSERT INTO detalles_orden (id_orden, id_producto, cantidad, comentarios) VALUES (?, ?, ?, ?)',
                [id_orden, producto.id_producto, producto.cantidad, producto.comentarios || '']
            );
        });

        await Promise.all(detallePromesas);

        res.status(201).json({ message: 'Orden creada con éxito', id_orden });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear la orden' });
    }
};

exports.getPendingOrders = async (req, res) => {
    try {
        // Consulta para obtener órdenes en estado de "Preparación"
        const [orders] = await db.query(`
            SELECT o.id_orden, o.id_mesa, o.id_mesero, o.fecha_orden, o.estado, 
                   d.id_producto, d.cantidad, d.comentarios
            FROM ordenes o
            JOIN detalles_orden d ON o.id_orden = d.id_orden
            WHERE o.estado = 'Preparación'
            ORDER BY o.fecha_orden ASC
        `);

        res.status(200).json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener órdenes pendientes' });
    }
};

