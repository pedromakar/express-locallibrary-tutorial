const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  category: { type: String, trim: true, default: 'Geral' },
  price: { type: Number, required: true, default: 0 },
  countInStock: { type: Number, default: 0 },
  images: [{ type: String }],
}, {
  timestamps: true,
});

module.exports = mongoose.model('Product', productSchema);
