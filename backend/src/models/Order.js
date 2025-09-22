/**
 * @fileoverview Define el esquema de Mongoose para la colección 'orders'.
 * Almacena la información de las compras realizadas por los usuarios.
 */

const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * @schema orderItemSchema
 * @description Sub-esquema para cada producto dentro de un pedido.
 */
const orderItemSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "La cantidad debe ser al menos 1."],
    },
    price: {
      // Precio unitario al momento de la compra
      type: Number,
      required: true,
    },
    costPrice: {
      // Costo unitario para cálculos de rentabilidad
      type: Number,
      required: true,
      default: 0,
    },
    selectedVariants: {
      // Almacena las variantes seleccionadas, ej: { "Color": "Rojo", "Talla": "M" }
      type: Map,
      of: String,
      required: false,
    },
  },
  { _id: false }
);

/**
 * @schema orderSchema
 * @description Esquema principal para un pedido.
 */
const orderSchema = new Schema({
  userId: {
    type: String,
    required: true,
    index: true, // Indexar para búsquedas rápidas de pedidos por usuario
  },
  customerInfo: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
  },
  shippingAddress: {
    type: Object, // Se almacena una copia de la dirección para preservar el registro histórico
    required: true,
  },
  items: [orderItemSchema],
  appliedCoupon: {
    type: String,
    default: null,
  },
  discountAmount: {
    type: Number,
    default: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ["Procesando", "Enviado", "Entregado", "Cancelado"],
    default: "Procesando",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Order", orderSchema);
