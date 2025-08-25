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
router.put("/:uid/addresses/:addressId", [authMiddleware], async (req, res) => {
  if (req.user.uid !== req.params.uid)
    return res.status(403).json({ message: "No autorizado" });

  try {
    const user = await User.findOne({ uid: req.params.uid });
    if (!user)
      return res.status(404).json({ message: "Usuario no encontrado" });

    const address = user.addresses.id(req.params.addressId);
    if (!address)
      return res.status(404).json({ message: "Dirección no encontrada" });

    // Actualizamos los campos de la dirección
    address.set(req.body);
    await user.save();
    res.json(user.addresses);
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar la dirección" });
  }
});
// --- RUTA PARA ESTABLECER UNA DIRECCIÓN COMO PREFERIDA! ---
router.patch(
  "/:uid/addresses/:addressId/set-preferred",
  [authMiddleware],
  async (req, res) => {
    if (req.user.uid !== req.params.uid)
      return res.status(403).json({ message: "No autorizado" });

    try {
      const user = await User.findOne({ uid: req.params.uid });
      if (!user)
        return res.status(404).json({ message: "Usuario no encontrado" });

      // 1. Quitamos la marca de 'preferida' de todas las demás direcciones
      user.addresses.forEach((addr) => (addr.isPreferred = false));

      // 2. Encontramos la nueva dirección preferida y la marcamos
      const preferredAddress = user.addresses.id(req.params.addressId);
      if (!preferredAddress)
        return res.status(404).json({ message: "Dirección no encontrada" });
      preferredAddress.isPreferred = true;

      await user.save();
      res.json(user.addresses);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error al establecer la dirección preferida" });
    }
  }
);

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
