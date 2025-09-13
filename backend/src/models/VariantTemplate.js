// En: backend/src/models/VariantTemplate.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const optionSchema = new Schema(
  {
    name: { type: String, required: true },
  },
  { _id: false }
);

const variantTemplateSchema = new Schema(
  {
    templateName: { type: String, required: true, unique: true }, // Ej: "Tallas de Ropa (S-XL)"
    variantName: { type: String, required: true }, // Ej: "Talla"
    options: [optionSchema], // Ej: [{name: 'S'}, {name: 'M'}, {name: 'L'}, {name: 'XL'}]
  },
  { timestamps: true }
);

module.exports = mongoose.model("VariantTemplate", variantTemplateSchema);
