// En: backend/src/models/Vendor.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const vendorSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    }, // Ej: "Telas Inc.", "Confecciones Sofía"
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vendor", vendorSchema);
