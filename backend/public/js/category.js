import { renderNav, renderFooter, renderProductCard, renderCategoryCard, initDrawerEvents, updateCartBadge, bindGlobalAddButtons } from './ui.js?v=2';

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

async function renderCategoryPage() {
  const searchQuery = params.get('search');
  
  if (!categoryId && !searchQuery) {
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
  } else {
    let url = `/api/products?category=${encodeURIComponent(categoryId || '')}`;
    if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
    
    const response = await fetch(url);
    const products = response.ok ? await response.json() : [];
    root.innerHTML = `
      ${renderNav('category')}
      <main class="content">
        <section class="box">
          <h1>${searchQuery ? `Busca em ${categoryId || 'Categorias'}` : categoryId}</h1>
          <p>${products.length} produto(s) encontrado(s).</p>
          <div class="grid-list">
            ${products.length > 0 ? products.map(renderProductCard).join('') : '<p class="text-center py-5">Nenhum produto encontrado.</p>'}
          </div>
        </section>
      </main>
      ${renderFooter()}
    `;
  }

  initDrawerEvents();
  updateCartBadge();
  bindGlobalAddButtons();
}

renderCategoryPage();
