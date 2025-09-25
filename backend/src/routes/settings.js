const express = require("express");
const router = express.Router();
const Setting = require("../models/Setting");
const { authMiddleware, adminOnly } = require("../middleware/authMiddleware");

/**
 * @route   GET /api/settings
 * @desc    Obtener el documento único de configuración de la tienda.
 *          Si no existe, lo crea con los valores por defecto.
 * @access  Public
 */
router.get("/", async (req, res) => {
  try {
    let settings = await Setting.findOne({ uniqueId: "global-settings" });
    if (!settings) {
      settings = new Setting();
      await settings.save();
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener los ajustes." });
  }
});

/**
 * @route   PUT /api/settings
 * @desc    Actualizar el documento de configuración de la tienda.
 * @access  Admin
 */
router.put("/", [authMiddleware, adminOnly], async (req, res) => {
  try {
    const updatedSettings = await Setting.findOneAndUpdate(
      { uniqueId: "global-settings" },
      { $set: req.body },
      { new: true, upsert: true, runValidators: true }
    );
    res.json(updatedSettings);
  } catch (error) {
    res
      .status(400)
      .json({
        message: "Error al actualizar los ajustes.",
        details: error.message,
      });
  }
});

module.exports = router;
