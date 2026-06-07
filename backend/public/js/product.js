import { renderNav, renderFooter } from './ui.js';

const root = document.getElementById('page-root');
const params = new URLSearchParams(window.location.search);
const productId = params.get('id');

async function renderProduct() {
  const response = await fetch(`/api/products/${productId}`);
  const product = response.ok ? await response.json() : null;

  root.innerHTML = `
    ${renderNav('products')}
    <main class="content">
      <section class="box product-detail">
        ${product ? `
          <div class="product-detail-image">
            ${product.images && product.images.length ? `<img src="${product.images[0]}" alt="${product.name}" />` : '<span>Sem imagem</span>'}
          </div>
          <div class="product-detail-info">
            <h1>${product.name}</h1>
            <p>${product.description}</p>
            <div class="product-meta">
              <span>R$ ${product.price.toFixed(2)}</span>
              <span>Estoque: ${product.countInStock}</span>
            </div>
            <button class="button add-to-cart-button" data-id="${product._id}" data-stock="${product.countInStock}">Adicionar ao carrinho</button>
          </div>
        ` : `
          <div>
            <h1>Produto não encontrado</h1>
            <p>Este produto não existe ou o ID está incorreto.</p>
          </div>
        `}
      </section>
    </main>
    ${renderFooter()}
  `;

  if (product) {
    const button = document.querySelector('.add-to-cart-button');
    button.addEventListener('click', () => {
      const cart = JSON.parse(localStorage.getItem('md-essential-cart') || '{}');
      const currentQty = cart[product._id] || 0;
      if (currentQty >= product.countInStock) {
        alert('Limite de estoque atingido para este produto.');
        return;
      }
      cart[product._id] = currentQty + 1;
      localStorage.setItem('md-essential-cart', JSON.stringify(cart));
      button.textContent = 'Adicionado!';
      setTimeout(() => {
        button.textContent = 'Adicionar ao carrinho';
      }, 1200);
    });
  }
}

renderProduct();
