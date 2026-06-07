export function renderNav(activePage) {
  return `
    <header class="app-header">
      <div class="brand-link"><a href="/">MD Essential</a></div>
      <nav class="main-nav">
        <a href="/products" class="nav-link ${activePage === 'products' ? 'active' : ''}">Produtos</a>
        <a href="/category" class="nav-link ${activePage === 'category' ? 'active' : ''}">Categoria</a>
        <a href="/cart" class="nav-link ${activePage === 'cart' ? 'active' : ''}">Carrinho</a>
        <a href="/login" class="nav-link ${activePage === 'login' ? 'active' : ''}">Login</a>
        <a href="/account" class="nav-link ${activePage === 'account' ? 'active' : ''}">Minha Conta</a>
      </nav>
    </header>
  `;
}

export function renderFooter() {
  return `
    <footer class="app-footer">
      <p>MD Essential - Estrutura de projeto</p>
    </footer>
  `;
}

export function renderProductCard(product) {
  const productId = product._id || product.id;
  const stock = product.countInStock || 0;
  return `
    <article class="card product-card">
      <div class="product-image">
        ${product.image ? `<img src="${product.image}" alt="${product.name}" />` : '<span>Sem imagem</span>'}
      </div>
      <div class="card-body">
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <div class="product-meta">
          <span>R$ ${product.price.toFixed(2)}</span>
          <a class="button small" href="/product?id=${productId}">Ver</a>
        </div>
        <div class="product-actions">
          <button class="button small add-to-cart-button" data-id="${productId}" data-stock="${stock}">Adicionar ao carrinho</button>
        </div>
      </div>
    </article>
  `;
}

export function renderCategoryCard(category) {
  return `
    <article class="card category-card">
      <div class="category-image">
        ${category.image ? `<img src="${category.image}" alt="${category.title}" />` : '<span>Sem imagem</span>'}
      </div>
      <div class="category-body">
        <h3>${category.title}</h3>
        <p>${category.description}</p>
        <a class="button small" href="/category?id=${category.id}">Ver categoria</a>
      </div>
    </article>
  `;
}
