/**
 * @fileoverview Define el esquema de Mongoose para la colección 'sections'.
 * Las secciones son las divisiones principales del sitio (ej: "Hombre", "Mujer", "Niños").
 */

const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * @schema sectionSchema
 * @description Esquema para una sección principal de navegación.
 */
const sectionSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Middleware de Mongoose que se ejecuta antes de guardar ('pre-save').
 * Genera un 'slug' amigable para URL a partir del campo 'name'.
 */
sectionSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, "-");
  }
  next();
});

module.exports = mongoose.model("Section", sectionSchema);
