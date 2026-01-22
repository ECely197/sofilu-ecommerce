/**
 * @fileoverview Gestiona las rutas de la API para los cupones de descuento.
 * Incluye rutas públicas para la validación y rutas de admin para el CRUD.
 */

const express = require("express");
const router = express.Router();
const Coupon = require("../models/Coupon");
const { authMiddleware, adminOnly } = require("../middleware/authMiddleware");

// ==========================================================================
// RUTA PÚBLICA
// ==========================================================================

/**
 * @route   GET /api/coupons/user/:uid
 * @desc    Obtener los cupones asignados exclusivamente a un usuario.
 * @access  Private (El usuario solo puede ver sus propios cupones)
 */
router.get("/user/:uid", authMiddleware, async (req, res) => {
  try {
    const { uid } = req.params;

    // Seguridad: Verificar que el token pertenezca al uid solicitado (o sea admin)
    if (req.user.uid !== uid && req.user.admin !== true) {
      return res.status(403).json({ message: "Acceso denegado." });
    }

    const coupons = await Coupon.find({
      allowedUsers: uid, // Busca que el UID esté en el array
      // Opcional: Solo mostrar cupones vigentes
      // expirationDate: { $gte: new Date() }
    }).sort({ createdAt: -1 });

    res.json(coupons);
  } catch (error) {
    console.error("Error obteniendo cupones del usuario:", error);
    res.status(500).json({ message: "Error al obtener los cupones." });
  }
});

/**
 * @route   POST /api/coupons/validate
 * @desc    Valida un código de cupón (incluyendo restricción de usuario).
 * @access  Public (Pero recibe userId en el body si existe)
 */
router.post("/validate", async (req, res) => {
  const { code, userId } = req.body; // <-- AHORA ESPERAMOS userId TAMBIÉN

  if (!code) {
    return res.status(400).json({ message: "Se requiere un código de cupón." });
  }

  try {
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon)
      return res.status(404).json({ message: "El cupón no existe." });

    // 1. Validar Fechas
    if (coupon.expirationDate && new Date() > new Date(coupon.expirationDate)) {
      return res.status(400).json({ message: "Este cupón ha expirado." });
    }

    // 2. Validar Límites de Uso Global
    if (coupon.usageLimit !== null && coupon.timesUsed >= coupon.usageLimit) {
      return res
        .status(400)
        .json({ message: "Este cupón ha alcanzado su límite de usos." });
    }

    // 3. --- ¡NUEVO! VALIDAR USUARIO ASIGNADO ---
    if (coupon.allowedUsers && coupon.allowedUsers.length > 0) {
      if (!userId) {
        return res.status(403).json({
          message: "Debes iniciar sesión para usar este cupón exclusivo.",
        });
      }
      if (!coupon.allowedUsers.includes(userId)) {
        return res
          .status(403)
          .json({ message: "Este cupón no es válido para tu cuenta." });
      }
    }

    res.json(coupon);
  } catch (error) {
    console.error("Error validando cupón:", error);
    res
      .status(500)
      .json({ message: "Error del servidor al validar el cupón." });
  }
});
/**
 * @route   POST /api/coupons/validate
 * @desc    Valida un código de cupón.
 * @access  Public
 */
router.post("/validate", async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ message: "Se requiere un código de cupón." });
  }

  try {
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon)
      return res.status(404).json({ message: "El cupón no existe." });
    if (coupon.expirationDate && new Date() > new Date(coupon.expirationDate)) {
      return res.status(400).json({ message: "Este cupón ha expirado." });
    }
    if (coupon.usageLimit !== null && coupon.timesUsed >= coupon.usageLimit) {
      return res
        .status(400)
        .json({ message: "Este cupón ha alcanzado su límite de usos." });
    }

    res.json(coupon);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error del servidor al validar el cupón." });
  }
});

// ==========================================================================
// RUTAS DE ADMINISTRACIÓN
// ==========================================================================

// Middleware de protección para las rutas de gestión.
router.use(authMiddleware, adminOnly);

/**
 * @route   GET /api/coupons
 * @desc    Obtener todos los cupones.
 * @access  Admin
 */
router.get("/", async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener los cupones." });
  }
});

/**
 * @route   GET /api/coupons/:id
 * @desc    Obtener un cupón por su ID.
 * @access  Admin
 */
router.get("/:id", async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon)
      return res.status(404).json({ message: "Cupón no encontrado." });
    res.json(coupon);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener el cupón." });
  }
});

/**
 * @route   POST /api/coupons
 * @desc    Crear un nuevo cupón.
 * @access  Admin
 */
router.post("/", async (req, res) => {
  try {
    const newCoupon = new Coupon(req.body);
    const savedCoupon = await newCoupon.save();
    res.status(201).json(savedCoupon);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error al crear el cupón.", details: error.message });
  }
});

/**
 * @route   PUT /api/coupons/:id
 * @desc    Actualizar un cupón existente.
 * @access  Admin
 */
router.put("/:id", async (req, res) => {
  try {
    const updatedCoupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );
    if (!updatedCoupon)
      return res.status(404).json({ message: "Cupón no encontrado." });
    res.json(updatedCoupon);
  } catch (error) {
    res.status(400).json({
      message: "Error al actualizar el cupón.",
      details: error.message,
    });
  }
});

/**
 * @route   DELETE /api/coupons/:id
 * @desc    Eliminar un cupón.
 * @access  Admin
 */
router.delete("/:id", async (req, res) => {
  try {
    const deletedCoupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!deletedCoupon)
      return res.status(404).json({ message: "Cupón no encontrado." });
    res.json({ message: "Cupón eliminado con éxito." });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar el cupón." });
  }
});

module.exports = router;
