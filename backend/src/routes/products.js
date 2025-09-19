// Contenido completo y actualizado para: backend/src/routes/products.js

const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Category = require("../models/Category"); // <-- ¡NUEVA IMPORTACIÓN!
const { authMiddleware, adminOnly } = require("../middleware/authMiddleware");

// ===============================
// RUTAS PÚBLICAS (para el cliente)
// ===============================

router.get("/", async (req, res) => {
  try {
    const { search, category, sortBy, sortOrder } = req.query;

    let query = {};
    let sortOptions = {};

    if (search) {
      query = {
        ...query,
        $or: [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { sku: { $regex: search, $options: "i" } },
        ],
      };
    }

    if (category) {
      query = { ...query, category: category };
    }

    if (sortBy) {
      sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;
    }

    const products = await Product.find(query)
      .populate("vendor")
      .sort(sortOptions);

    res.json(products);
  } catch (error) {
    console.error("Error al buscar o filtrar productos:", error);
    res.status(500).json({ message: "Error al obtener los productos" });
  }
});

router.get("/section/featured", async (req, res) => {
  try {
    const featuredProducts = await Product.find({ isFeatured: true }).limit(4);
    res.json(featuredProducts);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener productos destacados" });
  }
});

router.get("/section/featured/all", async (req, res) => {
  try {
    const allFeaturedProducts = await Product.find({ isFeatured: true });
    res.json(allFeaturedProducts);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener todos los productos destacados" });
  }
});

router.get("/section/sale", async (req, res) => {
  try {
    const saleProducts = await Product.find({ isOnSale: true });
    res.json(saleProducts);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener productos en oferta" });
  }
});

router.get("/category/:slug", async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });

    if (!category) {
      console.log(
        `No se encontró la categoría con el slug: ${req.params.slug}`
      );
      return res.json([]);
    }

    const products = await Product.find({ category: category._id });

    console.log(
      `Se encontraron ${products.length} productos para la categoría "${category.name}"`
    );
    res.json(products);
  } catch (error) {
    console.error("Error al obtener productos por categoría:", error);
    res
      .status(500)
      .json({ message: "Error al obtener los productos por categoría" });
  }
});

// IMPORTANTE: La ruta genérica /:id debe ir DESPUÉS de las rutas más específicas.
router.get("/:id", async (req, res) => {
  try {
    // Populamos la categoría para obtener su nombre, etc.
    const product = await Product.findById(req.params.id).populate("category");
    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener el producto" });
  }
});

// ===================================
// RUTAS PROTEGIDAS (solo administradores)
// ===================================

router.post("/", [authMiddleware, adminOnly], async (req, res) => {
  try {
    const {
      name,
      description,
      sku,
      vendor,
      price,
      costPrice,
      category,
      images,
      isFeatured,
      isOnSale,
      salePrice,
      variants,
    } = req.body;

    const newProduct = new Product({
      name,
      description,
      sku,
      vendor,
      price,
      costPrice,
      category,
      images,
      isFeatured,
      isOnSale,
      salePrice,
      variants,
    });

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

// --- ACTUALIZAR UN PRODUCTO ---
router.put("/:id", [authMiddleware, adminOnly], async (req, res) => {
  try {
    console.log(
      `--- BACKEND TRACE: Petición PUT para producto ID: ${req.params.id} ---`
    );
    console.log(
      "--- BACKEND TRACE: Datos recibidos:",
      JSON.stringify(req.body, null, 2)
    );

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true, context: "query" }
    );

    if (!updatedProduct) {
      return res
        .status(404)
        .json({ message: "Producto no encontrado para actualizar" });
    }

    console.log("--- BACKEND TRACE: Producto actualizado con éxito. ---");
    res.json(updatedProduct);
  } catch (error) {
    console.error(
      "--- BACKEND TRACE: ERROR en .findByIdAndUpdate() ---",
      error
    );
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Error de validación.",
        details: error.message,
      });
    }
    res.status(500).json({
      message: "Error interno del servidor al actualizar el producto.",
      details: error.message,
    });
  }
});

// Eliminar un producto por ID
router.delete("/:id", [authMiddleware, adminOnly], async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res
        .status(404)
        .json({ message: "Producto no encontrado para eliminar" });
    }
    res.json({ message: "Producto eliminado con éxito" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar el producto" });
  }
});

module.exports = router;
