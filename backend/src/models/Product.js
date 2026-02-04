/**
 * @fileoverview Define el esquema de Mongoose para la colección 'products'.
 */
const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * @schema optionSchema
 * @description Sub-esquema para las opciones dentro de una variante (ej: "Caja de Regalo", "Bolsa de Dulces").
 * Todos los campos excepto 'name' son ahora opcionales.
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
    price: {
      type: Number,
      default: 0,
    },
    stock: {
      type: Number,
    },
    costPrice: {
      type: Number,
    },
  },
  { _id: false },
);

/**
 * @schema variantSchema
 * @description Sub-esquema para los tipos de variantes de un producto (ej: "Empaque", "Acompañamiento").
 */
const variantSchema = new Schema(
  {
    name: { type: String, required: true },
    options: [optionSchema],
  },
  { _id: false },
);

/**
 * @schema productSchema
 * @description Esquema principal para un producto.
 */
const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, default: 0 },
    costPrice: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    sku: { type: String, trim: true, uppercase: true },
    vendor: { type: Schema.Types.ObjectId, ref: "Vendor" },
    categories: [
      {
        type: Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    images: [{ type: String, required: true }],
    isFeatured: { type: Boolean, default: false },
    isOnSale: { type: Boolean, default: false },
    salePrice: { type: Number },
    status: { type: String, enum: ["Activo", "Agotado"], default: "Activo" },
    warrantyType: {
      type: Schema.Types.ObjectId,
      ref: "WarrantyType",
      default: null,
    },
    variants: [variantSchema],
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Product", productSchema);
