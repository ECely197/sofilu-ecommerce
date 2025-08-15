const mongoose = require("mongoose");
const { Schema } = mongoose;

const settingSchema = new Schema({
  key: { type: String, required: true, unique: true }, // ej: 'shippingCost'
  value: { type: Schema.Types.Mixed, required: true }, // Puede ser un número, texto, etc.
});

module.exports = mongoose.model("Setting", settingSchema);
