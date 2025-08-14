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

  // --- ¡LA LÍNEA QUE FALTABA! ---
  // Este campo guardará las variantes seleccionadas por el cliente.
  // Usamos el tipo 'Map' de Mongoose, que es perfecto para almacenar
  // un objeto de clave-valor como { "Talla": "M", "Color": "Azul" }.
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
  items: [orderItemSchema], // El array de items ahora usará el nuevo sub-esquema
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
