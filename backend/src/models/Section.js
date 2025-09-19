// En: backend/src/models/Section.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const sectionSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

// Hook para generar el slug automáticamente
sectionSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, "-");
  }
  next();
});

module.exports = mongoose.model("Section", sectionSchema);
