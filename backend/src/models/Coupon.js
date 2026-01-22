/**
 * @fileoverview Define el esquema de Mongoose para la colección 'coupons'.
 */

const mongoose = require("mongoose");
const { Schema } = mongoose;

const couponSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
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
      type: Number,
      default: null,
    },
    timesUsed: {
      type: Number,
      default: 0,
    },
    allowedUsers: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Coupon", couponSchema);
