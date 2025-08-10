const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const { authMiddleware, adminOnly } = require("../middleware/authMiddleware");

/**
 * RUTAS DE PRODUCTOS
 * - Las rutas más específicas deben ir antes que las rutas con parámetros genéricos.
 * - Las rutas públicas están primero, luego las protegidas (admin).
 */

// ===============================
// RUTAS PÚBLICAS (para el cliente)
// ===============================

/**
 * GET /api/products/section/featured
 * Obtener productos destacados (máximo 4).
 */
router.get("/section/featured", async (req, res) => {
  try {
    const featuredProducts = await Product.find({ isFeatured: true }).limit(4);
    res.json(featuredProducts);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener productos destacados" });
  }
});

/**
 * GET /api/products/section/sale
 * Obtener productos en oferta.
 */
router.get("/section/sale", async (req, res) => {
  try {
    const saleProducts = await Product.find({ isOnSale: true });
    res.json(saleProducts);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener productos en oferta" });
  }
});

/**
 * GET /api/products
 * Obtener todos los productos.
 */
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener los productos" });
  }
});

/**
 * GET /api/products/:id
 * Obtener un solo producto por ID.
 * (Esta ruta debe ir después de las rutas específicas para evitar conflictos)
 */
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
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

/**
 * POST /api/products
 * Crear un nuevo producto.
 * Protegida por authMiddleware y adminOnly.
 */
// --- RUTA DE CREACIÓN CON RASTREO DETALLADO ---
router.post("/", [authMiddleware, adminOnly], async (req, res) => {
  // --- LOG DE RASTREO #1 ---
  console.log(
    "--- BACKEND TRACE: ¡Hemos pasado los middlewares! Entrando a la lógica de la ruta POST /api/products ---"
  );

  try {
    // --- LOG DE RASTREO #2 ---
    console.log(
      "--- BACKEND TRACE: Dentro del bloque TRY. El cuerpo de la petición (req.body) es: ---"
    );
    console.log(JSON.stringify(req.body, null, 2));

    const newProduct = new Product(req.body);

    // --- LOG DE RASTREO #3 ---
    console.log(
      "--- BACKEND TRACE: Objeto de Mongoose construido. Intentando guardar... ---"
    );

    const savedProduct = await newProduct.save();

    // --- LOG DE RASTREO #4 (ÉXITO) ---
    console.log(
      "--- BACKEND TRACE: ¡Producto guardado con éxito en la base de datos! ---"
    );
    res.status(201).json(savedProduct);
  } catch (error) {
    // --- LOG DE RASTREO #5 (ERROR) ---
    console.error(
      "--- BACKEND TRACE: ¡ERROR! La operación .save() ha fallado. Error de Mongoose: ---"
    );
    console.error(error); // Mostramos el error completo y detallado

    res.status(400).json({
      message: "Error de validación al crear el producto.",
      error: error.message,
      details: error, // Enviamos el error completo para depurar en el frontend si es necesario
    });
  }
});

/**
 * PUT /api/products/:id
 * Actualizar un producto existente por ID.
 * Protegida por authMiddleware y adminOnly.
 */
router.put("/:id", [authMiddleware, adminOnly], async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedProduct) {
      return res
        .status(404)
        .json({ message: "Producto no encontrado para actualizar" });
    }
    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: "Error al actualizar el producto" });
  }
});

/**
 * DELETE /api/products/:id
 * Eliminar un producto por ID.
 * Protegida por authMiddleware y adminOnly.
 */
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
