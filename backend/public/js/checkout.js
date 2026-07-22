import { renderNav, renderFooter, initDrawerEvents, updateCartBadge, syncCart, getSafeCart } from './ui.js?v=2';
import { calculateFreight, FREE_SHIPPING_THRESHOLD } from './freight.js';

const CART_KEY = 'md-essential-cart';
const root = document.getElementById('page-root');
const token = localStorage.getItem('md-essential-admin-token');

let selectedPayment = null;
let selectedShipping = null;
let appliedCoupon = null;

// Test coupons (simulated)
const TEST_COUPONS = {
  'DESCONTO10': { type: 'percent', value: 10, label: '10% de desconto' },
  'FRETE0': { type: 'shipping', value: 0, label: 'Frete Grátis' },
  'MD20': { type: 'fixed', value: 20, label: 'R$ 20,00 de desconto' },
};

/* ===========================
   TOAST NOTIFICATION
=========================== */
function showToast(message, type = 'default', duration = 3000) {
  let toast = document.getElementById('ck-global-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'ck-global-toast';
    toast.className = 'ck-toast';
    document.body.appendChild(toast);
  }
  toast.className = `ck-toast ${type}`;
  const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
  toast.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
  toast.classList.add('show');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => toast.classList.remove('show'), duration);
}

/* ===========================
   CEP LOOKUP (ViaCEP)
=========================== */
async function lookupCEP(cep) {
  const raw = cep.replace(/\D/g, '');
  if (raw.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
    const data = await res.json();
    if (data.erro) return null;
    return data;
  } catch {
    return null;
  }
}

/* ===========================
   INPUT MASKS
=========================== */
function applyMasks() {
  const cpf = document.getElementById('ck-cpf');
  if (cpf) {
    cpf.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '').slice(0, 11);
      v = v.replace(/(\d{3})(\d)/, '$1.$2');
      v = v.replace(/(\d{3})(\d)/, '$1.$2');
      v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      e.target.value = v;
    });
  }

  const phone = document.getElementById('ck-phone');
  if (phone) {
    phone.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '').slice(0, 11);
      v = v.replace(/(\d{2})(\d)/, '($1) $2');
      v = v.replace(/(\d{5})(\d)/, '$1-$2');
      e.target.value = v;
    });
  }

  const cepInput = document.getElementById('ck-cep');
  if (cepInput) {
    cepInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '').slice(0, 8);
      v = v.replace(/(\d{5})(\d)/, '$1-$2');
      e.target.value = v;
    });
  }

  const cardNumber = document.getElementById('ck-card-number');
  if (cardNumber) {
    cardNumber.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '').slice(0, 16);
      v = v.replace(/(\d{4})(?=\d)/g, '$1 ');
      e.target.value = v;
      updateCardPreview();
    });
  }

  const cardName = document.getElementById('ck-card-name');
  if (cardName) {
    cardName.addEventListener('input', () => updateCardPreview());
  }

  const cardExpiry = document.getElementById('ck-card-expiry');
  if (cardExpiry) {
    cardExpiry.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '').slice(0, 4);
      v = v.replace(/(\d{2})(\d)/, '$1/$2');
      e.target.value = v;
      updateCardPreview();
    });
  }
}

/* ===========================
   CARD PREVIEW UPDATE
=========================== */
function updateCardPreview() {
  const numEl = document.getElementById('card-prev-number');
  const nameEl = document.getElementById('card-prev-name');
  const expEl = document.getElementById('card-prev-expiry');

  const numRaw = document.getElementById('ck-card-number')?.value || '';
  const nameRaw = document.getElementById('ck-card-name')?.value || '';
  const expRaw = document.getElementById('ck-card-expiry')?.value || '';

  if (numEl) {
    const padded = numRaw.padEnd(19, '·').replace(/(\S{4})(?=\S)/g, '$1 ');
    // Mask middle digits
    const parts = numRaw.replace(/\s/g, '');
    const masked = parts.slice(0, 4).padEnd(4, '·') + ' ···· ···· ' + (parts.slice(12) || '····');
    numEl.textContent = numRaw.replace(/\s/g, '').length > 12
      ? masked
      : numRaw || '•••• •••• •••• ••••';
  }
  if (nameEl) nameEl.textContent = nameRaw.toUpperCase() || 'SEU NOME';
  if (expEl) expEl.textContent = expRaw || 'MM/AA';
}

/* ===========================
   PIX QR CODE (SVG simulated)
=========================== */
function renderPixSection(total) {
  const pixCode = `00020126580014br.gov.bcb.pix0136${Date.now()}5204000053039865406${total.toFixed(2).replace('.', '')}5802BR5910MDEssential6008Sao Paulo62070503***6304FAKE`;
  return `
    <div class="pix-section">
      <p style="color:var(--color-text-muted); font-size:0.875rem; margin-bottom:12px;">
        <i class="fas fa-info-circle"></i> Escaneie o QR Code com o app do seu banco ou copie o código Pix abaixo.
      </p>
      <div class="pix-qr-wrapper">
        <!-- Simulated QR Code SVG -->
        <svg width="160" height="160" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
          <rect width="160" height="160" fill="white"/>
          <rect x="10" y="10" width="50" height="50" fill="none" stroke="black" stroke-width="4"/>
          <rect x="18" y="18" width="34" height="34" fill="black"/>
          <rect x="100" y="10" width="50" height="50" fill="none" stroke="black" stroke-width="4"/>
          <rect x="108" y="18" width="34" height="34" fill="black"/>
          <rect x="10" y="100" width="50" height="50" fill="none" stroke="black" stroke-width="4"/>
          <rect x="18" y="108" width="34" height="34" fill="black"/>
          <rect x="68" y="10" width="8" height="8" fill="black"/>
          <rect x="80" y="10" width="8" height="8" fill="black"/>
          <rect x="68" y="20" width="8" height="8" fill="black"/>
          <rect x="80" y="24" width="8" height="8" fill="black"/>
          <rect x="68" y="34" width="8" height="8" fill="black"/>
          <rect x="68" y="50" width="8" height="8" fill="black"/>
          <rect x="80" y="40" width="8" height="8" fill="black"/>
          <rect x="68" y="68" width="8" height="8" fill="black"/>
          <rect x="76" y="76" width="8" height="8" fill="black"/>
          <rect x="100" y="68" width="8" height="8" fill="black"/>
          <rect x="112" y="68" width="8" height="8" fill="black"/>
          <rect x="124" y="68" width="8" height="8" fill="black"/>
          <rect x="136" y="68" width="8" height="8" fill="black"/>
          <rect x="100" y="80" width="8" height="8" fill="black"/>
          <rect x="116" y="80" width="8" height="8" fill="black"/>
          <rect x="132" y="80" width="8" height="8" fill="black"/>
          <rect x="108" y="92" width="8" height="8" fill="black"/>
          <rect x="124" y="92" width="8" height="8" fill="black"/>
          <rect x="100" y="104" width="8" height="8" fill="black"/>
          <rect x="116" y="104" width="8" height="8" fill="black"/>
          <rect x="136" y="104" width="8" height="8" fill="black"/>
          <rect x="100" y="116" width="8" height="8" fill="black"/>
          <rect x="124" y="116" width="8" height="8" fill="black"/>
          <rect x="108" y="128" width="8" height="8" fill="black"/>
          <rect x="132" y="128" width="8" height="8" fill="black"/>
          <rect x="68" y="100" width="8" height="8" fill="black"/>
          <rect x="80" y="108" width="8" height="8" fill="black"/>
          <rect x="68" y="116" width="8" height="8" fill="black"/>
          <rect x="80" y="124" width="8" height="8" fill="black"/>
          <rect x="68" y="132" width="8" height="8" fill="black"/>
        </svg>
      </div>
      <div class="pix-code-box" id="pix-code-text">${pixCode.slice(0, 80)}...</div>
      <button class="pix-copy-btn" onclick="copyPixCode('${pixCode}')">
        <i class="fas fa-copy"></i> Copiar Código Pix
      </button>
      <p style="font-size:0.72rem; color:var(--color-text-muted); margin-top:12px;">
        <i class="fas fa-clock"></i> O código Pix expira em <strong>30 minutos</strong>
      </p>
    </div>
  `;
}

window.copyPixCode = function(code) {
  navigator.clipboard.writeText(code).then(() => {
    showToast('Código Pix copiado!', 'success');
  }).catch(() => {
    showToast('Não foi possível copiar automaticamente. Selecione o código manualmente.', 'error');
  });
};

/* ===========================
   MAIN RENDER
=========================== */
async function renderCheckout() {
  if (!token) {
    alert('Você precisa estar logado para finalizar a compra.');
    window.location.href = '/login';
    return;
  }

  let userData = null;
  try {
    const profileRes = await fetch('/api/users/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (profileRes.ok) {
      const profileData = await profileRes.json();
      userData = profileData.user;
    } else {
      localStorage.removeItem('md-essential-admin-token');
      localStorage.removeItem('username');
      alert('Sessão expirada. Por favor, faça login novamente.');
      window.location.href = '/login';
      return;
    }
  } catch (err) {
    console.error('Erro ao buscar perfil do usuário:', err);
  }

  const defaultAddress = userData?.addresses?.find(addr => addr.isDefault) || userData?.addresses?.[0];

  const cart = getSafeCart();
  const cartKeys = Object.keys(cart);

  if (cartKeys.length === 0) {
    root.innerHTML = `
      ${renderNav()}
      <main class="content">
        <section class="box text-center" style="padding:80px 24px;">
          <i class="fas fa-shopping-bag" style="font-size: 3rem; color: var(--color-text-muted); margin-bottom: 1rem; display:block;"></i>
          <h1 style="font-family:var(--font-display); margin-bottom:8px;">Carrinho vazio</h1>
          <p style="color:var(--color-text-muted);">Adicione produtos antes de finalizar a compra.</p>
          <a class="button" href="/products" style="margin-top: 24px; display: inline-block;">Ver Produtos</a>
        </section>
      </main>
      ${renderFooter()}
    `;
    initDrawerEvents();
    return;
  }

  const response = await fetch('/api/products');
  const allProducts = await response.json();

  let subtotal = 0;
  const items = cartKeys.map(key => {
    const item = cart[key];
    const product = allProducts.find(p => p._id === item.productId);
    if (!product) return null;
    const total = product.price * item.quantity;
    subtotal += total;
    return { ...item, product, total, key };
  }).filter(Boolean);

  // Calculate shipping based on user's saved address state/city (dynamic from Sombrio/SC)
  const userState = defaultAddress?.state || 'SC';
  const userCity = defaultAddress?.city || 'Sombrio';
  const availableShipping = calculateFreight(userState, subtotal, userCity);

  root.innerHTML = `
    ${renderNav()}
    <main class="content">
      <section class="container-custom" style="padding: 40px 0 80px;">
        <div class="checkout-header">
          <h1 class="text-uppercase-bold">Checkout</h1>
          <div class="checkout-steps">
            <span class="checkout-step done"><i class="fas fa-shopping-cart"></i> Carrinho</span>
            <span class="checkout-step-divider"></span>
            <span class="checkout-step active"><i class="fas fa-credit-card"></i> Pagamento</span>
            <span class="checkout-step-divider"></span>
            <span class="checkout-step"><i class="fas fa-check-circle"></i> Confirmação</span>
          </div>
        </div>

        <div class="checkout-layout" id="checkout-layout">
          <!-- LEFT: Forms -->
          <div class="checkout-forms">

            <!-- Customer Data -->
            <div class="checkout-card">
              <div class="checkout-card-header">
                <i class="fas fa-user"></i>
                <h2>Dados do Cliente</h2>
                ${userData?.phone && userData?.phone !== '' ? '<span class="header-badge-saved visible"><i class="fas fa-check"></i> Dados salvos</span>' : '<span class="header-badge-saved" id="customer-saved-badge"></span>'}
              </div>
              <div class="checkout-card-body">
                <div class="checkout-form-grid">
                  <div class="form-group">
                    <label for="ck-name">NOME COMPLETO *</label>
                    <input type="text" id="ck-name" value="${userData?.username || ''}" placeholder="Seu nome completo" required autocomplete="name" />
                    <span class="field-error-msg">Por favor, preencha este campo</span>
                  </div>
                  <div class="form-group">
                    <label for="ck-email">E-MAIL *</label>
                    <input type="email" id="ck-email" value="${userData?.email || ''}" placeholder="seu@email.com" required autocomplete="email" />
                    <span class="field-error-msg">Por favor, preencha este campo</span>
                  </div>
                  <div class="form-group">
                    <label for="ck-cpf">CPF (OPCIONAL)</label>
                    <input type="text" id="ck-cpf" value="${userData?.cpf || ''}" placeholder="000.000.000-00" maxlength="14" autocomplete="off" />
                  </div>
                  <div class="form-group">
                    <label for="ck-phone">TELEFONE *</label>
                    <input type="text" id="ck-phone" value="${userData?.phone || ''}" placeholder="(00) 00000-0000" maxlength="15" required autocomplete="tel" />
                    <span class="field-error-msg">Por favor, preencha este campo</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Address -->
            <div class="checkout-card">
              <div class="checkout-card-header">
                <i class="fas fa-map-marker-alt"></i>
                <h2>Endereço de Entrega</h2>
                ${defaultAddress?.street ? '<span class="header-badge-saved visible"><i class="fas fa-check"></i> Endereço salvo</span>' : '<span class="header-badge-saved" id="address-saved-badge"></span>'}
              </div>
              <div class="checkout-card-body">
                <div class="checkout-form-grid">
                  <div class="form-group" style="grid-column: 1 / -1;">
                    <label for="ck-cep">CEP *</label>
                    <div class="cep-row">
                      <input type="text" id="ck-cep" value="${defaultAddress?.cep || ''}" placeholder="00000-000" maxlength="9" required autocomplete="postal-code" />
                      <button class="cep-lookup-btn" id="cep-lookup-btn" type="button">
                        <i class="fas fa-search"></i> Buscar
                      </button>
                    </div>
                    <span class="field-hint">Digite o CEP para preencher automaticamente</span>
                    <span class="field-error-msg">Por favor, preencha este campo</span>
                  </div>
                  <div class="form-group" style="grid-column: 1 / -1;">
                    <label for="ck-street">RUA *</label>
                    <input type="text" id="ck-street" value="${defaultAddress?.street || ''}" placeholder="Nome da rua" required autocomplete="street-address" />
                    <span class="field-error-msg">Por favor, preencha este campo</span>
                  </div>
                  <div class="form-group">
                    <label for="ck-number">NÚMERO *</label>
                    <input type="text" id="ck-number" value="${defaultAddress?.number || ''}" placeholder="Nº" required />
                    <span class="field-error-msg">Por favor, preencha este campo</span>
                  </div>
                  <div class="form-group">
                    <label for="ck-complement">COMPLEMENTO / PONTO DE REFERÊNCIA</label>
                    <input type="text" id="ck-complement" value="${defaultAddress?.complement || ''}" placeholder="Ex: Denitex Family, em frente à Magazine Luiza" autocomplete="address-line2" />
                  </div>
                  <div class="form-group">
                    <label for="ck-neighborhood">BAIRRO *</label>
                    <input type="text" id="ck-neighborhood" value="${defaultAddress?.neighborhood || ''}" placeholder="Bairro" required />
                    <span class="field-error-msg">Por favor, preencha este campo</span>
                  </div>
                  <div class="form-group">
                    <label for="ck-city">CIDADE *</label>
                    <input type="text" id="ck-city" value="${defaultAddress?.city || ''}" placeholder="Cidade" required autocomplete="address-level2" />
                    <span class="field-error-msg">Por favor, preencha este campo</span>
                  </div>
                  <div class="form-group">
                    <label for="ck-state">ESTADO *</label>
                    <select id="ck-state" required autocomplete="address-level1">
                      <option value="">Selecione</option>
                      ${['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(st =>
                        `<option value="${st}" ${defaultAddress?.state === st ? 'selected' : ''}>${st}</option>`
                      ).join('')}
                    </select>
                    <span class="field-error-msg">Por favor, selecione o estado</span>
                  </div>
                </div>

                <!-- Save address checkbox -->
                <div class="save-address-row">
                  <input type="checkbox" id="save-address" checked />
                  <label for="save-address">Salvar endereço e dados para próximas compras</label>
                </div>
              </div>
            </div>

            <!-- Shipping -->
            <div class="checkout-card">
              <div class="checkout-card-header">
                <i class="fas fa-truck"></i>
                <h2>Método de Entrega</h2>
              </div>
              <div class="checkout-card-body">
                <div class="shipping-options" id="shipping-options">
                  ${availableShipping.map((s, i) => `
                    <label class="shipping-option ${i === 0 ? 'selected' : ''}" data-id="${s.id}" data-price="${s.price}">
                      <input type="radio" name="shipping" value="${s.id}" ${i === 0 ? 'checked' : ''} />
                      <div class="shipping-option-info">
                        <strong><i class="fas ${s.icon}" style="margin-right:6px;color:var(--color-text-muted);"></i>${s.name}</strong>
                        <span class="shipping-days"><i class="fas fa-clock"></i> ${s.days}</span>
                      </div>
                      <span class="shipping-price ${s.price === 0 ? 'free' : ''}">${s.price === 0 ? 'GRÁTIS' : `R$ ${s.price.toFixed(2)}`}</span>
                    </label>
                  `).join('')}
                  ${subtotal < 198 ? `
                    <div style="font-size:0.75rem; color:var(--color-text-muted); padding:10px 4px; display:flex; gap:6px; align-items:center;">
                      <i class="fas fa-tag" style="color:var(--color-success);"></i>
                      Adicione mais <strong style="color:var(--color-success);">R$ ${(198 - subtotal).toFixed(2)}</strong> em produtos para ganhar <strong style="color:var(--color-success);">Frete Grátis</strong>!
                    </div>` : ''}
                </div>
              </div>
            </div>

            <!-- Payment -->
            <div class="checkout-card">
              <div class="checkout-card-header">
                <i class="fas fa-credit-card"></i>
                <h2>Forma de Pagamento</h2>
              </div>
              <div class="checkout-card-body">
                <div class="payment-methods" id="payment-methods">
                  <label class="payment-method" data-method="pix">
                    <input type="radio" name="payment" value="pix" />
                    <div class="payment-icon"><i class="fas fa-qrcode"></i></div>
                    <span>PIX</span>
                  </label>
                  <label class="payment-method" data-method="credit">
                    <input type="radio" name="payment" value="credit" />
                    <div class="payment-icon"><i class="fas fa-credit-card"></i></div>
                    <span>Crédito</span>
                  </label>
                  <label class="payment-method" data-method="debit">
                    <input type="radio" name="payment" value="debit" />
                    <div class="payment-icon"><i class="far fa-credit-card"></i></div>
                    <span>Débito</span>
                  </label>
                  <label class="payment-method" data-method="boleto">
                    <input type="radio" name="payment" value="boleto" />
                    <div class="payment-icon"><i class="fas fa-barcode"></i></div>
                    <span>Boleto</span>
                  </label>
                </div>

                <!-- Dynamic Payment Sections -->
                <div id="payment-extra-section"></div>
              </div>
            </div>

          </div>

          <!-- RIGHT: Order Summary -->
          <div class="checkout-sidebar">
            <div class="checkout-card checkout-summary-card">
              <div class="checkout-card-header">
                <i class="fas fa-receipt"></i>
                <h2>Resumo do Pedido</h2>
              </div>
              <div class="checkout-card-body">
                <div class="checkout-items">
                  ${items.map(item => `
                    <div class="checkout-item">
                      <div class="checkout-item-image">
                        <img src="${item.product.image || item.product.images?.[0] || ''}" alt="${item.product.name}" />
                        <span class="checkout-item-qty-badge">${item.quantity}</span>
                      </div>
                      <div class="checkout-item-details">
                        <strong>${item.product.name}</strong>
                        <div class="item-variations">
                          ${item.size ? `<span class="item-variation">${item.size}</span>` : ''}
                          ${item.color ? `<span class="item-variation">${item.color}</span>` : ''}
                        </div>
                      </div>
                      <span class="checkout-item-price">R$ ${item.total.toFixed(2)}</span>
                    </div>
                  `).join('')}
                </div>

                <!-- Coupon -->
                <div class="coupon-row">
                  <input type="text" class="coupon-input" id="coupon-input" placeholder="CUPOM DE DESCONTO" maxlength="20" />
                  <button class="coupon-apply-btn" id="coupon-apply-btn">Aplicar</button>
                </div>
                <div class="coupon-msg" id="coupon-msg"></div>

                <!-- Totals -->
                <div class="checkout-totals" id="checkout-totals">
                  <div class="checkout-total-row">
                    <span>Subtotal</span>
                    <span>R$ ${subtotal.toFixed(2)}</span>
                  </div>
                  <div class="checkout-total-row" id="shipping-total-row">
                    <span>Frete</span>
                    <span id="shipping-cost">${availableShipping[0]?.price === 0 ? '<span style="color:var(--color-success)">GRÁTIS</span>' : `R$ ${(availableShipping[0]?.price || 0).toFixed(2)}`}</span>
                  </div>
                  <div class="checkout-total-row discount-row" id="discount-row" style="display:none;">
                    <span id="discount-label">Desconto</span>
                    <span id="discount-value">-R$ 0,00</span>
                  </div>
                  <div class="checkout-total-row total-final">
                    <strong>Total</strong>
                    <strong id="order-total">R$ ${(subtotal + (availableShipping[0]?.price || 0)).toFixed(2)}</strong>
                  </div>
                </div>

                <button class="checkout-finalize-btn" id="finalize-order">
                  <i class="fas fa-lock"></i> FINALIZAR PEDIDO
                </button>

                <div class="checkout-secure">
                  <i class="fas fa-shield-alt"></i>
                  <span>Compra 100% segura e criptografada</span>
                </div>
              </div>
            </div>

            <a href="/cart" class="button w-100" style="margin-top:14px; display:flex; align-items:center; justify-content:center; gap:8px; background: transparent; color:var(--color-text); border: 1px solid var(--color-border);">
              <i class="fas fa-arrow-left"></i> Voltar ao Carrinho
            </a>
          </div>
        </div>
      </section>
    </main>
    ${renderFooter()}
  `;

  initDrawerEvents();
  updateCartBadge();
  setupCheckoutEvents(subtotal, availableShipping, items, userData);
}

/* ===========================
   CHECKOUT EVENTS
=========================== */
/* ===========================
   RENDER SHIPPING OPTIONS (dynamic)
=========================== */
function renderShippingOptions(options) {
  const container = document.getElementById('shipping-options');
  if (!container) return;
  container.innerHTML = options.map((s, i) => `
    <label class="shipping-option ${i === 0 ? 'selected' : ''}" data-id="${s.id}" data-price="${s.price}">
      <input type="radio" name="shipping" value="${s.id}" ${i === 0 ? 'checked' : ''} />
      <div class="shipping-option-info">
        <strong><i class="fas ${s.icon}" style="margin-right:6px;color:var(--color-text-muted);"></i>${s.name}</strong>
        <span class="shipping-days"><i class="fas fa-clock"></i> ${s.days}</span>
      </div>
      <span class="shipping-price ${s.price === 0 ? 'free' : ''}">${s.price === 0 ? 'GRÁTIS' : `R$ ${s.price.toFixed(2)}`}</span>
    </label>
  `).join('');

  // Re-bind click events
  container.querySelectorAll('.shipping-option').forEach(label => {
    label.addEventListener('click', () => {
      container.querySelectorAll('.shipping-option').forEach(l => l.classList.remove('selected'));
      label.classList.add('selected');
      selectedShipping = options.find(s => s.id === label.dataset.id);
      updateTotals(window._checkoutSubtotal || 0);
    });
  });
}

function setupCheckoutEvents(subtotal, shippingOptions, items, userData) {
  // Expose subtotal for use in renderShippingOptions
  window._checkoutSubtotal = subtotal;
  applyMasks();

  // Initial shipping
  selectedShipping = shippingOptions[0] || null;

  // Shipping selection
  document.querySelectorAll('.shipping-option').forEach(label => {
    label.addEventListener('click', () => {
      document.querySelectorAll('.shipping-option').forEach(l => l.classList.remove('selected'));
      label.classList.add('selected');
      selectedShipping = shippingOptions.find(s => s.id === label.dataset.id);
      updateTotals(subtotal);
    });
  });

  // Payment selection
  document.querySelectorAll('.payment-method').forEach(label => {
    label.addEventListener('click', () => {
      document.querySelectorAll('.payment-method').forEach(l => l.classList.remove('selected'));
      label.classList.add('selected');
      selectedPayment = label.dataset.method;

      const extraSection = document.getElementById('payment-extra-section');
      if (selectedPayment === 'credit' || selectedPayment === 'debit') {
        extraSection.innerHTML = renderCardForm();
        applyMasks(); // re-apply masks for card inputs
      } else if (selectedPayment === 'pix') {
        const total = computeTotal(subtotal);
        extraSection.innerHTML = renderPixSection(total);
      } else if (selectedPayment === 'boleto') {
        extraSection.innerHTML = `
          <div class="boleto-section">
            <div class="boleto-info">
              <i class="fas fa-info-circle"></i>
              <p>Após confirmar o pedido, você receberá o boleto por e-mail. O boleto vence em <strong>3 dias úteis</strong>. O prazo de entrega começa após a confirmação do pagamento.</p>
            </div>
          </div>
        `;
      } else {
        extraSection.innerHTML = '';
      }
    });
  });

  // CEP Lookup
  document.getElementById('cep-lookup-btn')?.addEventListener('click', async () => {
    const btn = document.getElementById('cep-lookup-btn');
    const cepVal = document.getElementById('ck-cep')?.value;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    btn.disabled = true;
    const data = await lookupCEP(cepVal);
    btn.innerHTML = '<i class="fas fa-search"></i> Buscar';
    btn.disabled = false;
    if (data) {
      if (data.logradouro) document.getElementById('ck-street').value = data.logradouro;
      if (data.bairro) document.getElementById('ck-neighborhood').value = data.bairro;
      if (data.localidade) document.getElementById('ck-city').value = data.localidade;
      const stateSelect = document.getElementById('ck-state');
      if (stateSelect && data.uf) stateSelect.value = data.uf;
      
      // Recalculate shipping based on new state and city
      if (data.uf) {
        const city = data.localidade || 'Sombrio';
        const newOptions = calculateFreight(data.uf, subtotal, city);
        renderShippingOptions(newOptions);
        selectedShipping = newOptions[0] || null;
        updateTotals(subtotal);
        showToast(`Frete calculado para ${city}/${data.uf}`, 'success');
      }
      
      if (!data.logradouro || !data.bairro) {
        if (!data.uf) showToast('CEP encontrado. Por favor, complete a rua e bairro.', 'info');
        if (!data.logradouro) document.getElementById('ck-street')?.focus();
        else document.getElementById('ck-number')?.focus();
      } else if (!data.uf) {
        document.getElementById('ck-number')?.focus();
        showToast('Endereço preenchido automaticamente!', 'success');
      }
    } else {
      showToast('CEP não encontrado. Preencha o endereço manualmente.', 'error');
    }
  });

  // CEP also triggers on blur when full
  document.getElementById('ck-cep')?.addEventListener('blur', async (e) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length === 8) {
      const btn = document.getElementById('cep-lookup-btn');
      if (btn) btn.click();
    }
  });

  // Coupon
  document.getElementById('coupon-apply-btn')?.addEventListener('click', () => {
    const code = document.getElementById('coupon-input')?.value.trim().toUpperCase();
    const msgEl = document.getElementById('coupon-msg');
    const inputEl = document.getElementById('coupon-input');

    if (!code) {
      showToast('Digite um cupom de desconto.', 'error');
      return;
    }

    const coupon = TEST_COUPONS[code];
    if (coupon) {
      appliedCoupon = { ...coupon, code };
      inputEl.classList.add('coupon-valid');
      inputEl.classList.remove('coupon-invalid');
      inputEl.disabled = true;
      msgEl.className = 'coupon-msg success';
      msgEl.innerHTML = `<i class="fas fa-check-circle"></i> Cupom aplicado: ${coupon.label}`;
      updateTotals(subtotal);
      showToast(`Cupom ${code} aplicado com sucesso!`, 'success');
    } else {
      appliedCoupon = null;
      inputEl.classList.add('coupon-invalid');
      inputEl.classList.remove('coupon-valid');
      msgEl.className = 'coupon-msg error';
      msgEl.innerHTML = `<i class="fas fa-times-circle"></i> Cupom inválido ou expirado.`;
      updateTotals(subtotal);
      showToast('Cupom inválido.', 'error');
    }
  });

  // Coupon input – remove error on re-type
  document.getElementById('coupon-input')?.addEventListener('input', () => {
    if (appliedCoupon) {
      appliedCoupon = null;
      document.getElementById('coupon-input').classList.remove('coupon-valid', 'coupon-invalid');
      document.getElementById('coupon-msg').className = 'coupon-msg';
      document.getElementById('coupon-input').disabled = false;
      updateTotals(subtotal);
    }
  });

  // Finalize order
  document.getElementById('finalize-order')?.addEventListener('click', () => finalizeOrder(subtotal, items, userData));
}

/* ===========================
   CARD FORM HTML
=========================== */
function renderCardForm() {
  return `
    <div class="card-form-section">
      <!-- Card Preview -->
      <div class="card-preview-wrapper">
        <div class="card-preview">
          <div class="card-chip"></div>
          <div class="card-number-display" id="card-prev-number">•••• •••• •••• ••••</div>
          <div class="card-bottom">
            <div>
              <div class="card-holder-label">Titular</div>
              <div class="card-holder-name" id="card-prev-name">SEU NOME</div>
            </div>
            <div class="card-expiry-display">
              <div class="card-expiry-label">Validade</div>
              <div class="card-expiry-value" id="card-prev-expiry">MM/AA</div>
            </div>
          </div>
        </div>
      </div>

      <div class="checkout-form-grid">
        <div class="form-group" style="grid-column: 1 / -1;">
          <label for="ck-card-number">NÚMERO DO CARTÃO</label>
          <input type="text" id="ck-card-number" placeholder="0000 0000 0000 0000" maxlength="19" autocomplete="cc-number" inputmode="numeric" />
        </div>
        <div class="form-group" style="grid-column: 1 / -1;">
          <label for="ck-card-name">NOME NO CARTÃO</label>
          <input type="text" id="ck-card-name" placeholder="Nome como está no cartão" autocomplete="cc-name" />
        </div>
        <div class="form-group">
          <label for="ck-card-expiry">VALIDADE</label>
          <input type="text" id="ck-card-expiry" placeholder="MM/AA" maxlength="5" autocomplete="cc-exp" inputmode="numeric" />
        </div>
        <div class="form-group">
          <label for="ck-card-cvv">CVV</label>
          <input type="text" id="ck-card-cvv" placeholder="000" maxlength="4" autocomplete="cc-csc" inputmode="numeric" />
        </div>
      </div>

      <div style="margin-top:12px; display:flex; align-items:center; gap:8px; font-size:0.72rem; color:var(--color-text-muted);">
        <i class="fas fa-lock" style="color:var(--color-success);"></i>
        Os dados do cartão são criptografados com SSL 256-bit
      </div>
    </div>
  `;
}

/* ===========================
   TOTAL COMPUTATION
=========================== */
function computeTotal(subtotal) {
  let shipping = selectedShipping?.price || 0;
  let discount = 0;

  if (appliedCoupon) {
    if (appliedCoupon.type === 'percent') discount = subtotal * (appliedCoupon.value / 100);
    else if (appliedCoupon.type === 'fixed') discount = Math.min(appliedCoupon.value, subtotal);
    else if (appliedCoupon.type === 'shipping') shipping = 0;
  }

  return Math.max(0, subtotal + shipping - discount);
}

function updateTotals(subtotal) {
  let shipping = selectedShipping?.price || 0;
  let discount = 0;

  if (appliedCoupon) {
    if (appliedCoupon.type === 'percent') discount = subtotal * (appliedCoupon.value / 100);
    else if (appliedCoupon.type === 'fixed') discount = Math.min(appliedCoupon.value, subtotal);
    else if (appliedCoupon.type === 'shipping') shipping = 0;
  }

  const total = Math.max(0, subtotal + shipping - discount);

  const shippingEl = document.getElementById('shipping-cost');
  if (shippingEl) shippingEl.innerHTML = shipping === 0 ? '<span style="color:var(--color-success)">GRÁTIS</span>' : `R$ ${shipping.toFixed(2)}`;

  const discountRow = document.getElementById('discount-row');
  const discountLabel = document.getElementById('discount-label');
  const discountValue = document.getElementById('discount-value');
  if (discountRow && discount > 0) {
    discountRow.style.display = 'flex';
    if (discountLabel) discountLabel.textContent = appliedCoupon?.label || 'Desconto';
    if (discountValue) discountValue.textContent = `-R$ ${discount.toFixed(2)}`;
  } else if (discountRow) {
    discountRow.style.display = 'none';
  }

  const totalEl = document.getElementById('order-total');
  if (totalEl) totalEl.textContent = `R$ ${total.toFixed(2)}`;
}

/* ===========================
   FINALIZE ORDER
=========================== */
async function finalizeOrder(subtotal, items, userData) {
  // Validate required fields
  const requiredFields = ['ck-name', 'ck-email', 'ck-phone', 'ck-cep', 'ck-street', 'ck-number', 'ck-neighborhood', 'ck-city', 'ck-state'];
  let allValid = true;

  for (const fieldId of requiredFields) {
    const field = document.getElementById(fieldId);
    if (!field || !field.value.trim()) {
      field?.classList.add('field-error');
      allValid = false;
    } else {
      field?.classList.remove('field-error');
    }
  }

  if (!allValid) {
    showToast('Por favor, preencha todos os campos obrigatórios.', 'error');
    document.querySelector('.field-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  if (!selectedPayment) {
    showToast('Por favor, selecione uma forma de pagamento.', 'error');
    return;
  }

  if (!selectedShipping) {
    showToast('Por favor, selecione um método de entrega.', 'error');
    return;
  }

  const btn = document.getElementById('finalize-order');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> PROCESSANDO...';
  btn.disabled = true;

  try {
    // 1. Collect form data
    const formData = {
      name: document.getElementById('ck-name')?.value,
      email: document.getElementById('ck-email')?.value,
      phone: document.getElementById('ck-phone')?.value,
      cpf: document.getElementById('ck-cpf')?.value,
      address: {
        street: document.getElementById('ck-street')?.value,
        number: document.getElementById('ck-number')?.value,
        complement: document.getElementById('ck-complement')?.value,
        neighborhood: document.getElementById('ck-neighborhood')?.value,
        city: document.getElementById('ck-city')?.value,
        state: document.getElementById('ck-state')?.value,
        cep: document.getElementById('ck-cep')?.value,
        isDefault: true,
      }
    };

    // 2. Save user data if checkbox is checked
    const shouldSave = document.getElementById('save-address')?.checked;
    if (shouldSave) {
      await saveUserData(formData, userData);
    }

    // 3. Create order
    const orderItems = items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      size: item.size || '',
      color: item.color || ''
    }));

    // Generate PIX/boleto codes if needed
    const pixCode = selectedPayment === 'pix'
      ? `00020126580014br.gov.bcb.pix0136MD_ESSENTIAL_${Date.now()}5204000053039865406${computeTotal(subtotal).toFixed(2).replace('.', '')}5802BR5910MDEssential6008Sombrio62070503***6304F${Math.random().toString(16).slice(2,6).toUpperCase()}`
      : '';
    const boletoCode = selectedPayment === 'boleto'
      ? `34191.75000 ${Math.floor(Math.random()*100000).toString().padStart(5,'0')}.${Math.floor(Math.random()*1000000).toString().padStart(6,'0')} ${Math.floor(Math.random()*1000000).toString().padStart(6,'0')} 1 ${Date.now().toString().slice(-14)} ${computeTotal(subtotal).toFixed(2).replace('.','').padStart(10,'0')}`
      : '';

    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        items: orderItems,
        paymentMethod: selectedPayment,
        shippingMethod: selectedShipping?.name || '',
        shippingPrice: selectedShipping?.price || 0,
        pixCode,
        boletoCode,
      })
    });

    const data = await response.json();

    if (!response.ok) {
      showToast(data.message || 'Erro ao registrar pedido no servidor.', 'error');
      btn.innerHTML = '<i class="fas fa-lock"></i> FINALIZAR PEDIDO';
      btn.disabled = false;
      return;
    }

    // Clear cart
    localStorage.removeItem(CART_KEY);
    syncCart();

    // Show success screen
    const totalPaid = document.getElementById('order-total')?.textContent || `R$ ${subtotal.toFixed(2)}`;

    const layout = document.getElementById('checkout-layout');
    layout.innerHTML = `
      <div class="checkout-success" style="grid-column:1/-1;">
        <div class="success-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <h2 class="text-uppercase-bold">Pedido Realizado!</h2>
        <p>Seu pedido <strong>#${data.orderId.toString().slice(-6).toUpperCase()}</strong> foi registrado com sucesso.</p>
        <p>Você receberá um e-mail de confirmação em breve em <strong>${formData.email}</strong>.</p>

        <div class="success-details">
          <div class="success-detail-row">
            <span>Forma de pagamento</span>
            <strong>${getPaymentName(selectedPayment)}</strong>
          </div>
          <div class="success-detail-row">
            <span>Entrega</span>
            <strong>${selectedShipping.name}</strong>
          </div>
          <div class="success-detail-row">
            <span>Prazo estimado</span>
            <strong>${selectedShipping.days}</strong>
          </div>
          <div class="success-detail-row">
            <span>Endereço</span>
            <strong>${formData.address.street}, ${formData.address.number} — ${formData.address.city}/${formData.address.state}</strong>
          </div>
          <div class="success-detail-row">
            <span>Total pago</span>
            <strong style="font-size:1.1rem;">${totalPaid}</strong>
          </div>
          ${shouldSave ? `
          <div class="success-detail-row" style="color:var(--color-success);">
            <span><i class="fas fa-check"></i> Dados salvos</span>
            <strong style="color:var(--color-success);">Próxima compra será mais rápida!</strong>
          </div>` : ''}
        </div>

        <div class="success-actions">
          <a class="button" href="/products">Continuar Comprando</a>
          <a class="button" href="/account" style="background:transparent; color:var(--color-text); border:1px solid var(--color-border);">Minha Conta</a>
        </div>
      </div>
    `;

    // Update step indicator
    const steps = document.querySelectorAll('.checkout-step');
    steps.forEach(s => { s.classList.remove('active'); s.classList.add('done'); });

  } catch (err) {
    console.error(err);
    showToast('Falha na comunicação com o servidor. Tente novamente.', 'error');
    btn.innerHTML = '<i class="fas fa-lock"></i> FINALIZAR PEDIDO';
    btn.disabled = false;
  }
}

/* ===========================
   SAVE USER DATA (auto-save)
=========================== */
async function saveUserData(formData, userData) {
  try {
    const existingAddresses = userData?.addresses || [];

    // Build new address list: mark others as non-default, add/update this one
    const newAddress = formData.address;
    const updatedAddresses = existingAddresses
      .filter(a => a.street !== newAddress.street || a.cep !== newAddress.cep)  // remove duplicate by street+cep
      .map(a => ({ ...a, isDefault: false }));  // unset other defaults
    updatedAddresses.unshift(newAddress);  // put new one first as default

    await fetch('/api/users/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        phone: formData.phone,
        cpf: formData.cpf,
        addresses: updatedAddresses
      })
    });
  } catch (err) {
    console.warn('Não foi possível salvar os dados do usuário:', err);
  }
}

/* ===========================
   HELPERS
=========================== */
function getPaymentName(method) {
  return { pix: 'PIX', credit: 'Cartão de Crédito', debit: 'Cartão de Débito', boleto: 'Boleto Bancário' }[method] || method;
}

renderCheckout();
