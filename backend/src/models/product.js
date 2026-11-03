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
  rating: { type: Number, default: 5 },
  numReviews: { type: Number, default: 0 },
  reviews: [
    {
      name: { type: String, required: true },
      rating: { type: Number, required: true, default: 5 },
      comment: { type: String, required: true },
      images: [{ type: String }],
      verifiedPurchase: { type: Boolean, default: true },
      createdAt: { type: Date, default: Date.now }
    }
  ]
}, {
  timestamps: true,
});

module.exports = mongoose.model('Product', productSchema);
