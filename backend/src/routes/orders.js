const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
// ¡Importamos el modelo Product para poder usarlo!
const Product = require('../models/Product');

// --- OBTENER TODOS LOS PEDIDOS (PARA EL ADMIN) ---
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los pedidos' });
  }
});

// --- OBTENER UN PEDIDO POR SU ID ---
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product');
    if (!order) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el pedido' });
  }
});

// --- CREAR UN NUEVO PEDIDO ---
router.post('/', async (req, res) => {
  try {
    const { customerInfo, items } = req.body;
    let totalAmount = 0;
    const processedItems = [];

    for (const item of items) {
      // ¡Ahora Node.js sabrá qué es 'Product' en esta línea!
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Producto con ID ${item.product} no encontrado.` });
      }
      totalAmount += product.price * item.quantity;
      processedItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price
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
    res.status(400).json({ message: 'Error al crear el pedido' });
  }
});

// --- ACTUALIZAR EL ESTADO DE UN PEDIDO ---
router.put('/:id/status', async (req, res) => {
  // ... (lógica existente)
});

module.exports = router;