/**
 * @fileoverview Gestiona las rutas CRUD para las opciones de entrega especial.
 */
const express = require("express");
const router = express.Router();
const DeliveryOption = require("../models/DeliveryOption");
const { authMiddleware, adminOnly } = require("../middleware/authMiddleware");

// ========================
// RUTA PÚBLICA (Para el Checkout)
// ========================
/**
 * @route   GET /api/delivery-options
 * @desc    Obtener todas las opciones de entrega ACTIVAS.
 * @access  Public
 */
router.get("/", async (req, res) => {
  try {
    // El cliente solo debe ver las que el admin tiene activas
    const options = await DeliveryOption.find({ isActive: true }).sort({
      cost: 1,
    }); // Ordenar por costo
    res.json(options);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener las opciones de entrega." });
  }
});

// ========================
// RUTAS DE ADMINISTRACIÓN
// ========================
router.use(authMiddleware, adminOnly);

/**
 * @route   GET /api/delivery-options/all
 * @desc    Obtener TODAS las opciones (activas e inactivas) para el panel de admin.
 * @access  Admin
 */
router.get("/all", async (req, res) => {
  try {
    const options = await DeliveryOption.find().sort({ createdAt: -1 });
    res.json(options);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener todas las opciones." });
  }
});

/**
 * @route   POST /api/delivery-options
 * @desc    Crear una nueva opción de entrega.
 * @access  Admin
 */
router.post("/", async (req, res) => {
  try {
    const newOption = new DeliveryOption(req.body);
    await newOption.save();
    res.status(201).json(newOption);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error al crear la opción.", details: error.message });
  }
});

/**
 * @route   PUT /api/delivery-options/:id
 * @desc    Actualizar una opción de entrega.
 * @access  Admin
 */
router.put("/:id", async (req, res) => {
  try {
    const updatedOption = await DeliveryOption.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );
    if (!updatedOption)
      return res.status(404).json({ message: "Opción no encontrada." });
    res.json(updatedOption);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error al actualizar.", details: error.message });
  }
});

/**
 * @route   DELETE /api/delivery-options/:id
 * @desc    Eliminar una opción de entrega.
 * @access  Admin
 */
router.delete("/:id", async (req, res) => {
  try {
    const deletedOption = await DeliveryOption.findByIdAndDelete(req.params.id);
    if (!deletedOption)
      return res.status(404).json({ message: "Opción no encontrada." });
    res.json({ message: "Opción eliminada con éxito." });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar la opción." });
  }
});

module.exports = router;
