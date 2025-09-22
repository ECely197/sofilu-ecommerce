/**
 * @fileoverview Gestiona las rutas de la API para los Vendedores/Marcas.
 */

const express = require("express");
const router = express.Router();
const Vendor = require("../models/Vendor");
const Product = require("../models/Product");
const { authMiddleware, adminOnly } = require("../middleware/authMiddleware");

// Middleware de protección para todas las rutas de este archivo
router.use(authMiddleware, adminOnly);

/**
 * @route   GET /api/vendors
 * @desc    Obtener todos los vendedores.
 * @access  Admin
 */
router.get("/", async (req, res) => {
  try {
    const vendors = await Vendor.find().sort({ name: 1 });
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener vendedores." });
  }
});

/**
 * @route   GET /api/vendors/stats
 * @desc    Obtener estadísticas de productos agrupadas por vendedor.
 * @access  Admin
 */
router.get("/stats", async (req, res) => {
  try {
    // Esta pipeline de agregación es compleja. Un buen comentario explica su propósito.
    const vendorStats = await Product.aggregate([
      { $match: { vendor: { $ne: null } } }, // Filtrar productos sin vendedor
      {
        $group: {
          _id: "$vendor", // Agrupar por el ID del vendedor
          totalProducts: { $sum: 1 },
        },
      },
      {
        $lookup: {
          // Unir con la colección 'vendors' para obtener el nombre
          from: "vendors",
          localField: "_id",
          foreignField: "_id",
          as: "vendorInfo",
        },
      },
      { $unwind: "$vendorInfo" },
      {
        $project: {
          // Formatear la salida final
          _id: 0,
          vendorName: "$vendorInfo.name",
          totalProducts: 1,
        },
      },
      { $sort: { vendorName: 1 } },
    ]);
    res.json(vendorStats);
  } catch (error) {
    console.error("Error al obtener estadísticas de vendedores:", error);
    res
      .status(500)
      .json({ message: "Error al obtener estadísticas de vendedores." });
  }
});

/**
 * @route   POST /api/vendors
 * @desc    Crear un nuevo vendedor.
 * @access  Admin
 */
router.post("/", async (req, res) => {
  try {
    const newVendor = new Vendor({ name: req.body.name });
    await newVendor.save();
    res.status(201).json(newVendor);
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "Un vendedor con este nombre ya existe." });
    }
    res
      .status(400)
      .json({ message: "Error al crear el vendedor.", details: error.message });
  }
});

/**
 * @route   DELETE /api/vendors/:id
 * @desc    Eliminar un vendedor.
 * @access  Admin
 */
router.delete("/:id", async (req, res) => {
  try {
    // TODO: Considerar qué sucede con los productos de este vendedor.
    const deleted = await Vendor.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Vendedor no encontrado." });
    res.json({ message: "Vendedor eliminado." });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar el vendedor." });
  }
});

module.exports = router;
