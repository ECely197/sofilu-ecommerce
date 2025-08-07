const mongoose = require('mongoose');
const { Schema } = mongoose;

const addressSchema = new Schema({
  // El 'name' ahora será el nombre completo del destinatario
  fullName: { type: String, required: true }, 
  phone: { type: String, required: true },
  streetAddress: { type: String, required: true }, // Calle/Número/Apto
  // Campo opcional para detalles extra
  addressDetails: { type: String }, 
  department: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true, default: 'Colombia' },
  isPreferred: { type: Boolean, default: false } // Para marcar como preferida
});

const userSchema = new Schema({
  _id: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  displayName: { type: String },
  addresses: [addressSchema]
});

module.exports = mongoose.model('User', userSchema);