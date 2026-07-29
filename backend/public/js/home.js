import { renderNav, renderFooter, renderProductCard, initDrawerEvents, updateCartBadge, bindGlobalAddButtons } from './ui.js?v=2';

const root = document.getElementById('page-root');

// High-resolution photography mapping for each category to prevent duplicate/random imagery
const CATEGORY_IMAGES = {
  'regatas': 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80',
  'camisetas': 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
  'tops e camisetas': 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
  'tops': 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
  'shorts': 'https://images.unsplash.com/photo-1508606572321-901ea4437072?auto=format&fit=crop&w=800&q=80',
  'leggings e calças': 'https://images.unsplash.com/photo-1506152983158-b4a74a01c721?auto=format&fit=crop&w=800&q=80',
  'leggings': 'https://images.unsplash.com/photo-1506152983158-b4a74a01c721?auto=format&fit=crop&w=800&q=80',
  'calças': 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=800&q=80',
  'moletom': 'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=800&q=80',
  'moletons': 'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=800&q=80',
  'acessórios': 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=800&q=80',
  'meias': 'https://images.unsplash.com/photo-1528701800489-20b9f7462f8c?auto=format&fit=crop&w=800&q=80',
  'kits': 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80',
  'coleções fitness': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
};

const DEFAULT_CATEGORY_IMAGE = 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80';

async function fetchHomeData() {
  const [productRes, categoryRes] = await Promise.all([
    fetch('/api/products'),
    fetch('/api/products/categories'),
  ]);

  const products = productRes.ok ? await productRes.json() : [];
  const categories = categoryRes.ok ? await categoryRes.json() : [];
  return { products, categories };
}

function getCategoryImage(categoryName) {
  const key = categoryName.trim().toLowerCase();
  return CATEGORY_IMAGES[key] || DEFAULT_CATEGORY_IMAGE;
}

function renderFluidCategoryCard(category) {
  const imgUrl = getCategoryImage(category.name);
  const categoryLink = `/category.html?id=${encodeURIComponent(category.name)}`;
  return `
    <div class="category-carousel-item">
      <a href="${categoryLink}" class="fluid-category-card">
        <div class="fluid-category-image-wrapper">
          <img src="${imgUrl}" alt="${category.name}" loading="lazy" />
          <div class="fluid-category-overlay"></div>
        </div>
        <div class="fluid-category-content">
          <span class="fluid-category-badge">${category.count} produto(s)</span>
          <h3 class="fluid-category-title">${category.name}</h3>
          <span class="fluid-category-link">VER CATEGORIA <i class="fas fa-arrow-right"></i></span>
        </div>
      </a>
    </div>
  `;
}

function setupCategoryCarousel(totalCategories) {
  const track = document.getElementById('category-carousel-track');
  const prevBtn = document.getElementById('category-prev');
  const nextBtn = document.getElementById('category-next');
  if (!track || !prevBtn || !nextBtn) return;

  let currentIndex = 0;

  const getVisibleItems = () => {
    const w = window.innerWidth;
    if (w <= 640) return 1;
    if (w <= 1024) return 2;
    return 3; // Maximum 3 items visible on desktop
  };

  const updateCarousel = () => {
    const visibleItems = getVisibleItems();
    const maxIndex = Math.max(0, totalCategories - visibleItems);
    currentIndex = Math.min(Math.max(0, currentIndex), maxIndex);

    const gapPx = 20;
    const containerWidth = track.parentElement.clientWidth;
    const itemWidth = (containerWidth - (gapPx * (visibleItems - 1))) / visibleItems;
    const moveAmount = currentIndex * (itemWidth + gapPx);

    track.style.transform = `translateX(-${moveAmount}px)`;

    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex >= maxIndex;
  };

  prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
      currentIndex--;
      updateCarousel();
    }
  });

  nextBtn.addEventListener('click', () => {
    const visibleItems = getVisibleItems();
    if (currentIndex < totalCategories - visibleItems) {
      currentIndex++;
      updateCarousel();
    }
  });

  window.addEventListener('resize', updateCarousel);
  updateCarousel();
}

function render(products, categories) {
  root.innerHTML = `
    ${renderNav('home')}
    <main class="content">
      <!-- Premium Hero Section -->
      <section class="hero premium-hero">
        <div class="hero-overlay"></div>
        <div class="hero-content-box">
          <p class="eyebrow">HIGH PERFORMANCE APPAREL — SOMBRIO/SC</p>
          <h1 class="text-uppercase-bold">ESSENCIAL PARA QUEM SUPERA LIMITES</h1>
          <p>Modelagens anatômicas e isolamento inteligente. Desenvolvido para máxima performance e atitude em qualquer treino.</p>
          <div class="button-row" style="margin-top: 28px;">
            <a class="button" href="/products">VER PRODUTOS</a>
            <a class="button button-outline" href="/category" style="color:#fff;border-color:#fff;">COLEÇÕES 2026</a>
          </div>
        </div>
      </section>

      <!-- Category Carousel Section (Max 3 visible at a time) -->
      <section class="section" style="padding-top: 60px;">
        <div class="container-custom">
          <div style="display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 32px; flex-wrap: wrap; gap: 16px;">
            <div>
              <p style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; color: var(--color-text-muted); margin-bottom: 6px;">NOSSAS LINHAS</p>
              <h2 class="text-uppercase-bold" style="font-size: 1.8rem; margin: 0;">Categorias em Destaque</h2>
            </div>
            
            <!-- Category Carousel Arrows -->
            <div style="display: flex; gap: 10px; align-items: center;">
              <button class="carousel-nav-btn prev" id="category-prev" aria-label="Categoria anterior">
                <i class="fas fa-chevron-left"></i>
              </button>
              <button class="carousel-nav-btn next" id="category-next" aria-label="Próxima categoria">
                <i class="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
          
          <div class="category-carousel-wrapper">
            <div class="category-carousel-container">
              <div class="category-carousel-track" id="category-carousel-track">
                ${categories.map(renderFluidCategoryCard).join('')}
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Spotlight Banners (Coleções Masculinas e Femininas) -->
      <section class="section" style="padding-top: 20px; padding-bottom: 60px;">
        <div class="container-custom">
          <div class="spotlight-grid">
            <a href="/products?category=Camisetas" class="spotlight-card">
              <img src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80" alt="Coleção Masculina" />
              <div class="spotlight-overlay"></div>
              <div class="spotlight-content">
                <span class="spotlight-subtitle">COLEÇÃO MASCULINA</span>
                <h3 class="spotlight-title">HEAVY & PERFORMANCE</h3>
                <span class="button button-small" style="background:#fff;color:#000;">VER MASCULINO →</span>
              </div>
            </a>

            <a href="/products?category=Leggings" class="spotlight-card">
              <img src="https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80" alt="Coleção Feminina" />
              <div class="spotlight-overlay"></div>
              <div class="spotlight-content">
                <span class="spotlight-subtitle">COLEÇÃO FEMININA</span>
                <h3 class="spotlight-title">ALPHACUT & COREFLEX</h3>
                <span class="button button-small" style="background:#fff;color:#000;">VER FEMININO →</span>
              </div>
            </a>
          </div>
        </div>
      </section>

      <!-- Kits e Bundles Carousel -->
      <section class="section" style="background-color: var(--color-bg); padding-top: 20px; padding-bottom: 40px;">
        <div class="container-custom">
          <div style="text-align: center; margin-bottom: 40px;">
            <p style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; color: var(--color-primary); margin-bottom: 6px;">COMPRE JUNTO E ECONOMIZE</p>
            <h2 class="text-uppercase-bold" style="font-size: 1.8rem;">Kits e Bundles</h2>
          </div>
          
          <div class="grid-list">
            ${products.slice(0, 4).map(p => { 
                const kitProduct = { ...p, category: 'Kits', name: 'Kit ' + p.name, price: p.price * 2.5 }; 
                return renderProductCard(kitProduct); 
             }).join('')}
          </div>
        </div>
      </section>

      <!-- Products Grid (Drops em Destaque) -->
      <section class="section section--alt">
        <div class="container-custom">
          <div style="text-align: center; margin-bottom: 40px;">
            <p style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; color: var(--color-text-muted); margin-bottom: 6px;">NOVIDADES DO ESTOQUE</p>
            <h2 class="text-uppercase-bold" style="font-size: 1.8rem;">Drops em Destaque</h2>
          </div>
          
          <div class="grid-list">
            ${products.slice(0, 8).map(renderProductCard).join('')}
          </div>

          <div style="text-align: center; margin-top: 40px;">
            <a href="/products" class="button button-outline" style="min-width: 200px;">VER TODOS OS PRODUTOS →</a>
          </div>
        </div>
      </section>

      <!-- Benefits & Trust Bar -->
      <section class="benefit-bar">
        <div class="container-custom benefit-grid">
          <div class="benefit-card">
            <i class="fas fa-shipping-fast"></i>
            <h3>ENVIO RÁPIDO</h3>
            <p>Despachamos em até 24h a partir de Sombrio/SC.</p>
          </div>
          <div class="benefit-card">
            <i class="fas fa-sync-alt"></i>
            <h3>TROCA FÁCIL</h3>
            <p>Primeira troca ou devolução sem burocracia.</p>
          </div>
          <div class="benefit-card">
            <i class="fas fa-percent"></i>
            <h3>10% OFF NO PIX</h3>
            <p>Desconto automático para pagamento via PIX.</p>
          </div>
          <div class="benefit-card">
            <i class="fas fa-shield-alt"></i>
            <h3>COMPRA SEGURA</h3>
            <p>Ambiente 100% criptografado e certificado.</p>
          </div>
        </div>
      </section>
    </main>
    ${renderFooter()}
  `;

  initDrawerEvents();
  updateCartBadge();
  bindGlobalAddButtons();
  setupCategoryCarousel(categories.length);
}

async function init() {
  const { products, categories } = await fetchHomeData();
  render(products, categories);
}

init();
