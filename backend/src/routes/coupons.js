const express = require("express");
const router = express.Router();
const Coupon = require("../models/Coupon");
const { authMiddleware, adminOnly } = require("../middleware/authMiddleware");

// --- OBTENER TODOS LOS CUPONES ---
router.get("/", async (req, res) => {
  try {
    const coupons = await Coupon.find();
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

module.exports = router;
