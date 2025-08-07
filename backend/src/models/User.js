const mongoose = require('mongoose');
const { Schema } = mongoose;

// Plantilla para una sola dirección
const addressSchema = new Schema({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  streetAddress: { type: String, required: true },
  addressDetails: { type: String },
  department: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true, default: 'Colombia' },
  isPreferred: { type: Boolean, default: false }
});

const userSchema = new Schema({
  // ¡EL CAMBIO CLAVE!
  // Ya no forzamos el _id a ser un String. Dejamos que Mongoose lo maneje,
  // pero añadimos un campo 'uid' para guardar la referencia de Firebase.
  uid: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true },
  displayName: { type: String },
  addresses: [addressSchema] 
});

module.exports = mongoose.model('User', userSchema);