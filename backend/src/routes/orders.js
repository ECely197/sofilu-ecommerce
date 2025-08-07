const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
// ¡Importamos el modelo Product para poder usarlo!
const Product = require("../models/Product");

const { authMiddleware, adminOnly } = require("../middleware/authMiddleware");

// --- OBTENER TODOS LOS PEDIDOS (PARA EL ADMIN) ---
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener los pedidos" });
  }
});

// --- ¡LA RUTA QUE FALTABA! OBTENER PEDIDOS DE UN USUARIO ESPECÍFICO ---
// GET /api/orders/user/:userId
router.get('/user/:userId', [authMiddleware], async (req, res) => {
  // Verificamos que el usuario que pide los datos sea el dueño de esos datos
  if (req.user.uid !== req.params.userId) {
    return res.status(403).json({ message: 'No tienes permiso para ver estos pedidos.' });
  }
  try {
    // Buscamos todos los pedidos que coincidan con el userId
    const orders = await Order.find({ userId: req.params.userId }).sort({ createdAt: -1 }).populate('items.product');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los pedidos del usuario' });
  }
});

// --- OBTENER UN PEDIDO POR SU ID (Para el Admin) ---
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
    const { customerInfo, items } = req.body;
    let totalAmount = 0;
    const processedItems = [];

    for (const item of items) {
      // ¡Ahora Node.js sabrá qué es 'Product' en esta línea!
      const product = await Product.findById(item.product);
      if (!product) {
        return res
          .status(404)
          .json({ message: `Producto con ID ${item.product} no encontrado.` });
      }
      totalAmount += product.price * item.quantity;
      processedItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price,
      });
    }

    const newOrder = new Order({
      customerInfo: customerInfo,
      items: processedItems,
      totalAmount: totalAmount,
    });

    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (error) {
    console.error("Error al crear el pedido:", error);
    res.status(400).json({ message: "Error al crear el pedido" });
  }
});

// --- ACTUALIZAR EL ESTADO DE UN PEDIDO ---
router.put("/:id/status", [authMiddleware, adminOnly], async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatus = ["Procesando", "Enviado", "Entregado", "Cancelado"];
    if (!status || !allowedStatus.includes(status)) {
      // Añadimos una validación extra
      return res
        .status(400)
        .json({ message: "Estado no válido proporcionado" });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status: status }, // Actualizamos solo el campo 'status'
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    // ¡La respuesta debe enviarse!
    res.json(updatedOrder);
  } catch (error) {
    console.error("Error al actualizar el estado:", error); // Log más detallado
    res
      .status(500)
      .json({ message: "Error al actualizar el estado del pedido" });
  }
});

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
