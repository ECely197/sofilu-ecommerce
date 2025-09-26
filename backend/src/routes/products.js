/**
 * @fileoverview Gestiona todas las rutas de la API relacionadas con los productos.
 * Incluye operaciones públicas para la visualización y búsqueda de productos,
 * así como rutas protegidas para la gestión de inventario (CRUD).
 */

const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Category = require("../models/Category");
const { authMiddleware, adminOnly } = require("../middleware/authMiddleware");

// ==========================================================================
// RUTAS PÚBLICAS (Accesibles para cualquier cliente)
// ==========================================================================

/**
 * @route   GET /api/products
 * @desc    Obtener todos los productos con filtros, búsqueda y ordenamiento.
 * @access  Public
 * @query   search - Término de búsqueda para nombre, descripción o SKU.
 * @query   category - ID de la categoría para filtrar.
 * @query   sortBy - Campo por el cual ordenar (ej: 'price', 'createdAt').
 * @query   sortOrder - 'asc' o 'desc'.
 */
router.get("/", async (req, res) => {
  try {
    const { search, category, sortBy, sortOrder } = req.query;
    let query = {};
    let sortOptions = {};

    if (search) {
      const regex = { $regex: search, $options: "i" }; // Búsqueda insensible a mayúsculas
      query.$or = [{ name: regex }, { description: regex }, { sku: regex }];
    }

    if (category) {
      query.category = category;
    }

    if (sortBy) {
      sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;
    }

    const products = await Product.find(query)
      .populate("vendor")
      .sort(sortOptions);

    res.json(products);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res
      .status(500)
      .json({ message: "Error del servidor al obtener productos." });
  }
});

/**
 * @route   GET /api/products/section/featured
 * @desc    Obtener una cantidad limitada de productos destacados para el home.
 * @access  Public
 */
router.get("/section/featured", async (req, res) => {
  try {
    const featuredProducts = await Product.find({ isFeatured: true });
    res.json(featuredProducts);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener productos destacados." });
  }
});

/**
 * @route   GET /api/products/section/featured/all
 * @desc    Obtener TODOS los productos destacados.
 * @access  Public
 */
router.get("/section/featured/all", async (req, res) => {
  try {
    const allFeaturedProducts = await Product.find({ isFeatured: true });
    res.json(allFeaturedProducts);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener todos los productos destacados." });
  }
});

/**
 * @route   GET /api/products/section/sale
 * @desc    Obtener todos los productos en oferta.
 * @access  Public
 */
router.get("/section/sale", async (req, res) => {
  try {
    const saleProducts = await Product.find({ isOnSale: true });
    res.json(saleProducts);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener productos en oferta." });
  }
});

/**
 * @route   GET /api/products/category/:slug
 * @desc    Obtener todos los productos de una categoría específica por su slug.
 * @access  Public
 */
router.get("/category/:slug", async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    if (!category) {
      // No es un error, simplemente no hay productos para una categoría inexistente.
      return res.json([]);
    }
    const products = await Product.find({ category: category._id });
    res.json(products);
  } catch (error) {
    console.error("Error al obtener productos por categoría:", error);
    res
      .status(500)
      .json({ message: "Error al obtener productos por categoría." });
  }
});

/**
 * @route   GET /api/products/:id
 * @desc    Obtener un producto único por su ID.
 * @access  Public
 * @note    Esta ruta debe ir después de las rutas más específicas como '/section/...'
 */
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "category vendor"
    );
    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado." });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener el producto." });
  }
});

// ==========================================================================
// RUTAS PROTEGIDAS (Solo accesibles para Administradores)
// ==========================================================================

// Middleware que protege todas las rutas definidas a continuación.
router.use(authMiddleware, adminOnly);

/**
 * @route   POST /api/products
 * @desc    Crear un nuevo producto.
 * @access  Admin
 */
router.post("/", async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error("Error al crear el producto:", error);
    res.status(400).json({
      message: "Error de validación al crear el producto.",
      details: error.message,
    });
  }
});

/**
 * @route   PUT /api/products/:id
 * @desc    Actualizar un producto existente.
 * @access  Admin
 */
router.put("/:id", async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true } // Opciones para devolver el doc actualizado y correr validaciones.
    );

    if (!updatedProduct) {
      return res
        .status(404)
        .json({ message: "Producto no encontrado para actualizar." });
    }
    res.json(updatedProduct);
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    res.status(500).json({
      message: "Error interno al actualizar el producto.",
      details: error.message,
    });
  }
});

/**
 * Ruta Patch PAra actualizar el estado de un pedido
 ***/

router.patch("/:id/status", [authMiddleware, adminOnly], async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Activo", "Agotado"].includes(status)) {
      return res.status(400).json({ message: "Estado no válido." });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: { status: status } },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Producto no encontrado." });
    }
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({
      message: "Error al actualizar el estado del producto.",
      details: error.message,
    });
  }
});

/**
 * @route   DELETE /api/products/:id
 * @desc    Eliminar un producto.
 * @access  Admin
 */
router.delete("/:id", async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res
        .status(404)
        .json({ message: "Producto no encontrado para eliminar." });
    }
    res.json({ message: "Producto eliminado con éxito." });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar el producto." });
  }
});

module.exports = router;
