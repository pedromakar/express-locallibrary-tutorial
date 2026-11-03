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

  // Check Verified Purchase Permission (Shopee style)
  const token = localStorage.getItem('md-essential-admin-token');
  let canReviewData = { canReview: false, reason: 'not_logged_in' };
  try {
    const checkHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};
    const canReviewRes = await fetch(`/api/products/${productId}/can-review`, { headers: checkHeaders });
    if (canReviewRes.ok) {
      canReviewData = await canReviewRes.json();
    }
  } catch (err) {
    console.warn('Erro ao verificar autorização de avaliação:', err);
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
            <div class="product-rating-summary">
              <span class="stars">${'★'.repeat(Math.round(product.rating || 5))}${'☆'.repeat(5 - Math.round(product.rating || 5))}</span>
              <span class="rating-value">${(product.rating || 5).toFixed(1)}</span>
              <a href="#reviews-section" class="rating-count">(${product.numReviews || (product.reviews ? product.reviews.length : 0)} avaliações)</a>
            </div>
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

              <a href="https://wa.me/5571999313160?text=Ol%C3%A1%2C%20tenho%20d%C3%BAvidas%20sobre%20a%20${encodeURIComponent(product.name)}" class="whatsapp-buy-btn" target="_blank">
                <i class="fab fa-whatsapp"></i> Dúvidas? Compre pelo WhatsApp
              </a>
              
              <div class="easy-return-banner">
                <i class="fas fa-box-open"></i>
                <span>Primeira troca <strong>gratuita</strong> e sem burocracia. Troque Fácil MD!</span>
              </div>
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

      <!-- Customer Reviews Section -->
      <section class="reviews-section" id="reviews-section">
        <div class="reviews-container">
          <div class="reviews-header-block">
            <div>
              <h2 class="text-uppercase-bold" style="font-size: 1.5rem; margin-bottom: 6px;">Avaliações de Clientes</h2>
              <p style="color: var(--color-text-muted); font-size: 0.85rem; margin: 0;">Opiniões reais de quem já comprou e testou (Padrão Shopee)</p>
            </div>
            <div class="reviews-score-card">
              <div class="reviews-big-number">${(product.rating || 5).toFixed(1)}</div>
              <div class="reviews-score-info">
                <div class="stars-large">${'★'.repeat(Math.round(product.rating || 5))}${'☆'.repeat(5 - Math.round(product.rating || 5))}</div>
                <span style="font-size: 0.8rem; color: var(--color-text-muted); font-weight: 600;">${product.numReviews || (product.reviews ? product.reviews.length : 0)} avaliações</span>
              </div>
            </div>
          </div>

          <!-- Review Form or Locked Notice (Shopee Style) -->
          ${canReviewData.canReview ? `
            <div class="review-form-card" id="review-form-card">
              <div class="review-form-header">
                <div>
                  <h3 style="margin: 0; font-size: 1.15rem; font-weight: 800; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-star" style="color: #eab308;"></i> Avaliar Minha Compra
                  </h3>
                  <p style="margin: 4px 0 0; font-size: 0.85rem; color: var(--color-text-muted);">
                    Sua opinião sincera ajuda outros clientes da MD Essential!
                  </p>
                </div>
                <span class="badge-verified-purchase">
                  <i class="fas fa-check-circle"></i> Compra Verificada
                </span>
              </div>

              <form id="product-review-form" style="margin-top: 16px;">
                <div class="review-form-field">
                  <label class="review-field-label">SUA CLASSIFICAÇÃO GERAL:</label>
                  <div class="star-rating-selector" id="star-rating-selector">
                    <span class="active" data-val="1">★</span>
                    <span class="active" data-val="2">★</span>
                    <span class="active" data-val="3">★</span>
                    <span class="active" data-val="4">★</span>
                    <span class="active" data-val="5">★</span>
                  </div>
                  <span id="star-rating-text" class="rating-descriptor">5 estrelas - Excelente produto!</span>
                  <input type="hidden" id="review-rating-val" value="5" />
                </div>

                <div class="review-form-field">
                  <label class="review-field-label">SEU NOME / EXIBIÇÃO:</label>
                  <input type="text" id="review-name" value="${canReviewData.username || ''}" placeholder="Seu nome ou apelido" required class="review-input" />
                </div>

                <div class="review-form-field">
                  <div class="d-flex justify-content-between align-items-center">
                    <label class="review-field-label">DETALHE SUA EXPERIÊNCIA:</label>
                    <span id="char-counter" class="char-counter-tag invalid">0 / 15 caracteres mínimos</span>
                  </div>
                  <textarea id="review-comment" placeholder="Conte como foi o caimento, a qualidade do tecido, costuras, acabamento e conforto..." rows="3" required class="review-textarea"></textarea>
                </div>

                <!-- Foto do Produto Recebido (Estilo Shopee) -->
                <div class="review-form-field">
                  <label class="review-field-label">
                    <i class="fas fa-camera"></i> FOTOS DO PRODUTO RECEBIDO (OPCIONAL):
                  </label>
                  <p style="font-size: 0.75rem; color: var(--color-text-muted); margin-bottom: 8px;">
                    Envie fotos reais da peça que você recebeu para mostrar o caimento e detalhes.
                  </p>
                  <div class="review-photo-upload-container">
                    <label for="review-photo-input" class="review-photo-btn">
                      <i class="fas fa-cloud-upload-alt"></i> Escolher Foto(s)
                    </label>
                    <input type="file" id="review-photo-input" accept="image/*" multiple style="display: none;" />
                    <span style="font-size: 0.75rem; color: var(--color-text-muted);">ou link da imagem:</span>
                    <input type="url" id="review-photo-url" placeholder="https://..." class="review-url-input" />
                  </div>
                  <div id="review-photos-preview" class="review-photos-preview"></div>
                </div>

                <button type="submit" class="button button-submit-review" id="btn-submit-review">
                  <i class="fas fa-paper-plane"></i> ENVIAR AVALIAÇÃO
                </button>
              </form>
            </div>
          ` : `
            <div class="review-lock-card">
              <div class="review-lock-icon">
                <i class="fas fa-shield-alt"></i>
              </div>
              <div class="review-lock-content">
                <h4>Avaliações com Compra Verificada (Padrão Shopee)</h4>
                ${canReviewData.reason === 'not_logged_in' ? `
                  <p>Para garantir 100% de autenticidade e evitar avaliações fakes, apenas clientes que compraram e receberam este produto podem postar fotos e avaliações.</p>
                  <a href="/login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search + '#reviews-section')}" class="button small">
                    <i class="fas fa-sign-in-alt"></i> Entrar na minha Conta para Avaliar
                  </a>
                ` : `
                  <p>Identificamos que você ainda não adquiriu este produto com esta conta. Somente quem já comprou e testou o produto pode enviar fotos e avaliações.</p>
                  <a href="#add-to-cart-premium" class="button small" id="btn-lock-buy" style="cursor: pointer;">
                    <i class="fas fa-shopping-cart"></i> Comprar Este Produto
                  </a>
                `}
              </div>
            </div>
          `}

          <!-- Reviews List -->
          <div class="reviews-list">
            ${(product.reviews && product.reviews.length > 0) ? product.reviews.map(r => `
              <div class="review-card">
                <div class="review-card-header">
                  <div>
                    <span class="review-author">${r.name}</span>
                    <span style="font-size: 0.75rem; color: #22c55e; margin-left: 8px; font-weight: 600;"><i class="fas fa-check-circle"></i> Compra Verificada</span>
                  </div>
                  <span class="review-date">${new Date(r.createdAt || Date.now()).toLocaleDateString('pt-BR')}</span>
                </div>
                <div class="stars-small">${'★'.repeat(r.rating || 5)}${'☆'.repeat(5 - (r.rating || 5))}</div>
                <p class="review-text">${r.comment}</p>
                ${(r.images && r.images.length > 0) ? `
                  <div class="review-photos-gallery">
                    ${r.images.map(img => `
                      <div class="review-photo-thumb" onclick="window.openReviewModal('${img}')" title="Clique para ampliar foto do cliente">
                        <img src="${img}" alt="Foto da avaliação do cliente" loading="lazy" />
                        <div class="photo-zoom-icon"><i class="fas fa-search-plus"></i></div>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
              </div>
            `).join('') : `
              <div class="review-card" style="text-align: center; color: var(--color-text-muted); padding: 32px;">
                <i class="far fa-comment-dots" style="font-size: 2rem; margin-bottom: 8px;"></i>
                <p>Nenhuma avaliação cadastrada ainda. Seja o primeiro comprador a avaliar!</p>
              </div>
            `}
          </div>
        </div>
      </section>

      <!-- Photo Zoom Modal -->
      <div class="modal-overlay" id="review-photo-modal">
        <div class="modal-content review-modal-content">
          <div class="modal-header">
            <h3>Foto do Cliente (Compra Verificada)</h3>
            <button id="close-review-modal" style="background:none; border:none; font-size:1.2rem; cursor:pointer;"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body text-center" style="padding: 16px;">
            <img id="review-modal-img" src="" alt="Foto expandida do produto" style="max-height: 70vh; max-width: 100%; border-radius: var(--radius-sm); object-fit: contain;" />
          </div>
        </div>
      </div>

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

  setupEventListeners(product, canReviewData);
  initDrawerEvents();
  updateCartBadge();
}

function setupEventListeners(product, canReviewData = {}) {
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

      // Update gallery if color has specific images
      const colorObj = product.colors?.find(c => c.name === selectedColor);
      if (colorObj && colorObj.images && colorObj.images.length > 0) {
        document.getElementById('main-product-image').src = colorObj.images[0];
        
        const thumbnailGrid = document.querySelector('.thumbnail-grid');
        if (thumbnailGrid) {
          thumbnailGrid.innerHTML = colorObj.images.map((img, idx) => `
            <div class="thumb-item ${idx === 0 ? 'active' : ''}" data-src="${img}">
              <img src="${img}" alt="Thumbnail ${idx + 1}" />
            </div>
          `).join('');

          // Re-bind thumbnail clicks
          thumbnailGrid.querySelectorAll('.thumb-item').forEach(thumb => {
            thumb.addEventListener('click', () => {
              thumbnailGrid.querySelector('.thumb-item.active')?.classList.remove('active');
              thumb.classList.add('active');
              document.getElementById('main-product-image').src = thumb.dataset.src;
            });
          });
        }
      }
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

  // ===== STAR RATING & REVIEW FORM (SHOPEE STYLE) =====
  let currentRating = 5;
  const ratingDescriptors = {
    1: '1 estrela - Muito Ruim',
    2: '2 estrelas - Ruim',
    3: '3 estrelas - Regular',
    4: '4 estrelas - Muito Bom!',
    5: '5 estrelas - Excelente produto!'
  };

  const starBtns = document.querySelectorAll('#star-rating-selector span');
  const starText = document.getElementById('star-rating-text');
  starBtns.forEach(star => {
    star.addEventListener('click', () => {
      currentRating = parseInt(star.dataset.val, 10);
      const ratingInput = document.getElementById('review-rating-val');
      if (ratingInput) ratingInput.value = currentRating;
      if (starText) starText.textContent = ratingDescriptors[currentRating] || `${currentRating} estrelas`;
      starBtns.forEach(s => {
        if (parseInt(s.dataset.val, 10) <= currentRating) {
          s.classList.add('active');
        } else {
          s.classList.remove('active');
        }
      });
    });
  });

  // Character Counter (Live Validation)
  const commentTextarea = document.getElementById('review-comment');
  const charCounter = document.getElementById('char-counter');
  commentTextarea?.addEventListener('input', () => {
    const len = commentTextarea.value.trim().length;
    if (charCounter) {
      charCounter.textContent = `${len} / 15 caracteres mínimos`;
      if (len >= 15) {
        charCounter.classList.remove('invalid');
        charCounter.classList.add('valid');
      } else {
        charCounter.classList.remove('valid');
        charCounter.classList.add('invalid');
      }
    }
  });

  // Photo Upload State & Handlers
  let uploadedPhotos = [];
  const previewContainer = document.getElementById('review-photos-preview');

  function renderPhotosPreview() {
    if (!previewContainer) return;
    previewContainer.innerHTML = uploadedPhotos.map((img, idx) => `
      <div class="review-preview-thumb">
        <img src="${img}" alt="Preview foto ${idx + 1}" />
        <button type="button" class="review-preview-remove" data-idx="${idx}" title="Remover foto">&times;</button>
      </div>
    `).join('');

    previewContainer.querySelectorAll('.review-preview-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx, 10);
        uploadedPhotos.splice(idx, 1);
        renderPhotosPreview();
      });
    });
  }

  const fileInput = document.getElementById('review-photo-input');
  fileInput?.addEventListener('change', (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach(file => {
      if (uploadedPhotos.length >= 4) {
        alert('Você pode anexar no máximo 4 fotos por avaliação.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        uploadedPhotos.push(loadEvent.target.result);
        renderPhotosPreview();
      };
      reader.readAsDataURL(file);
    });
    fileInput.value = '';
  });

  const photoUrlInput = document.getElementById('review-photo-url');
  photoUrlInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const url = photoUrlInput.value.trim();
      if (!url) return;
      if (uploadedPhotos.length >= 4) {
        alert('Você pode anexar no máximo 4 fotos por avaliação.');
        return;
      }
      uploadedPhotos.push(url);
      photoUrlInput.value = '';
      renderPhotosPreview();
    }
  });

  // Photo Zoom Modal Handlers
  window.openReviewModal = (imgSrc) => {
    const modalImg = document.getElementById('review-modal-img');
    const modalOverlay = document.getElementById('review-photo-modal');
    if (modalImg && modalOverlay) {
      modalImg.src = imgSrc;
      modalOverlay.classList.add('open');
    }
  };

  const closeReviewModalBtn = document.getElementById('close-review-modal');
  const reviewPhotoModal = document.getElementById('review-photo-modal');
  closeReviewModalBtn?.addEventListener('click', () => {
    reviewPhotoModal?.classList.remove('open');
  });
  reviewPhotoModal?.addEventListener('click', (e) => {
    if (e.target === reviewPhotoModal) {
      reviewPhotoModal.classList.remove('open');
    }
  });

  // Lock Card Action Scroll
  document.getElementById('btn-lock-buy')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('add-to-cart-premium')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  // Review Form Submit Handler
  const reviewForm = document.getElementById('product-review-form');
  reviewForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const commentEl = document.getElementById('review-comment');
    const nameEl = document.getElementById('review-name');
    const comment = commentEl?.value?.trim() || '';
    const name = nameEl?.value?.trim() || canReviewData.username || 'Cliente Verificado';
    const rating = parseInt(document.getElementById('review-rating-val')?.value, 10) || 5;

    if (comment.length < 15) {
      alert(`Por favor, escreva no mínimo 15 caracteres detalhando sua avaliação do produto (você digitou ${comment.length}).`);
      commentEl?.focus();
      return;
    }

    const token = localStorage.getItem('md-essential-admin-token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const submitBtn = reviewForm.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando Avaliação...';
    }

    try {
      const res = await fetch(`/api/products/${product._id}/reviews`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          rating,
          comment,
          name,
          images: uploadedPhotos
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert('🎉 Avaliação de compra verificada enviada com sucesso! Obrigado por compartilhar suas impressões.');
        window.location.reload();
      } else {
        alert(data.message || 'Erro ao enviar avaliação.');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> ENVIAR AVALIAÇÃO';
        }
      }
    } catch (err) {
      alert('Erro de conexão ao enviar avaliação.');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> ENVIAR AVALIAÇÃO';
      }
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
