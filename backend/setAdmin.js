const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Inicializamos la app de admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// El UID del usuario que queremos que sea administrador
const uid = 'Ej0l6cGCFfemBs6lpS0CuhoemjF2';

// Usamos el SDK de Admin para establecer una 'custom claim'
admin.auth().setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log(`¡Éxito! El usuario ${uid} ahora es un administrador.`);
    process.exit(0); // Termina el script
  })
  .catch(error => {
    console.error('Error al establecer el rol de admin:', error);
    process.exit(1); // Termina el script con un error
  });