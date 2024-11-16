const jwt = require('jsonwebtoken');

// Middleware para verificar el token JWT
exports.verifyToken = (req, res, next) => {
    // Obtener el encabezado 'Authorization'
    const authHeader = req.headers['authorization'];

  
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(403).json({ error: 'Token no proporcionado' });
    }

    // Extraer el token del encabezado
    const token = authHeader.split(' ')[1]; 


    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Token no valido' });
        }

  
        req.user = decoded;
        next(); //Sigue con la ruta siguiente
    });
};
