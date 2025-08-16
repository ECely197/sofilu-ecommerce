// Contenido para: backend/src/models/Category.js

const mongoose = require("mongoose");
const { Schema } = mongoose;

const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true, // Elimina espacios en blanco al principio y al final
    },
    slug: {
      type: String,
      required: true,
      unique: true, // No puede haber dos categorías con el mismo slug
      lowercase: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
  },
  {
    // Añade automáticamente las fechas de creación y actualización
    timestamps: true,
  }
);

module.exports = mongoose.model("Category", categorySchema);
