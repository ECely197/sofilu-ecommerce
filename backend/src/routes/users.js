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

// --- ¡NUEVA RUTA: OBTENER PERFIL DE USUARIO! ---
router.get("/profile", [authMiddleware], async (req, res) => {
  try {
    // Buscamos al usuario en nuestra base de datos MongoDB usando el uid del token
    const userProfile = await User.findOne({ uid: req.user.uid }).select(
      "firstName lastName phone email"
    );

    if (!userProfile) {
      // Si el usuario existe en Firebase Auth pero no en nuestra DB, devolvemos los datos básicos.
      return res.json({
        email: req.user.email,
        firstName: "",
        lastName: "",
        phone: "",
      });
    }
    res.json(userProfile);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener el perfil" });
  }
});

// --- ¡NUEVA RUTA: ACTUALIZAR PERFIL DE USUARIO! ---
router.put("/profile", [authMiddleware], async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;

    // findOneAndUpdate con 'upsert: true' buscará un documento que coincida con el uid
    // y lo actualizará. Si no lo encuentra, creará uno nuevo.
    const updatedProfile = await User.findOneAndUpdate(
      { uid: req.user.uid },
      {
        $set: {
          firstName,
          lastName,
          phone,
          email: req.user.email, // Aseguramos que el email esté sincronizado
        },
      },
      { new: true, upsert: true, runValidators: true }
    ).select("firstName lastName phone email");

    res.json(updatedProfile);
  } catch (error) {
    res.status(400).json({ message: "Error al actualizar el perfil" });
  }
});

router.get("/addresses", [authMiddleware], async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid }).select("addresses");
    if (!user) return res.json([]);
    res.json(user.addresses);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener direcciones" });
  }
});

router.post("/addresses", [authMiddleware], async (req, res) => {
  try {
    let user = await User.findOne({ uid: req.user.uid });
    if (!user) {
      user = new User({
        uid: req.user.uid,
        email: req.user.email,
        addresses: [],
      });
    }
    user.addresses.push(req.body);
    const savedUser = await user.save();
    res.status(201).json(savedUser.addresses);
  } catch (error) {
    res.status(500).json({ message: "Error al añadir dirección" });
  }
});

router.put("/addresses/:addressId", [authMiddleware], async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid });
    if (!user)
      return res.status(404).json({ message: "Usuario no encontrado" });
    const address = user.addresses.id(req.params.addressId);
    if (!address)
      return res.status(404).json({ message: "Dirección no encontrada" });
    address.set(req.body);
    await user.save();
    res.json(user.addresses);
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar dirección" });
  }
});

router.patch(
  "/addresses/:addressId/set-preferred",
  [authMiddleware],
  async (req, res) => {
    try {
      const user = await User.findOne({ uid: req.user.uid });
      if (!user)
        return res.status(404).json({ message: "Usuario no encontrado" });
      user.addresses.forEach((addr) => (addr.isPreferred = false));
      const preferredAddress = user.addresses.id(req.params.addressId);
      if (!preferredAddress)
        return res.status(404).json({ message: "Dirección no encontrada" });
      preferredAddress.isPreferred = true;
      await user.save();
      res.json(user.addresses);
    } catch (error) {
      res.status(500).json({ message: "Error al establecer preferida" });
    }
  }
);

router.delete("/addresses/:addressId", [authMiddleware], async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { uid: req.user.uid },
      { $pull: { addresses: { _id: req.params.addressId } } },
      { new: true }
    );
    if (!user)
      return res.status(404).json({ message: "Usuario no encontrado" });
    res.json(user.addresses);
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar dirección" });
  }
});

module.exports = router;
