/**
 * @fileoverview Gestiona todas las rutas de la API relacionadas con los pedidos.
 * Incluye la creación de pedidos por parte de los clientes y la gestión
 * completa de los mismos por parte de los administradores.
 */

const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const { authMiddleware, adminOnly } = require("../middleware/authMiddleware");
const { sendOrderConfirmationEmail } = require("../services/emailService");

// ==========================================================================
// RUTAS DE ADMINISTRACIÓN
// ==========================================================================

/**
 * @route   GET /api/orders
 * @desc    Obtener todos los pedidos (para panel de admin).
 * @access  Admin
 * @query   search - Busca por nombre de cliente o ID de pedido.
 */
router.get("/", [authMiddleware, adminOnly], async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      query = { "customerInfo.name": { $regex: search, $options: "i" } };
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .populate("items.product", "name sku images"); // Poblar solo lo necesario
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener los pedidos." });
  }
});

/**
 * @route   GET /api/orders/dashboard-summary
 * @desc    Obtener un resumen completo de estadísticas para el Dashboard.
 * @access  Admin
 * @query   startDate - Fecha de inicio (opcional, formato YYYY-MM-DD)
 * @query   endDate - Fecha de fin (opcional, formato YYYY-MM-DD)
 */
router.get(
  "/dashboard-summary",
  [authMiddleware, adminOnly],
  async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      // --- 1. Construir el filtro de fecha ---
      const dateFilter = {};
      if (startDate && endDate) {
        dateFilter.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)), // Incluir todo el día de fin
        };
      }

      // --- 2. Ejecutar todas las consultas en paralelo ---
      const [
        // Métricas de Ventas y Pedidos
        salesData,
        orderStatusCounts,
        recentOrders,
        // Métricas de Productos
        productStats,
        // Métricas de Cupones
        couponPerformance,
        // Métricas de Vendedores
        vendorPerformance,
      ] = await Promise.all([
        // 1. Total de Ventas
        Order.aggregate([
          { $match: dateFilter },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: "$totalAmount" },
              totalOrders: { $sum: 1 },
            },
          },
        ]),
        // 2. Conteo de Pedidos por Estado
        Order.aggregate([
          { $match: dateFilter },
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
        // 3. Pedidos Recientes (estos no se filtran por fecha)
        Order.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .populate("items.product", "name"),

        // 4. Estadísticas de Productos (no se filtran por fecha de pedido)
        Product.aggregate([
          {
            $group: {
              _id: null,
              totalProducts: { $sum: 1 },
              inventorySaleValue: { $sum: { $multiply: ["$price", "$stock"] } },
              inventoryCostValue: {
                $sum: { $multiply: ["$costPrice", "$stock"] },
              },
            },
          },
        ]),

        // 5. Rendimiento de Cupones
        Order.aggregate([
          { $match: { ...dateFilter, appliedCoupon: { $ne: null } } },
          {
            $group: {
              _id: "$appliedCoupon",
              timesUsed: { $sum: 1 },
              totalDiscount: { $sum: "$discountAmount" },
              totalRevenueGenerated: { $sum: "$totalAmount" },
            },
          },
          { $sort: { timesUsed: -1 } },
        ]),

        // 6. Rendimiento de Vendedores
        Product.aggregate([
          // Desenrollar productos, sus variantes y opciones para un análisis detallado
          { $unwind: { path: "$variants", preserveNullAndEmptyArrays: true } },
          {
            $unwind: {
              path: "$variants.options",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "vendors",
              localField: "vendor",
              foreignField: "_id",
              as: "vendorInfo",
            },
          },
          {
            $unwind: { path: "$vendorInfo", preserveNullAndEmptyArrays: true },
          },
          {
            $group: {
              _id: "$vendorInfo.name",
              totalProducts: { $addToSet: "$_id" }, // Contar productos únicos
              inventorySaleValue: {
                $sum: {
                  $multiply: [
                    "$variants.options.price",
                    "$variants.options.stock",
                  ],
                },
              },
              inventoryCostValue: {
                $sum: {
                  $multiply: [
                    "$variants.options.costPrice",
                    "$variants.options.stock",
                  ],
                },
              },
            },
          },
          {
            $project: {
              _id: 0,
              vendorName: "$_id",
              totalProducts: { $size: "$totalProducts" },
              inventorySaleValue: 1,
              inventoryCostValue: 1,
            },
          },
        ]),
      ]);

      // --- 3. Formatear la respuesta en un objeto limpio ---
      res.json({
        totalRevenue: salesData[0]?.totalRevenue || 0,
        totalOrders: salesData[0]?.totalOrders || 0,
        orderStatusCounts: orderStatusCounts.reduce(
          (acc, status) => {
            acc[status._id] = status.count;
            return acc;
          },
          { Procesando: 0, Enviado: 0, Entregado: 0, Cancelado: 0 }
        ), // Asegura que todos los estados existan
        recentOrders,
        totalProducts: productStats[0]?.totalProducts || 0,
        inventorySaleValue: productStats[0]?.inventorySaleValue || 0,
        inventoryCostValue: productStats[0]?.inventoryCostValue || 0,
        couponPerformance,
        vendorPerformance,
      });
    } catch (error) {
      console.error("Error al obtener las estadísticas del dashboard:", error);
      res.status(500).json({ message: "Error al obtener las estadísticas" });
    }
  }
);

/**
 * @route   GET /api/orders/:id
 * @desc    Obtener un pedido único por su ID (vista de admin).
 * @access  Admin
 */
router.get("/:id", [authMiddleware], async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate({
      path: "items.product",
      model: "Product",
      select: "name sku images variants",
    });

    if (!order) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener el pedido" });
  }
});

/**
 * @route   DELETE /api/orders/:id
 * @desc    Eliminar un pedido (acción destructiva).
 * @access  Admin
 */
router.delete("/:id", [authMiddleware, adminOnly], async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);
    if (!deletedOrder) {
      return res
        .status(404)
        .json({ message: "Pedido no encontrado para eliminar." });
    }
    res.json({ message: "Pedido eliminado con éxito." });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar el pedido." });
  }
});

// ==========================================================================
// RUTAS DE CLIENTE (Requieren autenticación)
// ==========================================================================

/**
 * @route   POST /api/orders
 * @desc    Crear un nuevo pedido.
 * @access  Private (Usuario logueado)
 */
router.post("/", [authMiddleware], async (req, res) => {
  try {
    const {
      customerInfo,
      shippingAddress,
      items,
      appliedCoupon,
      discountAmount,
      totalAmount,
    } = req.body;
    const userId = req.user.uid;

    if (!items || items.length === 0) {
      return res
        .status(400)
        .json({ message: "El carrito no puede estar vacío." });
    }

    // --- 1. Verificación de Stock y Preparación de Items ---
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Producto no encontrado.` });
      }
      if (product.status === "Agotado") {
        return res
          .status(400)
          .json({ message: `El producto "${product.name}" está agotado.` });
      }

      // Validar stock de variantes
      if (
        item.selectedVariants &&
        Object.keys(item.selectedVariants).length > 0
      ) {
        for (const variantName in item.selectedVariants) {
          const variant = product.variants.find((v) => v.name === variantName);
          const option = variant?.options.find(
            (o) => o.name === item.selectedVariants[variantName]
          );
          if (!option || option.stock < item.quantity) {
            return res.status(400).json({
              message: `Stock insuficiente para ${product.name} - ${option.name}.`,
            });
          }
        }
      } else {
        // Validar stock de producto principal (si no hay variantes)
        if (product.stock < item.quantity) {
          return res
            .status(400)
            .json({ message: `Stock insuficiente para ${product.name}.` });
        }
      }
    }

    // --- 2. Crear y Guardar el Pedido ---
    const newOrder = new Order({
      userId,
      customerInfo,
      shippingAddress,
      items,
      appliedCoupon,
      discountAmount,
      totalAmount,
    });
    let savedOrder = await newOrder.save();

    // --- 3. Actualizar el Inventario (¡Paso Crítico!) ---
    for (const item of items) {
      if (
        item.selectedVariants &&
        Object.keys(item.selectedVariants).length > 0
      ) {
        const updateQuery = {};
        for (const variantName in item.selectedVariants) {
          // Creamos el path dinámico para actualizar el stock de la opción correcta
          const fieldPath = `variants.$[v].options.$[o].stock`;
          updateQuery[fieldPath] = -item.quantity; // Restamos la cantidad

          await Product.updateOne(
            { _id: item.product },
            { $inc: updateQuery },
            {
              arrayFilters: [
                { "v.name": variantName },
                { "o.name": item.selectedVariants[variantName] },
              ],
            }
          );
        }
      } else {
        // Si no hay variantes, actualizamos el stock del producto principal
        await Product.updateOne(
          { _id: item.product },
          { $inc: { stock: -item.quantity } }
        );
      }
    }

    // --- 4. Actualizar Cupón y Enviar Correo ---
    if (appliedCoupon) {
      await Coupon.updateOne(
        { code: appliedCoupon },
        { $inc: { timesUsed: 1 } }
      );
    }
    savedOrder = await savedOrder.populate("items.product");
    // sendOrderConfirmationEmail(savedOrder); // Puedes habilitar esto cuando configures el email

    res.status(201).json(savedOrder);
  } catch (error) {
    console.error("Error al crear el pedido:", error);
    res
      .status(400)
      .json({ message: "Error al crear el pedido.", details: error.message });
  }
});

/**
 * @route   GET /api/orders/user/:userId
 * @desc    Obtener el historial de pedidos del usuario logueado.
 * @access  Private
 */
router.get("/user/:userId", authMiddleware, async (req, res) => {
  // Verificación de seguridad: el usuario solo puede ver sus propios pedidos.
  if (req.user.uid !== req.params.userId) {
    return res.status(403).json({ message: "Acceso denegado." });
  }
  try {
    const orders = await Order.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .populate("items.product");
    res.json(orders);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener los pedidos del usuario." });
  }
});

/**
 * @route   PUT /api/orders/:id/status
 * @desc    Actualizar el estado de un pedido (por admin o para cancelar por cliente).
 * @access  Private (Admin o Propietario del pedido)
 */
router.put("/:id/status", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order)
      return res.status(404).json({ message: "Pedido no encontrado." });

    const isAdmin = req.user.admin === true;
    const isOwner = order.userId === req.user.uid;

    if (!isAdmin && !isOwner) {
      return res
        .status(403)
        .json({ message: "No tienes permiso para modificar este pedido." });
    }

    // Lógica de cancelación del cliente
    if (isOwner && !isAdmin && status === "Cancelado") {
      if (order.status !== "Procesando") {
        return res.status(400).json({
          message: "Solo se pueden cancelar pedidos en estado 'Procesando'.",
        });
      }
      // TODO: Devolver stock al cancelar.
    } else if (!isAdmin) {
      return res.status(403).json({ message: "Acción no permitida." });
    }

    order.status = status;
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    console.error("Error al actualizar estado del pedido:", error);
    res
      .status(500)
      .json({ message: "Error al actualizar el estado del pedido." });
  }
});

module.exports = router;
