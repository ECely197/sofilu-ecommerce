const mongoose = require('mongoose');
const { Schema } = mongoose;

// Esta es la plantilla para un solo ítem dentro de un pedido
const orderItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true } // Guardamos el precio al momento de la compra
});

// Esta es la plantilla para el pedido completo
const orderSchema = new Schema({
  // En un futuro, aquí iría el ID del usuario que hizo la compra
  userId: { type: String, required: true },
  customerInfo: {
    name: { type: String, required: true },
    email: { type: String, required: true }
    // Aquí irían la dirección, ciudad, etc.
  },
  items: [orderItemSchema], // Un array de ítems, usando la plantilla de arriba
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    required: true,
    enum: ['Procesando', 'Enviado', 'Entregado', 'Cancelado'], // Solo permite estos valores
    default: 'Procesando'
  },
  createdAt: { type: Date, default: Date.now }
});



module.exports = mongoose.model('Order', orderSchema);