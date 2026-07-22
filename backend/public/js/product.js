import { renderNav, renderFooter, initDrawerEvents, updateCartBadge, syncCart, addToCart } from './ui.js?v=2';
import { calculateFreight, getFreightZoneInfo, FREE_SHIPPING_THRESHOLD } from './freight.js';

const root = document.getElementById('page-root');
const params = new URLSearchParams(window.location.search);
const productId = params.get('id');

let selectedSize = null;
let selectedColor = null;
let selectedQty = 1;

async function renderProduct() {
  const response = await fetch(`/api/products/${productId}`);
  const product = response.ok ? await response.json() : null;

  if (!product) {
    root.innerHTML = `
      ${renderNav('products')}
      <main class="content"><section class="box"><h1>Produto não encontrado</h1></section></main>
      ${renderFooter()}
    `;
    return;
  }

  // Initial Selection
  if (product.sizes && product.sizes.length > 0) selectedSize = product.sizes[0];
  if (product.colors && product.colors.length > 0) selectedColor = product.colors[0].name;

  root.innerHTML = `
    ${renderNav('products')}
    <main class="content">
      <section class="container-custom py-5">
        <div class="product-premium-layout">
          <!-- Gallery -->
          <div class="product-gallery">
            <div class="main-image-wrapper">
              <img id="main-product-image" src="${product.images[0]}" alt="${product.name}" />
              ${product.badge ? `<span class="badge premium">${product.badge}</span>` : ''}
            </div>
            <div class="thumbnail-grid">
              ${product.images.map((img, idx) => `
                <div class="thumb-item ${idx === 0 ? 'active' : ''}" data-src="${img}">
                  <img src="${img}" alt="Thumbnail ${idx + 1}" />
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Info -->
          <div class="product-premium-info">
            <p class="category-eyebrow">${product.category}</p>
            <h1 class="text-uppercase-bold">${product.name}</h1>
            <p class="price-premium">R$ ${product.price.toFixed(2)}</p>
            <p class="stock-status" style="font-size: 0.85rem; font-weight: 700; color: ${product.countInStock > 0 ? '#22c55e' : '#ef4444'}; margin-top: -8px; margin-bottom: 16px;">
              ${product.countInStock > 0 ? `<i class="fas fa-check"></i> Disponível em estoque (${product.countInStock} unidades)` : '<i class="fas fa-times-circle"></i> Esgotado'}
            </p>
            
            <div class="divider"></div>

            <p class="description-text">${product.description}</p>

            <!-- Color Selector -->
            ${product.colors && product.colors.length > 0 ? `
              <div class="selector-box">
                <label class="selector-label">COR: <span id="selected-color-name">${selectedColor}</span></label>
                <div class="color-swatches">
                  ${product.colors.map(c => `
                    <button class="swatch-btn ${c.name === selectedColor ? 'active' : ''}" 
                            data-name="${c.name}" 
                            style="background: ${c.hex}"
                            title="${c.name}"></button>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Size Selector -->
            ${product.sizes && product.sizes.length > 0 ? `
              <div class="selector-box">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <label class="selector-label">TAMANHO</label>
                  <button class="text-link small" id="open-measurements">TABELA DE MEDIDAS</button>
                </div>
                <div class="size-grid">
                  ${product.sizes.map(s => `
                    <button class="size-btn ${s === selectedSize ? 'active' : ''}" data-size="${s}">${s}</button>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Quantity Selector -->
            <div class="selector-box">
              <label class="selector-label">QUANTIDADE</label>
              <div class="qty-selector">
                <button class="qty-selector-btn" id="qty-minus">−</button>
                <span class="qty-selector-value" id="qty-value">1</span>
                <button class="qty-selector-btn" id="qty-plus">+</button>
              </div>
            </div>

            <!-- Benefits -->
            <div class="benefits-premium">
              ${product.benefits.map(b => `
                <div class="benefit-item">
                  <i class="fas fa-check"></i>
                  <span>${b}</span>
                </div>
              `).join('')}
            </div>

            <div class="product-buy-actions">
              ${product.countInStock > 0 ? `
                <button class="button w-100" id="add-to-cart-premium">
                  <i class="fas fa-shopping-cart"></i> ADICIONAR AO CARRINHO
                </button>
                <button class="button button-accent w-100" id="buy-now-btn">
                  <i class="fas fa-bolt"></i> COMPRAR AGORA
                </button>
              ` : `
                <button class="button w-100" disabled style="background-color: #6b7280; cursor: not-allowed; opacity: 0.6;">
                  <i class="fas fa-times-circle"></i> PRODUTO INDISPONÍVEL
                </button>
              `}
            </div>

            <!-- Freight Estimator Widget -->
            <div class="freight-estimator" id="freight-estimator">
              <div class="freight-estimator-header">
                <i class="fas fa-truck"></i>
                <span>Calcular Frete</span>
              </div>
              <div class="freight-estimator-body">
                <div class="freight-cep-row">
                  <input type="text" class="freight-cep-input" id="freight-cep" placeholder="00000-000" maxlength="9" inputmode="numeric" />
                  <button class="freight-calc-btn" id="freight-calc-btn">
                    <i class="fas fa-search"></i> Calcular
                  </button>
                </div>
                <div id="freight-results"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Measurements Modal (Simulated) -->
      <div class="modal-overlay" id="measurements-modal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>TABELA DE MEDIDAS</h3>
            <button id="close-modal"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body text-center">
            <img src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80" style="max-width: 100%;" />
            <p class="mt-3 small">Valores aproximados em centímetros.</p>
          </div>
        </div>
      </div>
    </main>
    ${renderFooter()}
  `;

  setupEventListeners(product);
  initDrawerEvents();
  updateCartBadge();
}

function setupEventListeners(product) {
  // ===== FREIGHT ESTIMATOR =====
  const freightCepInput = document.getElementById('freight-cep');
  const freightCalcBtn = document.getElementById('freight-calc-btn');
  const freightResultsEl = document.getElementById('freight-results');

  // CEP mask
  freightCepInput?.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 8);
    v = v.replace(/(\d{5})(\d)/, '$1-$2');
    e.target.value = v;
    // Auto-search when CEP is complete
    if (v.replace(/\D/g, '').length === 8) {
      freightCalcBtn?.click();
    }
  });

  freightCalcBtn?.addEventListener('click', async () => {
    const cepRaw = freightCepInput?.value.replace(/\D/g, '');
    if (!cepRaw || cepRaw.length !== 8) {
      freightResultsEl.innerHTML = '<div class="freight-error"><i class="fas fa-exclamation-circle"></i> Digite um CEP válido com 8 dígitos.</div>';
      return;
    }

    freightCalcBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    freightCalcBtn.disabled = true;
    freightResultsEl.innerHTML = '';

    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepRaw}/json/`);
      const data = await res.json();

      freightCalcBtn.innerHTML = '<i class="fas fa-search"></i> Calcular';
      freightCalcBtn.disabled = false;

      if (data.erro) {
        freightResultsEl.innerHTML = '<div class="freight-error"><i class="fas fa-times-circle"></i> CEP não encontrado. Verifique o número e tente novamente.</div>';
        return;
      }

      const state = data.uf;
      const city = data.localidade;
      const options = calculateFreight(state, product.price);
      const zoneInfo = getFreightZoneInfo(state);
      const isEligibleFree = product.price >= FREE_SHIPPING_THRESHOLD;
      const needed = (FREE_SHIPPING_THRESHOLD - product.price).toFixed(2);

      freightResultsEl.innerHTML = `
        <div class="freight-results">
          <div class="freight-city-tag">
            <i class="fas fa-map-marker-alt"></i>
            Entregando em <strong>${city}/${state}</strong>
            ${zoneInfo ? `<span style="color:var(--color-text-muted);">(${zoneInfo.label})</span>` : ''}
          </div>

          ${options.map(opt => `
            <div class="freight-option">
              <div class="freight-option-info">
                <div class="freight-option-name">
                  <i class="fas ${opt.icon}"></i>
                  ${opt.name}
                </div>
                <div class="freight-option-days"><i class="fas fa-clock" style="font-size:0.6rem;"></i> ${opt.days}</div>
              </div>
              <div class="freight-option-price ${opt.price === 0 ? 'free' : ''}">
                ${opt.price === 0 ? 'GRÁTIS' : `R$ ${opt.price.toFixed(2)}`}
              </div>
            </div>
          `).join('')}

          ${isEligibleFree
            ? '<div class="freight-free-note"><i class="fas fa-check-circle"></i> Este produto já te dá <strong>frete grátis</strong> por ser acima de R$ 198!</div>'
            : `<div class="freight-not-free-note"><i class="fas fa-tag"></i> Compre R$ ${needed} a mais para ganhar <strong>frete grátis</strong>.</div>`
          }
        </div>
      `;
    } catch (err) {
      freightCalcBtn.innerHTML = '<i class="fas fa-search"></i> Calcular';
      freightCalcBtn.disabled = false;
      freightResultsEl.innerHTML = '<div class="freight-error"><i class="fas fa-wifi"></i> Erro de conexão. Tente novamente.</div>';
    }
  });

  // Gallery Logic
  document.querySelectorAll('.thumb-item').forEach(thumb => {
    thumb.addEventListener('click', () => {
      document.querySelector('.thumb-item.active')?.classList.remove('active');
      thumb.classList.add('active');
      document.getElementById('main-product-image').src = thumb.dataset.src;
    });
  });

  // Color Selection
  document.querySelectorAll('.swatch-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelector('.swatch-btn.active')?.classList.remove('active');
      btn.classList.add('active');
      selectedColor = btn.dataset.name;
      document.getElementById('selected-color-name').textContent = selectedColor;
    });
  });

  // Size Selection
  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelector('.size-btn.active')?.classList.remove('active');
      btn.classList.add('active');
      selectedSize = btn.dataset.size;
    });
  });

  // Quantity Selection
  const qtyValue = document.getElementById('qty-value');
  document.getElementById('qty-minus')?.addEventListener('click', () => {
    if (selectedQty > 1) {
      selectedQty--;
      qtyValue.textContent = selectedQty;
    }
  });
  document.getElementById('qty-plus')?.addEventListener('click', () => {
    if (selectedQty < product.countInStock) {
      selectedQty++;
      qtyValue.textContent = selectedQty;
    }
  });

  // Modal Logic
  const modal = document.getElementById('measurements-modal');
  document.getElementById('open-measurements')?.addEventListener('click', () => modal.classList.add('open'));
  document.getElementById('close-modal')?.addEventListener('click', () => modal.classList.remove('open'));
  modal?.addEventListener('click', (e) => { if(e.target === modal) modal.classList.remove('open'); });

  // Add to Cart Logic
  document.getElementById('add-to-cart-premium')?.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!validateSelection(product)) return;
    
    addToCart(product._id, product.countInStock, selectedSize, selectedColor, selectedQty);
    
    btn.innerHTML = '<i class="fas fa-check"></i> ADICIONADO!';
    setTimeout(() => btn.innerHTML = '<i class="fas fa-shopping-cart"></i> ADICIONAR AO CARRINHO', 1500);
  });

  // Buy Now Logic
  document.getElementById('buy-now-btn')?.addEventListener('click', () => {
    if (!validateSelection(product)) return;
    
    const added = addToCart(product._id, product.countInStock, selectedSize, selectedColor, selectedQty, false);
    if (added) {
      window.location.href = '/checkout';
    }
  });
}

function validateSelection(product) {
  if (product.sizes && product.sizes.length > 0 && !selectedSize) {
    alert('Por favor, selecione um tamanho.');
    return false;
  }
  if (product.colors && product.colors.length > 0 && !selectedColor) {
    alert('Por favor, selecione uma cor.');
    return false;
  }
  return true;
}

renderProduct();
