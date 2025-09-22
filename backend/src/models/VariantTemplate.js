/**
 * @fileoverview Define el esquema de Mongoose para la colección 'varianttemplates'.
 */
const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * @schema optionSchema
 * @description Sub-esquema para las opciones dentro de una plantilla de variante.
 */
const optionSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: false,
    },
    price: { type: Number },
    stock: { type: Number },
    costPrice: { type: Number },
  },
  { _id: false }
);

/**
 * @schema variantTemplateSchema
 * @description Esquema principal para una plantilla de variantes.
 */
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
