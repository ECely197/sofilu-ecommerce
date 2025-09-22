/**
 * @fileoverview Gestiona las rutas de la API para las reseñas de productos.
 */

const express = require("express");
const router = express.Router();
const Review = require("../models/Review");
const { authMiddleware } = require("../middleware/authMiddleware");

// ==========================================================================
// RUTA PÚBLICA
// ==========================================================================

/**
 * @route   GET /api/reviews/:productId
 * @desc    Obtener todas las reseñas para un producto específico.
 * @access  Public
 */
router.get("/:productId", async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId }).sort(
      { createdAt: -1 }
    );
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener las reseñas." });
  }
});

// ==========================================================================
// RUTA PROTEGIDA
// ==========================================================================

/**
 * @route   POST /api/reviews/:productId
 * @desc    Crear una nueva reseña.
 * @access  Private (Usuario logueado)
 */
router.post("/:productId", authMiddleware, async (req, res) => {
  // TODO: En el futuro, verificar que el req.user.uid haya comprado este producto.
  try {
    const { author, rating, title, comment } = req.body;
    const newReview = new Review({
      productId: req.params.productId,
      author, // Podría reemplazarse con datos de req.user
      rating,
      title,
      comment,
    });
    const savedReview = await newReview.save();
    res.status(201).json(savedReview);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error al guardar la reseña.", details: error.message });
  }
});

module.exports = router;
