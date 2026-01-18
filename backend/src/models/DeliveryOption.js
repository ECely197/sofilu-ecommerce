/**
 * @fileoverview Define el esquema de Mongoose para las opciones de entrega especial.
 */
const mongoose = require("mongoose");
const { Schema } = mongoose;

const deliveryOptionSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "El nombre es obligatorio."],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "La descripción es obligatoria."],
    },
    imageUrl: {
      type: String,
      required: [true, "La imagen es obligatoria."],
    },
    cost: {
      type: Number,
      required: [true, "El costo es obligatorio."],
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true, // Para buscar rápido las activas
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("DeliveryOption", deliveryOptionSchema);
