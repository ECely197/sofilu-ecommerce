/**
 * @fileoverview Gestiona las rutas de la API para las plantillas de variantes.
 * Estas plantillas permiten a los administradores crear rápidamente conjuntos
 * de variantes predefinidas (ej: "Tallas", "Colores").
 */

const express = require("express");
const router = express.Router();
const VariantTemplate = require("../models/VariantTemplate");
const { authMiddleware, adminOnly } = require("../middleware/authMiddleware");

// Middleware de seguridad para todas las rutas de este archivo.
router.use(authMiddleware, adminOnly);

/**
 * @route   GET /api/variant-templates
 * @desc    Obtener todas las plantillas de variantes.
 * @access  Admin
 */
router.get("/", async (req, res) => {
  try {
    const templates = await VariantTemplate.find().sort({ templateName: 1 });
    res.json(templates);
  } catch (error) {
    console.error("Error al obtener plantillas de variantes:", error);
    res.status(500).json({ message: "Error al obtener las plantillas." });
  }
});

/**
 * @route   POST /api/variant-templates
 * @desc    Crear una nueva plantilla de variantes.
 * @access  Admin
 */
router.post("/", async (req, res) => {
  try {
    const newTemplate = new VariantTemplate(req.body);
    const savedTemplate = await newTemplate.save();
    res.status(201).json(savedTemplate);
  } catch (error) {
    console.error("Error al crear la plantilla:", error);
    res.status(400).json({
      message: "Error de validación al crear la plantilla.",
      details: error.message,
    });
  }
});

/**
 * @route   PUT /api/variant-templates/:id
 * @desc    Actualizar una plantilla de variantes existente.
 * @access  Admin
 */
router.put("/:id", async (req, res) => {
  try {
    const updatedTemplate = await VariantTemplate.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedTemplate) {
      return res.status(404).json({ message: "Plantilla no encontrada." });
    }
    res.json(updatedTemplate);
  } catch (error) {
    res.status(400).json({
      message: "Error al actualizar la plantilla.",
      details: error.message,
    });
  }
});

/**
 * @route   DELETE /api/variant-templates/:id
 * @desc    Eliminar una plantilla de variantes.
 * @access  Admin
 */
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await VariantTemplate.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Plantilla no encontrada." });
    }
    res.json({ message: "Plantilla eliminada con éxito." });
  } catch (error) {
    console.error("Error al eliminar la plantilla:", error);
    res.status(500).json({ message: "Error al eliminar la plantilla." });
  }
});

module.exports = router;
