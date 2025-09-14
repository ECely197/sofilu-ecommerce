// En: backend/src/routes/variantTemplates.js
const express = require("express");
const router = express.Router();
const VariantTemplate = require("../models/VariantTemplate");
const { authMiddleware, adminOnly } = require("../middleware/authMiddleware");

// Middleware de seguridad para todas las rutas de este archivo
router.use(authMiddleware, adminOnly);

// GET: Obtener todas las plantillas
router.get("/", async (req, res) => {
  try {
    const templates = await VariantTemplate.find().sort({ templateName: 1 });
    res.json(templates);
  } catch (error) {
    console.error("Error al obtener plantillas de variantes:", error);
    res.status(500).json({ message: "Error al obtener las plantillas" });
  }
});

// POST: Crear una nueva plantilla
router.post("/", async (req, res) => {
  try {
    console.log("BACKEND LOG: Datos recibidos para crear plantilla:", req.body);

    const newTemplate = new VariantTemplate(req.body);

    // Validación explícita antes de guardar
    await newTemplate.validate();

    const savedTemplate = await newTemplate.save();
    console.log("BACKEND LOG: Plantilla guardada con éxito.");
    res.status(201).json(savedTemplate);
  } catch (error) {
    // Este catch ahora capturará errores de validación (ej: nombre duplicado)
    console.error("Error al crear la plantilla:", error);
    res
      .status(400)
      .json({
        message: "Error de validación al crear la plantilla",
        details: error.message,
      });
  }
});

// DELETE: Eliminar una plantilla por ID
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await VariantTemplate.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Plantilla no encontrada" });
    }
    res.json({ message: "Plantilla eliminada con éxito" });
  } catch (error) {
    console.error("Error al eliminar la plantilla:", error);
    res.status(500).json({ message: "Error al eliminar la plantilla" });
  }
});

module.exports = router;
