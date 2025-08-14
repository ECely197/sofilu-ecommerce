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
router.get("/user/:userId", [authMiddleware], async (req, res) => {
  console.log("BACKEND ORDERS: Petición recibida en /user/:userId"); // Log #6
  console.log(
    "BACKEND ORDERS: Buscando pedidos para el userId:",
    req.params.userId
  ); // Log #7

  if (req.user.uid !== req.params.userId) {
    console.log(
      "BACKEND ORDERS: ¡Acceso denegado! UID del token no coincide con el de la URL."
    ); // Log de Seguridad
    return res.status(403).json({ message: "No tienes permiso." });
  }

  try {
    const orders = await Order.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .populate("items.product");
    console.log(`BACKEND ORDERS: Se encontraron ${orders.length} pedidos.`); // Log #8
    res.json(orders);
  } catch (error) {
    console.error("BACKEND ORDERS: Error en la base de datos:", error); // Log de Error
    res
      .status(500)
      .json({ message: "Error al obtener los pedidos del usuario" });
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
// Protegido: solo usuarios logueados pueden crear pedidos
router.post("/", [authMiddleware], async (req, res) => {
  try {
    const { customerInfo, items } = req.body;
    const userId = req.user.uid;

    if (!userId) {
      return res
        .status(400)
        .json({ message: "userId no encontrado en el token." });
    }
    if (!items || items.length === 0) {
      return res
        .status(400)
        .json({ message: "El carrito no puede estar vacío." });
    }

    let totalAmount = 0;
    const processedItems = [];

    // --- ¡LA CORRECCIÓN ESTÁ DENTRO DE ESTE BUCLE! ---
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res
          .status(404)
          .json({ message: `Producto con ID ${item.product} no encontrado.` });
      }

      // Sumamos al total (la lógica de precios puede ser más compleja si hay ofertas)
      const itemPrice = product.isOnSale ? product.salePrice : product.price;
      totalAmount += itemPrice * item.quantity;

      // Creamos el objeto para guardar, ahora incluyendo las variantes
      processedItems.push({
        product: product._id,
        quantity: item.quantity,
        price: itemPrice,
        selectedVariants: item.selectedVariants, // ¡LA LÍNEA QUE FALTABA!
      });
    }

    const newOrder = new Order({
      userId: userId,
      customerInfo: customerInfo,
      items: processedItems, // Ahora este array contiene las variantes
      totalAmount: totalAmount,
    });

    let savedOrder = await newOrder.save();
    savedOrder = await savedOrder.populate("items.product");
    sendOrderConfirmationEmail(savedOrder);

    res.status(201).json(savedOrder);
  } catch (error) {
    console.error("--- Ruta POST /api/orders: ERROR ---", error);
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
