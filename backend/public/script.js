const productsList = document.getElementById('products-list');

async function fetchProducts() {
  try {
    const response = await fetch('/api/products');
    const products = await response.json();
    productsList.innerHTML = products.length
      ? products.map(product => `
          <article class="product-card">
            <div class="product-image">${product.images && product.images[0] ? `<img src="${product.images[0]}" alt="${product.name}" />` : '<div class="placeholder-image">Foto</div>'}</div>
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <div class="product-meta">
              <strong>R$ ${product.price.toFixed(2)}</strong>
              <span>Estoque: ${product.countInStock}</span>
            </div>
          </article>
        `).join('')
      : '<p>Nenhum produto disponível.</p>';
  } catch (error) {
    productsList.innerHTML = '<p>Não foi possível carregar os produtos.</p>';
  }
}

fetchProducts();
