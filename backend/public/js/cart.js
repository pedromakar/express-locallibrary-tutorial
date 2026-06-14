import { renderNav, renderFooter, syncCart } from './ui.js';

const CART_KEY = 'md-essential-cart';
const root = document.getElementById('page-root');
root.innerHTML = `
  ${renderNav('cart')}
  <main class="content">
    <section class="box">
      <h1>Carrinho</h1>
      <p>Aqui estão os produtos que você adicionou ao carrinho.</p>
      <div id="cart-content"></div>
    </section>
  </main>
  ${renderFooter()}
`;

async function renderCart() {
  const cartContent = document.getElementById('cart-content');
  const cart = JSON.parse(localStorage.getItem(CART_KEY) || '{}');
  const cartKeys = Object.keys(cart);

  if (cartKeys.length === 0) {
    cartContent.innerHTML = `
      <div class="cart-empty">
        <p>Seu carrinho está vazio.</p>
        <a class="button" href="/products">Ver produtos</a>
      </div>
    `;
    return;
  }

  const response = await fetch('/api/products');
  const allProducts = await response.json();

  let subtotal = 0;
  const lineItemsHtml = cartKeys.map(key => {
    const item = cart[key];
    const product = allProducts.find(p => p._id === item.productId);
    if (!product) return '';

    const itemTotal = product.price * item.quantity;
    subtotal += itemTotal;

    return `
      <div class="cart-item">
        <div class="cart-item-info">
          <div class="cart-image">
            <img src="${product.image || product.images[0]}" alt="${product.name}" />
          </div>
          <div>
            <strong>${product.name}</strong>
            <div class="item-variations">
              ${item.size ? `<span class="item-variation">${item.size}</span>` : ''}
              ${item.color ? `<span class="item-variation">${item.color}</span>` : ''}
            </div>
            <p>R$ ${product.price.toFixed(2)}</p>
          </div>
        </div>
        <div class="cart-controls">
          <div class="quantity-control">
            <button class="button small" onclick="updateCartPageQty('${key}', ${item.quantity - 1})">-</button>
            <span>${item.quantity}</span>
            <button class="button small" onclick="updateCartPageQty('${key}', ${item.quantity + 1})">+</button>
          </div>
          <button class="text-link small cart-remove" onclick="updateCartPageQty('${key}', 0)">Remover</button>
        </div>
        <div class="cart-subtotal">
          R$ ${itemTotal.toFixed(2)}
        </div>
      </div>
    `;
  }).join('');

  cartContent.innerHTML = `
    <div class="cart-table">
      <div class="cart-header">
        <span>Produto</span>
        <span>Quantidade</span>
        <span style="text-align: right;">Subtotal</span>
      </div>
      ${lineItemsHtml}
    </div>
    <div class="cart-summary">
      <div>
        <p>Total do pedido</p>
        <strong>R$ ${subtotal.toFixed(2)}</strong>
      </div>
      <div class="cart-actions">
        <a class="button button-outline" href="/products">Continuar comprando</a>
        <button class="button checkout-button">Finalizar compra</button>
      </div>
    </div>
  `;
}

window.updateCartPageQty = (key, newQty) => {
  const cart = JSON.parse(localStorage.getItem(CART_KEY) || '{}');
  if (newQty <= 0) delete cart[key];
  else cart[key].quantity = newQty;
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  renderCart();
  syncCart();
};

document.addEventListener('click', async (event) => {
  const button = event.target;
  
  if (button.classList.contains('checkout-button')) {
    event.preventDefault();
    
    const token = localStorage.getItem('md-essential-admin-token');
    if (!token) {
      alert('Por favor, faça login para finalizar a compra.');
      window.location.href = '/login';
      return;
    }

    const cart = JSON.parse(localStorage.getItem(CART_KEY) || '{}');
    const items = Object.values(cart);

    if (items.length === 0) {
      alert('Seu carrinho está vazio.');
      return;
    }

    button.textContent = 'PROCESSANDO...';
    button.disabled = true;

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ items })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Erro ao processar pedido');
      }

      localStorage.removeItem(CART_KEY);
      syncCart();
      
      const cartContent = document.getElementById('cart-content');
      cartContent.innerHTML = `
        <div class="cart-empty">
          <i class="fas fa-check-circle" style="font-size: 3rem; color: #2ecc71; margin-bottom: 1rem;"></i>
          <h2>Pedido Realizado!</h2>
          <p>Seu pedido <strong>#${data.orderId}</strong> foi registrado com sucesso.</p>
          <p>Total: R$ ${data.totalPrice.toFixed(2)}</p>
          <a class="button" href="/products">Continuar comprando</a>
        </div>
      `;
    } catch (err) {
      alert(err.message);
      button.textContent = 'Finalizar compra';
      button.disabled = false;
    }
  }
});

renderCart();
