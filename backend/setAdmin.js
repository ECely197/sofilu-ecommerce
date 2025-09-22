/**
 * @fileoverview Script de utilidad para asignar el rol de administrador
 * a uno o más usuarios en Firebase Authentication.
 *
 * @usage node setAdmin.js
 *
 * @description Este script lee una lista de UIDs y les asigna un 'custom claim'
 * { admin: true }, que puede ser verificado en el backend para proteger rutas.
 */

// 1. Importaciones e Inicialización
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} catch (error) {
  if (error.code === "app/duplicate-app") {
    console.warn(
      "Firebase Admin ya estaba inicializado. Usando la instancia existente."
    );
  } else {
    console.error("Error inicializando Firebase Admin:", error.message);
    process.exit(1); // Salir si hay un error crítico
  }
}

// 2. Lista de UIDs a los que se les asignará el rol de administrador
const ADMIN_UIDS = [
  "OSZCduKuCTMmHL44eE2kuPm4Eph1",
  "Ej0l6cGCFfemBs6lpS0CuhoemjF2",
  "PY6WwAn1MoMMO1ddA9sfjhv5buG3",
  // Agrega futuros UIDs de administradores aquí
  // "otro-uid-de-admin",
];

/**
 * Función asíncrona principal que ejecuta el proceso.
 */
async function setAdminRoles() {
  console.log("Iniciando asignación de roles de administrador...");

  // Mapea cada UID a una promesa que intenta establecer el custom claim.
  const rolePromises = ADMIN_UIDS.map((uid) =>
    admin
      .auth()
      .setCustomUserClaims(uid, { admin: true })
      .then(() => {
        console.log(`✅ ¡Éxito! El usuario ${uid} ahora es un administrador.`);
        return { uid, status: "success" };
      })
      .catch((error) => {
        console.error(`❌ ERROR al establecer rol para ${uid}:`, error.message);
        return { uid, status: "error", reason: error.message };
      })
  );

  // Espera a que todas las promesas se resuelvan (con éxito o error).
  const results = await Promise.all(rolePromises);

  const errors = results.filter((r) => r.status === "error");

  console.log("\n--- Proceso Finalizado ---");
  if (errors.length > 0) {
    console.error(`\nSe encontraron ${errors.length} errores.`);
    process.exit(1); // Termina el script con un código de error.
  } else {
    console.log("Todos los roles de administrador se asignaron correctamente.");
    process.exit(0); // Termina el script con éxito.
  }
}

// Ejecutar la función
setAdminRoles();
