const mongoose = require('mongoose');
const { Schema } = mongoose;

// Plantilla para una sola dirección
const addressSchema = new Schema({
  name: { type: String, required: true }, // Ej: "Casa", "Oficina"
  address: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  phone: { type: String, required: true },
});

const userSchema = new Schema({
  _id: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  displayName: { type: String },
  // ¡Añadimos el array de direcciones!
  addresses: [addressSchema] 
});

module.exports = mongoose.model('User', userSchema);