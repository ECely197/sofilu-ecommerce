const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// --- OBTENER TODOS LOS PEDIDOS (PARA EL ADMIN) ---
// GET /api/orders
router.get('/', async (req, res) => {
  try {
    // Buscamos todos los pedidos y los ordenamos del más nuevo al más viejo
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los pedidos' });
  }
});

// En el futuro, aquí añadiremos rutas para OBTENER UN PEDIDO y ACTUALIZAR SU ESTADO

// GET /api/orders/:id
router.get('/:id', async (req, res) => {
  try {
    // Buscamos el pedido por su ID.
    // Usamos .populate() dos veces para traer la información completa del producto.
    const order = await Order.findById(req.params.id).populate('items.product');
    
    if (!order) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el pedido' });
  }
});

router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body; // Obtenemos el nuevo estado del cuerpo de la petición

    // Validamos que el estado sea uno de los permitidos en nuestro modelo
    const allowedStatus = ['Procesando', 'Enviado', 'Entregado', 'Cancelado'];
    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ message: 'Estado no válido' });
    }

    // Buscamos el pedido y actualizamos solo su campo 'status'
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status: status },
      { new: true } // Para que nos devuelva el documento actualizado
    );
    
    if (!updatedOrder) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el estado del pedido' });
  }
});

module.exports = router;