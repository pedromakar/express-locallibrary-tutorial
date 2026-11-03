import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { StoreSettingsProvider } from './contexts/StoreSettingsContext';
import AppRouter from './router';

function App() {
  return (
    <AuthProvider>
      <StoreSettingsProvider>
        <CartProvider>
          <AppRouter />
        </CartProvider>
      </StoreSettingsProvider>
    </AuthProvider>
  );
}

export default App;
