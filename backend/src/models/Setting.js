/**
 * @fileoverview Define un esquema único para almacenar todas las configuraciones de la tienda.
 */
const mongoose = require("mongoose");
const { Schema } = mongoose;

// Sub-esquema para las redes sociales
const socialLinkSchema = new Schema(
  {
    platform: { type: String, required: true }, // ej: 'instagram', 'facebook', 'telegram'
    url: { type: String, required: true },
  },
  { _id: false },
);

const settingSchema = new Schema({
  // Usamos una clave fija para encontrar siempre este único documento
  uniqueId: { type: String, default: "global-settings", unique: true },

  // --- Información de la Tienda ---
  storeName: { type: String, default: "Sofilu Store" },
  storeLogoUrl: { type: String, default: "" },
  contactEmail: { type: String, default: "" },
  whatsappNumber: { type: String, default: "573001234567" },

  // --- Envíos ---
  shippingCostBogota: { type: Number, default: 0 },
  shippingCostNational: { type: Number, default: 0 },

  // --- ¡AQUÍ ESTÁ LA LÍNEA QUE FALTABA! ---
  customDeliveryCost: { type: Number, default: 0 },

  // --- Tarifas ---
  serviceFeePercentage: { type: Number, default: 0, min: 0, max: 100 },

  // --- Redes Sociales ---
  socialLinks: [socialLinkSchema],
});

module.exports = mongoose.model("Setting", settingSchema);
