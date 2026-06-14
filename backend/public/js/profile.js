import { renderNav, renderFooter, initDrawerEvents, updateCartBadge, syncCart } from './ui.js';

const root = document.getElementById('page-root');
const token = localStorage.getItem('md-essential-admin-token');

if (!token) {
  window.location.href = '/login';
}

async function fetchProfile() {
  try {
    const response = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    
    if (!response.ok) {
      localStorage.removeItem('md-essential-admin-token');
      window.location.href = '/login';
      return;
    }

    renderProfile(data.user);
    fetchOrderHistory(data.user._id || data.user.id);
    syncCart();
  } catch (err) {
    window.location.href = '/login';
  }
}

async function fetchOrderHistory(userId) {
  const historyContainer = document.getElementById('order-history');
  if (!historyContainer) return;

  try {
    const response = await fetch(`/api/orders/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const orders = await response.json();

    if (orders.length > 0) {
      historyContainer.innerHTML = `
        <div class="table-responsive">
          <table class="table table-hover" style="font-size: 0.8rem;">
            <thead>
              <tr class="text-uppercase small" style="letter-spacing: 0.1em; color: #666;">
                <th class="border-0 px-0">PEDIDO</th>
                <th class="border-0">DATA</th>
                <th class="border-0">TOTAL</th>
                <th class="border-0">STATUS</th>
                <th class="border-0 text-end px-0">AÇÃO</th>
              </tr>
            </thead>
            <tbody>
              ${orders.map(order => `
                <tr>
                  <td class="px-0 py-3 fw-bold">#${order._id.slice(-6).toUpperCase()}</td>
                  <td class="py-3 text-muted">${new Date(order.createdAt).toLocaleDateString('pt-BR')}</td>
                  <td class="py-3">R$ ${order.totalPrice.toFixed(2)}</td>
                  <td class="py-3">
                    <span class="badge" style="background: ${getStatusColor(order.status)}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.6rem; text-transform: uppercase;">
                      ${order.status}
                    </span>
                  </td>
                  <td class="px-0 py-3 text-end">
                    <button class="button button-outline small" onclick="alert('ID do Pedido: ' + '${order._id}')">Ver Detalhes</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
  } catch (err) {
    console.error('Erro ao buscar pedidos:', err);
  }
}

function getStatusColor(status) {
  switch (status) {
    case 'pending': return '#f39c12';
    case 'paid': return '#2ecc71';
    case 'shipped': return '#3498db';
    case 'canceled': return '#e74c3c';
    default: return '#95a5a6';
  }
}

function renderProfile(user) {
  root.innerHTML = `
    ${renderNav('account')}
    <main class="container-custom py-5">
      <div class="dashboard-layout">
        <aside class="dashboard-sidebar">
          <div class="sidebar-user">
            <div class="user-avatar">${user.username.charAt(0).toUpperCase()}</div>
            <div class="user-info">
              <h3>${user.username}</h3>
              <p>${user.email}</p>
            </div>
          </div>
          <nav class="sidebar-nav">
            <button class="nav-item active" data-section="orders">
              <i class="fas fa-shopping-bag"></i> MEUS PEDIDOS
            </button>
            <button class="nav-item" data-section="addresses">
              <i class="fas fa-map-marker-alt"></i> ENDEREÇOS
            </button>
            <button class="nav-item" data-section="account-info">
              <i class="fas fa-user-edit"></i> DADOS DA CONTA
            </button>
            <button id="logout-button" class="nav-item logout">
              <i class="fas fa-sign-out-alt"></i> SAIR
            </button>
          </nav>
        </aside>

        <section class="dashboard-content">
          <div id="section-orders" class="dashboard-section active">
            <h2 class="text-uppercase-bold mb-4">Meus Pedidos</h2>
            <div id="order-history" class="text-center py-5 empty-state">
              <p>Você ainda não realizou nenhum pedido.</p>
              <a href="/products" class="button button-small mt-3">COMEÇAR A COMPRAR</a>
            </div>
          </div>

          <div id="section-addresses" class="dashboard-section">
            <h2 class="text-uppercase-bold mb-4">Meus Endereços</h2>
            <div class="empty-state py-5 text-center">
              <p>Nenhum endereço cadastrado.</p>
              <button class="button button-small mt-3">ADICIONAR ENDEREÇO</button>
            </div>
          </div>

          <div id="section-account-info" class="dashboard-section">
            <h2 class="text-uppercase-bold mb-4">Dados da Conta</h2>
            <form class="account-form">
              <div class="form-group">
                <label>Nome de Usuário</label>
                <input type="text" value="${user.username}" disabled />
              </div>
              <div class="form-group">
                <label>E-mail</label>
                <input type="email" value="${user.email}" disabled />
              </div>
              <div class="form-group">
                <label>Nova Senha</label>
                <input type="password" placeholder="••••••••" />
              </div>
              <button type="button" class="button mt-3">ATUALIZAR DADOS</button>
            </form>
          </div>
        </section>
      </div>
    </main>
    ${renderFooter()}
  `;

  // Section Toggling Logic
  const navItems = document.querySelectorAll('.sidebar-nav .nav-item:not(.logout)');
  const sections = document.querySelectorAll('.dashboard-section');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const sectionId = item.dataset.section;
      
      // Update sidebar
      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      // Update content
      sections.forEach(s => s.classList.remove('active'));
      document.getElementById(`section-${sectionId}`).classList.add('active');
    });
  });

  document.getElementById('logout-button').addEventListener('click', () => {
    localStorage.removeItem('md-essential-admin-token');
    localStorage.removeItem('md-essential-cart');
    window.location.href = '/';
  });

  initDrawerEvents();
  updateCartBadge();
}

fetchProfile();
