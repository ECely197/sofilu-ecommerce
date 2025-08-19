// Contenido completo y final para: backend/src/models/Product.js

const mongoose = require("mongoose");
const { Schema } = mongoose;

// --- ¡NUEVO SUB-ESQUEMA PARA LAS OPCIONES! ---
// Cada opción ahora es un objeto con su propio nombre, modificador de precio y stock.
const optionSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    priceModifier: {
      type: Number,
      required: true,
      default: 0, // Por defecto, una opción no cambia el precio. Si es +10000, el producto costará 10000 más.
    },
    stock: {
      type: Number,
      required: true,
      default: 0, // Por defecto, las nuevas opciones no tienen stock.
    },
  },
  { _id: false }
);

const variantSchema = new Schema(
  {
    name: { type: String, required: true },
    options: [optionSchema], // El array de opciones ahora usará el nuevo sub-esquema
  },
  { _id: false }
);

const productSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },

    // Este es ahora el PRECIO BASE. El precio final será base + priceModifier de la variante.
    price: { type: Number, required: true },

    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    images: [{ type: String, required: true }],
    isFeatured: { type: Boolean, default: false },
    isOnSale: { type: Boolean, default: false },
    salePrice: { type: Number }, // Este se aplicará sobre el precio final (base + modificador)
    variants: [variantSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", productSchema);
