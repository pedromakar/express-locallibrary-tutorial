import { renderNav, renderFooter, renderProductCard, renderCategoryCard, initDrawerEvents, updateCartBadge, bindGlobalAddButtons } from './ui.js?v=2';

const root = document.getElementById('page-root');
console.log("=== home.js executed ===");

async function fetchHomeData() {
  const [productRes, categoryRes] = await Promise.all([
    fetch('/api/products'),
    fetch('/api/products/categories'),
  ]);

  const products = productRes.ok ? await productRes.json() : [];
  const categories = categoryRes.ok ? await categoryRes.json() : [];
  return { products, categories };
}

function buildCategoryItems(categories) {
  const categoryPlaceholderImages = [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80', // Gym
    'https://images.unsplash.com/photo-1571731956622-39ed2739cbbb?auto=format&fit=crop&w=800&q=80', // Training
    'https://images.unsplash.com/photo-1583454110551-21f2fa200181?auto=format&fit=crop&w=800&q=80', // Fitness
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80', // Lifestyle
  ];

  return categories.map((category, index) => ({
    id: encodeURIComponent(category.name),
    title: category.name,
    description: `${category.count} produto(s) nesta categoria`,
    image: categoryPlaceholderImages[index % categoryPlaceholderImages.length],
  }));
}

function render(products, categories) {
  root.innerHTML = `
    ${renderNav('home')}
    <main class="content">
      <section class="hero premium-hero">
        <div class="hero-overlay"></div>
        <div class="hero-content-box">
          <p class="eyebrow">ESTÉTICA & PERFORMANCE</p>
          <h1>MD ESSENTIAL<br>FITNESS</h1>
          <p>O uniforme de quem não aceita o comum. Tecidos tecnológicos com modelagem premium.</p>
          <div class="button-row">
            <a class="button" href="/products">COMPRAR AGORA</a>
            <a class="button secondary" href="/category">COLEÇÕES</a>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container-custom">
          <h2 class="text-uppercase-bold text-center mb-5">Categorias</h2>
          <div class="grid-list">
            ${buildCategoryItems(categories).map(renderCategoryCard).join('')}
          </div>
        </div>
      </section>

      <section class="section section--alt">
        <div class="container-custom">
          <h2 class="text-uppercase-bold text-center mb-5">Drops em Destaque</h2>
          <div class="grid-list">
            ${products.slice(0, 6).map(renderProductCard).join('')}
          </div>
        </div>
      </section>

      <section class="benefit-bar">
        <div class="container-custom benefit-grid">
          <div class="benefit-card">
            <i class="fas fa-shipping-fast"></i>
            <h3>ENVIO RÁPIDO</h3>
            <p>Despachamos em até 24h úteis.</p>
          </div>
          <div class="benefit-card">
            <i class="fas fa-sync-alt"></i>
            <h3>TROCA GRÁTIS</h3>
            <p>Primeira troca por nossa conta.</p>
          </div>
          <div class="benefit-card">
            <i class="fas fa-shield-alt"></i>
            <h3>COMPRA SEGURA</h3>
            <p>Ambiente 100% criptografado.</p>
          </div>
        </div>
      </section>
    </main>
    ${renderFooter()}
  `;

  initDrawerEvents();
  updateCartBadge();
  bindGlobalAddButtons();
}

async function init() {
  const { products, categories } = await fetchHomeData();
  render(products, categories);
}

init();
