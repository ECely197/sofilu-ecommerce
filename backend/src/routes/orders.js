/**
 * @fileoverview Gestiona todas las rutas de la API relacionadas con los pedidos.
 */

const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const { authMiddleware, adminOnly } = require("../middleware/authMiddleware");
const { sendOrderConfirmationEmail } = require("../services/emailService");
const Category = require("../models/Category");
const Vendor = require("../models/Vendor");

// ==========================================================================
// RUTAS DE ADMINISTRACIÓN
// ==========================================================================

// Obtener todos los pedidos
router.get("/", [authMiddleware, adminOnly], async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      query = { "customerInfo.name": { $regex: search, $options: "i" } };
    }
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .populate("items.product", "name sku images");
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener los pedidos." });
  }
});

// Dashboard Summary
/**
 * @route   GET /api/orders/dashboard-summary
 * @desc    Obtener un resumen completo de estadísticas (BI).
 */
router.get(
  "/dashboard-summary",
  [authMiddleware, adminOnly],
  async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      // Filtro de fecha inteligente
      const dateFilter = {};
      if (startDate && endDate) {
        dateFilter.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
        };
      }

      // 1. VENTAS TOTALES Y RECUENTO
      const salesStats = await Order.aggregate([
        { $match: { ...dateFilter, status: { $ne: "Cancelado" } } }, // Ignorar cancelados para ingresos
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalAmount" },
            totalOrders: { $sum: 1 },
            avgOrderValue: { $avg: "$totalAmount" }, // Ticket promedio
          },
        },
      ]);

      // 2. PEDIDOS POR ESTADO (Incluye cancelados)
      const statusStats = await Order.aggregate([
        { $match: dateFilter },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]);

      // 3. PRODUCTOS MÁS VENDIDOS (Top 5)
      const topProducts = await Order.aggregate([
        { $match: { ...dateFilter, status: "Entregado" } }, // Solo ventas reales
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.product",
            totalSold: { $sum: "$items.quantity" },
            revenue: {
              $sum: { $multiply: ["$items.price", "$items.quantity"] },
            },
          },
        },
        { $sort: { totalSold: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "productInfo",
          },
        },
        { $unwind: "$productInfo" },
        { $project: { name: "$productInfo.name", totalSold: 1, revenue: 1 } },
      ]);

      // 4. VENTAS POR CATEGORÍA (¡Nuevo!)
      // Esto requiere un doble lookup: Order -> Product -> Category
      const categoryStats = await Order.aggregate([
        { $match: { ...dateFilter, status: "Entregado" } },
        { $unwind: "$items" },
        {
          $lookup: {
            from: "products",
            localField: "items.product",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        {
          $lookup: {
            from: "categories",
            localField: "product.category",
            foreignField: "_id",
            as: "category",
          },
        },
        { $unwind: "$category" },
        {
          $group: {
            _id: "$category.name",
            totalRevenue: {
              $sum: { $multiply: ["$items.price", "$items.quantity"] },
            },
            itemsSold: { $sum: "$items.quantity" },
          },
        },
        { $sort: { totalRevenue: -1 } },
      ]);

      // 5. RENDIMIENTO DE CUPONES
      const couponStats = await Order.aggregate([
        { $match: { ...dateFilter, appliedCoupon: { $ne: null } } },
        {
          $group: {
            _id: "$appliedCoupon",
            count: { $sum: 1 },
            discountGiven: { $sum: "$discountAmount" },
          },
        },
        { $sort: { count: -1 } },
      ]);

      // 6. INVENTARIO (Valor total)
      const inventoryStats = await Product.aggregate([
        {
          $group: {
            _id: null,
            totalStock: { $sum: "$stock" }, // Debería sumar variantes también si es complejo
            totalValue: { $sum: { $multiply: ["$price", "$stock"] } },
          },
        },
      ]);

      res.json({
        sales: salesStats[0] || {
          totalRevenue: 0,
          totalOrders: 0,
          avgOrderValue: 0,
        },
        status: statusStats.reduce(
          (acc, curr) => ({ ...acc, [curr._id]: curr.count }),
          {},
        ),
        topProducts,
        categoryStats,
        couponStats,
        inventory: inventoryStats[0] || { totalStock: 0, totalValue: 0 },
        recentOrders: await Order.find(dateFilter)
          .sort("-createdAt")
          .limit(5)
          .select("totalAmount status createdAt customerInfo"),
      });
    } catch (error) {
      console.error("Error en dashboard:", error);
      res.status(500).json({ message: "Error calculando estadísticas." });
    }
  },
);

// Obtener un pedido por ID (Admin y Cliente)
router.get("/:id", [authMiddleware], async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate({ path: "items.product", model: "Product" })
      .populate("selectedDeliveryOption"); // Importante para ver el tipo de entrega

    if (!order)
      return res.status(404).json({ message: "Pedido no encontrado" });

    // Seguridad básica: Si no es admin, verificar que sea el dueño
    if (req.user.admin !== true && order.userId !== req.user.uid) {
      return res.status(403).json({ message: "Acceso denegado" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener el pedido" });
  }
});

// Eliminar pedido (Admin)
router.delete("/:id", [authMiddleware, adminOnly], async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);
    if (!deletedOrder)
      return res.status(404).json({ message: "No encontrado." });
    res.json({ message: "Pedido eliminado." });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar." });
  }
});

// ==========================================================================
// RUTAS DE CLIENTE
// ==========================================================================

// Historial del usuario
router.get("/user/:userId", authMiddleware, async (req, res) => {
  if (req.user.uid !== req.params.userId) {
    return res.status(403).json({ message: "Acceso denegado." });
  }
  try {
    const orders = await Order.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .populate("items.product")
      .populate("selectedDeliveryOption"); // Mostrar opción de entrega
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener historial." });
  }
});

// Actualizar estado (Admin o Cancelación por Cliente)
router.put("/:id/status", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order)
      return res.status(404).json({ message: "Pedido no encontrado." });

    const isAdmin = req.user.admin === true;
    const isOwner = order.userId === req.user.uid;

    if (!isAdmin && !isOwner)
      return res.status(403).json({ message: "Sin permiso." });

    if (isOwner && !isAdmin && status === "Cancelado") {
      if (order.status !== "Procesando" && order.status !== "Pendiente") {
        return res
          .status(400)
          .json({ message: "No se puede cancelar en este estado." });
      }
    } else if (!isAdmin) {
      return res.status(403).json({ message: "Acción no permitida." });
    }

    order.status = status;
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar estado." });
  }
});

// --- ¡ESTA ES LA RUTA QUE FALTABA! ---
/**
 * @route   PUT /api/orders/:id/shipping
 * @desc    El cliente actualiza sus datos de envío/notas.
 */
router.put("/:id/shipping", [authMiddleware], async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Pedido no encontrado." });
    }

    // 1. Verificar que sea el dueño
    if (order.userId !== req.user.uid) {
      return res.status(403).json({ message: "No puedes editar este pedido." });
    }

    // 2. Verificar estado (Solo si no ha sido enviado aún)
    if (
      order.status === "Enviado" ||
      order.status === "Entregado" ||
      order.status === "Cancelado"
    ) {
      return res
        .status(400)
        .json({ message: "El pedido ya no se puede editar." });
    }

    // 3. Actualizar campos permitidos
    // Nota: No dejamos editar el 'deliveryType' (costo) ni 'items' aquí, solo datos de contacto.
    order.shippingAddress = req.body.shippingAddress;
    order.customerInfo = req.body.customerInfo;

    // Actualizar notas también
    if (req.body.orderNotes !== undefined)
      order.orderNotes = req.body.orderNotes;
    if (req.body.deliveryNotes !== undefined)
      order.deliveryNotes = req.body.deliveryNotes;

    const updatedOrder = await order.save();

    // Devolvemos la orden populada para que el frontend actualice la vista bien
    const populatedOrder = await Order.findById(updatedOrder._id)
      .populate("items.product")
      .populate("selectedDeliveryOption");

    res.json(populatedOrder);
  } catch (error) {
    console.error("Error al actualizar dirección:", error);
    res.status(500).json({ message: "Error interno al actualizar." });
  }
});

module.exports = router;
