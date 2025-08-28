// Contenido para: backend/src/routes/categories.js

const express = require("express");
const router = express.Router();
const Category = require("../models/Category");
const { authMiddleware, adminOnly } = require("../middleware/authMiddleware");

// --- OBTENER TODAS LAS CATEGORÍAS (Ruta Pública) ---
// Útil para que el cliente vea las categorías en el home
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 }); // Ordenadas alfabéticamente
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener las categorías" });
  }
});

// --- OBTENER UNA CATEGORÍA POR SU SLUG (Ruta Pública) ---
// Útil para la página de categoría del cliente
router.get("/:slug", async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    if (!category) {
      return res.status(404).json({ message: "Categoría no encontrada" });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener la categoría" });
  }
});

// --- CREAR UNA NUEVA CATEGORÍA (Solo Admin) ---
router.post("/", [authMiddleware, adminOnly], async (req, res) => {
  const { name, imageUrl } = req.body;
  // Ya no generamos el slug aquí
  const newCategory = new Category({ name, imageUrl });
  try {
    const savedCategory = await newCategory.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    // Manejo de error si el slug ya existe
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "Una categoría con este nombre ya existe." });
    }
    res
      .status(400)
      .json({ message: "Error al crear la categoría", error: error.message });
  }
});

// --- ACTUALIZAR UNA CATEGORÍA (Solo Admin) ---
router.put("/:id", [authMiddleware, adminOnly], async (req, res) => {
  const { name, imageUrl } = req.body;
  // Ya no generamos el slug aquí
  try {
    // Al actualizar el 'name', el hook pre-save del modelo se encargará del slug
    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      { name, imageUrl },
      { new: true }
    );
    if (!updatedCategory) {
      return res.status(404).json({ message: "Categoría no encontrada" });
    }
    res.json(updatedCategory);
  } catch (error) {
    res.status(400).json({
      message: "Error al actualizar la categoría",
      error: error.message,
    });
  }
});

// --- ELIMINAR UNA CATEGORÍA (Solo Admin) ---
router.delete("/:id", [authMiddleware, adminOnly], async (req, res) => {
  try {
    const deletedCategory = await Category.findByIdAndDelete(req.params.id);
    if (!deletedCategory) {
      return res.status(404).json({ message: "Categoría no encontrada" });
    }
    res.json({ message: "Categoría eliminada con éxito" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar la categoría" });
  }
});

module.exports = router;
