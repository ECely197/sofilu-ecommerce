const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  imageUrl: { type: String, required: true },
  category: { type: String, required: true },
  isFeatured: { type: Boolean, default: false }, 
  isOnSale: { type: Boolean, default: false }, 
  salePrice: { type: Number },
});

module.exports = mongoose.model("Product", productSchema);
