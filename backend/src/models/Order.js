const mongoose = require('mongoose');
const { Schema } = mongoose;

// Plantilla para un solo ítem dentro de un pedido
const orderItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true } // Guardamos el precio al momento de la compra
});

// Plantilla para el pedido completo
const orderSchema = new Schema({
  // Guardamos el UID del usuario de Firebase que realizó la compra
  userId: { 
    type: String, 
    required: true 
  },
  customerInfo: {
    name: { type: String, required: true },
    email: { type: String, required: true }
    // En el futuro aquí irían la dirección, ciudad, etc.
  },
  items: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    required: true,
    enum: ['Procesando', 'Enviado', 'Entregado', 'Cancelado'],
    default: 'Procesando'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);