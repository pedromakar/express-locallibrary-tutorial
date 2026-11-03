const mongoose = require('mongoose');
const StoreSettings = require('../models/storeSettings');

// Fallback in-memory settings in case DB is offline or not yet initialized
let fallbackSettings = {
  storeName: 'MD ESSENTIAL',
  logoUrl: '',
  announcementText: 'FRETE GRÁTIS ACIMA DE R$ 198 · 10% CASHBACK NA PRIMEIRA COMPRA',
  heroEyebrow: 'Coleção Apex Pro - A Melhor do Brasil',
  heroTitle: 'O INVERNO É O NOSSO PONTO ZERO',
  heroSubtitle: 'Alta performance e isolamento térmico inteligente. Desenvolvido para superar o frio com atitude.',
  heroButtonText: 'VER COLEÇÃO',
  heroBannerUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1600&q=80',
  categoryImages: {}
};

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

exports.getSettings = async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.json(fallbackSettings);
    }
    let settings = await StoreSettings.findOne();
    if (!settings) {
      settings = await StoreSettings.create({});
    }
    res.json(settings);
  } catch (err) {
    console.error('Error fetching store settings:', err);
    res.json(fallbackSettings);
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const {
      storeName,
      logoUrl,
      announcementText,
      heroEyebrow,
      heroTitle,
      heroSubtitle,
      heroButtonText,
      heroBannerUrl,
      categoryImages
    } = req.body;

    if (!isDbConnected()) {
      fallbackSettings = {
        ...fallbackSettings,
        storeName: storeName ?? fallbackSettings.storeName,
        logoUrl: logoUrl ?? fallbackSettings.logoUrl,
        announcementText: announcementText ?? fallbackSettings.announcementText,
        heroEyebrow: heroEyebrow ?? fallbackSettings.heroEyebrow,
        heroTitle: heroTitle ?? fallbackSettings.heroTitle,
        heroSubtitle: heroSubtitle ?? fallbackSettings.heroSubtitle,
        heroButtonText: heroButtonText ?? fallbackSettings.heroButtonText,
        heroBannerUrl: heroBannerUrl ?? fallbackSettings.heroBannerUrl,
        categoryImages: categoryImages ? { ...fallbackSettings.categoryImages, ...categoryImages } : fallbackSettings.categoryImages
      };
      return res.json(fallbackSettings);
    }

    let settings = await StoreSettings.findOne();
    if (!settings) {
      settings = new StoreSettings({});
    }

    if (storeName !== undefined) settings.storeName = storeName;
    if (logoUrl !== undefined) settings.logoUrl = logoUrl;
    if (announcementText !== undefined) settings.announcementText = announcementText;
    if (heroEyebrow !== undefined) settings.heroEyebrow = heroEyebrow;
    if (heroTitle !== undefined) settings.heroTitle = heroTitle;
    if (heroSubtitle !== undefined) settings.heroSubtitle = heroSubtitle;
    if (heroButtonText !== undefined) settings.heroButtonText = heroButtonText;
    if (heroBannerUrl !== undefined) settings.heroBannerUrl = heroBannerUrl;
    if (categoryImages !== undefined) {
      settings.categoryImages = categoryImages;
    }

    await settings.save();
    res.json(settings);
  } catch (err) {
    console.error('Error updating store settings:', err);
    res.status(500).json({ message: 'Erro ao atualizar configurações da loja.' });
  }
};
