import React, { createContext, useContext, useState, useEffect } from 'react';
import settingsService from '../services/settingsService';

const StoreSettingsContext = createContext();

const defaultSettings = {
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

export const StoreSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const data = await settingsService.getSettings();
      if (data) {
        setSettings({
          ...defaultSettings,
          ...data,
          categoryImages: data.categoryImages || {}
        });
      }
    } catch (err) {
      console.error('Error loading store settings context:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (settings?.storeName) {
      document.title = settings.storeName;
    }
  }, [settings]);

  const updateStoreSettings = async (newSettingsData) => {
    try {
      const updated = await settingsService.updateSettings(newSettingsData);
      if (updated) {
        setSettings({
          ...defaultSettings,
          ...updated,
          categoryImages: updated.categoryImages || {}
        });
      }
      return updated;
    } catch (err) {
      console.error('Error updating store settings context:', err);
      throw err;
    }
  };

  return (
    <StoreSettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings, updateStoreSettings }}>
      {children}
    </StoreSettingsContext.Provider>
  );
};

export const useStoreSettings = () => {
  const context = useContext(StoreSettingsContext);
  if (!context) {
    throw new Error('useStoreSettings must be used within a StoreSettingsProvider');
  }
  return context;
};

export default StoreSettingsContext;
