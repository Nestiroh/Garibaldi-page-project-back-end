const db = require('../../config/db'); 

exports.createReservation = async (req, res) => {
    let { cantidad_personas, horario_reserva, comentarios_adicionales, hay_nino, rango_edad_nino, motivo_reserva } = req.body;

    const id_usuario = req.user.id_usuario;
  
    if (!cantidad_personas || !horario_reserva || !motivo_reserva) {
        return res.status(400).json({ error: 'Los campos cantidad de personas, horario de reserva y motivo de reserva son obligatorios.' });
    }
    
    if (hay_nino) {
        const validRangos = ['2-3', '4-8', '9-12', '13-16'];

        if (!rango_edad_nino) {
            return res.status(400).json({ error: 'Debe especificar el rango de edad del niño si se indicó que hay niños.' });
        }

        if (!validRangos.includes(rango_edad_nino)) {
            return res.status(400).json({ error: 'El rango de edad del niño no es válido. Debe ser uno de: 2-3, 4-8, 9-12, 13-16.' });
        }
    } else {       
        rango_edad_nino = null;
    }
    try {
        const query = `
            INSERT INTO reservas (id_usuario, cantidad_personas, horario_reserva, comentarios_adicionales, hay_nino, rango_edad_nino, motivo_reserva)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        await db.query(query, [id_usuario, cantidad_personas, horario_reserva, comentarios_adicionales, hay_nino, rango_edad_nino, motivo_reserva]);

        res.status(201).json({ message: 'Reserva creada exitosamente.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear la reserva' });
    }
};


exports.getReservations = async (req, res) => {
    try {
        const query = `
            SELECT r.cantidad_personas, r.horario_reserva, r.comentarios_adicionales, 
                   r.hay_nino, r.rango_edad_nino, r.motivo_reserva, 
                   u.nombre AS usuario_nombre, u.email AS usuario_email
            FROM reservas r
            JOIN usuarios u ON r.id_usuario = u.id_usuario
        `;

        const [reservations] = await db.query(query);
        
        if (reservations.length === 0) {
            return res.status(404).json({ message: 'No se encontraron reservas' });
        }

        res.status(200).json(reservations);
    } catch (error) {
        console.error('Error al obtener las reservas:', error);
        res.status(500).json({ error: 'Error interno del servidor al obtener las reservas' });
    }
};




