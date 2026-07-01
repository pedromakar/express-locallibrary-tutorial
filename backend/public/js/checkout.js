import { renderNav, renderFooter, initDrawerEvents, updateCartBadge, syncCart, getSafeCart } from './ui.js?v=2';

const CART_KEY = 'md-essential-cart';
const root = document.getElementById('page-root');

let selectedPayment = null;
let selectedShipping = null;

async function renderCheckout() {
  const cart = getSafeCart();
  const cartKeys = Object.keys(cart);

  if (cartKeys.length === 0) {
    root.innerHTML = `
      ${renderNav()}
      <main class="content">
        <section class="box text-center">
          <i class="fas fa-shopping-bag" style="font-size: 3rem; color: var(--color-text-muted); margin-bottom: 1rem;"></i>
          <h1>Carrinho vazio</h1>
          <p>Adicione produtos antes de finalizar a compra.</p>
          <a class="button" href="/products" style="margin-top: 24px; display: inline-block;">Ver Produtos</a>
        </section>
      </main>
      ${renderFooter()}
    `;
    initDrawerEvents();
    return;
  }

  // Fetch product data
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

  const shippingOptions = [
    { id: 'pac', name: 'PAC — Correios', price: 18.90, days: '8 a 12 dias úteis' },
    { id: 'sedex', name: 'SEDEX — Correios', price: 32.50, days: '3 a 5 dias úteis' },
    { id: 'free', name: 'Frete Grátis', price: 0, days: '10 a 15 dias úteis', minOrder: 198 }
  ];

  const availableShipping = shippingOptions.filter(s => !s.minOrder || subtotal >= s.minOrder);

  root.innerHTML = `
    ${renderNav()}
    <main class="content">
      <section class="container-custom py-5">
        <div class="checkout-header">
          <h1 class="text-uppercase-bold">Checkout</h1>
          <div class="checkout-steps">
            <span class="checkout-step active"><i class="fas fa-shopping-cart"></i> Carrinho</span>
            <span class="checkout-step-divider"></span>
            <span class="checkout-step active"><i class="fas fa-credit-card"></i> Pagamento</span>
            <span class="checkout-step-divider"></span>
            <span class="checkout-step"><i class="fas fa-check-circle"></i> Confirmação</span>
          </div>
        </div>

        <div class="checkout-layout">
          <!-- LEFT: Forms -->
          <div class="checkout-forms">
            
            <!-- Customer Data -->
            <div class="checkout-card">
              <div class="checkout-card-header">
                <i class="fas fa-user"></i>
                <h2>Dados do Cliente</h2>
              </div>
              <div class="checkout-card-body">
                <div class="checkout-form-grid">
                  <div class="form-group">
                    <label for="ck-name">NOME COMPLETO *</label>
                    <input type="text" id="ck-name" placeholder="Seu nome completo" required />
                  </div>
                  <div class="form-group">
                    <label for="ck-email">E-MAIL *</label>
                    <input type="email" id="ck-email" placeholder="seu@email.com" required />
                  </div>
                  <div class="form-group">
                    <label for="ck-cpf">CPF (OPCIONAL)</label>
                    <input type="text" id="ck-cpf" placeholder="000.000.000-00" maxlength="14" />
                  </div>
                  <div class="form-group">
                    <label for="ck-phone">TELEFONE *</label>
                    <input type="text" id="ck-phone" placeholder="(00) 00000-0000" maxlength="15" required />
                  </div>
                </div>
              </div>
            </div>

            <!-- Address -->
            <div class="checkout-card">
              <div class="checkout-card-header">
                <i class="fas fa-map-marker-alt"></i>
                <h2>Endereço de Entrega</h2>
              </div>
              <div class="checkout-card-body">
                <div class="checkout-form-grid">
                  <div class="form-group" style="grid-column: 1 / -1; max-width: 200px;">
                    <label for="ck-cep">CEP *</label>
                    <input type="text" id="ck-cep" placeholder="00000-000" maxlength="9" required />
                  </div>
                  <div class="form-group" style="grid-column: 1 / -1;">
                    <label for="ck-street">RUA *</label>
                    <input type="text" id="ck-street" placeholder="Nome da rua" required />
                  </div>
                  <div class="form-group">
                    <label for="ck-number">NÚMERO *</label>
                    <input type="text" id="ck-number" placeholder="Nº" required />
                  </div>
                  <div class="form-group">
                    <label for="ck-complement">COMPLEMENTO</label>
                    <input type="text" id="ck-complement" placeholder="Apto, bloco..." />
                  </div>
                  <div class="form-group">
                    <label for="ck-neighborhood">BAIRRO *</label>
                    <input type="text" id="ck-neighborhood" placeholder="Bairro" required />
                  </div>
                  <div class="form-group">
                    <label for="ck-city">CIDADE *</label>
                    <input type="text" id="ck-city" placeholder="Cidade" required />
                  </div>
                  <div class="form-group">
                    <label for="ck-state">ESTADO *</label>
                    <select id="ck-state" required>
                      <option value="">Selecione</option>
                      <option value="AC">AC</option><option value="AL">AL</option>
                      <option value="AP">AP</option><option value="AM">AM</option>
                      <option value="BA">BA</option><option value="CE">CE</option>
                      <option value="DF">DF</option><option value="ES">ES</option>
                      <option value="GO">GO</option><option value="MA">MA</option>
                      <option value="MT">MT</option><option value="MS">MS</option>
                      <option value="MG">MG</option><option value="PA">PA</option>
                      <option value="PB">PB</option><option value="PR">PR</option>
                      <option value="PE">PE</option><option value="PI">PI</option>
                      <option value="RJ">RJ</option><option value="RN">RN</option>
                      <option value="RS">RS</option><option value="RO">RO</option>
                      <option value="RR">RR</option><option value="SC">SC</option>
                      <option value="SP">SP</option><option value="SE">SE</option>
                      <option value="TO">TO</option>
                    </select>
                  </div>
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
                        <strong>${s.name}</strong>
                        <span class="shipping-days"><i class="fas fa-clock"></i> ${s.days}</span>
                      </div>
                      <span class="shipping-price">${s.price === 0 ? 'GRÁTIS' : `R$ ${s.price.toFixed(2)}`}</span>
                    </label>
                  `).join('')}
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
                    <span>Cartão de Crédito</span>
                  </label>
                  <label class="payment-method" data-method="debit">
                    <input type="radio" name="payment" value="debit" />
                    <div class="payment-icon"><i class="fas fa-credit-card"></i></div>
                    <span>Cartão de Débito</span>
                  </label>
                  <label class="payment-method" data-method="boleto">
                    <input type="radio" name="payment" value="boleto" />
                    <div class="payment-icon"><i class="fas fa-barcode"></i></div>
                    <span>Boleto Bancário</span>
                  </label>
                </div>

                <!-- Credit/Debit Card Form (hidden by default) -->
                <div id="card-form" class="card-form-section" style="display: none;">
                  <div class="divider" style="margin: 24px 0;"></div>
                  <div class="checkout-form-grid">
                    <div class="form-group" style="grid-column: 1 / -1;">
                      <label for="ck-card-number">NÚMERO DO CARTÃO</label>
                      <input type="text" id="ck-card-number" placeholder="0000 0000 0000 0000" maxlength="19" />
                    </div>
                    <div class="form-group" style="grid-column: 1 / -1;">
                      <label for="ck-card-name">NOME NO CARTÃO</label>
                      <input type="text" id="ck-card-name" placeholder="Nome impresso no cartão" />
                    </div>
                    <div class="form-group">
                      <label for="ck-card-expiry">VALIDADE</label>
                      <input type="text" id="ck-card-expiry" placeholder="MM/AA" maxlength="5" />
                    </div>
                    <div class="form-group">
                      <label for="ck-card-cvv">CVV</label>
                      <input type="text" id="ck-card-cvv" placeholder="000" maxlength="4" />
                    </div>
                  </div>
                </div>
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
                        <img src="${item.product.image || item.product.images[0]}" alt="${item.product.name}" />
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

                <div class="checkout-totals">
                  <div class="checkout-total-row">
                    <span>Subtotal</span>
                    <span>R$ ${subtotal.toFixed(2)}</span>
                  </div>
                  <div class="checkout-total-row" id="shipping-total-row">
                    <span>Frete</span>
                    <span id="shipping-cost">${availableShipping[0]?.price === 0 ? 'GRÁTIS' : `R$ ${(availableShipping[0]?.price || 0).toFixed(2)}`}</span>
                  </div>
                  <div class="checkout-total-row total-final">
                    <strong>Total</strong>
                    <strong id="order-total">R$ ${(subtotal + (availableShipping[0]?.price || 0)).toFixed(2)}</strong>
                  </div>
                </div>

                <button class="button w-100 checkout-finalize-btn" id="finalize-order">
                  <i class="fas fa-lock"></i> FINALIZAR PEDIDO
                </button>

                <div class="checkout-secure">
                  <i class="fas fa-shield-alt"></i>
                  <span>Compra 100% segura e criptografada</span>
                </div>
              </div>
            </div>

            <a href="/cart" class="button button-outline w-100" style="margin-top: 16px;">
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
  setupCheckoutEvents(subtotal, availableShipping, items);
}

function setupCheckoutEvents(subtotal, shippingOptions, items) {
  // Shipping selection
  const shippingLabels = document.querySelectorAll('.shipping-option');
  selectedShipping = shippingOptions[0] || null;

  shippingLabels.forEach(label => {
    label.addEventListener('click', () => {
      shippingLabels.forEach(l => l.classList.remove('selected'));
      label.classList.add('selected');
      const shippingPrice = parseFloat(label.dataset.price);
      selectedShipping = shippingOptions.find(s => s.id === label.dataset.id);
      
      document.getElementById('shipping-cost').textContent = shippingPrice === 0 ? 'GRÁTIS' : `R$ ${shippingPrice.toFixed(2)}`;
      document.getElementById('order-total').textContent = `R$ ${(subtotal + shippingPrice).toFixed(2)}`;
    });
  });

  // Payment selection
  const paymentLabels = document.querySelectorAll('.payment-method');
  const cardForm = document.getElementById('card-form');

  paymentLabels.forEach(label => {
    label.addEventListener('click', () => {
      paymentLabels.forEach(l => l.classList.remove('selected'));
      label.classList.add('selected');
      selectedPayment = label.dataset.method;
      
      // Show card form for credit/debit
      if (selectedPayment === 'credit' || selectedPayment === 'debit') {
        cardForm.style.display = 'block';
      } else {
        cardForm.style.display = 'none';
      }
    });
  });

  // CPF mask
  document.getElementById('ck-cpf')?.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    e.target.value = v;
  });

  // Phone mask
  document.getElementById('ck-phone')?.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    v = v.replace(/(\d{2})(\d)/, '($1) $2');
    v = v.replace(/(\d{5})(\d)/, '$1-$2');
    e.target.value = v;
  });

  // CEP mask
  document.getElementById('ck-cep')?.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 8) v = v.slice(0, 8);
    v = v.replace(/(\d{5})(\d)/, '$1-$2');
    e.target.value = v;
  });

  // Card number mask
  document.getElementById('ck-card-number')?.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 16) v = v.slice(0, 16);
    v = v.replace(/(\d{4})(?=\d)/g, '$1 ');
    e.target.value = v;
  });

  // Card expiry mask
  document.getElementById('ck-card-expiry')?.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 4) v = v.slice(0, 4);
    v = v.replace(/(\d{2})(\d)/, '$1/$2');
    e.target.value = v;
  });

  // Finalize order
  document.getElementById('finalize-order')?.addEventListener('click', async () => {
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
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (!selectedPayment) {
      alert('Por favor, selecione uma forma de pagamento.');
      return;
    }

    if (!selectedShipping) {
      alert('Por favor, selecione um método de entrega.');
      return;
    }

    const btn = document.getElementById('finalize-order');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> PROCESSANDO...';
    btn.disabled = true;

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Clear cart
    localStorage.removeItem(CART_KEY);
    syncCart();

    // Show success
    const mainContent = document.querySelector('.checkout-layout');
    mainContent.innerHTML = `
      <div class="checkout-success">
        <div class="success-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <h2 class="text-uppercase-bold">Pedido Realizado com Sucesso!</h2>
        <p>Seu pedido <strong>#${Date.now().toString(36).toUpperCase()}</strong> foi registrado.</p>
        <p>Você receberá um e-mail de confirmação em breve.</p>
        
        <div class="success-details">
          <div class="success-detail-row">
            <span>Método de pagamento</span>
            <strong>${getPaymentName(selectedPayment)}</strong>
          </div>
          <div class="success-detail-row">
            <span>Entrega</span>
            <strong>${selectedShipping.name} — ${selectedShipping.days}</strong>
          </div>
          <div class="success-detail-row">
            <span>Total pago</span>
            <strong>${document.getElementById('order-total')?.textContent || `R$ ${subtotal.toFixed(2)}`}</strong>
          </div>
        </div>
        
        <div class="success-actions">
          <a class="button" href="/products">Continuar Comprando</a>
          <a class="button button-outline" href="/">Voltar à Loja</a>
        </div>
      </div>
    `;
  });
}

function getPaymentName(method) {
  const names = {
    pix: 'PIX',
    credit: 'Cartão de Crédito',
    debit: 'Cartão de Débito',
    boleto: 'Boleto Bancário'
  };
  return names[method] || method;
}

renderCheckout();
