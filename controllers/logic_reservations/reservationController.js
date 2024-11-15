const db = require('../../config/db'); 
const PDFDocument = require('pdfkit');
const moment = require('moment');
const fs = require('fs');
const path = require('path');


exports.createReservation = async (req, res) => {
    let { cantidad_personas, horario_reserva, comentarios_adicionales, hay_nino, rango_edad_nino, motivo_reserva } = req.body;

    const id_usuario = req.user.id_usuario;

    // Validar campos obligatorios
    if (!cantidad_personas || !horario_reserva || !motivo_reserva) {
        return res.status(400).json({
            error: 'Los campos cantidad de personas, horario de reserva y motivo de reserva son obligatorios.',
        });
    }

    // Validar rango de edad de niños
    if (hay_nino) {
        const validRangos = ['2-3', '4-8', '9-12', '13-16'];

        if (!rango_edad_nino) {
            return res.status(400).json({
                error: 'Debe especificar el rango de edad del niño si se indicó que hay niños.',
            });
        }

        if (!validRangos.includes(rango_edad_nino)) {
            return res.status(400).json({
                error: 'El rango de edad del niño no es válido. Debe ser uno de: 2-3, 4-8, 9-12, 13-16.',
            });
        }
    } else {
        rango_edad_nino = null;
    }

    try {
        // Invocar el stored procedure
        const query = 'CALL CreateReservation(?, ?, ?, ?, ?, ?, ?)';
        await db.query(query, [
            id_usuario,
            cantidad_personas,
            horario_reserva,
            comentarios_adicionales,
            hay_nino,
            rango_edad_nino,
            motivo_reserva,
        ]);

        res.status(201).json({ message: 'Reserva creada exitosamente.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear la reserva' });
    }
};



exports.getReservations = async (req, res) => {
    try {
        const query = `
        SELECT r.id_reserva, r.cantidad_personas, r.horario_reserva, r.comentarios_adicionales, 
            r.hay_nino, r.rango_edad_nino, r.motivo_reserva, 
            u.nombre AS usuario_nombre, u.email AS usuario_email
        FROM reservas r
        JOIN usuarios u ON r.id_usuario = u.id_usuario;
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

//Eliminar reservacion
exports.deleteReservation = async (req, res) => {
    const { id_reserva } = req.params;
    try {
        const result = await db.query('DELETE FROM reservas WHERE id_reserva = ?', [id_reserva]);

        if (result[0].affectedRows === 0) {
            return res.status(404).json({ message: 'Reserva no encontrada' });
        }
        res.status(200).json({ message: 'Reserva eliminada con éxito' });
    } catch (error) {
        console.error('Error al eliminar la reserva:', error);
        res.status(500).json({ error: 'Error al eliminar la reserva' });
    }
};

//Generar reporte de reservaciones por mes
exports.generateMonthlyReport = async (req, res) => {
    const { month, year } = req.params;

    if (!month || !year || isNaN(month) || isNaN(year)) {
        return res.status(400).json({ error: 'Mes y año son obligatorios y deben ser números.' });
    }

    try {
        const startDate = moment(`${year}-${month}-01`).startOf('month');
        const endDate = moment(startDate).endOf('month');

        const query = `
            SELECT r.cantidad_personas, r.horario_reserva, r.comentarios_adicionales, 
                   r.hay_nino, r.rango_edad_nino, r.motivo_reserva, 
                   u.nombre AS usuario_nombre, u.email AS usuario_email
            FROM reservas r
            JOIN usuarios u ON r.id_usuario = u.id_usuario
            WHERE r.horario_reserva BETWEEN ? AND ?
        `;

        const [reservations] = await db.query(query, [startDate.toISOString(), endDate.toISOString()]);

        if (reservations.length === 0) {
            return res.status(404).json({ message: 'No se encontraron reservas para el mes solicitado' });
        }

        const tempDir = path.join(__dirname, '..', '..', 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }

        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const reportFileName = `Reporte_Reservas_${startDate.format('MMMM_YYYY')}.pdf`;
        const reportPath = path.join(tempDir, reportFileName);
        
        // Crear un write stream para el archivo
        const stream = fs.createWriteStream(reportPath);
        doc.pipe(stream);  // Pipe del documento al stream

        const addColoredTitle = (text, fontSize = 14) => {
            doc.fontSize(fontSize).font('Helvetica-Bold').fillColor('#0066cc').text(text, { align: 'left' });
            doc.moveDown(0.5);
            doc.fillColor('black');  // Restaurar el color negro para el texto normal
        };

        // Encabezado
        addColoredTitle('Informe Mensual de Reservas', 24);
        doc.fontSize(16).font('Helvetica').text(`${startDate.format('MMMM YYYY')}`, { align: 'center' });
        doc.moveDown();

        // Resumen
        const totalReservas = reservations.length;
        const totalPersonas = reservations.reduce((sum, r) => sum + r.cantidad_personas, 0);
        const reservasConNinos = reservations.filter(r => r.hay_nino).length;

        addColoredTitle('Resumen');
        doc.fontSize(12).font('Helvetica')
           .text(`Total de reservas: ${totalReservas}`)
           .text(`Total de personas: ${totalPersonas}`)
           .text(`Reservas con niños: ${reservasConNinos}`)
           .moveDown();

      
        addColoredTitle('Numero De Reserva Por Motivo');
        const motivosCount = {};
        reservations.forEach(r => {
            motivosCount[r.motivo_reserva] = (motivosCount[r.motivo_reserva] || 0) + 1;
        });
        Object.entries(motivosCount).forEach(([motivo, count]) => {
            doc.fontSize(12).font('Helvetica').text(`${motivo}: ${count}`);
        });
        doc.moveDown();

        // Tabla de reservas
        addColoredTitle('Detalle de Reservas');

        const tableTop = 300;
        const tableLeft = 50;
        const colWidths = [80, 60, 60, 300]; 

        // Encabezados de la tabla
        doc.font('Helvetica-Bold');
        ['Fecha', 'Hora', 'Personas', 'Detalles'].forEach((header, i) => {
            let position = tableLeft + colWidths.slice(0, i).reduce((sum, w) => sum + w, 0);
            if (header === 'Detalles') {
                position += 10; 
            }
            doc.text(header, position, tableTop);
        });


        // Filas de la tabla
        doc.font('Helvetica');
        let y = tableTop + 20;
        reservations.forEach((reservation) => {
            if (y > 700) {  
                doc.addPage();
                addColoredTitle('Detalle de Reservas (continuación)');
                y = 100;  
            }

            const fecha = moment(reservation.horario_reserva).format('DD/MM/YYYY');
            const hora = moment(reservation.horario_reserva).format('HH:mm');
            const personas = reservation.cantidad_personas.toString();
            let detalles = `${reservation.motivo_reserva}`;
            if (reservation.hay_nino) {
                detalles += `, Niños: ${reservation.rango_edad_nino}`;
            }
            if (reservation.comentarios_adicionales) {
                detalles += `, ${reservation.comentarios_adicionales}`;
            }

            doc.text(fecha, tableLeft, y);
            doc.text(hora, tableLeft + colWidths[0], y);
            doc.text(personas, tableLeft + colWidths[0] + colWidths[1], y);
            
            // Ajustar texto para la columna de detalles
            doc.text(detalles, tableLeft + colWidths[0] + colWidths[1] + colWidths[2], y, {
                width: colWidths[3],
                align: 'left'
            });

            y += 50;  // Ajustar para la próxima fila
        });

        // Pie de página
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
            doc.switchToPage(i);
            doc.fontSize(10).text(
                `Página ${i + 1} de ${pageCount}`,
                50,
                doc.page.height - 50,
                { align: 'center' }
            );
        }

        // Finalizar el documento
        doc.end();

        // Manejar la finalización de la escritura del archivo
        stream.on('finish', () => {
            // Enviar el archivo como respuesta
            res.download(reportPath, reportFileName, (err) => {
                if (err) {
                    console.error('Error al enviar el archivo:', err);
                    res.status(500).send('Error al generar el informe');
                }
                // Eliminar el archivo temporal después de enviarlo
                fs.unlink(reportPath, (unlinkErr) => {
                    if (unlinkErr) console.error('Error al eliminar el archivo temporal:', unlinkErr);
                });
            });
        });

        stream.on('error', (error) => {
            console.error('Error al escribir el archivo:', error);
            res.status(500).json({ error: 'Error interno del servidor al generar el informe' });
        });

    } catch (error) {
        console.error('Error al generar el informe:', error);
        res.status(500).json({ error: 'Error interno del servidor al generar el informe' });
    }
};

