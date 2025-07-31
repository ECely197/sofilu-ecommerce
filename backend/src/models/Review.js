const mongoose = require('mongoose');
const { Schema } = mongoose;

const reviewSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  // En el futuro, aquí iría el userId para saber quién escribió la reseña
  // userId: { type: String, required: true },
  author: { type: String, required: true, default: 'Anónimo' }, // Por ahora, un nombre simple
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, required: true },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', reviewSchema);