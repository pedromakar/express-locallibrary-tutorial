import { renderNav, renderFooter } from './ui.js';

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

function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY) || '{}');
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

async function loadProducts() {
  const response = await fetch('/api/products');
  return response.ok ? await response.json() : [];
}

async function renderCart() {
  const cartContent = document.getElementById('cart-content');
  const cart = getCart();
  const products = await loadProducts();
  const lineItems = Object.entries(cart)
    .map(([productId, quantity]) => {
      const product = products.find((item) => item._id === productId);
      if (!product) return null;
      return { product, quantity };
    })
    .filter(Boolean);

  if (!lineItems.length) {
    cartContent.innerHTML = `
      <div class="cart-empty">
        <p>O carrinho está vazio por enquanto.</p>
        <a class="button" href="/products">Ver produtos</a>
      </div>
    `;
    return;
  }

  const total = lineItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  cartContent.innerHTML = `
    <div class="cart-table">
      <div class="cart-header">
        <span>Produto</span>
        <span>Quantidade</span>
        <span>Subtotal</span>
      </div>
      ${lineItems
        .map(
          ({ product, quantity }) => `
            <div class="cart-item">
              <div class="cart-item-info">
                <div class="cart-image">
                  ${product.images && product.images.length ? `<img src="${product.images[0]}" alt="${product.name}" />` : '<span>Imagem</span>'}
                </div>
                <div>
                  <strong>${product.name}</strong>
                  <p>${product.description}</p>
                </div>
              </div>
              <div class="cart-controls">
                <div class="quantity-control">
                  <button class="button small" data-id="${product._id}" data-action="decrease">-</button>
                  <span>${quantity}</span>
                  <button class="button small" data-id="${product._id}" data-action="increase">+</button>
                </div>
                <button class="button secondary cart-remove" data-id="${product._id}">Remover</button>
              </div>
              <div class="cart-subtotal">R$ ${(product.price * quantity).toFixed(2)}</div>
            </div>
          `
        )
        .join('')}
    </div>
    <div class="cart-summary">
      <div>
        <p>Total</p>
        <strong>R$ ${total.toFixed(2)}</strong>
      </div>
      <div class="cart-actions">
        <button class="button checkout-button">Finalizar compra</button>
        <a class="button secondary" href="/products">Continuar comprando</a>
      </div>
    </div>
  `;
}

async function updateQuantity(productId, action) {
  const cart = getCart();
  const currentQty = cart[productId] || 0;
  if (!currentQty) return;
  const products = await loadProducts();
  const product = products.find((item) => item._id === productId);
  if (action === 'increase' && product && currentQty < product.countInStock) {
    cart[productId] = currentQty + 1;
  }
  if (action === 'decrease') {
    cart[productId] = currentQty - 1;
    if (cart[productId] <= 0) {
      delete cart[productId];
    }
  }
  saveCart(cart);
  renderCart();
}

function removeItem(productId) {
  const cart = getCart();
  delete cart[productId];
  saveCart(cart);
  renderCart();
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  renderCart();
}

root.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  const productId = button.dataset.id;
  const action = button.dataset.action;

  if (button.classList.contains('cart-remove')) {
    removeItem(productId);
  }
  if (action) {
    updateQuantity(productId, action);
  }
  if (button.classList.contains('checkout-button')) {
    event.preventDefault();
    clearCart();
    const cartContent = document.getElementById('cart-content');
    cartContent.innerHTML = `
      <div class="cart-empty">
        <p>Compra finalizada com sucesso! Seu carrinho foi limpo.</p>
        <a class="button" href="/products">Continuar comprando</a>
      </div>
    `;
  }
});

renderCart();
