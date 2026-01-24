const mongoose = require("mongoose");
const { Schema } = mongoose;

const warrantyTypeSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true, // Ej: "Garantía Extendida"
    },
    durationMonths: {
      type: Number,
      required: true,
      min: 0, // 0 podría ser "Sin garantía" o garantía de por vida si manejamos lógica especial, pero usaremos meses.
    },
    description: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("WarrantyType", warrantyTypeSchema);
