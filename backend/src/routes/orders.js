const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const { authMiddleware, adminOnly } = require("../middleware/authMiddleware");
const { sendOrderConfirmationEmail } = require("../services/emailService");
const { createInvoicePdf } = require("../services/pdfService");

// --- OBTENER TODOS LOS PEDIDOS (PARA EL PANEL DE ADMIN) ---
// Esta es la ruta que le faltaba el .populate()
router.get("/", [authMiddleware, adminOnly], async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate("items.product"); // Popula los detalles del producto para la lista
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener los pedidos" });
  }
});

// --- OBTENER PEDIDOS DE UN USUARIO ESPECÍFICO (PARA EL ÁREA "MI CUENTA") ---
router.get("/user/:userId", [authMiddleware], async (req, res) => {
  if (req.user.uid !== req.params.userId) {
    return res.status(403).json({ message: "No tienes permiso." });
  }
  try {
    const orders = await Order.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .populate("items.product");
    res.json(orders);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener los pedidos del usuario" });
  }
});

// --- OBTENER UN PEDIDO ÚNICO POR SU ID (PARA LA PÁGINA DE DETALLE) ---
router.get("/:id", [authMiddleware, adminOnly], async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("items.product");
    if (!order) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener el pedido" });
  }
});

// --- GENERAR LA FACTURA EN PDF PARA UN PEDIDO ---
router.get("/:id", [authMiddleware, adminOnly], async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("items.product");
    if (!order) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }
    // ¡AÑADIMOS UN LOG AQUÍ!
    console.log(
      `--- BACKEND: Enviando datos del pedido ${req.params.id} al frontend ---`
    );
    res.json(order);
  } catch (error) {
    console.error(
      `--- BACKEND: ERROR al obtener el pedido ${req.params.id} ---`,
      error
    );
    res.status(500).json({ message: "Error al obtener el pedido" });
  }
});

// --- CREAR UN NUEVO PEDIDO ---
router.post("/", [authMiddleware], async (req, res) => {
  try {
    const { customerInfo, items, appliedCoupon, discountAmount } = req.body;
    const userId = req.user.uid;

    if (!items || items.length === 0) {
      return res
        .status(400)
        .json({ message: "El carrito no puede estar vacío." });
    }

    let subTotal = 0;
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res
          .status(404)
          .json({ message: `Producto con ID ${item.product} no encontrado.` });
      }
      const itemPrice =
        product.isOnSale && product.salePrice
          ? product.salePrice
          : product.price;
      subTotal += itemPrice * item.quantity;
    }

    const shippingCost = 10000;
    const finalTotal = subTotal + shippingCost - (discountAmount || 0);

    const newOrder = new Order({
      userId,
      customerInfo,
      items,
      appliedCoupon,
      discountAmount,
      totalAmount: finalTotal,
    });

    let savedOrder = await newOrder.save();

    if (appliedCoupon) {
      await Coupon.updateOne(
        { code: appliedCoupon },
        { $inc: { timesUsed: 1 } }
      );
    }

    savedOrder = await savedOrder.populate("items.product");

    sendOrderConfirmationEmail(savedOrder);

    res.status(201).json(savedOrder);
  } catch (error) {
    console.error("--- RUTA POST /api/orders: ERROR ---", error);
    res
      .status(400)
      .json({ message: "Error al crear el pedido", details: error.message });
  }
});

// --- ACTUALIZAR EL ESTADO DE UN PEDIDO ---
router.put("/:id/status", [authMiddleware, adminOnly], async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatus = ["Procesando", "Enviado", "Entregado", "Cancelado"];
    if (!status || !allowedStatus.includes(status)) {
      return res
        .status(400)
        .json({ message: "Estado no válido proporcionado" });
    }
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status: status },
      { new: true }
    );
    if (!updatedOrder) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }
    res.json(updatedOrder);
  } catch (error) {
    console.error("Error al actualizar el estado:", error);
    res
      .status(500)
      .json({ message: "Error al actualizar el estado del pedido" });
  }
});

// --- ELIMINAR UN PEDIDO ---
router.delete("/:id", [authMiddleware, adminOnly], async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);
    if (!deletedOrder) {
      return res
        .status(404)
        .json({ message: "Pedido no encontrado para eliminar" });
    }
    res.json({ message: "Pedido eliminado con éxito" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar el pedido" });
  }
});

module.exports = router;
