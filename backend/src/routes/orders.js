const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const { authMiddleware, adminOnly } = require("../middleware/authMiddleware");
const { sendOrderConfirmationEmail } = require("../services/emailService");

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

// --- CREAR UN NUEVO PEDIDO ---
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

    if (!shippingAddress) {
      // Una validación extra por seguridad
      return res
        .status(400)
        .json({ message: "La dirección de envío es requerida." });
    }

    // --- 1. Verificación de Stock (esta parte ya estaba bien, la dejamos igual) ---
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res
          .status(404)
          .json({ message: `Producto con ID ${item.product} no encontrado.` });
      }
      if (item.selectedVariants) {
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

    // --- 3. ¡ACTUALIZAR EL INVENTARIO! ---
    await Promise.all(
      items.map(async (item) => {
        const updateQuery = {};
        for (const variantName in item.selectedVariants) {
          const product = await Product.findById(item.product);
          const variantIndex = product.variants.findIndex(
            (v) => v.name === variantName
          );
          if (variantIndex > -1) {
            const optionIndex = product.variants[
              variantIndex
            ].options.findIndex(
              (o) => o.name === item.selectedVariants[variantName]
            );
            if (optionIndex > -1) {
              const stockPath = `variants.${variantIndex}.options.${optionIndex}.stock`;

              updateQuery[stockPath] = -item.quantity;
            }
          }
        }

        if (Object.keys(updateQuery).length > 0) {
          await Product.updateOne({ _id: item.product }, { $inc: updateQuery });
        }
      })
    );

    // --- 4. Actualizar Cupón y Enviar Correo ---
    if (appliedCoupon) {
      await Coupon.updateOne(
        { code: appliedCoupon },
        { $inc: { timesUsed: 1 } }
      );
    }
    savedOrder = await savedOrder.populate("items.product");
    sendOrderConfirmationEmail(savedOrder);

    // --- 5. Enviar Respuesta ---
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

// --- ¡NUEVA RUTA PARA ESTADÍSTICAS DEL DASHBOARD! ---
router.get("/summary/stats", [authMiddleware, adminOnly], async (req, res) => {
  try {
    // Usamos Promise.all para ejecutar todas las consultas en paralelo
    const [totalRevenue, totalOrders, totalProducts, latestOrders] =
      await Promise.all([
        // Suma el totalAmount de todos los pedidos
        Order.aggregate([
          { $group: { _id: null, total: { $sum: "$totalAmount" } } },
        ]),
        // Cuenta el número total de documentos en la colección de pedidos
        Order.countDocuments(),
        // Cuenta el número total de productos
        Product.countDocuments(),
        // Obtiene los 5 pedidos más recientes, populando los productos
        Order.find().sort({ createdAt: -1 }).limit(5).populate("items.product"),
      ]);

    res.json({
      totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
      totalOrders,
      totalProducts,
      latestOrders,
    });
  } catch (error) {
    console.error("Error al obtener las estadísticas del dashboard:", error);
    res.status(500).json({ message: "Error al obtener las estadísticas" });
  }
});

module.exports = router;
