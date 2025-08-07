const { authMiddleware, adminOnly } = require("../middleware/authMiddleware");
const express = require("express");
const router = express.Router();
// ¡Importamos admin, pero no lo inicializamos aquí!
const admin = require("firebase-admin");
const User = require('../models/User');

// --- OBTENER TODOS LOS USUARIOS (PARA EL ADMIN) ---
router.get('/', [authMiddleware, adminOnly], async (req, res) => {
  try {
    const userRecords = await admin.auth().listUsers(1000);
    const users = userRecords.users.map(user => ({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      creationTime: user.metadata.creationTime,
      disabled: user.disabled
    }));
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los usuarios' });
  }
});

// --- OBTENER TODAS LAS DIRECCIONES DE UN USUARIO ---
// GET /api/users/:uid/addresses
router.get('/:uid/addresses', [authMiddleware], async (req, res) => {
  console.log(`BACKEND USERS: Petición GET recibida en /:uid/addresses para UID: ${req.params.uid}`); // Log #5

  if (req.user.uid !== req.params.uid) {
    console.log('BACKEND USERS: Acceso denegado, UID de token y URL no coinciden.');
    return res.status(403).json({ message: 'No autorizado' });
  }
  
  try {
    console.log(`BACKEND USERS: Buscando usuario en MongoDB con _id: ${req.params.uid}`); // Log #6
    const user = await User.findById(req.params.uid).select('addresses');
    
    if (!user) {
      console.log('BACKEND USERS: Usuario no encontrado en MongoDB. Devolviendo array vacío.'); // Log #7
      return res.json([]); 
    }

    console.log(`BACKEND USERS: Usuario encontrado. Devolviendo ${user.addresses.length} direcciones.`); // Log #8
    res.json(user.addresses);
  } catch (error) {
    console.error("BACKEND USERS: ERROR al obtener direcciones:", error); // Log de Error Backend
    res.status(500).json({ message: 'Error al obtener las direcciones' });
  }
});
// --- AÑADIR UNA NUEVA DIRECCIÓN ---
// POST /api/users/:uid/addresses
router.post('/:uid/addresses', [authMiddleware], async (req, res) => {
  console.log(`BACKEND USERS: Petición POST recibida en /:uid/addresses para UID: ${req.params.uid}`); // Log #E
  console.log('BACKEND USERS: Datos recibidos en el body:', req.body); // Log #F
  
  if (req.user.uid !== req.params.uid) {
    console.log('BACKEND USERS: Acceso denegado, UID de token y URL no coinciden.');
    return res.status(403).json({ message: 'No autorizado' });
  }

  try {
    let user = await User.findById(req.params.uid);
    
    if (!user) {
      console.log(`BACKEND USERS: Usuario con ID ${req.params.uid} no encontrado en MongoDB. Creando nuevo documento...`); // Log #G
      user = new User({
        _id: req.user.uid,
        email: req.user.email,
        displayName: req.user.displayName || '',
        addresses: []
      });
    } else {
      console.log(`BACKEND USERS: Usuario con ID ${req.params.uid} encontrado en MongoDB.`); // Log #H
    }
    
    user.addresses.push(req.body);
    console.log('BACKEND USERS: Intentando guardar usuario con nueva dirección...'); // Log #I
    const savedUser = await user.save();
    console.log('BACKEND USERS: ¡Usuario guardado con éxito!'); // Log #J

    res.status(201).json(savedUser.addresses);

  } catch (error) {
    console.error("BACKEND USERS: ERROR al añadir dirección:", error); // Log de Error Backend
    res.status(500).json({ message: 'Error al añadir la dirección' });
  }
});

// --- ELIMINAR UNA DIRECCIÓN ---
// DELETE /api/users/:uid/addresses/:addressId
router.delete('/:uid/addresses/:addressId', [authMiddleware], async (req, res) => {
  if (req.user.uid !== req.params.uid) return res.status(403).json({ message: 'No autorizado' });
  try {
    const user = await User.findByIdAndUpdate(
      req.params.uid,
      { $pull: { addresses: { _id: req.params.addressId } } },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(user.addresses);
  } catch (error) {
    console.error("Error al eliminar dirección:", error);
    res.status(500).json({ message: 'Error al eliminar la dirección', error });
  }
});

module.exports = router;
