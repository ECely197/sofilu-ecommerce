// En: backend/src/routes/variantTemplates.js
const express = require("express");
const router = express.Router();
const VariantTemplate = require("../models/VariantTemplate");
const { authMiddleware, adminOnly } = require("../middleware/authMiddleware");

// Middleware para todas las rutas de este archivo
router.use(authMiddleware, adminOnly);

// GET todas las plantillas
router.get("/", async (req, res) => {
  try {
    const templates = await VariantTemplate.find().sort({ templateName: 1 });
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener plantillas" });
  }
});

// POST para crear una nueva plantilla
router.post("/", async (req, res) => {
  try {
    // --- AÑADE ESTE LOG ---
    console.log(
      "BACKEND LOG: Intentando crear nueva plantilla con datos:",
      req.body
    );
    const newTemplate = new VariantTemplate(req.body);
    await newTemplate.save();
    console.log("BACKEND LOG: Plantilla guardada con éxito.");
    res.status(201).json(newTemplate);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error al crear la plantilla", details: error.message });
  }
});

// DELETE para eliminar una plantilla
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await VariantTemplate.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Plantilla no encontrada" });
    res.json({ message: "Plantilla eliminada" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar la plantilla" });
  }
});

module.exports = router;
