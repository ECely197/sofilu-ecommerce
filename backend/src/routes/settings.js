// Contenido para: backend/src/routes/settings.js
const express = require("express");
const router = express.Router();
const Setting = require("../models/Setting");
const { authMiddleware, adminOnly } = require("../middleware/authMiddleware");

// OBTENER UN AJUSTE (PÚBLICO)
router.get("/:key", async (req, res) => {
  try {
    const setting = await Setting.findOne({ key: req.params.key });
    if (!setting) {
      // Si no existe, devolvemos un valor por defecto para no romper el frontend
      if (req.params.key === "shippingCost") {
        return res.json({ key: "shippingCost", value: 10000 });
      }
      return res.status(404).json({ message: "Ajuste no encontrado" });
    }
    res.json(setting);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener el ajuste" });
  }
});

// ACTUALIZAR UN AJUSTE (SOLO ADMIN)
router.put("/:key", [authMiddleware, adminOnly], async (req, res) => {
  try {
    const updatedSetting = await Setting.findOneAndUpdate(
      { key: req.params.key },
      { value: req.body.value },
      { new: true, upsert: true } // upsert: true lo crea si no existe
    );
    res.json(updatedSetting);
  } catch (error) {
    res.status(400).json({ message: "Error al actualizar el ajuste" });
  }
});

module.exports = router;
