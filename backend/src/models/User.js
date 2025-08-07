const mongoose = require('mongoose');
const { Schema } = mongoose;

// Plantilla para una sola dirección
const addressSchema = new Schema({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  streetAddress: { type: String, required: true },
  addressDetails: { type: String }, // Detalles opcionales
  department: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true, default: 'Colombia' },
  isPreferred: { type: Boolean, default: false }
});

const userSchema = new Schema({
  // Usamos el UID de Firebase como el _id de nuestro documento
  _id: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  displayName: { type: String },
  // Un usuario puede tener un array de direcciones
  addresses: [addressSchema] 
});

// Le decimos a Mongoose que no añada un campo '_id' adicional al subdocumento de dirección
// addressSchema.set('id', false); // Esto puede ayudar a evitar conflictos
// userSchema.set('_id', false); // El _id lo proveeremos nosotros

module.exports = mongoose.model('User', userSchema);