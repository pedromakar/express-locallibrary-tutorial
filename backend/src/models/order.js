const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Product',
      },
      name: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true },
      size: { type: String },
      color: { type: String },
    },
  ],
  totalPrice: {
    type: Number,
    required: true,
    default: 0.0,
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'paid', 'processing', 'shipped', 'delivered', 'canceled'],
    default: 'pending',
  },
  paymentMethod: { type: String, default: '' },
  shippingMethod: { type: String, default: '' },
  shippingPrice: { type: Number, default: 0 },
  shippingAddress: {
    recipientName: { type: String, default: '' },
    phone: { type: String, default: '' },
    zipCode: { type: String, default: '' },
    street: { type: String, default: '' },
    number: { type: String, default: '' },
    complement: { type: String, default: '' },
    neighborhood: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' }
  },
  customerPhone: { type: String, default: '' },
  customerEmail: { type: String, default: '' },
  pixCode: { type: String, default: '' },
  boletoCode: { type: String, default: '' },
  trackingCode: { type: String, default: '' },
  carrier: { type: String, default: 'Correios' },
  trackingEvents: [
    {
      status: { type: String, required: true },
      description: { type: String, required: true },
      location: { type: String, default: 'Sombrio/SC' },
      date: { type: Date, default: Date.now }
    }
  ]
}, {
  timestamps: true,
});

module.exports = mongoose.model('Order', orderSchema);
