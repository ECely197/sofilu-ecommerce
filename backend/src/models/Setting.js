/**
 * @fileoverview Define el esquema de Mongoose para la colección 'settings'.
 * Funciona como un almacén clave-valor para configuraciones globales de la aplicación.
 */

const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * @schema settingSchema
 * @description Esquema para una configuración global.
 */
const settingSchema = new Schema({
  /**
   * @property {String} key - El identificador único de la configuración (ej: 'costo-envio', 'impuesto-iva').
   */
  key: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },

  /**
   * @property {Schema.Types.Mixed} value - El valor de la configuración.
   * Puede ser de cualquier tipo (Número, String, Objeto, etc.).
   */
  value: {
    type: Schema.Types.Mixed,
    required: true,
  },
});

module.exports = mongoose.model("Setting", settingSchema);
