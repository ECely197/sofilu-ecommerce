/**
 * @fileoverview Define el esquema de Mongoose para la colección 'coupons'.
 * Representa los cupones de descuento que se pueden aplicar en el carrito de compras.
 */

const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * @schema couponSchema
 * @description Esquema para un cupón de descuento.
 */
const couponSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    discountType: {
      type: String,
      required: true,
      enum: ["Porcentaje", "Monto Fijo"],
    },
    value: {
      type: Number,
      required: true,
    },
    appliesTo: {
      type: String,
      required: true,
      enum: ["Subtotal", "Envío", "Todo"],
      default: "Subtotal",
    },
    expirationDate: {
      type: Date,
    },
    usageLimit: {
      // Límite total de usos para este cupón. 'null' significa ilimitado.
      type: Number,
      default: null,
    },
    timesUsed: {
      // Contador de cuántas veces se ha usado el cupón.
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Coupon", couponSchema);
