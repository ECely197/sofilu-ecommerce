const mongoose = require('mongoose');
const { Schema } = mongoose;

// Esta es la plantilla para una colección de Wishlists.
const wishlistSchema = new Schema({
  // Hacemos referencia al _id del usuario en la colección de usuarios de Firebase.
  // Así sabemos a quién pertenece esta lista de deseos.
  userId: {
    type: String,
    required: true,
    unique: true // Cada usuario solo puede tener UNA lista de deseos.
  },
  // 'products' será un array de IDs de productos.
  // Hacemos referencia a la colección 'Product'.
  products: [{
    type: Schema.Types.ObjectId,
    ref: 'Product'
  }]
});

module.exports = mongoose.model('Wishlist', wishlistSchema);