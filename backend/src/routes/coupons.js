const express = require("express");
const router = express.Router();
const Coupon = require("../models/Coupon");
const { authMiddleware, adminOnly } = require("../middleware/authMiddleware");

// --- OBTENER TODOS LOS CUPONES ---
router.get("/", async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      query = { name: { $regex: search, $options: "i" } };
    }
    const coupons = await Coupon.find(query).sort({ name: 1 });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener los cupones" });
  }
});

// --- OBTENER UN CUPÓN POR SU ID ---
router.get("/:id", async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon)
      return res.status(404).json({ message: "Cupón no encontrado" });
    res.json(coupon);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener el cupón" });
  }
});

// --- CREAR UN NUEVO CUPÓN ---
router.post("/", [authMiddleware, adminOnly], async (req, res) => {
  const newCoupon = new Coupon(req.body);
  try {
    const savedCoupon = await newCoupon.save();
    res.status(201).json(savedCoupon);
  } catch (error) {
    res.status(400).json({ message: "Error al crear el cupón", error });
  }
});

router.put("/:id", [authMiddleware, adminOnly], async (req, res) => {
  try {
    const updatedCoupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedCoupon)
      return res.status(404).json({ message: "Cupón no encontrado" });
    res.json(updatedCoupon);
  } catch (error) {
    res.status(400).json({ message: "Error al actualizar el cupón", error });
  }
});

// --- NUEVA RUTA: Eliminar un cupón (DELETE) ---
router.delete("/:id", [authMiddleware, adminOnly], async (req, res) => {
  try {
    const deletedCoupon = await Coupon.findByIdAndDelete(req.params.id);

    if (!deletedCoupon) {
      return res
        .status(404)
        .json({ message: "Cupón no encontrado para eliminar" });
    }

    res.json({ message: "Cupón eliminado con éxito" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar el cupón" });
  }
});

// --- ¡NUEVA RUTA PARA VALIDAR UN CUPÓN! ---
router.post("/validate", async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ message: "Se requiere un código de cupón." });
  }

  try {
    // 1. Buscamos el cupón en la BBDD (insensible a mayúsculas/minúsculas)
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    // 2. Validamos que exista
    if (!coupon) {
      return res.status(404).json({ message: "El cupón no existe." });
    }

    // 3. Validamos la fecha de expiración
    if (coupon.expirationDate && new Date() > new Date(coupon.expirationDate)) {
      return res.status(400).json({ message: "Este cupón ha expirado." });
    }

    // 4. Validamos el límite de uso
    if (coupon.usageLimit !== null && coupon.timesUsed >= coupon.usageLimit) {
      return res
        .status(400)
        .json({ message: "Este cupón ha alcanzado su límite de usos." });
    }

    // Si todas las validaciones pasan, devolvemos el cupón
    res.json(coupon);
  } catch (error) {
    res.status(500).json({ message: "Error al validar el cupón." });
  }
});

module.exports = router;
