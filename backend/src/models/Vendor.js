/**
 * @fileoverview Define el esquema de Mongoose para la colección 'vendors'.
 * Representa a los fabricantes, marcas o proveedores de los productos.
 */

const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * @schema vendorSchema
 * @description Esquema para un proveedor o marca.
 */
const vendorSchema = new Schema(
  {
    /**
     * @property {String} name - El nombre único del proveedor.
     */
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Vendor", vendorSchema);
