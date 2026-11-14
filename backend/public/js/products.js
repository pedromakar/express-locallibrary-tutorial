import { renderNav, renderFooter, renderProductCard, initDrawerEvents, updateCartBadge, bindGlobalAddButtons } from './ui.js?v=2';

const root = document.getElementById('page-root');

async function renderProducts() {
  const params = new URLSearchParams(window.location.search);
  const searchQuery = params.get('search');
  const currentCategory = params.get('category') || '';

  const categories = [
    { label: 'Todos', slug: '' },
    { label: 'Camisetas', slug: 'Camisetas' },
    { label: 'Regatas', slug: 'Regatas' },
    { label: 'Shorts', slug: 'Shorts' },
    { label: 'Calças', slug: 'Calças' },
    { label: 'Moletons', slug: 'Moletom' },
    { label: 'Kits', slug: 'Kits' },
    { label: 'Acessórios', slug: 'Acessórios' }
  ];

  let url = '/api/products';
  if (searchQuery) {
    url = `/api/products?search=${encodeURIComponent(searchQuery)}`;
  } else if (currentCategory) {
    url = `/api/products?category=${encodeURIComponent(currentCategory)}`;
  }

  const response = await fetch(url);
  const products = response.ok ? await response.json() : [];

  const categoryChipsHtml = `
    <div class="mobile-category-chips mobile-only" role="tablist">
      ${categories.map(c => {
        const isActive = (!currentCategory && !c.slug) || (currentCategory.toLowerCase() === c.slug.toLowerCase());
        const href = c.slug ? `/products?category=${encodeURIComponent(c.slug)}` : '/products';
        return `
          <a href="${href}" class="mobile-chip ${isActive ? 'active' : ''}">
            ${c.label}
          </a>
        `;
      }).join('')}
    </div>
  `;

  root.innerHTML = `
    ${renderNav('products')}
    <main class="content">
      <section class="box">
        <h1 class="products-page-title">${searchQuery ? `Resultados para "${searchQuery}"` : (currentCategory ? currentCategory : 'Todos os produtos')}</h1>
        <p class="products-page-subtitle">${searchQuery ? `Encontramos ${products.length} produto(s).` : 'Explore nossa coleção completa de roupas e acessórios de treino.'}</p>
        
        ${categoryChipsHtml}

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
