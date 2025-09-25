/**
 * @fileoverview Gestiona las rutas para usuarios, perfiles y direcciones.
 * Incluye rutas de administración para gestionar usuarios y rutas para
 * que los propios usuarios gestionen su información personal.
 */

const express = require("express");
const router = express.Router();
const admin = require("firebase-admin"); // Se asume que está inicializado en server.js
const User = require("../models/User");
const Order = require("../models/Order");
const { authMiddleware, adminOnly } = require("../middleware/authMiddleware");

// ==========================================================================
// RUTAS DE ADMINISTRACIÓN (Protegidas)
// ==========================================================================

/**
 * @route   GET /api/users
 * @desc    Obtener una lista de todos los usuarios de Firebase Auth.
 * @access  Admin
 * @query   search - Filtra usuarios por email o displayName.
 */
router.get("/", [authMiddleware, adminOnly], async (req, res) => {
  try {
    const { search } = req.query;
    const listUsersResult = await admin.auth().listUsers(1000);
    let users = listUsersResult.users;

    if (search) {
      const lowerCaseSearch = search.toLowerCase();
      users = users.filter(
        (user) =>
          user.email?.toLowerCase().includes(lowerCaseSearch) ||
          user.displayName?.toLowerCase().includes(lowerCaseSearch)
      );
    }

    const formattedUsers = users.map((user) => ({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      creationTime: user.metadata.creationTime,
      disabled: user.disabled,
      isAdmin: user.customClaims?.admin === true,
    }));

    res.json(formattedUsers);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ message: "Error al obtener la lista de usuarios." });
  }
});

/**
 * @route   GET /api/users/:uid/details
 * @desc    Obtener detalles completos de un cliente (Firebase, Mongo, Pedidos).
 * @access  Admin
 */
router.get("/:uid/details", [authMiddleware, adminOnly], async (req, res) => {
  try {
    const { uid } = req.params;

    // Ejecutar todas las consultas en paralelo para mayor eficiencia
    const [firebaseUser, mongoUser, userOrders] = await Promise.all([
      admin.auth().getUser(uid),
      User.findOne({ uid }),
      Order.find({ userId: uid }),
    ]);

    // Calcular métricas
    const totalOrders = userOrders.length;
    const totalSpent = userOrders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );
    const usedCoupons = userOrders.reduce((acc, order) => {
      if (order.appliedCoupon) {
        acc[order.appliedCoupon] = (acc[order.appliedCoupon] || 0) + 1;
      }
      return acc;
    }, {});

    // Ensamblar la respuesta
    const userDetails = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      isAdmin: firebaseUser.customClaims?.admin === true,
      isDisabled: firebaseUser.disabled,
      creationTime: firebaseUser.metadata.creationTime,
      firstName: mongoUser?.firstName || "",
      lastName: mongoUser?.lastName || "",
      phone: mongoUser?.phone || "",
      totalOrders,
      totalSpent,
      usedCoupons: Object.entries(usedCoupons).map(([code, timesUsed]) => ({
        code,
        timesUsed,
      })),
    };

    res.json(userDetails);
  } catch (error) {
    console.error("Error al obtener detalles del cliente:", error);
    res.status(500).json({
      message: "Error al obtener los detalles del cliente.",
      details: error.message,
    });
  }
});

/**
 * @route   POST /api/users/:uid/toggle-admin
 * @desc    Alternar el rol de administrador de un usuario.
 * @access  Admin
 */
router.post(
  "/:uid/toggle-admin",
  [authMiddleware, adminOnly],
  async (req, res) => {
    try {
      const { uid } = req.params;
      const user = await admin.auth().getUser(uid);
      const currentAdminStatus = user.customClaims?.admin === true;

      await admin
        .auth()
        .setCustomUserClaims(uid, { admin: !currentAdminStatus });

      res.json({
        message: `Rol de admin actualizado a: ${!currentAdminStatus}`,
      });
    } catch (error) {
      res.status(500).json({
        message: "Error al cambiar el rol de admin.",
        details: error.message,
      });
    }
  }
);

/**
 * @route   POST /api/users/:uid/toggle-disable
 * @desc    Habilitar o deshabilitar una cuenta de usuario.
 * @access  Admin
 */
router.post(
  "/:uid/toggle-disable",
  [authMiddleware, adminOnly],
  async (req, res) => {
    try {
      const { uid } = req.params;
      const user = await admin.auth().getUser(uid);
      const newDisabledStatus = !user.disabled;

      await admin.auth().updateUser(uid, { disabled: newDisabledStatus });

      res.json({
        message: `Usuario ${
          newDisabledStatus ? "deshabilitado" : "habilitado"
        }.`,
      });
    } catch (error) {
      res.status(500).json({
        message: "Error al cambiar el estado del usuario.",
        details: error.message,
      });
    }
  }
);

// ==========================================================================
// RUTAS DE PERFIL DE USUARIO (Protegidas por autenticación de usuario)
// ==========================================================================

/**
 * @route   GET /api/users/profile
 * @desc    Obtener el perfil del usuario autenticado.
 * @access  Private (Usuario logueado)
 */
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const userProfile = await User.findOne({ uid: req.user.uid });
    if (!userProfile) {
      // Devuelve datos básicos de Firebase si no hay perfil en Mongo
      return res.json({
        email: req.user.email,
        firstName: "",
        lastName: "",
        phone: "",
      });
    }
    res.json(userProfile);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener el perfil." });
  }
});

/**
 * @route   PUT /api/users/profile
 * @desc    Crear o actualizar el perfil del usuario autenticado.
 * @access  Private (Usuario logueado)
 */
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const updatedProfile = await User.findOneAndUpdate(
      { uid: req.user.uid },
      { $set: { firstName, lastName, phone, email: req.user.email } },
      { new: true, upsert: true, runValidators: true } // Crea si no existe
    ).select("-addresses"); // Excluye las direcciones

    res.json(updatedProfile);
  } catch (error) {
    res.status(400).json({
      message: "Error al actualizar el perfil.",
      details: error.message,
    });
  }
});

// ==========================================================================
// RUTAS DE GESTIÓN DE DIRECCIONES (Protegidas por autenticación de usuario)
// ==========================================================================

/**
 * @route   GET /api/users/addresses
 * @desc    Obtener todas las direcciones del usuario autenticado.
 * @access  Private (Usuario logueado)
 */
router.get("/addresses", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid }).select("addresses");
    res.json(user ? user.addresses : []);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener direcciones." });
  }
});

/**
 * @route   POST /api/users/addresses
 * @desc    Añadir una nueva dirección para el usuario autenticado.
 * @access  Private (Usuario logueado)
 */
router.post("/addresses", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { uid: req.user.uid },
      {
        $push: { addresses: req.body },
        $setOnInsert: { email: req.user.email }, // Asegura que el email se guarde al crear el usuario
      },
      { new: true, upsert: true, runValidators: true }
    );
    res.status(201).json(user.addresses);
  } catch (error) {
    res.status(500).json({
      message: "Error al añadir la dirección.",
      details: error.message,
    });
  }
});

/**
 * @route   PUT /api/users/addresses/:addressId
 * @desc    Actualizar una dirección existente.
 * @access  Private (Usuario logueado)
 */
router.put("/addresses/:addressId", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid });
    if (!user)
      return res.status(404).json({ message: "Usuario no encontrado." });

    const address = user.addresses.id(req.params.addressId);
    if (!address)
      return res.status(404).json({ message: "Dirección no encontrada." });

    address.set(req.body);
    await user.save();
    res.json(user.addresses);
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar la dirección." });
  }
});

/**
 * @route   PATCH /api/users/addresses/:addressId/set-preferred
 * @desc    Marcar una dirección como preferida.
 * @access  Private (Usuario logueado)
 */
router.patch(
  "/addresses/:addressId/set-preferred",
  authMiddleware,
  async (req, res) => {
    try {
      const user = await User.findOne({ uid: req.user.uid });
      if (!user)
        return res.status(404).json({ message: "Usuario no encontrado." });

      // Desmarcar todas las demás direcciones
      user.addresses.forEach((addr) => (addr.isPreferred = false));

      const preferredAddress = user.addresses.id(req.params.addressId);
      if (!preferredAddress)
        return res.status(404).json({ message: "Dirección no encontrada." });

      preferredAddress.isPreferred = true;
      await user.save();
      res.json(user.addresses);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error al establecer dirección preferida." });
    }
  }
);

/**
 * @route   DELETE /api/users/addresses/:addressId
 * @desc    Eliminar una dirección.
 * @access  Private (Usuario logueado)
 */
router.delete("/addresses/:addressId", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { uid: req.user.uid },
      { $pull: { addresses: { _id: req.params.addressId } } },
      { new: true }
    );
    if (!user)
      return res.status(404).json({ message: "Usuario no encontrado." });
    res.json(user.addresses);
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar la dirección." });
  }
});

module.exports = router;
