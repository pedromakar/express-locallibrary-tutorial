import { renderNav, renderFooter, renderProductCard, initDrawerEvents, updateCartBadge, bindGlobalAddButtons } from './ui.js?v=2';

const root = document.getElementById('page-root');

async function renderProducts() {
  const params = new URLSearchParams(window.location.search);
  const searchQuery = params.get('search');
  const currentCategory = params.get('category') || '';
  const currentGender = (params.get('gender') || params.get('publico') || '').toLowerCase();

  // Dynamic category chips based on target audience
  let categories = [];
  if (currentGender === 'masculino') {
    categories = [
      { label: 'Todos', slug: '' },
      { label: 'Camisetas', slug: 'Camisetas' },
      { label: 'Regatas', slug: 'Regatas' },
      { label: 'Shorts', slug: 'Shorts' },
      { label: 'Calças', slug: 'Calças' },
      { label: 'Moletons', slug: 'Moletons' },
      { label: 'Acessórios', slug: 'Acessórios' }
    ];
  } else if (currentGender === 'feminino') {
    categories = [
      { label: 'Todos', slug: '' },
      { label: 'Leggings', slug: 'Leggings' },
      { label: 'Croppeds', slug: 'Croppeds' },
      { label: 'Tops', slug: 'Tops' },
      { label: 'Shorts', slug: 'Shorts' },
      { label: 'Acessórios', slug: 'Acessórios' }
    ];
  } else {
    categories = [
      { label: 'Todos', slug: '' },
      { label: 'Camisetas', slug: 'Camisetas' },
      { label: 'Regatas', slug: 'Regatas' },
      { label: 'Shorts', slug: 'Shorts' },
      { label: 'Calças', slug: 'Calças' },
      { label: 'Moletons', slug: 'Moletons' },
      { label: 'Leggings', slug: 'Leggings' },
      { label: 'Croppeds', slug: 'Croppeds' },
      { label: 'Tops', slug: 'Tops' },
      { label: 'Acessórios', slug: 'Acessórios' }
    ];
  }

  // Build API Query
  const apiParams = new URLSearchParams();
  if (searchQuery) apiParams.set('search', searchQuery);
  if (currentCategory) apiParams.set('category', currentCategory);
  if (currentGender) apiParams.set('gender', currentGender);

  const url = '/api/products' + (apiParams.toString() ? `?${apiParams.toString()}` : '');

  const response = await fetch(url);
  const products = response.ok ? await response.json() : [];

  function getChipHref(slug) {
    const p = new URLSearchParams();
    if (currentGender) p.set('gender', currentGender);
    if (slug) p.set('category', slug);
    return '/products' + (p.toString() ? `?${p.toString()}` : '');
  }

  const categoryChipsHtml = `
    <div class="mobile-category-chips mobile-only" role="tablist">
      ${categories.map(c => {
        const isActive = (!currentCategory && !c.slug) || (currentCategory.toLowerCase() === c.slug.toLowerCase());
        const href = getChipHref(c.slug);
        return `
          <a href="${href}" class="mobile-chip ${isActive ? 'active' : ''}">
            ${c.label}
          </a>
        `;
      }).join('')}
    </div>
  `;

  // Dynamic Title & Subtitle
  let title = 'Todos os produtos';
  let subtitle = 'Explore nossa coleção completa de roupas e acessórios de treino.';

  if (searchQuery) {
    title = `Resultados para "${searchQuery}"`;
    subtitle = `Encontramos ${products.length} produto(s).`;
  } else if (currentCategory && currentGender) {
    title = `${currentCategory} (${currentGender === 'masculino' ? 'Masculino' : 'Feminino'})`;
    subtitle = currentGender === 'masculino'
      ? 'Peças masculinas com máxima durabilidade, corte anatômico e tecidos de compressão.'
      : 'Modelagens femininas com zero transparência, sustentação superior e ajuste perfeito.';
  } else if (currentCategory) {
    title = currentCategory;
    subtitle = `Confira os modelos disponíveis na categoria ${currentCategory}.`;
  } else if (currentGender === 'masculino') {
    title = 'Coleção Masculina';
    subtitle = 'Alta performance, conforto térmico e modelagens estruturadas desenvolvidas para atletas exigentes.';
  } else if (currentGender === 'feminino') {
    title = 'Coleção Feminina';
    subtitle = 'Peças com zero transparência, cós modelador, tecidos sem costura e máxima sustentação.';
  }

  root.innerHTML = `
    ${renderNav('products')}
    <main class="content">
      <section class="box">
        <h1 class="products-page-title">${title}</h1>
        <p class="products-page-subtitle">${subtitle}</p>
        
        ${categoryChipsHtml}

        <div class="grid-list">
          ${products.length > 0 ? products.map(renderProductCard).join('') : '<p class="text-center py-5">Nenhum produto encontrado nesta categoria.</p>'}
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
