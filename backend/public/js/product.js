import { renderNav, renderFooter, initDrawerEvents, updateCartBadge, syncCart, addToCart } from './ui.js';

const root = document.getElementById('page-root');
const params = new URLSearchParams(window.location.search);
const productId = params.get('id');

let selectedSize = null;
let selectedColor = null;

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

            <!-- Benefits -->
            <div class="benefits-premium">
              ${product.benefits.map(b => `
                <div class="benefit-item">
                  <i class="fas fa-check"></i>
                  <span>${b}</span>
                </div>
              `).join('')}
            </div>

            <button class="button w-100 mt-4" id="add-to-cart-premium">
              ADICIONAR AO CARRINHO
            </button>

            <div class="shipping-preview">
              <i class="fas fa-truck"></i>
              <span>Frete grátis em compras acima de R$ 198</span>
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

  // Modal Logic
  const modal = document.getElementById('measurements-modal');
  document.getElementById('open-measurements')?.addEventListener('click', () => modal.classList.add('open'));
  document.getElementById('close-modal')?.addEventListener('click', () => modal.classList.remove('open'));
  modal?.addEventListener('click', (e) => { if(e.target === modal) modal.classList.remove('open'); });

  // Add to Cart Logic
  document.getElementById('add-to-cart-premium')?.addEventListener('click', (e) => {
    const btn = e.target;
    addToCart(product._id, product.countInStock, selectedSize, selectedColor);
    
    btn.textContent = 'ADICIONADO!';
    setTimeout(() => btn.textContent = 'ADICIONAR AO CARRINHO', 1500);
  });
}

renderProduct();
