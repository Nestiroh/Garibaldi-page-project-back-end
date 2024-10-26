const db = require('../../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de multer para almacenar las imágenes
const uploadDir = path.join(__dirname, '..', 'uploads', 'images');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Formato de archivo no soportado'), false);
    }
};
const upload = multer({ storage: storage, fileFilter: fileFilter });

// Controlador para subir la imagen
exports.addImage = [
    upload.single('image'),
    async (req, res) => {
      try {
        const id_usuario = req.user.id_usuario;
  
        if (!req.file) {
          return res.status(400).json({ error: 'No se ha proporcionado ninguna imagen.' });
        }
  
        // Crear la URL relativa para la base de datos
        const relativePath = path.relative(
          path.join(__dirname, '..'),
          req.file.path
        ).replace(/\\/g, '/');
  
  
        const result = await db.query(
          'INSERT INTO multimedia (id_usuario, url_foto, seccion, estado) VALUES (?, ?, "shows", 1)',
          [id_usuario, relativePath]
        );
  
        res.status(201).json({
          message: 'Imagen agregada con éxito en la sección Shows',
          url: '/' + relativePath
        });
      } catch (error) {
        console.error('Error en addImage:', error);
        res.status(500).json({ error: 'Error al subir la imagen' });
      }
    }
  ];

// Eliminar imagen
exports.deleteImage = async (req, res) => {
    const { id_foto } = req.params;

    try {
        // Obtener la ruta de la imagen en la base de datos
        const [rows] = await db.query(
            'SELECT url_foto FROM multimedia WHERE id_foto = ?',
            [id_foto]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Imagen no encontrada' });
        }

        // Convertir el buffer de url_foto en string si es necesario
        const imagePath = path.join(__dirname, '..', Buffer.isBuffer(rows[0].url_foto) ? rows[0].url_foto.toString() : rows[0].url_foto);

        // Eliminar registro de la base de datos
        const result = await db.query(
            'DELETE FROM multimedia WHERE id_foto = ?',
            [id_foto]
        );

        if (result[0].affectedRows === 0) {
            return res.status(404).json({ error: 'No se pudo eliminar la imagen de la base de datos' });
        }

        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        res.status(200).json({ message: 'Imagen eliminada con éxito' });
    } catch (error) {
        console.error('Error en deleteImage:', error);
        res.status(500).json({ error: 'Error al eliminar la imagen' });
    }
};

// Obtener todas las imágenes activas
exports.getAllImages = async (req, res) => {
    try {
        const [images] = await db.query(
            'SELECT * FROM multimedia WHERE estado = 1'
        );

        // Convertir url_foto a string si es un Buffer
        const formattedImages = images.map(image => ({
            ...image,
            url_foto: Buffer.isBuffer(image.url_foto) ? image.url_foto.toString() : image.url_foto
        }));

        res.status(200).json(formattedImages);
    } catch (error) {
        console.error('Error al obtener las imágenes:', error);
        res.status(500).json({ error: 'Error al obtener las imágenes' });
    }
};
