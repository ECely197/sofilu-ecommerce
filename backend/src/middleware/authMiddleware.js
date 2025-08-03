const admin = require('firebase-admin');

async function authMiddleware(req, res, next) {
  // 1. Buscamos el token en la cabecera 'Authorization' de la petición.
  // El formato estándar es "Bearer <token>".
  const headerToken = req.headers.authorization;
  if (!headerToken || !headerToken.startsWith('Bearer ')) {
    return res.status(401).send({ message: 'No se proporcionó token o el formato es incorrecto.' });
  }

  // 2. Extraemos el token puro.
  const idToken = headerToken.split('Bearer ')[1];

  try {
    // 3. Le pedimos a Firebase Admin que verifique si el token es válido.
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // 4. Si el token es válido, guardamos la información del usuario en la petición (req)
    // para que las rutas que vienen después puedan usarla.
    req.user = decodedToken;
    
    // 5. 'next()' es la palabra clave que le dice al guardia: "Todo en orden, deja pasar a la siguiente función".
    next();
  } catch (error) {
    console.error('Error al verificar el token:', error);
    return res.status(403).send({ message: 'Token inválido o expirado.' });
  }
}

module.exports = authMiddleware;