// Contenido para: backend/src/models/Category.js

const mongoose = require("mongoose");
const { Schema } = mongoose;

const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    imageUrl: { type: String, required: true },
    section: { type: Schema.Types.ObjectId, ref: "Section", required: true },
  },
  { timestamps: true }
);

// --- ¡NUEVA LÓGICA AQUÍ! ---
// Este código se ejecutará automáticamente ANTES de que un documento 'Category' se guarde.
categorySchema.pre("save", function (next) {
  // Solo genera el slug si el nombre ha sido modificado (o es nuevo)
  if (this.isModified("name")) {
    this.slug = this.name
      .toLowerCase()
      .replace(/\s+/g, "-") // Reemplaza espacios con -
      .replace(/[^\w-]+/g, ""); // Elimina caracteres no válidos
  }
  next();
});

module.exports = mongoose.model("Category", categorySchema);
