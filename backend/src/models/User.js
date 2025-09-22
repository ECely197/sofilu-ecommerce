/**
 * @fileoverview Define el esquema de Mongoose para la colección 'users'.
 * Este modelo representa a un usuario en la base de datos, almacenando su
 * información de autenticación de Firebase, datos personales y direcciones.
 */

const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * @schema addressSchema
 * @description Sub-esquema para las direcciones de un usuario.
 * Contiene todos los campos necesarios para el envío y la facturación.
 */
const addressSchema = new Schema(
  {
    fullName: {
      type: String,
      required: [true, "El nombre completo es obligatorio."],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "El teléfono es obligatorio."],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "El email de contacto es obligatorio."],
      trim: true,
    },
    streetAddress: {
      type: String,
      required: [true, "La dirección (calle) es obligatoria."],
    },
    addressDetails: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      required: [true, "El departamento es obligatorio."],
    },
    city: {
      type: String,
      required: [true, "La ciudad es obligatoria."],
    },
    postalCode: {
      type: String,
      required: [true, "El código postal es obligatorio."],
    },
    isPreferred: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
); // Se mantiene el _id para poder identificar unívocamente cada dirección.

/**
 * @schema userSchema
 * @description Esquema principal para un usuario.
 */
const userSchema = new Schema(
  {
    /**
     * @property {String} uid - Identificador único de Firebase.
     * Es la clave principal para vincular con el sistema de autenticación.
     */
    uid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    /**
     * @property {String} email - Correo electrónico principal de la cuenta.
     */
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    /**
     * @property {String} firstName - Nombre del usuario.
     */
    firstName: {
      type: String,
      trim: true,
    },

    /**
     * @property {String} lastName - Apellido del usuario.
     */
    lastName: {
      type: String,
      trim: true,
    },

    /**
     * @property {String} phone - Teléfono de contacto principal del usuario.
     */
    phone: {
      type: String,
      trim: true,
    },

    /**
     * @property {Array<addressSchema>} addresses - Lista de direcciones guardadas por el usuario.
     */
    addresses: [addressSchema],
  },
  {
    timestamps: true, // Agrega createdAt y updatedAt automáticamente.
  }
);

module.exports = mongoose.model("User", userSchema);
