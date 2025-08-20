// Contenido completo y corregido para: backend/setAdmin.js

const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// --- ¡NUEVO! Un array con todos los UIDs que quieres que sean administradores ---
const adminUids = [
  "OSZCduKuCTMmHL44eE2kuPm4Eph1",
  "Ej0l6cGCFfemBs6lpS0CuhoemjF2",
  // Puedes añadir más UIDs aquí en el futuro:
  // "otro-uid-aqui",
  // "y-otro-mas-aqui",
];

// Creamos un array de promesas. Cada elemento del array es una llamada a setCustomUserClaims.
const promises = adminUids.map((uid) =>
  admin
    .auth()
    .setCustomUserClaims(uid, { admin: true })
    .then(() => {
      console.log(`✅ ¡Éxito! El usuario ${uid} ahora es un administrador.`);
    })
    .catch((error) => {
      console.error(
        `❌ ERROR al establecer el rol para ${uid}:`,
        error.message
      );
    })
);

// Promise.all espera a que TODAS las promesas del array se completen.
Promise.all(promises)
  .then(() => {
    console.log("\nProceso completado.");
    process.exit(0); // Termina el script solo cuando todo ha finalizado
  })
  .catch(() => {
    console.error("\nEl proceso finalizó con uno o más errores.");
    process.exit(1); // Termina con un código de error
  });
