const { authMiddleware, adminOnly } = require("../middleware/authMiddleware");
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

// --- AÑADIR UNA NUEVA DIRECCIÓN ---
// POST /api/users/:uid/addresses
router.post('/:uid/addresses', [authMiddleware], async (req, res) => {
  if (req.user.uid !== req.params.uid) return res.status(403).json({ message: 'No autorizado' });
  try {
    const user = await User.findById(req.params.uid);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    user.addresses.push(req.body); // Añadimos la nueva dirección al array
    await user.save();
    res.status(201).json(user.addresses);
  } catch (error) {
    res.status(500).json({ message: 'Error al añadir la dirección' });
  }
});

module.exports = router;