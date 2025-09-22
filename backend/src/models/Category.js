/**
 * @fileoverview Define el esquema de Mongoose para la colección 'categories'.
 * Las categorías se utilizan para agrupar productos (ej: "Ropa", "Electrónica").
 */

const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * @schema categorySchema
 * @description Esquema para una categoría de productos.
 */
const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    section: {
      type: Schema.Types.ObjectId,
      ref: "Section",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Middleware de Mongoose que se ejecuta antes de guardar un documento ('pre-save').
 * Genera automáticamente un 'slug' a partir del campo 'name' si este ha sido modificado.
 * El slug es una versión amigable para URL del nombre.
 */
categorySchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = this.name
      .toLowerCase()
      .replace(/\s+/g, "-") // Reemplaza espacios con guiones
      .replace(/[^\w-]+/g, ""); // Elimina caracteres no alfanuméricos excepto guiones
  }
  next();
});

module.exports = mongoose.model("Category", categorySchema);
