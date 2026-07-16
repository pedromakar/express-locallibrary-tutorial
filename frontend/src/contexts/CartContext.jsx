import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';

const CartContext = createContext(null);
const CART_KEY = 'md-essential-cart';

export const CartProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [cart, setCart] = useState(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch (e) {
      console.error('Error loading cart from localStorage:', e);
    }
    return {};
  });

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    syncCartWithServer();
  }, [cart]);

  // Synchronize cart with the server when logged in
  const syncCartWithServer = async () => {
    if (token) {
      try {
        const formattedCart = Object.values(cart).map((item) => ({
          product: item.productId,
          quantity: item.quantity,
          size: item.size || null,
          color: item.color || null
        }));
        await api.put('/users/cart', { cart: formattedCart });
      } catch (err) {
        console.error('Error syncing cart with server:', err);
      }
    }
  };

  // Helper to get cart item unique key
  const getCartKey = (productId, size, color) => {
    return `${productId}-${size || ''}-${color || ''}`;
  };

  const addToCart = (product, quantity = 1, size = '', color = '') => {
    const key = getCartKey(product._id, size, color);
    setCart((prev) => {
      const existing = prev[key];
      const newQty = existing ? existing.quantity + quantity : quantity;
      
      if (product.countInStock !== undefined && newQty > product.countInStock) {
        alert('Limite de estoque atingido para este produto.');
        return prev;
      }

      return {
        ...prev,
        [key]: {
          productId: product._id,
          name: product.name,
          price: product.price,
          image: product.images?.[0] || '',
          quantity: newQty,
          size,
          color,
          stock: product.countInStock
        }
      };
    });
  };

  const removeFromCart = (productId, size = '', color = '') => {
    const key = getCartKey(productId, size, color);
    setCart((prev) => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  const updateQuantity = (productId, size = '', color = '', quantity = 1) => {
    const key = getCartKey(productId, size, color);
    setCart((prev) => {
      const existing = prev[key];
      if (!existing) return prev;
      
      if (quantity <= 0) {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      }

      if (existing.stock !== undefined && quantity > existing.stock) {
        alert('Limite de estoque atingido para este produto.');
        return prev;
      }

      return {
        ...prev,
        [key]: {
          ...existing,
          quantity
        }
      };
    });
  };

  const clearCart = () => {
    setCart({});
  };

  const getSubtotal = () => {
    return Object.values(cart).reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const getItemCount = () => {
    return Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal: getSubtotal(),
        itemCount: getItemCount(),
        syncCartWithServer
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
