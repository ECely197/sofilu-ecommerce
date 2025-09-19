// En: backend/src/models/Product.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

// SUB-ESQUEMA PARA LAS OPCIONES
const optionSchema = new Schema(
  {
    name: { type: String, required: true },
    priceModifier: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    costPrice: { type: Number, default: 0 },
  },
  { _id: false }
);

const variantSchema = new Schema(
  {
    name: { type: String, required: true },
    options: [optionSchema],
  },
  { _id: false }
);

// ESQUEMA PRINCIPAL DEL PRODUCTO
const productSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    sku: { type: String, trim: true, uppercase: true },
    vendor: { type: Schema.Types.ObjectId, ref: "Vendor" },
    price: { type: Number, default: 0 },
    costPrice: { type: Number, default: 0 },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    images: [{ type: String, required: true }],
    isFeatured: { type: Boolean, default: false },
    isOnSale: { type: Boolean, default: false },
    salePrice: { type: Number },
    variants: [variantSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
