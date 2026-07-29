const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  category: { type: String, trim: true, default: 'Geral' },
  price: { type: Number, required: true, default: 0 },
  countInStock: { type: Number, default: 0 },
  badge: { type: String, trim: true },
  images: [{ type: String }],
  sizes: [{ type: String }], // e.g., ['P', 'M', 'G', 'GG']
  colors: [
    {
      name: { type: String },
      hex: { type: String },
      images: [{ type: String }]
    }
  ],
  benefits: [{ type: String }], // e.g., ['Tecido Respirável', 'Secagem Rápida']
  measurementsTable: { type: String }, // URL to a measurement table image or a string
}, {
  timestamps: true,
});

module.exports = mongoose.model('Product', productSchema);
