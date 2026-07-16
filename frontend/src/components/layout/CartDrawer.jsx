import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';

const CartDrawer = ({ isOpen, onClose }) => {
  const { cart, subtotal, removeFromCart, updateQuantity, clearCart } = useCart();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const cartItems = Object.values(cart);
  const freeShippingThreshold = 198;
  const progressPercent = Math.min((subtotal / freeShippingThreshold) * 100, 100);
  const remainingForFreeShipping = freeShippingThreshold - subtotal;

  const handleCheckoutClick = () => {
    if (cartItems.length === 0) {
      alert('Seu carrinho está vazio.');
      return;
    }
    onClose();
    navigate('/checkout');
  };

  return (
    <>
      <div className="drawer-overlay open" onClick={onClose}></div>
      <div className="cart-drawer open" id="cart-drawer">
        <div className="drawer-header">
          <h2>Seu Carrinho</h2>
          <button className="close-drawers icon-button" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="shipping-bar-container">
          <span className="shipping-bar-text" id="shipping-msg">
            {subtotal >= freeShippingThreshold
              ? 'VOCÊ GANHOU FRETE GRÁTIS!'
              : `Faltam R$ ${remainingForFreeShipping.toFixed(2)} para FRETE GRÁTIS`}
          </span>
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              id="shipping-progress"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        <div className="drawer-body" id="drawer-items">
          {cartItems.length === 0 ? (
            <p className="text-center py-5" style={{ padding: '40px 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              Seu carrinho está vazio.
            </p>
          ) : (
            cartItems.map((item) => {
              const itemKey = `${item.productId}-${item.size || ''}-${item.color || ''}`;
              return (
                <div className="drawer-cart-item" key={itemKey}>
                  <img src={item.image} alt={item.name} />
                  <div className="drawer-cart-item-details" style={{ flexGrow: 1 }}>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>{item.name}</h4>
                    
                    {(item.size || item.color) && (
                      <div className="item-variations">
                        {item.size && <span className="item-variation">Tam: {item.size}</span>}
                        {item.color && <span className="item-variation">Cor: {item.color}</span>}
                      </div>
                    )}

                    <div style={{ marginTop: '8px', fontWeight: 700, fontSize: '0.85rem' }}>
                      R$ {item.price.toFixed(2)}
                    </div>

                    <div className="drawer-qty-control">
                      <button
                        className="drawer-qty-btn"
                        onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity - 1)}
                      >
                        -
                      </button>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{item.quantity}</span>
                      <button
                        className="drawer-qty-btn"
                        onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity + 1)}
                      >
                        +
                      </button>
                      
                      <button
                        className="icon-button"
                        style={{ marginLeft: 'auto', color: 'var(--color-error)', border: 'none', background: 'none', cursor: 'pointer' }}
                        onClick={() => removeFromCart(item.productId, item.size, item.color)}
                        title="Remover produto"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="drawer-footer">
          <div className="subtotal-info">
            <span>Subtotal</span>
            <span id="drawer-subtotal">R$ {subtotal.toFixed(2)}</span>
          </div>
          <button className="button w-100" id="drawer-checkout" onClick={handleCheckoutClick} style={{ marginBottom: '12px' }}>
            FINALIZAR COMPRA
          </button>
          <button className="button-as-link w-100" onClick={onClose} style={{ display: 'block', textAlign: 'center', background: 'none', border: 'none', cursor: 'pointer' }}>
            Continuar comprando →
          </button>
        </div>
      </div>
    </>
  );
};

export default CartDrawer;
