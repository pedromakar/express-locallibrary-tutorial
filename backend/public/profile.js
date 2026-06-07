const welcomeText = document.getElementById('welcome-text');
const profileData = document.getElementById('profile-data');
const productsList = document.getElementById('profile-products-list');
const logoutButton = document.getElementById('logout-button');
const token = localStorage.getItem('md-essential-admin-token');

if (!token) {
  window.location.href = '/login';
}

logoutButton.addEventListener('click', () => {
  localStorage.removeItem('md-essential-admin-token');
  window.location.href = '/';
});

async function fetchProfile() {
  try {
    const response = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) {
      window.location.href = '/login';
      return;
    }

    welcomeText.textContent = `Olá, ${data.user.username}! Você está logado como ${data.user.role}.`;
    profileData.innerHTML = `
      <p><strong>Usuário:</strong> ${data.user.username}</p>
      <p><strong>E-mail:</strong> ${data.user.email || 'não informado'}</p>
      <p><strong>Perfil:</strong> ${data.user.role}</p>
    `;

    if (data.user.role === 'admin') {
      profileData.innerHTML += `
        <div class="box admin-panel">
          <h2>Painel Admin</h2>
          <p>Você tem acesso à edição e criação de produtos.</p>
          <a class="button" href="/admin">Abrir painel de produtos</a>
        </div>
      `;
    }
  } catch (err) {
    window.location.href = '/login';
  }
}

async function fetchProducts() {
  try {
    const response = await fetch('/api/products');
    const products = await response.json();
    productsList.innerHTML = products.length
      ? products.map(product => `
          <article class="product-card">
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

fetchProfile();
fetchProducts();
