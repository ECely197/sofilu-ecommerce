const admin = require('firebase-admin');

/**
 * Middleware para verificar el token de Firebase en las peticiones protegidas.
 * - Extrae el token del header 'Authorization'.
 * - Verifica el token usando Firebase Admin SDK.
 * - Si es válido, añade el usuario decodificado a req.user y continúa.
 * - Si no es válido, responde con error 401 o 403.
 */
async function authMiddleware(req, res, next) {
  const headerToken = req.headers.authorization;

  // Verifica que el header exista y tenga el formato correcto
  if (!headerToken || !headerToken.startsWith('Bearer ')) {
    return res.status(401).send({ message: 'No se proporcionó token o el formato es incorrecto.' });
  }

  // Extrae el token JWT del header
  const idToken = headerToken.split('Bearer ')[1];

  try {
    // Verifica el token con Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // Log de depuración: muestra el contenido del token verificado
    console.log('--- AuthMiddleware: Token Verificado ---');
    console.log(decodedToken);

    // Añade el usuario decodificado al objeto req para uso en rutas siguientes
    req.user = decodedToken;

    // Continúa con la siguiente función en la cadena de middlewares/rutas
    next();
  } catch (error) {
    // Log de error y respuesta si el token no es válido o expiró
    console.error("--- AuthMiddleware: ERROR al verificar token ---", error);
    return res.status(403).send({ message: 'Token inválido o expirado.' });
  }
}

/**
 * Middleware para permitir solo usuarios con rol de administrador.
 * - Requiere que authMiddleware se haya ejecutado antes.
 * - Verifica que req.user tenga el claim 'admin' en true.
 * - Si es admin, continúa; si no, responde con error 403.
 */
function adminOnly(req, res, next) {
  if (req.user && req.user.admin === true) {
    // Usuario es admin, puede continuar
    next();
  } else {
    // Usuario no es admin, acceso denegado
    res.status(403).send({ message: 'Acceso denegado. Se requiere rol de administrador.' });
  }
}

module.exports = { authMiddleware, adminOnly };