// En: backend/src/models/User.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

// ¡UN ÚNICO ESQUEMA "ADDRESS" CON TODO INCLUIDO!
const addressSchema = new Schema({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true }, // <-- Añadimos el email aquí
  streetAddress: { type: String, required: true },
  addressDetails: { type: String },
  department: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  isPreferred: { type: Boolean, default: false },
});

const userSchema = new Schema({
  uid: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true }, // Email principal de la cuenta

  // Mantenemos los datos del perfil para el usuario en sí
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  phone: { type: String, trim: true },

  // ¡VOLVEMOS A TENER SOLO UN ARRAY DE DIRECCIONES!
  addresses: [addressSchema],
});

module.exports = mongoose.model("User", userSchema);
