const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: [
      'new_order',
      'new_customer',
      'out_of_stock',
      'low_stock',
      'abandoned_cart',
      'order_canceled',
      'payment_approved',
      'order_shipped',
    ],
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    default: '',
  },
  read: {
    type: Boolean,
    default: false,
  },
  relatedId: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Notification', notificationSchema);
