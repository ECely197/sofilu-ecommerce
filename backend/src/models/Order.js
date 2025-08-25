// Contenido completo y final para: backend/src/models/Order.js

const mongoose = require("mongoose");
const { Schema } = mongoose;

// --- Sub-esquema para un solo ítem dentro de un pedido ---
const orderItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  selectedVariants: {
    type: Map,
    of: String,
    required: false, // Lo hacemos no requerido por si algún producto no tiene variantes
  },
});

// --- Esquema para el pedido completo ---
const orderSchema = new Schema({
  userId: {
    type: String,
    required: true,
  },
  customerInfo: {
    name: { type: String, required: true },
    email: { type: String, required: true },
  },
  shippingAddress: {
    type: Object,
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
