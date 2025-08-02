const express = require('express');
const router = express.Router();
// ¡Importamos admin, pero no lo inicializamos aquí!
const admin = require('firebase-admin');

// --- OBTENER TODOS LOS USUARIOS (PARA EL ADMIN) ---
router.get('/', async (req, res) => {
  try {
    const userRecords = await admin.auth().listUsers(1000);
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