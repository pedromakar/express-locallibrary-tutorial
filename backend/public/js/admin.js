import { renderNav, renderFooter, initDrawerEvents, updateCartBadge } from './ui.js?v=2';

const root = document.getElementById('page-root');
const token = localStorage.getItem('md-essential-admin-token');

function renderAdminPage() {
  root.innerHTML = `
    ${renderNav('admin')}
    <main class="content">
      <header class="admin-header">
        <div>
          <h1>Admin MD Essential</h1>
          <p>Crie ou edite produtos com a conta de administrador.</p>
        </div>
        <div class="admin-actions">
          <a class="button" href="/">Voltar à loja</a>
          <button id="logout-button" class="button secondary">Sair</button>
        </div>
      </header>

      <section class="box admin-dashboard">
        <h2>Visão Geral do Painel</h2>
        <div class="dashboard-grid">
          <div class="dashboard-card">
            <span>Total de produtos</span>
            <strong id="admin-total-products">0</strong>
          </div>
          <div class="dashboard-card">
            <span>Estoque total</span>
            <strong id="admin-total-stock">0</strong>
          </div>
          <div class="dashboard-card">
            <span>Categorias</span>
            <strong id="admin-category-count">0</strong>
          </div>
        </div>
        <div class="category-list-box">
          <h3>Categorias disponíveis</h3>
          <div id="admin-category-list" class="category-list"></div>
        </div>
      </section>

      <section class="box" id="admin-section">
        <h2>Criar / Editar Produto</h2>
        <form id="product-form" class="form-grid">
          <input type="hidden" id="product-id" />
          <label>
            Nome
            <input type="text" id="name" required />
          </label>
          <label>
            Descrição
            <textarea id="description" rows="3" required></textarea>
          </label>
          <label>
            Categoria
            <select id="category"></select>
          </label>
          <label>
            Nova categoria (opcional)
            <input type="text" id="new-category" placeholder="Digite nova categoria" />
          </label>
          <label>
            Preço
            <input type="number" id="price" step="0.01" required />
          </label>
          <label>
            Estoque
            <input type="number" id="countInStock" min="0" required />
          </label>
          <label>
            Imagem principal (URL)
            <input type="text" id="image-url" placeholder="https://..." />
          </label>
          <label>
            Enviar imagem
            <input type="file" id="image-upload" accept="image/*" />
          </label>
          <label>
            Imagens extras (URLs separadas por vírgula)
            <textarea id="images" placeholder="https://..." rows="2"></textarea>
          </label>
          <div id="image-preview" class="image-preview"></div>
          <div class="form-actions">
            <button type="submit">Salvar</button>
            <button type="button" id="clear-product" class="button secondary">Limpar</button>
          </div>
        </form>
        <div id="admin-message" class="message"></div>
      </section>

      <section class="box" id="admin-orders-section">
        <h2>Gestão de Pedidos</h2>
        <div id="admin-orders-list" class="orders-list">
          <p class="text-center py-4">Carregando pedidos...</p>
        </div>
      </section>

      <section class="box" id="admin-users-section">
        <h2>Gestão de Clientes</h2>
        <div id="admin-users-list" class="table-responsive">
          <p class="text-center py-4">Carregando clientes...</p>
        </div>
      </section>

      <section class="box" id="admin-products-section">
        <h2>Produtos Existentes</h2>
        <div id="admin-products-list" class="products"></div>
      </section>
    </main>
    ${renderFooter()}
  `;
}

// Render the page first
renderAdminPage();

// Initialize drawer events from the shared UI module
initDrawerEvents();
updateCartBadge();

// Now grab all DOM references
const adminMessage = document.getElementById('admin-message');
const productForm = document.getElementById('product-form');
const adminProductsList = document.getElementById('admin-products-list');
const logoutButton = document.getElementById('logout-button');
const imageUrlInput = document.getElementById('image-url');
const imageUploadInput = document.getElementById('image-upload');
const imagesInput = document.getElementById('images');
const imagePreview = document.getElementById('image-preview');
const clearButton = document.getElementById('clear-product');
const categorySelect = document.getElementById('category');
const newCategoryInput = document.getElementById('new-category');

if (!token) {
  adminMessage.textContent = 'Você precisa estar logado como admin para acessar esta página.';
  productForm.querySelectorAll('input, textarea, button, select').forEach(field => {
    if (field.type !== 'button') field.disabled = true;
  });
}

logoutButton?.addEventListener('click', () => {
  localStorage.removeItem('md-essential-admin-token');
  window.location.href = '/';
});

imageUploadInput.addEventListener('change', async event => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    imageUrlInput.value = reader.result;
    renderCurrentPreview();
  };
  reader.readAsDataURL(file);
});

imageUrlInput.addEventListener('input', () => renderCurrentPreview());
imagesInput.addEventListener('input', () => renderCurrentPreview());
clearButton.addEventListener('click', resetForm);

function renderCurrentPreview() {
  const imageUrl = imageUrlInput.value.trim();
  const extraImages = imagesInput.value.split(',').map(s => s.trim()).filter(Boolean);
  renderImagePreview([imageUrl, ...extraImages].filter(Boolean));
}

function renderImagePreview(images = []) {
  imagePreview.innerHTML = images.length
    ? images.map(src => `<img src="${src}" alt="Preview de imagem" />`).join('')
    : '<p class="hint">Pré-visualização das imagens do produto aparecerá aqui.</p>';
}

function resetForm() {
  productForm.reset();
  document.getElementById('product-id').value = '';
  renderImagePreview([]);
  adminMessage.textContent = '';
}

function getSelectedCategory() {
  const newCategory = newCategoryInput.value.trim();
  if (newCategory) return newCategory;
  return categorySelect.value || 'Geral';
}

async function checkAdmin() {
  try {
    const response = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok || data.user.role !== 'admin') {
      window.location.href = '/login';
    }
  } catch (err) {
    window.location.href = '/login';
  }
}

async function fetchProducts() {
  try {
    const response = await fetch('/api/products');
    const products = await response.json();
    renderAdminProducts(products);
    renderAdminDashboard(products);
    populateCategorySelect(products);
    fetchOrders(); 
    fetchUsers(); // Also fetch users
  } catch (error) {
    adminProductsList.innerHTML = '<p>Erro ao carregar produtos.</p>';
  }
}

async function fetchOrders() {
  const ordersList = document.getElementById('admin-orders-list');
  try {
    const response = await fetch('/api/admin/orders', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const orders = await response.json();
    renderAdminOrders(orders);
  } catch (error) {
    ordersList.innerHTML = '<p>Erro ao carregar pedidos.</p>';
  }
}

async function fetchUsers() {
  const usersList = document.getElementById('admin-users-list');
  try {
    const response = await fetch('/api/users', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const users = await response.json();
    renderAdminUsers(users);
  } catch (error) {
    usersList.innerHTML = '<p>Erro ao carregar clientes.</p>';
  }
}

function renderAdminUsers(users) {
  const usersList = document.getElementById('admin-users-list');
  if (!users || users.length === 0) {
    usersList.innerHTML = '<p class="text-center py-4">Nenhum cliente encontrado.</p>';
    return;
  }

  usersList.innerHTML = `
    <table class="table" style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
      <thead>
        <tr style="border-bottom: 2px solid var(--color-border); text-align: left;">
          <th class="py-3">USUÁRIO</th>
          <th class="py-3">EMAIL</th>
          <th class="py-3">ROLE</th>
        </tr>
      </thead>
      <tbody>
        ${users.map(user => `
          <tr style="border-bottom: 1px solid var(--color-border);">
            <td class="py-3">${user.username}</td>
            <td class="py-3">${user.email}</td>
            <td class="py-3">${user.role}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderAdminOrders(orders) {
  const ordersList = document.getElementById('admin-orders-list');
  if (!orders || orders.length === 0) {
    ordersList.innerHTML = '<p class="text-center py-4">Nenhum pedido encontrado.</p>';
    return;
  }

  ordersList.innerHTML = `
    <div class="table-responsive">
      <table class="table" style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
        <thead>
          <tr style="border-bottom: 2px solid var(--color-border); text-align: left;">
            <th class="py-3">PEDIDO</th>
            <th class="py-3">CLIENTE</th>
            <th class="py-3">DATA</th>
            <th class="py-3">TOTAL</th>
            <th class="py-3">STATUS</th>
            <th class="py-3">AÇÕES</th>
          </tr>
        </thead>
        <tbody>
          ${orders.map(order => `
            <tr style="border-bottom: 1px solid var(--color-border);">
              <td class="py-3 fw-bold">#${order._id.slice(-6).toUpperCase()}</td>
              <td class="py-3">${order.user ? order.user.username : 'Excluído'}<br><small class="text-muted">${order.user ? order.user.email : ''}</small></td>
              <td class="py-3">${new Date(order.createdAt).toLocaleDateString('pt-BR')}</td>
              <td class="py-3 fw-bold">R$ ${order.totalPrice.toFixed(2)}</td>
              <td class="py-3">
                <select class="status-select" data-id="${order._id}" style="padding: 4px; border-radius: 4px; background: var(--color-bg-alt); color: var(--color-text-main); border: 1px solid var(--color-border);">
                  <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pendente</option>
                  <option value="paid" ${order.status === 'paid' ? 'selected' : ''}>Pago</option>
                  <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Enviado</option>
                  <option value="canceled" ${order.status === 'canceled' ? 'selected' : ''}>Cancelado</option>
                </select>
              </td>
              <td class="py-3">
                <button class="button small" onclick="alert('Itens: ' + '${order.items.map(i => `${i.quantity}x ${i.name} (${i.size || '-'})`).join(', ')}')">Ver Itens</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  document.querySelectorAll('.status-select').forEach(select => {
    select.addEventListener('change', async (e) => {
      const orderId = e.target.dataset.id;
      const newStatus = e.target.value;
      await updateOrderStatus(orderId, newStatus);
    });
  });
}

async function updateOrderStatus(orderId, status) {
  try {
    const response = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    const data = await response.json();
    if (response.ok) {
      adminMessage.textContent = 'Status do pedido atualizado com sucesso.';
      setTimeout(() => adminMessage.textContent = '', 3000);
    } else {
      alert(data.message || 'Erro ao atualizar status');
    }
  } catch (err) {
    alert('Erro ao conectar com o servidor');
  }
}

function renderAdminProducts(products) {
  adminProductsList.innerHTML = products.length
    ? products.map(product => `
          <article class="product-card admin-card">
            <div class="product-image-preview">
              ${product.images && product.images.length ? `<img src="${product.images[0]}" alt="${product.name}" />` : '<span>Sem imagem</span>'}
            </div>
            <div class="admin-card-body">
              <h3>${product.name}</h3>
              <p>${product.description}</p>
              <p class="category-tag">Categoria: ${product.category || 'Geral'}</p>
              <div class="product-meta">
                <strong>R$ ${product.price.toFixed(2)}</strong>
                <span>Estoque: ${product.countInStock}</span>
              </div>
              <div class="admin-actions-row">
                <button data-id="${product._id}" class="button small edit-button">Editar</button>
                <button data-id="${product._id}" class="button small secondary delete-button">Excluir</button>
              </div>
            </div>
          </article>
        `).join('')
    : '<p>Nenhum produto disponível.</p>';

  document.querySelectorAll('.edit-button').forEach(button => {
    button.addEventListener('click', () => loadProduct(button.dataset.id));
  });
  document.querySelectorAll('.delete-button').forEach(button => {
    button.addEventListener('click', () => deleteProduct(button.dataset.id));
  });
}

function renderAdminDashboard(products) {
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, product) => sum + (product.countInStock || 0), 0);
  const categories = Array.from(new Set(products.map(product => product.category || 'Geral'))).sort();

  document.getElementById('admin-total-products').textContent = totalProducts;
  document.getElementById('admin-total-stock').textContent = totalStock;
  document.getElementById('admin-category-count').textContent = categories.length;

  const categoryList = document.getElementById('admin-category-list');
  categoryList.innerHTML = categories.length
    ? categories.map(category => `<span class="category-chip">${category}</span>`).join('')
    : '<p>Nenhuma categoria cadastrada.</p>';
}

function populateCategorySelect(products) {
  const categories = Array.from(new Set(products.map(product => product.category || 'Geral'))).sort();
  categorySelect.innerHTML = categories
    .map(category => `<option value="${category}">${category}</option>`)
    .join('');
  if (!categories.length) {
    categorySelect.innerHTML = '<option value="Geral">Geral</option>';
  }
}

async function loadProduct(productId) {
  try {
    const response = await fetch(`/api/products/${productId}`);
    const product = await response.json();
    if (!response.ok) {
      adminMessage.textContent = product.message || 'Não foi possível carregar o produto.';
      return;
    }

    document.getElementById('product-id').value = product._id;
    document.getElementById('name').value = product.name;
    document.getElementById('description').value = product.description;
    document.getElementById('price').value = product.price;
    document.getElementById('countInStock').value = product.countInStock;
    document.getElementById('new-category').value = '';
    if (product.category) {
      const optionExists = Array.from(categorySelect.options).some(option => option.value === product.category);
      if (!optionExists) {
        const option = document.createElement('option');
        option.value = product.category;
        option.textContent = product.category;
        categorySelect.append(option);
      }
      categorySelect.value = product.category;
    }
    imageUrlInput.value = product.images && product.images.length ? product.images[0] : '';
    imagesInput.value = product.images && product.images.length > 1 ? product.images.slice(1).join(', ') : '';
    renderImagePreview(product.images || []);
    adminMessage.textContent = 'Editando produto. Altere os campos e salve.';

    // Scroll to form
    document.getElementById('admin-section').scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    adminMessage.textContent = 'Falha interna ao carregar produto.';
  }
}

productForm.addEventListener('submit', async event => {
  event.preventDefault();
  adminMessage.textContent = '';

  const id = document.getElementById('product-id').value;
  const name = document.getElementById('name').value.trim();
  const description = document.getElementById('description').value.trim();
  const price = parseFloat(document.getElementById('price').value);
  const countInStock = parseInt(document.getElementById('countInStock').value, 10);
  const category = getSelectedCategory();
  const imageUrl = imageUrlInput.value.trim();
  const extraImages = imagesInput.value.split(',').map(s => s.trim()).filter(Boolean);
  const images = [imageUrl, ...extraImages].filter(Boolean);

  const payload = { name, description, category, price, countInStock, images };
  const path = id ? `/api/products/${id}` : '/api/products';
  const method = id ? 'PUT' : 'POST';

  try {
    const response = await fetch(path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      adminMessage.textContent = data.message || 'Erro ao salvar produto.';
      return;
    }

    adminMessage.textContent = `Produto ${id ? 'atualizado' : 'criado'} com sucesso.`;
    resetForm();
    fetchProducts();
  } catch (err) {
    adminMessage.textContent = 'Erro ao enviar dados ao servidor.';
  }
});

async function deleteProduct(productId) {
  if (!confirm('Tem certeza de que deseja excluir este produto?')) return;

  try {
    const response = await fetch(`/api/products/${productId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) {
      adminMessage.textContent = data.message || 'Erro ao excluir produto.';
      return;
    }
    adminMessage.textContent = 'Produto excluído com sucesso.';
    fetchProducts();
  } catch (err) {
    adminMessage.textContent = 'Falha ao excluir o produto.';
  }
}

if (token) {
  checkAdmin().then(fetchProducts);
}
