/**
 * @fileoverview Gestiona las rutas de la API para las Secciones (divisiones principales del sitio).
 */

const express = require("express");
const router = express.Router();
const Section = require("../models/Section");
const { authMiddleware, adminOnly } = require("../middleware/authMiddleware");

// ==========================================================================
// RUTA PÚBLICA
// ==========================================================================

/**
 * @route   GET /api/sections
 * @desc    Obtener todas las secciones de navegación.
 * @access  Public
 */
router.get("/", async (req, res) => {
  try {
    const sections = await Section.find().sort({ name: 1 });
    res.json(sections);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener las secciones." });
  }
});

// ==========================================================================
// RUTAS DE ADMINISTRACIÓN
// ==========================================================================

router.use(authMiddleware, adminOnly);

/**
 * @route   POST /api/sections
 * @desc    Crear una nueva sección.
 * @access  Admin
 */
router.post("/", async (req, res) => {
  try {
    // El slug se genera automáticamente por el hook pre-save del modelo.
    const newSection = new Section({ name: req.body.name });
    const savedSection = await newSection.save();
    res.status(201).json(savedSection);
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "Una sección con este nombre ya existe." });
    }
    res
      .status(400)
      .json({ message: "Error al crear la sección.", details: error.message });
  }
});

/**
 * @route   PUT /api/sections/:id
 * @desc    Actualizar una sección.
 * @access  Admin
 */
router.put("/:id", async (req, res) => {
  try {
    const updatedSection = await Section.findByIdAndUpdate(
      req.params.id,
      { name: req.body.name },
      { new: true, runValidators: true }
    );
    if (!updatedSection) {
      return res.status(404).json({ message: "Sección no encontrada." });
    }
    res.json(updatedSection);
  } catch (error) {
    res
      .status(400)
      .json({
        message: "Error al actualizar la sección.",
        details: error.message,
      });
  }
});

/**
 * @route   DELETE /api/sections/:id
 * @desc    Eliminar una sección.
 * @access  Admin
 */
router.delete("/:id", async (req, res) => {
  try {
    // TODO: Considerar qué sucede con las categorías de esta sección.
    const deletedSection = await Section.findByIdAndDelete(req.params.id);
    if (!deletedSection) {
      return res.status(404).json({ message: "Sección no encontrada." });
    }
    res.json({ message: "Sección eliminada con éxito." });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar la sección." });
  }
});

module.exports = router;
