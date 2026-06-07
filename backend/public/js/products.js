import { renderNav, renderFooter, renderProductCard } from './ui.js';

const root = document.getElementById('page-root');

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

async function renderProducts() {
  const response = await fetch('/api/products');
  const products = response.ok ? await response.json() : [];

  root.innerHTML = `
    ${renderNav('products')}
    <main class="content">
      <section class="box">
        <h1>Todos os produtos</h1>
        <p>Explore nossa coleção completa de roupas e acessórios de treino.</p>
        <div class="grid-list">
          ${products.map(renderProductCard).join('')}
        </div>
      </section>
    </main>
    ${renderFooter()}
  `;

  bindAddCartButtons();
}

renderProducts();
