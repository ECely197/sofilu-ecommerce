/**
 * @fileoverview Middlewares de Autenticación y Autorización.
 * Este módulo proporciona funciones para verificar la identidad de un usuario
 * a través de tokens de Firebase (autenticación) y para comprobar si un
 * usuario tiene permisos de administrador (autorización).
 */

const admin = require("firebase-admin");

/**
 * Middleware de Autenticación.
 * Verifica el token de Firebase ID enviado en la cabecera 'Authorization'.
 * Si el token es válido, decodifica la información del usuario y la adjunta
 * al objeto `req` como `req.user` para su uso en las siguientes rutas.
 *
 * @param {object} req - El objeto de la petición de Express.
 * @param {object} res - El objeto de la respuesta de Express.
 * @param {function} next - La función callback para pasar al siguiente middleware.
 */
async function authMiddleware(req, res, next) {
  // 1. Extraer el token de la cabecera 'Authorization'.
  const authHeader = req.headers.authorization;

  // 2. Validar la existencia y el formato del token.
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn(
      "Acceso no autorizado: Token no proporcionado o con formato incorrecto."
    );
    return res
      .status(401)
      .json({ message: "Acceso no autorizado. Se requiere token." });
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    // 3. Verificar el token usando el SDK de Admin de Firebase.
    // Esta función decodifica y valida la firma y la expiración del token.
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // 4. Adjuntar el payload del usuario al objeto `req`.
    // Ahora, cualquier ruta protegida después de este middleware tendrá acceso a `req.user`.
    req.user = decodedToken;
    console.log(`Autenticación exitosa para el UID: ${decodedToken.uid}`);

    // 5. Continuar con la siguiente función en la cadena de middlewares/rutas.
    next();
  } catch (error) {
    // El token es inválido (expirado, malformado, etc.).
    console.error(
      "Error de autenticación: El token es inválido.",
      error.message
    );
    return res
      .status(403)
      .json({
        message: "Acceso prohibido. El token es inválido o ha expirado.",
      });
  }
}

/**
 * Middleware de Autorización de Administrador.
 * Comprueba si el usuario adjuntado en `req.user` (por el `authMiddleware`)
 * tiene el custom claim de `admin: true`.
 * DEBE usarse siempre DESPUÉS de `authMiddleware`.
 *
 * @param {object} req - El objeto de la petición de Express.
 * @param {object} res - El objeto de la respuesta de Express.
 * @param {function} next - La función callback para pasar al siguiente middleware.
 */
function adminOnly(req, res, next) {
  // Se comprueba de forma segura que `req.user` exista y que la propiedad `admin` sea `true`.
  if (req.user && req.user.admin === true) {
    // El usuario es administrador, permitir el acceso.
    next();
  } else {
    // El usuario no es administrador o no está autenticado correctamente.
    console.warn(
      `Acceso denegado a ruta de admin para el UID: ${
        req.user?.uid || "desconocido"
      }.`
    );
    res
      .status(403)
      .json({ message: "Acceso denegado. Se requiere rol de administrador." });
  }
}

module.exports = { authMiddleware, adminOnly };
