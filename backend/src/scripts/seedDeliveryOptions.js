/**
 * @fileoverview Script para sembrar las opciones de entrega por defecto en la base de datos.
 * Ejecución: node src/scripts/seedDeliveryOptions.js
 */
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const DeliveryOption = require("../models/DeliveryOption");

async function seed() {
  if (!process.env.MONGO_URI) {
    console.error("Error: MONGO_URI no está definido en las variables de entorno.");
    process.exit(1);
  }

  try {
    console.log("Conectando a MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Conexión exitosa.");

    // 1. Migrar opciones existentes sin tipo a 'special'
    console.log("Migrando opciones existentes sin campo 'type'...");
    const migrationResult = await DeliveryOption.updateMany(
      { type: { $exists: false } },
      { $set: { type: "special" } }
    );
    console.log(`Migración completada. Modificados: ${migrationResult.modifiedCount}`);

    // 2. Sembrar las opciones por defecto si no existen sus respectivos tipos
    const defaultOptions = [
      {
        name: "Envío Estándar (Nacional)",
        description: "Envío a nivel nacional por transportadora terrestre.",
        cost: 15000,
        type: "standard",
        isActive: true,
      },
      {
        name: "Envío Local (Bogotá)",
        description: "Entrega express a domicilio en Bogotá.",
        cost: 10000,
        type: "local",
        isActive: true,
      },
      {
        name: "Recoger en Tienda",
        description: "Retira tu pedido directamente en nuestro punto físico gratis.",
        cost: 0,
        type: "pickup",
        isActive: true,
      }
    ];

    for (const opt of defaultOptions) {
      const exists = await DeliveryOption.findOne({ type: opt.type });
      if (!exists) {
        console.log(`Creando opción de entrega por defecto: ${opt.name}...`);
        await DeliveryOption.create(opt);
        console.log(`Opción ${opt.name} creada.`);
      } else {
        console.log(`La opción con tipo '${opt.type}' ya existe (${exists.name}). No se recreará.`);
      }
    }

    console.log("Proceso de siembra completado con éxito.");
  } catch (error) {
    console.error("Error durante el proceso de siembra:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Conexión a MongoDB cerrada.");
  }
}

seed();
