/**
 * @fileoverview Gestiona las rutas de la API para la lista de deseos de los usuarios.
 */

const express = require("express");
const router = express.Router();
const Wishlist = require("../models/Wishlist");
const { authMiddleware } = require("../middleware/authMiddleware");

// Middleware de autenticación para todas las rutas de este archivo
router.use(authMiddleware);

/**
 * @route   GET /api/wishlist/:userId
 * @desc    Obtener la lista de deseos de un usuario.
 * @access  Private
 */
router.get("/:userId", async (req, res) => {
  try {
    // Si la wishlist no existe, se crea una vacía al instante.
    const wishlist = await Wishlist.findOneAndUpdate(
      { userId: req.params.userId },
      { $setOnInsert: { userId: req.params.userId, products: [] } },
      { upsert: true, new: true }
    ).populate("products");

    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener la wishlist." });
  }
});

/**
 * @route   POST /api/wishlist/:userId
 * @desc    Añadir un producto a la lista de deseos.
 * @access  Private
 */
router.post("/:userId", async (req, res) => {
  const { productId } = req.body;
  const { userId } = req.params;

  try {
    // $addToSet es una operación atómica que previene duplicados.
    // 'upsert: true' crea la wishlist si no existe.
    await Wishlist.updateOne(
      { userId },
      { $addToSet: { products: productId } },
      { upsert: true }
    );

    // Devolvemos la lista actualizada y populada.
    const updatedWishlist = await Wishlist.findOne({ userId }).populate(
      "products"
    );
    res.json(updatedWishlist);
  } catch (error) {
    console.error("Error al añadir a la wishlist:", error);
    res.status(500).json({ message: "Error al añadir a la wishlist." });
  }
});

/**
 * @route   DELETE /api/wishlist/:userId/:productId
 * @desc    Eliminar un producto de la lista de deseos.
 * @access  Private
 */
router.delete("/:userId/:productId", async (req, res) => {
  const { userId, productId } = req.params;

  try {
    // $pull quita el elemento del array.
    const wishlist = await Wishlist.findOneAndUpdate(
      { userId },
      { $pull: { products: productId } },
      { new: true } // Devolvemos el documento actualizado
    ).populate("products");

    if (!wishlist) {
      return res.json({ userId, products: [] });
    }

    res.json(wishlist);
  } catch (error) {
    console.error("Error al eliminar de la wishlist:", error);
    res.status(500).json({ message: "Error al eliminar de la wishlist." });
  }
});

module.exports = router;
