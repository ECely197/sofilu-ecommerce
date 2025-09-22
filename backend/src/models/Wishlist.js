/**
 * @fileoverview Define el esquema de Mongoose para la colección 'wishlists'.
 * Cada documento representa la lista de deseos de un usuario específico.
 */

const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * @schema wishlistSchema
 * @description Esquema para la lista de deseos de un usuario.
 */
const wishlistSchema = new Schema(
  {
    /**
     * @property {String} userId - El UID del usuario de Firebase.
     * Vincula esta lista de deseos a una cuenta de usuario única.
     */
    userId: {
      type: String,
      required: true,
      unique: true, // Asegura que cada usuario solo tenga una lista de deseos.
      index: true,
    },

    /**
     * @property {Array<ObjectId>} products - Un array de IDs de productos.
     * Contiene las referencias a los productos que el usuario ha añadido a su lista.
     */
    products: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
  },
  {
    timestamps: true, // Agrega createdAt y updatedAt.
  }
);

module.exports = mongoose.model("Wishlist", wishlistSchema);
