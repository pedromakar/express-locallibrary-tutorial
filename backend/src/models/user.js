const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  avatar: {
    type: String,
    default: '',
  },
  addresses: [
    {
      street: { type: String, default: '' },
      number: { type: String, default: '' },
      complement: { type: String, default: '' },
      neighborhood: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      cep: { type: String, default: '' },
      isDefault: { type: Boolean, default: false },
    }
  ],
  marketingPreferences: {
    emailPromo: { type: Boolean, default: true },
    smsPromo: { type: Boolean, default: true },
    whatsappPromo: { type: Boolean, default: true },
    postPromo: { type: Boolean, default: false }
  },
  cart: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        default: 1,
      },
      size: {
        type: String,
      },
      color: {
        type: String,
      },
    },
  ],
  phone: {
    type: String,
    default: '',
    trim: true,
  },
  cpf: {
    type: String,
    default: '',
    trim: true,
  },
  lastLogin: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', userSchema);
