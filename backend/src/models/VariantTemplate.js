// En: backend/src/models/VariantTemplate.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const optionSchema = new Schema(
  {
    name: { type: String, required: true },
    priceModifier: { type: Number, default: null },
    stock: { type: Number, default: null },
    costPrice: { type: Number, default: null },
  },
  { _id: false }
);

const variantTemplateSchema = new Schema(
  {
    templateName: { type: String, required: true, unique: true },
    variantName: { type: String, required: true },
    options: [optionSchema],
  },
  {
    timestamps: true,
    collection: "varianttemplates",
  }
);

module.exports = mongoose.model("VariantTemplate", variantTemplateSchema);
