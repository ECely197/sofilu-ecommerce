/**
 * @fileoverview Gestiona las rutas para las configuraciones globales de la aplicación.
 * Funciona como un almacén clave-valor (ej: 'costo-envio', 'impuesto-iva').
 */

const express = require("express");
const router = express.Router();
const Setting = require("../models/Setting");
const { authMiddleware, adminOnly } = require("../middleware/authMiddleware");

// ==========================================================================
// RUTA PÚBLICA
// ==========================================================================

/**
 * @route   GET /api/settings/:key
 * @desc    Obtener el valor de una configuración específica por su clave.
 * @access  Public
 */
router.get("/:key", async (req, res) => {
  try {
    const setting = await Setting.findOne({ key: req.params.key });

    if (!setting) {
      // Lógica de fallback para evitar errores en el frontend si un ajuste no está configurado.
      if (req.params.key === "shippingCost") {
        return res.json({ key: "shippingCost", value: 10000 }); // Valor por defecto
      }
      return res.status(404).json({ message: "Ajuste no encontrado." });
    }
    res.json(setting);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener el ajuste." });
  }
});

// ==========================================================================
// RUTA DE ADMINISTRACIÓN
// ==========================================================================

/**
 * @route   PUT /api/settings/:key
 * @desc    Crear o actualizar una configuración.
 * @access  Admin
 */
router.put("/:key", [authMiddleware, adminOnly], async (req, res) => {
  try {
    const updatedSetting = await Setting.findOneAndUpdate(
      { key: req.params.key },
      { value: req.body.value },
      { new: true, upsert: true, runValidators: true } // 'upsert' crea el documento si no existe.
    );
    res.json(updatedSetting);
  } catch (error) {
    res
      .status(400)
      .json({
        message: "Error al actualizar el ajuste.",
        details: error.message,
      });
  }
});

module.exports = router;
