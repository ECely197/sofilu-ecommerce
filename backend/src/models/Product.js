// Contenido completo y final para: backend/src/models/Product.js

const mongoose = require("mongoose");
const { Schema } = mongoose;

// --- SUB-ESQUEMA PARA LAS OPCIONES (CORREGIDO) ---
// Cada opción es un objeto con su propio nombre, modificador de precio y stock.
const optionSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    priceModifier: {
      type: Number,
      required: true,
      default: 0,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { _id: false }
);

// --- SUB-ESQUEMA PARA LAS VARIANTES ---
const variantSchema = new Schema(
  {
    name: { type: String, required: true },
    options: [optionSchema], // ¡AHORA USA EL optionSchema CORRECTO!
  },
  { _id: false }
);

// --- ESQUEMA PRINCIPAL DEL PRODUCTO ---
const productSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: {
      type: Number,
      default: 0,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    images: [{ type: String, required: true }],
    isFeatured: { type: Boolean, default: false },
    isOnSale: { type: Boolean, default: false },
    salePrice: { type: Number },
    variants: [variantSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", productSchema);
