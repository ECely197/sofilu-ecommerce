const express = require("express");
const router = express.Router();
const Section = require("../models/Section");
const { authMiddleware, adminOnly } = require("../middleware/authMiddleware");

// ==========================================================================
// RUTAS PÚBLICAS
// ==========================================================================

// --- OBTENER TODAS LAS SECCIONES (Público) ---
router.get("/", async (req, res) => {
  try {
    const sections = await Section.find().sort({ name: 1 });
    res.json(sections);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener las secciones" });
  }
});

// ==========================================================================
// RUTAS PROTEGIDAS (Solo para Administradores)
// ==========================================================================

// Middleware para proteger todas las rutas de modificación que vienen después
router.use(authMiddleware, adminOnly);

// --- CREAR UNA NUEVA SECCIÓN (Admin) ---
router.post("/", async (req, res) => {
  const { name } = req.body;
  const slug = name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");

  const newSection = new Section({ name, slug });

  try {
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
      .json({ message: "Error al crear la sección", details: error.message });
  }
});

// --- ACTUALIZAR UNA SECCIÓN (Admin) ---
router.put("/:id", async (req, res) => {
  const { name } = req.body;

  try {
    // El slug se actualizará automáticamente si el nombre cambia
    const updatedSection = await Section.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true, runValidators: true }
    );

    if (!updatedSection) {
      return res.status(404).json({ message: "Sección no encontrada" });
    }
    res.json(updatedSection);
  } catch (error) {
    res.status(400).json({
      message: "Error al actualizar la sección",
      details: error.message,
    });
  }
});

// --- ELIMINAR UNA SECCIÓN (Admin) ---
router.delete("/:id", async (req, res) => {
  try {
    const deletedSection = await Section.findByIdAndDelete(req.params.id);

    if (!deletedSection) {
      return res.status(404).json({ message: "Sección no encontrada" });
    }
    res.json({ message: "Sección eliminada con éxito" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar la sección" });
  }
});

module.exports = router;
