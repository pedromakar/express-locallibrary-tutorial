import { renderNav, renderFooter, syncCart, initDrawerEvents, updateCartBadge, getSafeCart, addToCart } from './ui.js?v=2';

const CART_KEY = 'md-essential-cart';
const FREE_SHIPPING_THRESHOLD = 198;
const root = document.getElementById('page-root');

// Supported test / promo coupons
const AVAILABLE_COUPONS = {
  'DESCONTO10': { type: 'percent', value: 10, label: '10% OFF' },
  'FRETE0': { type: 'shipping', value: 0, label: 'Frete Grátis' },
  'MD20': { type: 'fixed', value: 20, label: 'R$ 20,00 OFF' },
  'PRIMEIRACOMPRA': { type: 'percent', value: 10, label: '10% OFF Primeira Compra' }
};

let appliedCoupon = null;

root.innerHTML = `
  ${renderNav('cart')}
  <main class="content">
    <section class="box">
      <div class="cart-page-header">
        <h1>Carrinho</h1>
        <p class="cart-page-subtitle">Confira os itens selecionados e finalize sua compra com segurança.</p>
      </div>
      <div id="cart-content"></div>
    </section>
  </main>
  ${renderFooter('cart')}
`;

initDrawerEvents();
updateCartBadge();

async function renderCart() {
  const cartContent = document.getElementById('cart-content');
  if (!cartContent) return;

  const cart = getSafeCart();
  const cartKeys = Object.keys(cart);

  if (cartKeys.length === 0) {
    cartContent.innerHTML = `
      <div class="cart-empty">
        <i class="fas fa-shopping-bag" style="font-size: 3.5rem; color: var(--color-text-muted); margin-bottom: 1.25rem;"></i>
        <h2>Seu carrinho está vazio</h2>
        <p style="color: var(--color-text-muted); max-width: 420px; margin: 0 auto 1.5rem auto;">Explore nossa coleção de roupas e equipamentos de treino e escolha as melhores peças para o seu treino.</p>
        <a class="button" href="/products">Ver Coleção</a>
      </div>
    `;
    return;
  }

  let allProducts = [];
  try {
    const response = await fetch('/api/products');
    allProducts = response.ok ? await response.json() : [];
  } catch (err) {
    console.error('Erro ao buscar produtos:', err);
  }

  let subtotal = 0;
  const inCartProductIds = new Set();

  const lineItemsHtml = cartKeys.map(key => {
    const item = cart[key];
    const product = allProducts.find(p => p._id === item.productId || p.id === item.productId);
    if (!product) return '';

    inCartProductIds.add(product._id || product.id);
    const itemTotal = product.price * item.quantity;
    subtotal += itemTotal;

    const productUrl = `/product.html?id=${product._id || product.id}`;
    const productImg = product.image || (product.images && product.images[0]) || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=80';

    return `
      <div class="cart-item">
        <div class="cart-item-info">
          <a href="${productUrl}" class="cart-image" title="Ver ${product.name}">
            <img src="${productImg}" alt="${product.name}" />
          </a>
          <div class="cart-item-details">
            <strong class="cart-item-title"><a href="${productUrl}">${product.name}</a></strong>
            <p class="cart-item-price">R$ ${product.price.toFixed(2).replace('.', ',')}</p>
            <div class="item-variations">
              ${item.size ? `<span class="item-variation-pill">Tam: ${item.size}</span>` : ''}
              ${item.color ? `<span class="item-variation-pill">Cor: ${item.color}</span>` : ''}
            </div>
            <span class="stock-badge-cart">
              <i class="fas fa-check-circle"></i> Em estoque (${product.countInStock} un.)
            </span>
          </div>
        </div>
        <div class="cart-controls">
          <div class="quantity-control">
            <button class="qty-btn" data-action="decrease" data-key="${key}" data-stock="${product.countInStock}" aria-label="Diminuir quantidade">−</button>
            <span class="qty-num">${String(item.quantity).padStart(2, '0')}</span>
            <button class="qty-btn" data-action="increase" data-key="${key}" data-stock="${product.countInStock}" aria-label="Aumentar quantidade">+</button>
          </div>
          <button class="cart-remove-btn" data-action="remove" data-key="${key}" data-stock="${product.countInStock}">
            <i class="fas fa-trash-alt"></i> Remover
          </button>
        </div>
        <div class="cart-subtotal">
          <span class="cart-subtotal-label mobile-only">Subtotal: </span>
          <strong>R$ ${itemTotal.toFixed(2).replace('.', ',')}</strong>
        </div>
      </div>
    `;
  }).join('');

  // 1. Free Shipping Progress
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));

  const shippingBarHtml = `
    <div class="cart-shipping-bar-card">
      <div class="shipping-bar-header">
        <i class="fas fa-truck-fast"></i>
        <span>
          ${isFreeShipping 
            ? '🎉 Parabéns! Você ganhou <strong>FRETE GRÁTIS</strong> neste pedido!' 
            : `Faltam <strong>R$ ${remainingForFreeShipping.toFixed(2).replace('.', ',')}</strong> para você garantir <strong>FRETE GRÁTIS</strong>`}
        </span>
      </div>
      <div class="shipping-bar-track">
        <div class="shipping-bar-fill ${isFreeShipping ? 'complete' : ''}" style="width: ${progressPercent}%;"></div>
      </div>
    </div>
  `;

  // 2. Calculations with Discounts
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percent') {
      discountAmount = (subtotal * appliedCoupon.value) / 100;
    } else if (appliedCoupon.type === 'fixed') {
      discountAmount = Math.min(subtotal, appliedCoupon.value);
    }
  }

  const finalTotal = Math.max(0, subtotal - discountAmount);

  // 3. Complementary Products (Cross-sell / Compre Junto)
  const complementaryProducts = allProducts
    .filter(p => !inCartProductIds.has(p._id) && !inCartProductIds.has(p.id) && p.countInStock > 0)
    .slice(0, 3);

  const complementaryHtml = complementaryProducts.length > 0 ? `
    <div class="cart-cross-sell-section">
      <div class="cross-sell-header">
        <h3><i class="fas fa-sparkles"></i> COMPRE JUNTO E COMPLETE SEU KIT</h3>
        <p>Itens selecionados que combinam com seu treino:</p>
      </div>
      <div class="cross-sell-grid">
        ${complementaryProducts.map(p => {
          const cImg = p.image || (p.images && p.images[0]) || '';
          return `
            <div class="cross-sell-item">
              <img src="${cImg}" alt="${p.name}" class="cross-sell-img" />
              <div class="cross-sell-info">
                <h4>${p.name}</h4>
                <p class="cross-sell-price">R$ ${p.price.toFixed(2).replace('.', ',')}</p>
                <button class="button button-small button-outline cross-sell-add-btn" 
                        data-product-id="${p._id || p.id}" 
                        data-product-stock="${p.countInStock}"
                        data-product-size="${p.sizes?.[0] || 'M'}">
                  + Adicionar
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  ` : '';

  cartContent.innerHTML = `
    ${shippingBarHtml}

    <div class="cart-layout-container">
      <div class="cart-table-wrapper">
        <div class="cart-table">
          <div class="cart-header">
            <span>Produto</span>
            <span>Quantidade</span>
            <span style="text-align: right;">Subtotal</span>
          </div>
          ${lineItemsHtml}
        </div>

        ${complementaryHtml}
      </div>

      <div class="cart-summary-wrapper">
        <div class="cart-summary-card">
          <h3 class="summary-title">Resumo do Pedido</h3>

          <!-- Promo Code Input (Reference 2) -->
          <div class="cart-coupon-box">
            <div class="coupon-input-group">
              <input type="text" id="cart-coupon-input" placeholder="Cupom de desconto" value="${appliedCoupon ? appliedCoupon.code : ''}" />
              <button id="cart-apply-coupon-btn" class="button button-small ${appliedCoupon ? 'button-outline' : ''}">
                ${appliedCoupon ? 'Remover' : 'Aplicar'}
              </button>
            </div>
            <p id="cart-coupon-feedback" class="coupon-feedback ${appliedCoupon ? 'success' : ''}">
              ${appliedCoupon ? `Cupom <strong>${appliedCoupon.code}</strong> (${appliedCoupon.label}) aplicado com sucesso!` : ''}
            </p>
          </div>

          <div class="summary-breakdown">
            <div class="summary-row">
              <span>Subtotal dos produtos</span>
              <span>R$ ${subtotal.toFixed(2).replace('.', ',')}</span>
            </div>
            <div class="summary-row">
              <span>Frete</span>
              <span class="${isFreeShipping ? 'text-success font-bold' : ''}">
                ${isFreeShipping ? 'GRÁTIS' : 'Calculado no checkout'}
              </span>
            </div>
            ${discountAmount > 0 ? `
              <div class="summary-row discount-row">
                <span>Desconto (${appliedCoupon.code})</span>
                <span class="text-danger">- R$ ${discountAmount.toFixed(2).replace('.', ',')}</span>
              </div>
            ` : ''}
            <div class="summary-row total-row">
              <div>
                <strong>Total</strong>
                <span class="total-items-badge">(${cartKeys.length} ${cartKeys.length === 1 ? 'item' : 'itens'})</span>
              </div>
              <strong class="total-value">R$ ${finalTotal.toFixed(2).replace('.', ',')}</strong>
            </div>
          </div>

          <div class="cart-checkout-actions">
            <a class="button button-checkout-main" href="/checkout">
              <i class="fas fa-lock"></i> FINALIZAR COMPRA
            </a>
            <a class="button button-outline w-100" href="/products">
              Continuar Comprando
            </a>
          </div>

          <!-- Trust & Security Badges (Reference 1 & 2) -->
          <div class="cart-trust-badges">
            <div class="trust-badge-item">
              <i class="fas fa-shield-check"></i>
              <span>Ambiente Seguro • Checkout Pro Mercado Pago</span>
            </div>
            <div class="trust-badge-item">
              <i class="fab fa-pix"></i>
              <span>PIX com aprovação imediata</span>
            </div>
            <div class="trust-badge-item">
              <i class="fas fa-sync-alt"></i>
              <span>Primeira troca grátis em até 30 dias</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Bind coupon handler
  const couponBtn = document.getElementById('cart-apply-coupon-btn');
  const couponInput = document.getElementById('cart-coupon-input');
  const couponFeedback = document.getElementById('cart-coupon-feedback');

  couponBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    if (appliedCoupon) {
      appliedCoupon = null;
      renderCart();
      return;
    }
    const code = (couponInput?.value || '').trim().toUpperCase();
    if (!code) {
      if (couponFeedback) {
        couponFeedback.textContent = 'Digite um cupom válido.';
        couponFeedback.className = 'coupon-feedback error';
      }
      return;
    }

    if (AVAILABLE_COUPONS[code]) {
      appliedCoupon = { code, ...AVAILABLE_COUPONS[code] };
      renderCart();
    } else {
      if (couponFeedback) {
        couponFeedback.textContent = `Cupom "${code}" inválido ou expirado. Tente DESCONTO10 ou MD20.`;
        couponFeedback.className = 'coupon-feedback error';
      }
    }
  });

  // Bind cross-sell quick add buttons
  document.querySelectorAll('.cross-sell-add-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const pId = btn.dataset.productId;
      const pStock = parseInt(btn.dataset.productStock, 10);
      const pSize = btn.dataset.productSize || 'M';

      btn.disabled = true;
      btn.textContent = 'Adicionando...';
      addToCart(pId, pStock, pSize, null, 1, false);
      renderCart();
    });
  });
}

window.updateCartPageQty = (key, newQty, stock) => {
  const cart = getSafeCart();
  if (newQty <= 0) {
    delete cart[key];
  } else {
    if (cart[key]) {
      if (stock !== undefined && newQty > stock) {
        alert('Limite de estoque atingido para este produto.');
        return;
      }
      cart[key].quantity = newQty;
    }
  }
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  syncCart();
  renderCart();
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
