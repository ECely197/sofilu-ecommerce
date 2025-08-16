const mongoose = require("mongoose");
const { Schema } = mongoose;

const couponSchema = new Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  discountType: {
    type: String,
    required: true,
    enum: ["Porcentaje", "Monto Fijo"],
  },
  value: { type: Number, required: true },
  appliesTo: {
    type: String,
    required: true,
    enum: ["Subtotal", "Envío", "Todo"],
    default: "Subtotal",
  },
  expirationDate: { type: Date },
  usageLimit: { type: Number, default: null }, // Límite total de usos
  timesUsed: { type: Number, default: 0 },
});

module.exports = mongoose.model("Coupon", couponSchema);
