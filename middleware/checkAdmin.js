
exports.checkAdmin = (req, res, next) => {
    
    if (!req.user) {
        return res.status(403).json({ error: 'Acceso denegado' });
    }

    // Verificar si el rol es "administrador"
    if (req.user.rol !== 'Administrador') {
        return res.status(403).json({ error: 'No tienes permisos para realizar esta acción' });
    }

    next(); 
};
