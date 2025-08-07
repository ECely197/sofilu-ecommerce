const { authMiddleware, adminOnly } = require("../middleware/authMiddleware");
const express = require("express");
const router = express.Router();
// ¡Importamos admin, pero no lo inicializamos aquí!
const admin = require("firebase-admin");

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
router.get('/:uid/addresses', [authMiddleware], async (req, res) => {
  if (req.user.uid !== req.params.uid) return res.status(403).json({ message: 'No autorizado' });
  try {
    // Usamos el modelo 'User' para buscar en MongoDB
    const user = await User.findById(req.params.uid).select('addresses');
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado en la base de datos local' });
    res.json(user.addresses);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener las direcciones' });
  }
});

// --- AÑADIR UNA NUEVA DIRECCIÓN ---
router.post('/:uid/addresses', [authMiddleware], async (req, res) => {
  if (req.user.uid !== req.params.uid) return res.status(403).json({ message: 'No autorizado' });
  try {
    let user = await User.findById(req.params.uid);
    if (!user) {
      // Si el usuario no existe, lo creamos y le añadimos la dirección
      user = new User({
        _id: req.user.uid,
        email: req.user.email,
        displayName: req.user.displayName || '',
        addresses: [req.body] // Añade la dirección directamente
      });
      await user.save();
      return res.status(201).json(user.addresses);
    }
    // Si el usuario existe, añadimos la dirección normalmente
    user.addresses.push(req.body);
    await user.save();
    res.status(201).json(user.addresses);
  } catch (error) {
    res.status(500).json({ message: 'Error al añadir la dirección', error });
  }
});

// --- ELIMINAR UNA DIRECCIÓN ---
router.delete('/:uid/addresses/:addressId', [authMiddleware], async (req, res) => {
  if (req.user.uid !== req.params.uid) return res.status(403).json({ message: 'No autorizado' });
  try {
    const user = await User.findByIdAndUpdate(
      req.params.uid,
      { $pull: { addresses: { _id: req.params.addressId } } },
      { new: true }
    );
    res.json(user.addresses);
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar la dirección' });
  }
});

module.exports = router;
