const mongoose = require('mongoose');

const storeSettingsSchema = new mongoose.Schema({
  storeName: {
    type: String,
    default: 'MD ESSENTIAL'
  },
  logoUrl: {
    type: String,
    default: ''
  },
  announcementText: {
    type: String,
    default: 'FRETE GRÁTIS ACIMA DE R$ 198 · 10% CASHBACK NA PRIMEIRA COMPRA'
  },
  heroEyebrow: {
    type: String,
    default: 'Coleção Apex Pro - A Melhor do Brasil'
  },
  heroTitle: {
    type: String,
    default: 'O INVERNO É O NOSSO PONTO ZERO'
  },
  heroSubtitle: {
    type: String,
    default: 'Alta performance e isolamento térmico inteligente. Desenvolvido para superar o frio com atitude.'
  },
  heroButtonText: {
    type: String,
    default: 'VER COLEÇÃO'
  },
  heroBannerUrl: {
    type: String,
    default: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1600&q=80'
  },
  categoryImages: {
    type: Map,
    of: String,
    default: {}
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('StoreSettings', storeSettingsSchema);
