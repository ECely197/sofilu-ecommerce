/**
 * @fileoverview Define el esquema de Mongoose para la colección 'reviews'.
 * Almacena las reseñas y calificaciones de los productos escritas por los usuarios.
 */

const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * @schema reviewSchema
 * @description Esquema para la reseña de un producto.
 */
const reviewSchema = new Schema({
  /**
   * @property {ObjectId} productId - Referencia al producto que está siendo reseñado.
   */
  productId: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
    index: true,
  },

  /**
   * @property {String} userId - (Futura implementación) UID de Firebase del autor.
   */
  // userId: { type: String, required: true },

  /**
   * @property {String} author - Nombre del autor de la reseña.
   */
  author: {
    type: String,
    required: true,
    default: "Anónimo",
  },

  /**
   * @property {Number} rating - Calificación en estrellas, de 1 a 5.
   */
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },

  /**
   * @property {String} title - Título principal de la reseña.
   */
  title: {
    type: String,
    required: true,
  },

  /**
   * @property {String} comment - El cuerpo o contenido de la reseña.
   */
  comment: {
    type: String,
    required: true,
  },

  /**
   * @property {Date} createdAt - Fecha de creación de la reseña.
   */
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Review", reviewSchema);
