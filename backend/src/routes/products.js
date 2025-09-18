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
        ],
      };
    }

    if (category) {
      query = { ...query, category: category };
    }

    if (sortBy) {
      sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;
    }

    const products = await Product.find(query).sort(sortOptions);

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
    const newProduct = new Product(req.body);
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error("Error al crear el producto:", error);
    res.status(400).json({
      message: "Error de validación al crear el producto.",
      error: error.message,
    });
  }
});

router.put("/:id", [authMiddleware, adminOnly], async (req, res) => {
  try {
    // --- LOG DE DEPURACIÓN DETALLADO ---
    console.log(
      `--- BACKEND TRACE: Petición PUT recibida para el producto ID: ${req.params.id} ---`
    );
    console.log("--- BACKEND TRACE: Datos recibidos en req.body: ---");
    console.log(JSON.stringify(req.body, null, 2));

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: req.body }, // <--- ¡LA CORRECCIÓN CLAVE ESTÁ AQUÍ!
      { new: true, runValidators: true, context: "query" } // Añadimos context: 'query' para asegurar que los validadores se ejecuten bien con $set
    );

    if (!updatedProduct) {
      console.error(
        `--- BACKEND TRACE: ERROR - Producto con ID ${req.params.id} no encontrado para actualizar.`
      );
      return res
        .status(404)
        .json({ message: "Producto no encontrado para actualizar" });
    }

    console.log(
      "--- BACKEND TRACE: Producto actualizado con éxito en la BBDD. ---"
    );
    res.json(updatedProduct);
  } catch (error) {
    // --- LOG DE ERROR DETALLADO ---
    console.error(
      "--- BACKEND TRACE: ¡ERROR! La operación .findByIdAndUpdate() ha fallado. ---"
    );
    console.error(error); // Mostramos el error completo de Mongoose

    // ¡MEJORA! Verificamos si es un error de validación de Mongoose
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Error de validación. Revisa los datos enviados.",
        details: error.message, // El mensaje de Mongoose es muy descriptivo
      });
    }

    // Si es otro tipo de error, mantenemos la respuesta genérica
    res.status(500).json({
      message: "Error interno del servidor al actualizar el producto.",
      details: error.message,
    });
  }
});
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
