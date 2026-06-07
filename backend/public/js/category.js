import { renderNav, renderFooter, renderProductCard, renderCategoryCard } from './ui.js';

const root = document.getElementById('page-root');
const params = new URLSearchParams(window.location.search);
const categoryId = params.get('id');
const fallbackImage = 'https://images.unsplash.com/photo-1503342452485-86fd4d463029?auto=format&fit=crop&w=800&q=80';

function buildCategoryItems(categories) {
  return categories.map((category) => ({
    id: encodeURIComponent(category.name),
    title: category.name,
    description: `${category.count} produto(s) nesta categoria`,
    image: fallbackImage,
  }));
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

async function renderCategoryPage() {
  if (!categoryId) {
    const response = await fetch('/api/products/categories');
    const categories = response.ok ? await response.json() : [];
    root.innerHTML = `
      ${renderNav('category')}
      <main class="content">
        <section class="box">
          <h1>Categorias</h1>
          <p>Escolha uma categoria para ver os produtos correspondentes.</p>
          <div class="grid-list">
            ${buildCategoryItems(categories).map(renderCategoryCard).join('')}
          </div>
        </section>
      </main>
      ${renderFooter()}
    `;
    return;
  }

  const response = await fetch(`/api/products?category=${encodeURIComponent(categoryId)}`);
  const products = response.ok ? await response.json() : [];
  root.innerHTML = `
    ${renderNav('category')}
    <main class="content">
      <section class="box">
        <h1>${categoryId}</h1>
        <p>Produtos cadastrados para a categoria ${categoryId}.</p>
        <div class="grid-list">
          ${products.map(renderProductCard).join('')}
        </div>
      </section>
    </main>
    ${renderFooter()}
  `;

  bindAddCartButtons();
}

renderCategoryPage();
