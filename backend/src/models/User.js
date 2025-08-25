// En: backend/src/models/User.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const addressSchema = new Schema({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  streetAddress: { type: String, required: true },
  addressDetails: { type: String }, // ej: "Apto 201, Torre B"
  department: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  isPreferred: { type: Boolean, default: false }, // <-- El campo clave
});

const userSchema = new Schema({
  uid: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true },
  displayName: { type: String },
  addresses: [addressSchema],
});

module.exports = mongoose.model("User", userSchema);
