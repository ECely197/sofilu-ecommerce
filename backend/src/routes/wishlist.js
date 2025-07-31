const express = require('express');
const router = express.Router();
const Wishlist = require('../models/Wishlist');

// --- OBTENER LA WISHLIST DE UN USUARIO ---
// GET /api/wishlist/:userId
router.get('/:userId', async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.params.userId }).populate('products');
    if (!wishlist) {
      // Si no existe, la creamos vacía y la devolvemos.
      const newWishlist = new Wishlist({ userId: req.params.userId, products: [] });
      await newWishlist.save();
      return res.json(newWishlist);
    }
    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener la wishlist' });
  }
});

// --- AÑADIR UN PRODUCTO A LA WISHLIST ---
// POST /api/wishlist/:userId
router.post('/:userId', async (req, res) => {
  const { productId } = req.body;
  try {
    // Buscamos la wishlist del usuario. Usamos 'findOneAndUpdate' para buscar y actualizar.
    // '$addToSet' es un operador de MongoDB que añade un valor a un array solo si no existe ya.
    // '{ new: true, upsert: true }' significa: devuelve el documento actualizado y, si no existe, créalo.
    const updatedWishlist = await Wishlist.findOneAndUpdate(
      { userId: req.params.userId },
      { $addToSet: { products: productId } },
      { new: true, upsert: true }
    ).populate('products');

    res.json(updatedWishlist);
  } catch (error) {
    res.status(500).json({ message: 'Error al añadir a la wishlist' });
  }
});

// --- ELIMINAR UN PRODUCTO DE LA WISHLIST ---
// DELETE /api/wishlist/:userId/:productId
router.delete('/:userId/:productId', async (req, res) => {
  try {
    // Usamos '$pull' para eliminar un valor específico de un array.
    const updatedWishlist = await Wishlist.findOneAndUpdate(
      { userId: req.params.userId },
      { $pull: { products: req.params.productId } },
      { new: true }
    ).populate('products');

    res.json(updatedWishlist);
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar de la wishlist' });
  }
});

module.exports = router;