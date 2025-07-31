const express = require('express');
const router = express.Router();
const Review = require('../models/Review');

// --- OBTENER RESEÑAS PARA UN PRODUCTO ESPECÍFICO ---
// GET /api/reviews/:productId
router.get('/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener las reseñas' });
  }
});

// --- CREAR UNA NUEVA RESEÑA ---
// POST /api/reviews/:productId
router.post('/:productId', async (req, res) => {
  // En un futuro, verificaríamos que el usuario haya comprado el producto
  const { author, rating, title, comment } = req.body;
  const newReview = new Review({
    productId: req.params.productId,
    author,
    rating,
    title,
    comment
  });
  try {
    const savedReview = await newReview.save();
    res.status(201).json(savedReview);
  } catch (error) {
    res.status(400).json({ message: 'Error al guardar la reseña' });
  }
});

module.exports = router;