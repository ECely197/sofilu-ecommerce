const { authMiddleware, adminOnly } = require("../middleware/authMiddleware");
const express = require("express");
const router = express.Router();
// ¡Importamos admin, pero no lo inicializamos aquí!
const admin = require("firebase-admin");
const User = require("../models/User");

// --- OBTENER TODOS LOS USUARIOS (PARA EL ADMIN) ---
router.get("/", [authMiddleware, adminOnly], async (req, res) => {
  try {
    const { search } = req.query;

    // 1. Obtenemos la lista completa de usuarios de Firebase Auth.
    //    '1000' es el máximo por página, puedes implementar paginación en el futuro si es necesario.
    const userRecords = await admin.auth().listUsers(1000);
    let usersToReturn = userRecords.users;

    // 2. Si se proporcionó un término de búsqueda, filtramos la lista.
    if (search) {
      const lowerCaseSearch = search.toLowerCase();

      usersToReturn = userRecords.users.filter((user) => {
        // Comprobamos si el término de búsqueda está incluido en el email (si existe)
        const emailMatch = user.email?.toLowerCase().includes(lowerCaseSearch);
        // Comprobamos si el término de búsqueda está incluido en el nombre (si existe)
        const nameMatch = user.displayName
          ?.toLowerCase()
          .includes(lowerCaseSearch);

        // Devolvemos true si hay coincidencia en cualquiera de los dos campos
        return emailMatch || nameMatch;
      });
    }

    // 3. Mapeamos la lista (ya sea la completa o la filtrada) al formato que necesita el frontend.
    const formattedUsers = usersToReturn.map((user) => ({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      creationTime: user.metadata.creationTime,
      disabled: user.disabled,
    }));

    res.json(formattedUsers);
  } catch (error) {
    console.error("Error al obtener o buscar usuarios:", error); // Log de error mejorado
    res.status(500).json({ message: "Error al obtener los usuarios" });
  }
});

// --- RUTA DE DETALLES COMPLETOS DEL CLIENTE (CORREGIDA) ---
router.get("/:uid/details", [authMiddleware, adminOnly], async (req, res) => {
  try {
    const { uid } = req.params;

    // Usamos Promise.all para obtener todo en paralelo
    const [firebaseUser, mongoUser, userOrders] = await Promise.all([
      admin.auth().getUser(uid),
      User.findOne({ uid: uid }), // Aseguramos que busca por el campo correcto
      Order.find({ userId: uid }), // Y aquí también
    ]);

    if (!firebaseUser) {
      return res
        .status(404)
        .json({ message: "Usuario no encontrado en Firebase." });
    }

    // --- CÁLCULO DE MÉTRICAS ---
    const totalOrders = userOrders.length;
    const totalSpent = userOrders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );

    // Agrupamos los cupones usados por este cliente
    const usedCoupons = userOrders.reduce((acc, order) => {
      if (order.appliedCoupon) {
        if (!acc[order.appliedCoupon]) {
          acc[order.appliedCoupon] = { timesUsed: 0, totalDiscount: 0 };
        }
        acc[order.appliedCoupon].timesUsed += 1;
        acc[order.appliedCoupon].totalDiscount += order.discountAmount || 0;
      }
      return acc;
    }, {});

    // --- ENSAMBLAJE DEL OBJETO FINAL ---
    const userDetails = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      isAdmin: firebaseUser.customClaims?.admin === true,
      isDisabled: firebaseUser.disabled,
      creationTime: firebaseUser.metadata.creationTime,

      // Usamos el operador 'optional chaining' (?.) por si el usuario aún no tiene perfil en MongoDB
      firstName: mongoUser?.firstName || "",
      lastName: mongoUser?.lastName || "",
      phone: mongoUser?.phone || "",

      totalOrders,
      totalSpent,
      // Convertimos el objeto de cupones en un array para que sea más fácil de usar en el frontend
      usedCoupons: Object.entries(usedCoupons).map(([code, data]) => ({
        code,
        ...data,
      })),
    };

    res.json(userDetails);
  } catch (error) {
    console.error("Error al obtener los detalles del cliente:", error);
    res
      .status(500)
      .json({
        message: "Error al obtener los detalles del cliente",
        details: error.message,
      });
  }
});

// Asignar o quitar rol de administrador
router.post(
  "/:uid/toggle-admin",
  [authMiddleware, adminOnly],
  async (req, res) => {
    try {
      const { uid } = req.params;
      const user = await admin.auth().getUser(uid);

      // Obtenemos el estado actual del claim 'admin'
      const currentAdminClaim = user.customClaims?.admin === true;

      // Establecemos el nuevo claim al valor opuesto
      await admin
        .auth()
        .setCustomUserClaims(uid, { admin: !currentAdminClaim });

      res.json({
        message: `Rol de admin para ${uid} actualizado a ${!currentAdminClaim}.`,
      });
    } catch (error) {
      res.status(500).json({
        message: "Error al cambiar el rol de admin",
        details: error.message,
      });
    }
  }
);

// Habilitar o deshabilitar un usuario
router.post(
  "/:uid/toggle-disable",
  [authMiddleware, adminOnly],
  async (req, res) => {
    try {
      const { uid } = req.params;
      const user = await admin.auth().getUser(uid);

      // Actualizamos el estado 'disabled' al opuesto del actual
      await admin.auth().updateUser(uid, { disabled: !user.disabled });

      res.json({
        message: `Usuario ${uid} ha sido ${
          !user.disabled ? "deshabilitado" : "habilitado"
        }.`,
      });
    } catch (error) {
      res.status(500).json({
        message: "Error al cambiar el estado del usuario",
        details: error.message,
      });
    }
  }
);

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
    const user = await User.findOneAndUpdate(
      { uid: req.user.uid },
      {
        $push: { addresses: req.body },
        $setOnInsert: { email: req.user.email },
      },
      { new: true, upsert: true, runValidators: true }
    ).select("addresses");

    res.status(201).json(user.addresses);
  } catch (error) {
    console.error("Error al añadir dirección:", error);
    res.status(500).json({
      message: "Error al añadir la dirección",
      details: error.message,
    });
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
