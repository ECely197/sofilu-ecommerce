// En: backend/src/routes/vendors.js
const express = require("express");
const router = express.Router();
const Vendor = require("../models/Vendor");
const { authMiddleware, adminOnly } = require("../middleware/authMiddleware");
const Product = require("../models/Product");

// Middleware de protección para todas las rutas
router.use(authMiddleware, adminOnly);

// GET todos los vendedores
router.get("/", async (req, res) => {
  try {
    const vendors = await Vendor.find().sort({ name: 1 });
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener vendedores" });
  }
});

router.get("/stats", async (req, res) => {
  try {
    const vendorStats = await Product.aggregate([
      { $match: { vendor: { $exists: true, $ne: null } } },

      {
        $lookup: {
          from: "vendors",
          localField: "vendor",
          foreignField: "_id",
          as: "vendorInfo",
        },
      },
      { $unwind: "$vendorInfo" },

      {
        $project: {
          vendorName: "$vendorInfo.name",
          inventorySaleValue: {
            $sum: {
              $map: {
                input: "$variants",
                as: "variant",
                in: {
                  $sum: {
                    $map: {
                      input: "$$variant.options",
                      as: "option",
                      in: {
                        $multiply: [
                          "$$option.stock",
                          { $add: ["$price", "$$option.price"] },
                        ],
                      },
                    },
                  },
                },
              },
            },
          },
          inventoryCostValue: {
            $sum: {
              $map: {
                input: "$variants",
                as: "variant",
                in: {
                  $sum: {
                    $map: {
                      input: "$$variant.options",
                      as: "option",
                      in: {
                        $multiply: ["$$option.stock", "$$option.costPrice"],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },

      {
        $group: {
          _id: "$vendorName",
          totalProducts: { $sum: 1 },
          totalInventorySaleValue: { $sum: "$inventorySaleValue" },
          totalInventoryCostValue: { $sum: "$inventoryCostValue" },
        },
      },

      {
        $project: {
          _id: 0,
          vendorName: "$_id",
          totalProducts: 1,
          totalInventorySaleValue: 1,
          totalInventoryCostValue: 1,
        },
      },

      { $sort: { vendorName: 1 } },
    ]);

    res.json(vendorStats);
  } catch (error) {
    console.error("Error al obtener estadísticas de vendedores:", error);
    res
      .status(500)
      .json({ message: "Error al obtener estadísticas de vendedores" });
  }
});

// POST para crear un nuevo vendedor
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
      .json({ message: "Error al crear el vendedor", details: error.message });
  }
});

// DELETE para eliminar un vendedor
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Vendor.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Vendedor no encontrado" });
    res.json({ message: "Vendedor eliminado" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar el vendedor" });
  }
});

module.exports = router;
