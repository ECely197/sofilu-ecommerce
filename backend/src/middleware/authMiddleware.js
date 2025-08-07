const admin = require('firebase-admin');

// Middleware para verificar el token de Firebase
async function authMiddleware(req, res, next) {
  const headerToken = req.headers.authorization;
  if (!headerToken || !headerToken.startsWith('Bearer ')) {
    return res.status(401).send({ message: 'No se proporcionó token o el formato es incorrecto.' });
  }

  const idToken = headerToken.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // --- Log de Depuración #1 ---
    // Esto nos mostrará el contenido completo del token verificado.
    console.log('--- AuthMiddleware: Token Verificado ---');
    console.log(decodedToken);
    
    // Añadimos el objeto de usuario decodificado al objeto 'req'
    req.user = decodedToken;
    
    // Damos paso a la siguiente función en la cadena (la lógica de la ruta)
    next();
  } catch (error) {
    console.error("--- AuthMiddleware: ERROR al verificar token ---", error);
    return res.status(403).send({ message: 'Token inválido o expirado.' });
  }
}

// Middleware para verificar si el usuario es admin
function adminOnly(req, res, next) {
  // Este middleware asume que 'authMiddleware' ya se ejecutó
  if (req.user && req.user.admin === true) {
    next(); // Si es admin, puede continuar
  } else {
    // Si no es admin, se le deniega el acceso
    res.status(403).send({ message: 'Acceso denegado. Se requiere rol de administrador.' });
  }
}

module.exports = { authMiddleware, adminOnly };