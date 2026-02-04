const express = require("express");
const router = express.Router();
const SpecialEvent = require("../models/SpecialEvent");
const { authMiddleware, adminOnly } = require("../middleware/authMiddleware");

// ==========================================================================
// RUTA PÚBLICA (Para el Home)
// ==========================================================================
/**
 * @route   GET /api/special-events/active
 * @desc    Obtener TODOS los eventos especiales activos (para el slider).
 */
router.get("/active", async (req, res) => {
  try {
    const activeEvents = await SpecialEvent.find({ isActive: true }).populate({
      path: "linkedProducts",
      populate: { path: "categories", model: "Category" },
    });
    res.json(activeEvents);
  } catch (error) {
    console.error("Error obteniendo eventos activos:", error);
    res.status(500).json({ message: "Error al obtener eventos activos." });
  }
});

// ==========================================================================
// RUTAS DE ADMINISTRACIÓN
// ==========================================================================
router.use(authMiddleware, adminOnly);

router.get("/", async (req, res) => {
  try {
    const events = await SpecialEvent.find().sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener los eventos." });
  }
});

router.post("/", async (req, res) => {
  try {
    const newEvent = new SpecialEvent(req.body);
    const savedEvent = await newEvent.save();
    res.status(201).json(savedEvent);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error al crear el evento.", details: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updatedEvent = await SpecialEvent.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );
    if (!updatedEvent)
      return res.status(404).json({ message: "Evento no encontrado." });
    res.json(updatedEvent);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error al actualizar.", details: error.message });
  }
});

// --- RUTA MODIFICADA PARA TOGGLE SIMPLE ---
/**
 * @route   PATCH /api/special-events/:id/toggle-active
 * @desc    Alterna el estado activo de un evento sin afectar a los demás.
 */
router.patch("/:id/toggle-active", async (req, res) => {
  try {
    const event = await SpecialEvent.findById(req.params.id);
    if (!event)
      return res.status(404).json({ message: "Evento no encontrado" });

    event.isActive = !event.isActive; // Invertir estado
    await event.save();

    // Devolver la lista completa actualizada
    const updatedEvents = await SpecialEvent.find().sort("-createdAt");
    res.json(updatedEvents);
  } catch (error) {
    res.status(500).json({ message: "Error al cambiar estado." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deletedEvent = await SpecialEvent.findByIdAndDelete(req.params.id);
    if (!deletedEvent)
      return res.status(404).json({ message: "Evento no encontrado." });
    res.json({ message: "Evento eliminado." });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar." });
  }
});

module.exports = router;
