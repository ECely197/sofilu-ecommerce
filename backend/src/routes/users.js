const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// Carga la llave de servicio que descargaste
const serviceAccount = require('../../serviceAccountKey.json');

// Inicializa la app de Firebase Admin (solo si no se ha hecho antes)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

// --- OBTENER TODOS LOS USUARIOS (PARA EL ADMIN) ---
// GET /api/users
router.get('/', async (req, res) => {
  try {
    const userRecords = await admin.auth().listUsers(1000); // Obtiene hasta 1000 usuarios
    const users = userRecords.users.map(user => ({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      creationTime: user.metadata.creationTime,
    }));
    res.json(users);
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    res.status(500).json({ message: 'Error al obtener los usuarios' });
  }
});

module.exports = router;