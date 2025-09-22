/**
 * @fileoverview Gestiona las rutas de la API para las categorías de productos.
 * Incluye rutas públicas para visualización y rutas de admin para el CRUD.
 */

const express = require("express");
const router = express.Router();
const Category = require("../models/Category");
const { authMiddleware, adminOnly } = require("../middleware/authMiddleware");

// ==========================================================================
// RUTAS PÚBLICAS
// ==========================================================================

/**
 * @route   GET /api/categories
 * @desc    Obtener todas las categorías.
 * @access  Public
 * @query   search - Permite filtrar categorías por nombre.
 */
router.get("/", async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }
    const categories = await Category.find(query)
      .populate("section")
      .sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener las categorías." });
  }
});

/**
 * @route   GET /api/categories/:slug
 * @desc    Obtener una categoría por su slug (para páginas de categoría del cliente).
 * @access  Public
 */
router.get("/:slug", async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    if (!category) {
      return res.status(404).json({ message: "Categoría no encontrada." });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener la categoría." });
  }
});

/**
 * @route   GET /api/categories/id/:id
 * @desc    Obtener una categoría por su ID (para formularios de edición en admin).
 * @access  Public (Puede ser usado por Admin)
 */
router.get("/id/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).populate("section");
    if (!category) {
      return res.status(404).json({ message: "Categoría no encontrada." });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener la categoría." });
  }
});

// ==========================================================================
// RUTAS DE ADMINISTRACIÓN
// ==========================================================================

router.use(authMiddleware, adminOnly);

/**
 * @route   POST /api/categories
 * @desc    Crear una nueva categoría.
 * @access  Admin
 */
router.post("/", async (req, res) => {
  try {
    const { name, imageUrl, section } = req.body;
    // El slug se genera automáticamente gracias al hook pre-save del modelo.
    const newCategory = new Category({ name, imageUrl, section });
    const savedCategory = await newCategory.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    if (error.code === 11000) {
      // Error de índice único (nombre/slug duplicado)
      return res
        .status(400)
        .json({ message: "Una categoría con este nombre ya existe." });
    }
    res
      .status(400)
      .json({
        message: "Error al crear la categoría.",
        details: error.message,
      });
  }
});

/**
 * @route   PUT /api/categories/:id
 * @desc    Actualizar una categoría.
 * @access  Admin
 */
router.put("/:id", async (req, res) => {
  try {
    // El hook pre-save se encargará de actualizar el slug si el nombre cambia.
    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedCategory) {
      return res.status(404).json({ message: "Categoría no encontrada." });
    }
    res.json(updatedCategory);
  } catch (error) {
    res
      .status(400)
      .json({
        message: "Error al actualizar la categoría.",
        details: error.message,
      });
  }
});

/**
 * @route   DELETE /api/categories/:id
 * @desc    Eliminar una categoría.
 * @access  Admin
 */
router.delete("/:id", async (req, res) => {
  try {
    // TODO: Considerar qué sucede con los productos de esta categoría. ¿Se desasignan o se impide el borrado?
    const deletedCategory = await Category.findByIdAndDelete(req.params.id);
    if (!deletedCategory) {
      return res.status(404).json({ message: "Categoría no encontrada." });
    }
    res.json({ message: "Categoría eliminada con éxito." });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar la categoría." });
  }
});

module.exports = router;
