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
      { new: true, runValidators: true }
    );
    if (!updatedCoupon)
      return res.status(404).json({ message: "Cupón no encontrado." });
    res.json(updatedCoupon);
  } catch (error) {
    res
      .status(400)
      .json({
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
