import { renderNav, renderFooter, renderProductCard, initDrawerEvents, updateCartBadge, bindGlobalAddButtons } from './ui.js?v=2';

const root = document.getElementById('page-root');

async function renderProducts() {
  const params = new URLSearchParams(window.location.search);
  const searchQuery = params.get('search');

  const url = searchQuery ? `/api/products?search=${encodeURIComponent(searchQuery)}` : '/api/products';
  const response = await fetch(url);
  const products = response.ok ? await response.json() : [];

  root.innerHTML = `
    ${renderNav('products')}
    <main class="content">
      <section class="box">
        <h1>${searchQuery ? `Resultados para "${searchQuery}"` : 'Todos os produtos'}</h1>
        <p>${searchQuery ? `Encontramos ${products.length} produto(s).` : 'Explore nossa coleção completa de roupas e acessórios de treino.'}</p>
        <div class="grid-list">
          ${products.length > 0 ? products.map(renderProductCard).join('') : '<p class="text-center py-5">Nenhum produto encontrado.</p>'}
        </div>
      </section>
    </main>
    ${renderFooter()}
  `;

  initDrawerEvents();
  updateCartBadge();
  bindGlobalAddButtons();
}

renderProducts();
