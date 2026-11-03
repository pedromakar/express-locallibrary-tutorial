import { renderNav, renderFooter, syncCart, initDrawerEvents, updateCartBadge, getSafeCart } from './ui.js?v=2';

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

initDrawerEvents();
updateCartBadge();

async function renderCart() {
  const cartContent = document.getElementById('cart-content');
  
  // Always read from localStorage (single source of truth on frontend)
  const cart = getSafeCart();
  const cartKeys = Object.keys(cart);

  if (cartKeys.length === 0) {
    cartContent.innerHTML = `
      <div class="cart-empty">
        <i class="fas fa-shopping-bag" style="font-size: 3rem; color: var(--color-text-muted); margin-bottom: 1rem;"></i>
        <p>Seu carrinho está vazio no momento!</p>
        <p>Você pode conferir todos os produtos disponíveis e comprar alguns na loja.</p>
        <a class="button" href="/products">Continuar Comprando</a>
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

    const productUrl = `/product.html?id=${product._id || product.id}`;

    return `
      <div class="cart-item">
        <div class="cart-item-info">
          <a href="${productUrl}" class="cart-image" title="Ver ${product.name}">
            <img src="${product.image || product.images[0]}" alt="${product.name}" style="border-radius: var(--radius-sm);" />
          </a>
          <div>
            <strong><a href="${productUrl}" style="color: inherit; text-decoration: none;">${product.name}</a></strong>
            <p style="margin: 2px 0; font-weight: 700;">R$ ${product.price.toFixed(2)}</p>
            <div class="item-variations" style="display: flex; gap: 6px; margin: 4px 0;">
              ${item.size ? `<span class="item-variation" style="font-size: 0.7rem; font-weight: 700; background: #fff; border: 1px solid var(--color-border); padding: 2px 6px; border-radius: 4px;">Tam: ${item.size}</span>` : ''}
              ${item.color ? `<span class="item-variation" style="font-size: 0.7rem; font-weight: 700; background: #fff; border: 1px solid var(--color-border); padding: 2px 6px; border-radius: 4px;">Cor: ${item.color}</span>` : ''}
            </div>
            <span style="font-size: 0.75rem; color: #28a745; font-weight: 700;">
              <i class="fas fa-check-circle" style="font-size: 0.7rem;"></i> ${product.countInStock} disponíveis em estoque
            </span>
          </div>
        </div>
        <div class="cart-controls">
          <div class="quantity-control">
            <button class="button small" data-action="decrease" data-key="${key}" data-stock="${product.countInStock}">-</button>
            <span>${item.quantity}</span>
            <button class="button small" data-action="increase" data-key="${key}" data-stock="${product.countInStock}">+</button>
          </div>
          <button class="text-link small cart-remove" data-action="remove" data-key="${key}" data-stock="${product.countInStock}">Remover</button>
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
        <a class="button checkout-button" href="/checkout">Finalizar compra</a>
      </div>
    </div>
  `;
}

window.updateCartPageQty = (key, newQty, stock) => {
  console.log('window.updateCartPageQty called with:', key, newQty, stock);
  const cart = getSafeCart();
  console.log('Current cart on page in localStorage:', cart);
  if (newQty <= 0) delete cart[key];
  else {
    if (cart[key]) {
      if (stock !== undefined && newQty > stock) {
        alert('Limite de estoque atingido para este produto.');
        return;
      }
      cart[key].quantity = newQty;
    } else {
      console.warn('Key not found in page cart:', key);
    }
  }
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  console.log('Updated cart on page in localStorage:', localStorage.getItem(CART_KEY));
  syncCart();
};

const cartContentElement = document.getElementById('cart-content');
cartContentElement?.addEventListener('click', async (e) => {
  const button = e.target.closest('[data-action]');
  if (!button) return;

  e.preventDefault();
  const action = button.dataset.action;
  const key = button.dataset.key;
  const stock = button.dataset.stock ? parseInt(button.dataset.stock, 10) : undefined;

  const cart = getSafeCart();
  if (!cart[key]) return;

  let newQty = cart[key].quantity;
  if (action === 'increase') {
    newQty += 1;
  } else if (action === 'decrease') {
    newQty -= 1;
  } else if (action === 'remove') {
    newQty = 0;
  }

  await window.updateCartPageQty(key, newQty, stock);
});

window.refreshCartPage = renderCart;

renderCart();
