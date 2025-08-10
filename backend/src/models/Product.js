

const mongoose = require('mongoose');
const { Schema } = mongoose;

const optionSchema = new Schema({
  name: { type: String, required: true },
}, { _id: false });


const variantSchema = new Schema({
  name: { type: String, required: true },
  options: [optionSchema]
}, { _id: false });


const productSchema = new Schema({
  name: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  price: { 
    type: Number, 
    required: true 
  },
  category: { 
    type: String 
  },
  // --------------------------------

  images: [{ 
    type: String, 
    required: true 
  }],
  isFeatured: { 
    type: Boolean, 
    default: false 
  },
  isOnSale: { 
    type: Boolean, 
    default: false 
  },
  salePrice: { 
    type: Number 
  },
  variants: [variantSchema]
});

module.exports = mongoose.model('Product', productSchema);