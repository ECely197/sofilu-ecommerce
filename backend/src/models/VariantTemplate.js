// En: backend/src/models/VariantTemplate.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const optionSchema = new Schema(
  {
    name: { type: String, required: true },
    // Campos opcionales sin 'default: null' para máxima flexibilidad
    priceModifier: { type: Number },
    stock: { type: Number },
    costPrice: { type: Number },
  },
  { _id: false }
);

const variantTemplateSchema = new Schema(
  {
    templateName: { type: String, required: true, unique: true, trim: true },
    variantName: { type: String, required: true, trim: true },
    options: [optionSchema],
  },
  {
    timestamps: true,
    collection: "varianttemplates",
  }
);

module.exports = mongoose.model("VariantTemplate", variantTemplateSchema);
