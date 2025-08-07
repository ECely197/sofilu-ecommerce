const { authMiddleware, adminOnly } = require("../middleware/authMiddleware");
const express = require("express");
const router = express.Router();
// ¡Importamos admin, pero no lo inicializamos aquí!
const admin = require("firebase-admin");
const User = require("../models/User");

// --- OBTENER TODOS LOS USUARIOS (PARA EL ADMIN) ---
router.get("/", [authMiddleware, adminOnly], async (req, res) => {
  try {
    const userRecords = await admin.auth().listUsers(1000);
    const users = userRecords.users.map((user) => ({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      creationTime: user.metadata.creationTime,
      disabled: user.disabled,
    }));
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener los usuarios" });
  }
});

// --- OBTENER TODAS LAS DIRECCIONES DE UN USUARIO ---
router.get("/:uid/addresses", [authMiddleware], async (req, res) => {
  if (req.user.uid !== req.params.uid)
    return res.status(403).json({ message: "No autorizado" });
  try {
    const user = await User.findOne({ uid: req.params.uid }).select(
      "addresses"
    );
    if (!user) return res.json([]);
    res.json(user.addresses);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener las direcciones" });
  }
});
// --- AÑADIR UNA NUEVA DIRECCIÓN ---
router.post("/:uid/addresses", [authMiddleware], async (req, res) => {
  if (req.user.uid !== req.params.uid)
    return res.status(403).json({ message: "No autorizado" });
  try {
    let user = await User.findOne({ uid: req.params.uid });
    if (!user) {
      user = new User({
        uid: req.user.uid, // Usamos el campo 'uid'
        email: req.user.email,
        displayName: req.user.displayName || "",
        addresses: [],
      });
    }
    user.addresses.push(req.body);
    const savedUser = await user.save();
    res.status(201).json(savedUser.addresses);
  } catch (error) {
    res.status(500).json({ message: "Error al añadir la dirección" });
  }
});

// --- ELIMINAR UNA DIRECCIÓN ---
router.delete(
  "/:uid/addresses/:addressId",
  [authMiddleware],
  async (req, res) => {
    if (req.user.uid !== req.params.uid)
      return res.status(403).json({ message: "No autorizado" });
    try {
      const user = await User.findOneAndUpdate(
        { uid: req.params.uid },
        { $pull: { addresses: { _id: req.params.addressId } } },
        { new: true }
      );
      if (!user)
        return res.status(404).json({ message: "Usuario no encontrado" });
      res.json(user.addresses);
    } catch (error) {
      res.status(500).json({ message: "Error al eliminar la dirección" });
    }
  }
);

module.exports = router;
