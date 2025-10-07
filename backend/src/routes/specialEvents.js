const express = require("express");
const router = express.Router();
const SpecialEvent = require("../models/SpecialEvent");
const { authMiddleware, adminOnly } = require("../middleware/authMiddleware");

// ==========================================================================
// RUTA PÚBLICA (Para la Home Page)
// ==========================================================================

/**
 * @route   GET /api/special-events/active
 * @desc    Obtener el banner de evento especial que esté actualmente activo.
 * @access  Public
 */
router.get("/active", async (req, res) => {
  try {
    // Busca el primer evento marcado como 'isActive: true' y trae los datos de los productos asociados.
    const activeEvent = await SpecialEvent.findOne({ isActive: true }).populate(
      "linkedProducts"
    );
    res.json(activeEvent); // Devuelve el evento o `null` si no hay ninguno activo.
  } catch (error) {
    console.error("Error al obtener el evento activo:", error);
    res
      .status(500)
      .json({ message: "Error del servidor al obtener el evento activo." });
  }
});

// ==========================================================================
// RUTAS DE ADMINISTRACIÓN (Protegidas)
// ==========================================================================

// Middleware que protege todas las rutas siguientes.
router.use(authMiddleware, adminOnly);

/**
 * @route   GET /api/special-events
 * @desc    Obtener todos los eventos especiales para el panel de admin.
 * @access  Admin
 */
router.get("/", async (req, res) => {
  try {
    const events = await SpecialEvent.find().sort({ createdAt: -1 }); // Ordena por más reciente
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener los eventos." });
  }
});

/**
 * @route   POST /api/special-events
 * @desc    Crear un nuevo evento especial.
 * @access  Admin
 */
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

/**
 * @route   PUT /api/special-events/:id
 * @desc    Actualizar un evento especial existente.
 * @access  Admin
 */
router.put("/:id", async (req, res) => {
  try {
    const updatedEvent = await SpecialEvent.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedEvent) {
      return res.status(404).json({ message: "Evento no encontrado." });
    }
    res.json(updatedEvent);
  } catch (error) {
    res.status(400).json({
      message: "Error al actualizar el evento.",
      details: error.message,
    });
  }
});

/**
 * @route   PATCH /api/special-events/:id/set-active
 * @desc    Activa un evento específico y desactiva todos los demás.
 * @access  Admin
 */
router.patch(
  "/:id/set-active",
  [authMiddleware, adminOnly],
  async (req, res) => {
    try {
      const { id } = req.params;

      // Paso 1: Desactivar cualquier otro evento que esté activo.
      // `updateMany` afecta a todos los documentos que coincidan con el filtro.
      await SpecialEvent.updateMany(
        { isActive: true },
        { $set: { isActive: false } }
      );

      // Paso 2: Activar el evento seleccionado.
      await SpecialEvent.updateOne({ _id: id }, { $set: { isActive: true } });

      // Paso 3: Devolver la lista actualizada de todos los eventos.
      const updatedEvents = await SpecialEvent.find().sort("-createdAt");
      res.json(updatedEvents);
    } catch (error) {
      res
        .status(500)
        .json({
          message: "Error al activar el evento.",
          details: error.message,
        });
    }
  }
);

/**
 * @route   DELETE /api/special-events/:id
 * @desc    Eliminar un evento especial.
 * @access  Admin
 */
router.delete("/:id", async (req, res) => {
  try {
    const deletedEvent = await SpecialEvent.findByIdAndDelete(req.params.id);
    if (!deletedEvent) {
      return res.status(404).json({ message: "Evento no encontrado." });
    }
    res.json({ message: "Evento eliminado con éxito." });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar el evento." });
  }
});

module.exports = router;
