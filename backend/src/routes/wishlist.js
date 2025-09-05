// En: backend/src/routes/wishlist.js

const express = require("express");
const router = express.Router();
const Wishlist = require("../models/Wishlist");
const { authMiddleware } = require("../middleware/authMiddleware"); // Quitamos 'adminOnly' que no se usa

// --- OBTENER LA WISHLIST DE UN USUARIO (SIN CAMBIOS) ---
router.get("/:userId", [authMiddleware], async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({
      userId: req.params.userId,
    }).populate("products");
    if (!wishlist) {
      // Si no existe, creamos una vacía. Esto está bien.
      wishlist = new Wishlist({ userId: req.params.userId, products: [] });
      await wishlist.save();
    }
    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener la wishlist" });
  }
});

// --- AÑADIR UN PRODUCTO A LA WISHLIST (REFACTORIZADO) ---
router.post("/:userId", [authMiddleware], async (req, res) => {
  const { productId } = req.body;
  const { userId } = req.params;

  try {
    // 1. Actualizamos el documento. $addToSet previene duplicados.
    //    'upsert: true' crea la wishlist si no existe.
    await Wishlist.updateOne(
      { userId: userId },
      { $addToSet: { products: productId } },
      { upsert: true }
    );

    // 2. Después de actualizar, hacemos una segunda consulta para obtener la lista completa y populada.
    //    Esto es más seguro y predecible que encadenar .populate() a un update.
    const updatedWishlist = await Wishlist.findOne({ userId: userId }).populate(
      "products"
    );

    res.json(updatedWishlist);
  } catch (error) {
    console.error("Error al añadir a la wishlist:", error);
    res.status(500).json({ message: "Error al añadir a la wishlist" });
  }
});

// --- ELIMINAR UN PRODUCTO DE LA WISHLIST (REFACTORIZADO) ---
router.delete("/:userId/:productId", [authMiddleware], async (req, res) => {
  const { userId, productId } = req.params;

  try {
    // 1. Actualizamos el documento usando $pull para quitar el producto del array.
    await Wishlist.updateOne(
      { userId: userId },
      { $pull: { products: productId } }
    );

    // 2. Hacemos una segunda consulta para devolver la lista actualizada y populada.
    const updatedWishlist = await Wishlist.findOne({ userId: userId }).populate(
      "products"
    );

    // Si después de eliminar, la wishlist no se encuentra (caso muy raro), devolvemos una vacía.
    if (!updatedWishlist) {
      return res.json({ userId: userId, products: [] });
    }

    res.json(updatedWishlist);
  } catch (error) {
    console.error("Error al eliminar de la wishlist:", error);
    res.status(500).json({ message: "Error al eliminar de la wishlist" });
  }
});

module.exports = router;
