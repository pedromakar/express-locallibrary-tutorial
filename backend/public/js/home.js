import { renderNav, renderFooter, renderProductCard, renderCategoryCard } from './ui.js';

const root = document.getElementById('page-root');
const fallbackImage = 'https://images.unsplash.com/photo-1503342452485-86fd4d463029?auto=format&fit=crop&w=800&q=80';

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
  return categories.map((category) => ({
    id: encodeURIComponent(category.name),
    title: category.name,
    description: `${category.count} produto(s) nesta categoria`,
    image: fallbackImage,
  }));
}

function render(products, categories) {
  root.innerHTML = `
    ${renderNav('home')}
    <main class="content">
      <section class="hero box">
        <div>
          <p class="eyebrow">Bem-vindo</p>
          <h1>MD Essential Fitness</h1>
          <p>Roupas e acessórios de academia para estilo, conforto e performance.</p>
          <div class="button-row">
            <a class="button" href="/products">Ver produtos</a>
            <a class="button secondary" href="/login">Login</a>
          </div>
        </div>
      </section>

      <section class="box section-grid">
        <h2>Categorias</h2>
        <div class="grid-list">
          ${buildCategoryItems(categories).map(renderCategoryCard).join('')}
        </div>
      </section>

      <section class="box section-grid">
        <h2>Produtos em destaque</h2>
        <div class="grid-list">
          ${products.slice(0, 6).map(renderProductCard).join('')}
        </div>
      </section>
    </main>
    ${renderFooter()}
  `;

  bindAddCartButtons();
}

function getCart() {
  return JSON.parse(localStorage.getItem('md-essential-cart') || '{}');
}

function saveCart(cart) {
  localStorage.setItem('md-essential-cart', JSON.stringify(cart));
}

function addToCart(productId, stock) {
  const cart = getCart();
  const currentQty = cart[productId] || 0;
  if (currentQty >= stock) {
    alert('Limite de estoque atingido para este produto.');
    return;
  }
  cart[productId] = currentQty + 1;
  saveCart(cart);
}

function bindAddCartButtons() {
  document.querySelectorAll('.add-to-cart-button').forEach((button) => {
    button.addEventListener('click', () => {
      const productId = button.dataset.id;
      const stock = parseInt(button.dataset.stock, 10);
      addToCart(productId, stock);
      button.textContent = 'Adicionado!';
      setTimeout(() => {
        button.textContent = 'Adicionar ao carrinho';
      }, 1200);
    });
  });
}

async function init() {
  const { products, categories } = await fetchHomeData();
  render(products, categories);
}

init();
