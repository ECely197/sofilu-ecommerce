// Contenido para: backend/src/middleware/authMiddleware.js
const admin = require('firebase-admin');

async function authMiddleware(req, res, next) {
  // --- LOG DE RASTREO #A ---
  console.log('--- BACKEND TRACE: Entrando a authMiddleware ---');

  const headerToken = req.headers.authorization;
  if (!headerToken || !headerToken.startsWith('Bearer ')) {
    console.log('--- BACKEND TRACE: Fallo en authMiddleware (Sin token o mal formato) ---');
    return res.status(401).send({ message: 'No se proporcionó token o el formato es incorrecto.' });
  }
  const idToken = headerToken.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log('--- BACKEND TRACE: Token verificado con éxito en authMiddleware ---');
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('--- BACKEND TRACE: Fallo en authMiddleware (Token inválido) ---', error);
    return res.status(403).send({ message: 'Token inválido o expirado.' });
  }
}

function adminOnly(req, res, next) {
  // --- LOG DE RASTREO #B ---
  console.log('--- BACKEND TRACE: Entrando a adminOnly Middleware ---');

  if (req.user && req.user.admin === true) {
    console.log('--- BACKEND TRACE: Verificación de Admin exitosa ---');
    next();
  } else {
    console.log('--- BACKEND TRACE: Fallo en adminOnly (Usuario no es admin) ---');
    res.status(403).send({ message: 'Acceso denegado. Se requiere rol de administrador.' });
  }
}

module.exports = { authMiddleware, adminOnly };