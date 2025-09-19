// En: backend/src/routes/vendors.js
const express = require("express");
const router = express.Router();
const Vendor = require("../models/Vendor");
const { authMiddleware, adminOnly } = require("../middleware/authMiddleware");

// Middleware de protección para todas las rutas
router.use(authMiddleware, adminOnly);

// GET todos los vendedores
router.get("/", async (req, res) => {
  try {
    const vendors = await Vendor.find().sort({ name: 1 });
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener vendedores" });
  }
});

// POST para crear un nuevo vendedor
router.post("/", async (req, res) => {
  try {
    const newVendor = new Vendor({ name: req.body.name });
    await newVendor.save();
    res.status(201).json(newVendor);
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "Un vendedor con este nombre ya existe." });
    }
    res
      .status(400)
      .json({ message: "Error al crear el vendedor", details: error.message });
  }
});

// DELETE para eliminar un vendedor
router.delete("/:id", async (req, res) => {
  try {
    // En el futuro, aquí se podría añadir una lógica para verificar si el vendedor
    // tiene productos asociados antes de permitir su eliminación.
    const deleted = await Vendor.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Vendedor no encontrado" });
    res.json({ message: "Vendedor eliminado" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar el vendedor" });
  }
});

module.exports = router;
