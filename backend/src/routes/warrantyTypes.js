const express = require("express");
const router = express.Router();
const WarrantyType = require("../models/WarrantyType");
const { authMiddleware, adminOnly } = require("../middleware/authMiddleware");

// Todas las rutas protegidas
router.use(authMiddleware, adminOnly);

// GET: Obtener todas
router.get("/", async (req, res) => {
  try {
    const warranties = await WarrantyType.find().sort({ durationMonths: 1 });
    res.json(warranties);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener garantías." });
  }
});

// POST: Crear
router.post("/", async (req, res) => {
  try {
    const newWarranty = new WarrantyType(req.body);
    await newWarranty.save();
    res.status(201).json(newWarranty);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error al crear garantía.", error: error.message });
  }
});

// PUT: Actualizar
router.put("/:id", async (req, res) => {
  try {
    const updated = await WarrantyType.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: "Error al actualizar." });
  }
});

// DELETE: Eliminar
router.delete("/:id", async (req, res) => {
  try {
    await WarrantyType.findByIdAndDelete(req.params.id);
    res.json({ message: "Garantía eliminada." });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar." });
  }
});

module.exports = router;
