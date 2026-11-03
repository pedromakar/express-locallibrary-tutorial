import React from 'react';
import { useStoreSettings } from '../../contexts/StoreSettingsContext';

const Footer = () => {
  const { settings } = useStoreSettings();
  return (
    <footer className="app-footer">
      <div className="container-custom">
        <p>&copy; {new Date().getFullYear()} {settings?.storeName || 'MD Essential'}. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;
