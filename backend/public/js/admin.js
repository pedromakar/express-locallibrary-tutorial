// Token check
const token = localStorage.getItem('md-essential-admin-token');
if (!token) {
  window.location.href = '/login';
}

// State management
let currentTab = 'dashboard';
let stats = null;
let products = [];
let orders = [];
let users = [];
let carts = [];
let notifications = [];
let reportsData = null;

// Search, Filter & Pagination states
let searchQuery = '';
let filterStatus = 'all';
let filterCategory = 'all';
let currentPage = 1;
const itemsPerPage = 10;

// Editing product state
let editingProduct = null; // null for list, 'new' for create, object for editing

// Active charts instances to destroy before rendering again
let salesChartInstance = null;
let categoryChartInstance = null;

// Fetch dashboard statistics
async function loadStats() {
  try {
    const res = await fetch('/api/admin/stats', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.status === 401 || res.status === 403) {
      logout();
      return;
    }
    if (!res.ok) {
      showToast('Erro ao carregar estatísticas do dashboard.');
      return;
    }
    stats = await res.json();
  } catch (err) {
    showToast('Erro ao carregar estatísticas do dashboard.');
  }
}

// Fetch lists from database
async function loadProducts() {
  try {
    const res = await fetch('/api/products');
    if (!res.ok) {
      products = [];
      showToast('Erro ao carregar produtos.');
      return;
    }
    products = await res.json();
  } catch (err) {
    products = [];
    showToast('Erro ao carregar produtos.');
  }
}

async function loadOrders() {
  try {
    const res = await fetch('/api/admin/orders', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.status === 401 || res.status === 403) {
      logout();
      return;
    }
    if (!res.ok) {
      orders = [];
      showToast('Erro ao carregar pedidos.');
      return;
    }
    orders = await res.json();
  } catch (err) {
    orders = [];
    showToast('Erro ao carregar pedidos.');
  }
}

async function loadUsers() {
  try {
    const res = await fetch('/api/users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.status === 401 || res.status === 403) {
      logout();
      return;
    }
    if (!res.ok) {
      users = [];
      showToast('Erro ao carregar clientes.');
      return;
    }
    users = await res.json();
  } catch (err) {
    users = [];
    showToast('Erro ao carregar clientes.');
  }
}

async function loadCarts() {
  try {
    const res = await fetch('/api/admin/carts', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.status === 401 || res.status === 403) {
      logout();
      return;
    }
    if (!res.ok) {
      carts = [];
      showToast('Erro ao carregar carrinhos.');
      return;
    }
    carts = await res.json();
  } catch (err) {
    carts = [];
    showToast('Erro ao carregar carrinhos.');
  }
}

async function loadNotifications() {
  try {
    const res = await fetch('/api/admin/notifications', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.status === 401 || res.status === 403) {
      logout();
      return;
    }
    if (!res.ok) {
      notifications = [];
      showToast('Erro ao carregar notificações.');
      return;
    }
    notifications = await res.json();
  } catch (err) {
    notifications = [];
    showToast('Erro ao carregar notificações.');
  }
}

async function loadReports() {
  try {
    const res = await fetch('/api/admin/reports', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.status === 401 || res.status === 403) {
      logout();
      return;
    }
    if (!res.ok) {
      reportsData = null;
      showToast('Erro ao carregar dados do relatório.');
      return;
    }
    reportsData = await res.json();
  } catch (err) {
    reportsData = null;
    showToast('Erro ao carregar dados do relatório.');
  }
}

// Update notifications badge counter on sidebar
function updateNotificationsBadge() {
  const unreadCount = notifications.filter(n => !n.read).length;
  const badgeEl = document.getElementById('notif-badge');
  if (badgeEl) {
    if (unreadCount > 0) {
      badgeEl.textContent = unreadCount;
      badgeEl.style.display = 'inline-block';
    } else {
      badgeEl.style.display = 'none';
    }
  }
}

// Show success/error toast alerts
function showToast(message, iconClass = 'fa-check-circle') {
  let toastEl = document.getElementById('admin-toast');
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.id = 'admin-toast';
    toastEl.className = 'admin-toast';
    document.body.appendChild(toastEl);
  }
  toastEl.innerHTML = `<i class="fas ${iconClass}"></i> <span>${message}</span>`;
  toastEl.classList.add('show');
  setTimeout(() => {
    toastEl.classList.remove('show');
  }, 3500);
}

// Logout procedure
function logout() {
  localStorage.removeItem('md-essential-admin-token');
  window.location.href = '/';
}

// Render the application shell
function renderShell() {
  const root = document.getElementById('page-root');
  const loggedUser = localStorage.getItem('username') || 'Administrador';

  root.innerHTML = `
    <!-- Sidebar Navigation -->
    <aside class="admin-sidebar">
      <div class="admin-logo">
        <i class="fas fa-bolt"></i> MD ESSENTIAL
      </div>
      <nav class="admin-nav">
        <button class="admin-nav-item ${currentTab === 'dashboard' ? 'active' : ''}" onclick="switchTab('dashboard')">
          <i class="fas fa-chart-pie"></i> <span>Dashboard</span>
        </button>
        <button class="admin-nav-item ${currentTab === 'orders' ? 'active' : ''}" onclick="switchTab('orders')">
          <i class="fas fa-shopping-bag"></i> <span>Pedidos</span>
        </button>
        <button class="admin-nav-item ${currentTab === 'customers' ? 'active' : ''}" onclick="switchTab('customers')">
          <i class="fas fa-users"></i> <span>Clientes</span>
        </button>
        <button class="admin-nav-item ${currentTab === 'products' ? 'active' : ''}" onclick="switchTab('products')">
          <i class="fas fa-tags"></i> <span>Produtos</span>
        </button>
        <button class="admin-nav-item ${currentTab === 'carts' ? 'active' : ''}" onclick="switchTab('carts')">
          <i class="fas fa-shopping-cart"></i> <span>Carrinhos</span>
        </button>
        <button class="admin-nav-item ${currentTab === 'notifications' ? 'active' : ''}" onclick="switchTab('notifications')">
          <i class="fas fa-bell"></i> <span>Notificações</span>
          <span class="badge" id="notif-badge" style="display:none;">0</span>
        </button>
        <button class="admin-nav-item ${currentTab === 'reports' ? 'active' : ''}" onclick="switchTab('reports')">
          <i class="fas fa-chart-line"></i> <span>Relatórios</span>
        </button>
      </nav>
      <div class="admin-sidebar-footer">
        <a href="/" class="admin-nav-item">
          <i class="fas fa-store"></i> <span>Ver Loja</span>
        </a>
        <button onclick="logout()" class="admin-nav-item text-danger">
          <i class="fas fa-sign-out-alt"></i> <span>Desconectar</span>
        </button>
      </div>
    </aside>

    <!-- Main Workspace -->
    <main class="admin-main">
      <header class="admin-main-header">
        <h1 class="admin-header-title" id="admin-view-title">Dashboard</h1>
        <div class="admin-user-profile">
          <div class="admin-user-info">
            <span class="admin-user-name">${loggedUser}</span>
            <span class="admin-user-role">Super Admin</span>
          </div>
          <img src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=80&q=80" alt="Avatar" class="admin-user-avatar" />
        </div>
      </header>
      <div class="admin-content" id="admin-content-pane">
        <!-- Render Active View here -->
      </div>
    </main>

    <!-- Modal for details -->
    <div id="admin-modal-overlay" class="admin-modal-overlay"></div>
  `;

  updateNotificationsBadge();
  renderActiveTab();
}

// Switches visible tab and resets filter/pagination states
window.switchTab = async function(tab) {
  currentTab = tab;
  searchQuery = '';
  filterStatus = 'all';
  filterCategory = 'all';
  currentPage = 1;
  editingProduct = null;

  // Render shell immediately to highlight menu selection
  renderShell();
};

// Render active tab content
async function renderActiveTab() {
  const container = document.getElementById('admin-content-pane');
  const titleEl = document.getElementById('admin-view-title');
  if (!container) return;

  renderSkeleton(container);

  switch (currentTab) {
    case 'dashboard':
      titleEl.textContent = 'Dashboard';
      await Promise.all([loadStats(), loadProducts(), loadNotifications()]);
      renderDashboard(container);
      break;
    case 'orders':
      titleEl.textContent = 'Gestão de Pedidos';
      await loadOrders();
      renderOrders(container);
      break;
    case 'customers':
      titleEl.textContent = 'Gerenciamento de Clientes';
      await loadUsers();
      renderCustomers(container);
      break;
    case 'products':
      titleEl.textContent = 'Gerenciamento de Produtos';
      await loadProducts();
      renderProductsTab(container);
      break;
    case 'carts':
      titleEl.textContent = 'Carrinhos Ativos & Abandonados';
      await loadCarts();
      renderCartsTab(container);
      break;
    case 'notifications':
      titleEl.textContent = 'Alertas & Notificações';
      await loadNotifications();
      renderNotificationsTab(container);
      break;
    case 'reports':
      titleEl.textContent = 'Relatórios de Vendas';
      await loadReports();
      renderReportsTab(container);
      break;
  }
  updateNotificationsBadge();
}

// Skeletons during fetch transitions
function renderSkeleton(target) {
  target.innerHTML = `
    <div class="skeleton-title skeleton"></div>
    <div class="metrics-grid">
      <div class="metric-card"><div class="skeleton-text skeleton" style="width: 40%"></div><div class="skeleton-text skeleton" style="height: 32px"></div></div>
      <div class="metric-card"><div class="skeleton-text skeleton" style="width: 40%"></div><div class="skeleton-text skeleton" style="height: 32px"></div></div>
      <div class="metric-card"><div class="skeleton-text skeleton" style="width: 40%"></div><div class="skeleton-text skeleton" style="height: 32px"></div></div>
      <div class="metric-card"><div class="skeleton-text skeleton" style="width: 40%"></div><div class="skeleton-text skeleton" style="height: 32px"></div></div>
    </div>
    <div class="admin-section-card">
      <div class="card-content">
        <div class="skeleton-text skeleton" style="width: 20%; margin-bottom: 20px;"></div>
        <div class="skeleton-text skeleton" style="height: 40px; margin-bottom: 12px;"></div>
        <div class="skeleton-text skeleton" style="height: 40px; margin-bottom: 12px;"></div>
        <div class="skeleton-text skeleton" style="height: 40px;"></div>
      </div>
    </div>
  `;
}

// --------------------------------------------------------------------------
// VIEW: Dashboard
// --------------------------------------------------------------------------
function renderDashboard(container) {
  if (!stats) return;

  const lowStockCount = stats.products?.lowStock || 0;
  const outOfStockCount = stats.products?.outOfStock || 0;
  const categories = Array.from(new Set(products.map(p => p.category || 'Geral'))).sort();

  container.innerHTML = `
    <!-- Top metrics cards -->
    <div class="metrics-grid">
      <div class="metric-card accent">
        <span class="metric-title">Receita Hoje</span>
        <strong class="metric-value">R$ ${stats.revenue.today.toFixed(2)}</strong>
        <span class="metric-sub">Total acumulado hoje</span>
      </div>
      <div class="metric-card success">
        <span class="metric-title">Faturamento Mês</span>
        <strong class="metric-value">R$ ${stats.revenue.month.toFixed(2)}</strong>
        <span class="metric-sub">Mês corrente</span>
      </div>
      <div class="metric-card">
        <span class="metric-title">Vendas Totais</span>
        <strong class="metric-value">R$ ${stats.revenue.total.toFixed(2)}</strong>
        <span class="metric-sub">Histórico acumulado</span>
      </div>
      <div class="metric-card">
        <span class="metric-title">Pedidos Hoje</span>
        <strong class="metric-value">${stats.orders.today}</strong>
        <span class="metric-sub">Entradas nas últimas 24h</span>
      </div>
      <div class="metric-card">
        <span class="metric-title">Clientes</span>
        <strong class="metric-value">${stats.customers.total}</strong>
        <span class="metric-sub">${stats.customers.new} novos nos últimos 7 dias</span>
      </div>
      <div class="metric-card ${outOfStockCount > 0 ? 'warning' : ''}">
        <span class="metric-title">Ruptura de Estoque</span>
        <strong class="metric-value">${outOfStockCount}</strong>
        <span class="metric-sub">${lowStockCount} produtos com estoque crítico (<= 5)</span>
      </div>
      <div class="metric-card">
        <span class="metric-title">Ticket Médio</span>
        <strong class="metric-value">R$ ${stats.avgTicket.toFixed(2)}</strong>
        <span class="metric-sub">Faturamento / Total pedidos</span>
      </div>
      <div class="metric-card warning">
        <span class="metric-title">Carrinhos Abandonados</span>
        <strong class="metric-value">${stats.abandonedCarts.count}</strong>
        <span class="metric-sub">Totalizando R$ ${stats.abandonedCarts.totalValue.toFixed(2)} perdidos</span>
      </div>
    </div>

    <!-- Active categories section -->
    <div class="admin-section-card" style="margin-bottom: 32px;">
      <div class="card-header">
        <h3>Categorias Ativas no Catálogo (${categories.length})</h3>
      </div>
      <div class="card-content">
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          ${categories.map(cat => {
            const count = products.filter(p => (p.category || 'Geral') === cat).length;
            return `
              <button class="admin-btn admin-btn-small" onclick="selectDashboardCategory('${cat}')" style="display: inline-flex; align-items: center; gap: 8px;">
                <i class="fas fa-folder" style="color: var(--admin-color-primary);"></i>
                <strong>${cat}</strong>
                <span class="admin-badge admin-badge-info" style="font-size: 0.65rem; padding: 2px 6px;">${count}</span>
              </button>
            `;
          }).join('')}
        </div>
      </div>
    </div>

    <!-- Main overview table layout split -->
    <div class="grid-2col">
      <!-- Recent orders -->
      <div class="admin-section-card">
        <div class="card-header">
          <h3>Últimos Pedidos</h3>
          <button class="admin-btn admin-btn-small" onclick="switchTab('orders')">Ver todos</button>
        </div>
        <div class="card-content table-wrapper">
          ${stats.recentOrders && stats.recentOrders.length ? `
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${stats.recentOrders.slice(0, 5).map(order => `
                  <tr>
                    <td class="fw-bold">#${order._id.slice(-6).toUpperCase()}</td>
                    <td>${order.user ? order.user.username : 'Removido'}</td>
                    <td class="fw-bold">R$ ${order.totalPrice.toFixed(2)}</td>
                    <td>
                      <span class="admin-badge ${
                        order.status === 'paid' ? 'admin-badge-success' :
                        order.status === 'shipped' ? 'admin-badge-info' :
                        order.status === 'canceled' ? 'admin-badge-error' :
                        'admin-badge-warning'
                      }">${order.status}</span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<p class="empty-state">Nenhum pedido recente registrado.</p>'}
        </div>
      </div>

      <!-- Top products sold -->
      <div class="admin-section-card">
        <div class="card-header">
          <h3>Produtos Mais Vendidos</h3>
          <button class="admin-btn admin-btn-small" onclick="switchTab('reports')">Relatório de vendas</button>
        </div>
        <div class="card-content table-wrapper">
          ${stats.topProducts && stats.topProducts.length ? `
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Nome do Produto</th>
                  <th class="text-center">Quantidade</th>
                  <th>Faturamento</th>
                </tr>
              </thead>
              <tbody>
                ${stats.topProducts.map(p => `
                  <tr>
                    <td class="fw-bold">${p.name}</td>
                    <td class="text-center">${p.sold}</td>
                    <td class="fw-bold text-success">R$ ${p.revenue.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<p class="empty-state">Nenhum registro de venda disponível.</p>'}
        </div>
      </div>
    </div>
  `;
}

window.selectDashboardCategory = function(cat) {
  filterCategory = cat;
  currentTab = 'products';
  // Render layout and navigate directly
  renderShell();
};

window.filterProductsByCategory = function(cat) {
  filterCategory = cat;
  currentPage = 1;
  renderActiveTab();
};

// --------------------------------------------------------------------------
// VIEW: Orders Management
// --------------------------------------------------------------------------
function renderOrders(container) {
  let filtered = [...orders];

  // Apply Search
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(o => 
      o._id.toLowerCase().includes(q) || 
      (o.user && o.user.username.toLowerCase().includes(q)) ||
      (o.user && o.user.email.toLowerCase().includes(q))
    );
  }

  // Apply Status filter
  if (filterStatus !== 'all') {
    filtered = filtered.filter(o => o.status === filterStatus);
  }

  // Pagination calculation
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIdx, startIdx + itemsPerPage);

  container.innerHTML = `
    <div class="admin-section-card">
      <div class="card-header">
        <h3>Lista de Pedidos (${totalItems})</h3>
      </div>
      <div class="card-content">
        <!-- Filter bar -->
        <div class="filter-bar">
          <div class="search-input-wrapper">
            <i class="fas fa-search"></i>
            <input type="text" placeholder="Buscar por pedido ou nome do cliente..." value="${searchQuery}" oninput="searchOrders(this.value)" />
          </div>
          <select class="filter-select" onchange="filterOrdersStatus(this.value)">
            <option value="all" ${filterStatus === 'all' ? 'selected' : ''}>Todos os Status</option>
            <option value="pending" ${filterStatus === 'pending' ? 'selected' : ''}>Pendente</option>
            <option value="paid" ${filterStatus === 'paid' ? 'selected' : ''}>Pago</option>
            <option value="shipped" ${filterStatus === 'shipped' ? 'selected' : ''}>Enviado</option>
            <option value="canceled" ${filterStatus === 'canceled' ? 'selected' : ''}>Cancelado</option>
          </select>
        </div>

        <!-- Orders Table -->
        <div class="table-wrapper">
          ${paginated.length ? `
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Data</th>
                  <th>Valor total</th>
                  <th>Status</th>
                  <th>Itens</th>
                </tr>
              </thead>
              <tbody>
                ${paginated.map(order => `
                  <tr>
                    <td class="fw-bold">#${order._id.slice(-6).toUpperCase()}</td>
                    <td>
                      <div><strong>${order.user ? order.user.username : 'Removido'}</strong></div>
                      <small class="text-muted">${order.user ? order.user.email : ''}</small>
                    </td>
                    <td>${new Date(order.createdAt).toLocaleDateString('pt-BR')} ${new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                    <td class="fw-bold">R$ ${order.totalPrice.toFixed(2)}</td>
                    <td>
                      <select class="filter-select" style="padding: 4px 8px; font-size: 0.8rem;" onchange="updateOrderStatus('${order._id}', this.value)">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pendente</option>
                        <option value="paid" ${order.status === 'paid' ? 'selected' : ''}>Pago</option>
                        <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Enviado</option>
                        <option value="canceled" ${order.status === 'canceled' ? 'selected' : ''}>Cancelado</option>
                      </select>
                    </td>
                    <td>
                      <button class="admin-btn admin-btn-small" onclick="viewOrderItems('${order._id}')">
                        <i class="fas fa-box-open"></i> Ver (${order.items.length})
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<div class="empty-state"><i class="fas fa-box-open"></i><h3>Nenhum pedido encontrado</h3><p>Modifique seus filtros de busca.</p></div>'}
        </div>

        <!-- Pagination -->
        ${totalPages > 1 ? `
          <div class="pagination-container">
            <span class="pagination-info">Exibindo de ${startIdx + 1} a ${Math.min(startIdx + itemsPerPage, totalItems)} de ${totalItems} pedidos</span>
            <div class="pagination-buttons">
              <button class="admin-btn admin-btn-small" ${currentPage === 1 ? 'disabled' : ''} onclick="changeOrdersPage(${currentPage - 1})">Anterior</button>
              <button class="admin-btn admin-btn-small" ${currentPage === totalPages ? 'disabled' : ''} onclick="changeOrdersPage(${currentPage + 1})">Próximo</button>
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// Local filters and updates triggers
window.searchOrders = function(val) {
  searchQuery = val;
  currentPage = 1;
  renderOrders(document.getElementById('admin-content-pane'));
};

window.filterOrdersStatus = function(val) {
  filterStatus = val;
  currentPage = 1;
  renderOrders(document.getElementById('admin-content-pane'));
};

window.changeOrdersPage = function(page) {
  currentPage = page;
  renderOrders(document.getElementById('admin-content-pane'));
};

window.updateOrderStatus = async function(orderId, status) {
  try {
    const res = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      showToast('Status do pedido atualizado com sucesso!');
      // Update local state without full reload
      orders = orders.map(o => o._id === orderId ? { ...o, status } : o);
    } else {
      showToast('Erro ao atualizar status do pedido.', 'fa-exclamation-triangle');
    }
  } catch (err) {
    showToast('Erro ao conectar com o servidor.', 'fa-exclamation-triangle');
  }
};

window.viewOrderItems = function(orderId) {
  const order = orders.find(o => o._id === orderId);
  if (!order) return;

  const modal = document.getElementById('admin-modal-overlay');
  modal.innerHTML = `
    <div class="admin-modal">
      <div class="admin-modal-header">
        <h3>Detalhes do Pedido #${order._id.slice(-6).toUpperCase()}</h3>
        <button class="admin-modal-close" onclick="closeAdminModal()">&times;</button>
      </div>
      <div class="admin-modal-body">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Produto</th>
              <th class="text-center">Quantidade</th>
              <th>Unitário</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr>
                <td>
                  <strong>${item.name}</strong>
                  ${item.size ? `<span class="admin-badge admin-badge-info" style="font-size:0.6rem; padding: 2px 4px; margin-left: 6px;">Tam: ${item.size}</span>` : ''}
                  ${item.color ? `<span class="admin-badge admin-badge-success" style="font-size:0.6rem; padding: 2px 4px; margin-left: 6px;">Cor: ${item.color}</span>` : ''}
                </td>
                <td class="text-center">${item.quantity}</td>
                <td>R$ ${item.price.toFixed(2)}</td>
                <td class="fw-bold">R$ ${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="text-align: right; margin-top: 24px;">
          <p style="font-size: 1.1rem; font-weight: 800;">Total do Pedido: <span class="text-success">R$ ${order.totalPrice.toFixed(2)}</span></p>
        </div>
      </div>
    </div>
  `;
  modal.classList.add('show');
};

window.closeAdminModal = function() {
  document.getElementById('admin-modal-overlay').classList.remove('show');
};

// --------------------------------------------------------------------------
// VIEW: Customers List
// --------------------------------------------------------------------------
function renderCustomers(container) {
  let filtered = [...users];

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(u => 
      u.username.toLowerCase().includes(q) || 
      u.email.toLowerCase().includes(q)
    );
  }

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIdx, startIdx + itemsPerPage);

  container.innerHTML = `
    <div class="admin-section-card">
      <div class="card-header">
        <h3>Lista de Clientes Cadastrados (${totalItems})</h3>
      </div>
      <div class="card-content">
        <!-- Search bar -->
        <div class="filter-bar">
          <div class="search-input-wrapper">
            <i class="fas fa-search"></i>
            <input type="text" placeholder="Buscar por nome ou e-mail..." value="${searchQuery}" oninput="searchCustomers(this.value)" />
          </div>
        </div>

        <!-- Table -->
        <div class="table-wrapper">
          ${paginated.length ? `
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Avatar</th>
                  <th>Usuário</th>
                  <th>E-mail</th>
                  <th>Função</th>
                  <th>Cadastro</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                ${paginated.map(user => `
                  <tr>
                    <td>
                      <img src="${user.avatar || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=40&q=80'}" class="admin-user-avatar" style="width: 32px; height: 32px;" />
                    </td>
                    <td class="fw-bold">${user.username}</td>
                    <td>${user.email}</td>
                    <td>
                      <span class="admin-badge ${user.role === 'admin' ? 'admin-badge-success' : 'admin-badge-info'}">${user.role}</span>
                    </td>
                    <td>${new Date(user.createdAt).toLocaleDateString('pt-BR')}</td>
                    <td>
                      <button class="admin-btn admin-btn-small" onclick="viewCustomerDetails('${user._id}')">
                        <i class="fas fa-user-tag"></i> Detalhes
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<div class="empty-state"><i class="fas fa-users"></i><h3>Nenhum cliente cadastrado</h3></div>'}
        </div>

        <!-- Pagination -->
        ${totalPages > 1 ? `
          <div class="pagination-container">
            <span class="pagination-info">Exibindo de ${startIdx + 1} a ${Math.min(startIdx + itemsPerPage, totalItems)} de ${totalItems} clientes</span>
            <div class="pagination-buttons">
              <button class="admin-btn admin-btn-small" ${currentPage === 1 ? 'disabled' : ''} onclick="changeCustomersPage(${currentPage - 1})">Anterior</button>
              <button class="admin-btn admin-btn-small" ${currentPage === totalPages ? 'disabled' : ''} onclick="changeCustomersPage(${currentPage + 1})">Próximo</button>
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

window.searchCustomers = function(val) {
  searchQuery = val;
  currentPage = 1;
  renderCustomers(document.getElementById('admin-content-pane'));
};

window.changeCustomersPage = function(page) {
  currentPage = page;
  renderCustomers(document.getElementById('admin-content-pane'));
};

window.viewCustomerDetails = async function(userId) {
  const user = users.find(u => u._id === userId);
  if (!user) return;

  // Let's fetch orders specifically for this client to list in details modal
  let clientOrders = [];
  try {
    const res = await fetch(`/api/orders/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    clientOrders = await res.json();
  } catch (err) {
    clientOrders = [];
  }

  const modal = document.getElementById('admin-modal-overlay');
  modal.innerHTML = `
    <div class="admin-modal" style="max-width: 700px;">
      <div class="admin-modal-header">
        <h3>Ficha do Cliente — ${user.username}</h3>
        <button class="admin-modal-close" onclick="closeAdminModal()">&times;</button>
      </div>
      <div class="admin-modal-body">
        <div style="display: flex; gap: 20px; align-items: center; margin-bottom: 24px; border-bottom: 1px solid var(--admin-color-border); padding-bottom: 20px;">
          <img src="${user.avatar || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=120&q=80'}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover;" />
          <div>
            <h4 style="font-size: 1.2rem; margin: 0 0 4px 0; font-family: var(--admin-font-display);">${user.username.toUpperCase()}</h4>
            <p style="margin: 0 0 4px 0; color: var(--admin-color-text-muted);">${user.email}</p>
            <p style="margin: 0; font-size: 0.8rem; color: var(--admin-color-text-muted);">
              Último login: ${user.lastLogin ? new Date(user.lastLogin).toLocaleString('pt-BR') : 'Sem registros'}
            </p>
          </div>
        </div>

        <!-- Addresses block -->
        <h4 style="margin: 0 0 12px 0; font-family: var(--admin-font-display); text-transform: uppercase; font-size: 0.9rem;">Endereços Registrados</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px;">
          ${user.addresses && user.addresses.length ? user.addresses.map(addr => `
            <div style="border: 1px solid var(--admin-color-border); border-radius: var(--admin-radius-md); padding: 12px; font-size: 0.8rem; background-color: #fcfcfc;">
              <div style="font-weight: 700; margin-bottom: 4px; display: flex; justify-content: space-between;">
                <span>${addr.neighborhood}</span>
                ${addr.isDefault ? '<span class="admin-badge admin-badge-success" style="font-size:0.5rem; padding: 1px 4px;">Padrão</span>' : ''}
              </div>
              <p style="margin:0;">${addr.street}, nº ${addr.number} ${addr.complement ? `(${addr.complement})` : ''}</p>
              <p style="margin:0;">CEP: ${addr.cep} — ${addr.city}/${addr.state}</p>
            </div>
          `).join('') : '<p style="color: var(--admin-color-text-muted); font-size: 0.85rem; grid-column: span 2;">Nenhum endereço cadastrado.</p>'}
        </div>

        <!-- Orders History -->
        <h4 style="margin: 0 0 12px 0; font-family: var(--admin-font-display); text-transform: uppercase; font-size: 0.9rem;">Histórico de Compras (${clientOrders.length})</h4>
        <div class="table-wrapper" style="max-height: 200px; overflow-y: auto;">
          ${clientOrders.length ? `
            <table class="admin-table" style="font-size: 0.75rem;">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Data</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${clientOrders.map(o => `
                  <tr>
                    <td class="fw-bold">#${o._id.slice(-6).toUpperCase()}</td>
                    <td>${new Date(o.createdAt).toLocaleDateString('pt-BR')}</td>
                    <td class="fw-bold">R$ ${o.totalPrice.toFixed(2)}</td>
                    <td><span class="admin-badge ${o.status === 'paid' ? 'admin-badge-success' : 'admin-badge-warning'}">${o.status}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<p style="color: var(--admin-color-text-muted); font-size: 0.85rem;">Nenhum pedido realizado.</p>'}
        </div>
      </div>
    </div>
  `;
  modal.classList.add('show');
};

// --------------------------------------------------------------------------
// VIEW: Products Tab
// --------------------------------------------------------------------------
function renderProductsTab(container) {
  if (editingProduct) {
    renderProductForm(container);
    return;
  }

  let filtered = [...products];

  // Apply search query filter
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || (p.category && p.category.toLowerCase().includes(q)));
  }

  // Apply category dropdown filter
  if (filterCategory !== 'all') {
    filtered = filtered.filter(p => (p.category || 'Geral') === filterCategory);
  }

  const categoriesList = Array.from(new Set(products.map(p => p.category || 'Geral'))).sort();

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIdx, startIdx + itemsPerPage);

  container.innerHTML = `
    <div class="admin-section-card">
      <div class="card-header">
        <h3>Produtos Cadastrados (${totalItems})</h3>
        <button class="admin-btn admin-btn-accent" onclick="openProductForm('new')">
          <i class="fas fa-plus"></i> Novo Produto
        </button>
      </div>
      <div class="card-content">
        <!-- Search & Filter bar -->
        <div class="filter-bar">
          <div class="search-input-wrapper">
            <i class="fas fa-search"></i>
            <input type="text" placeholder="Buscar produtos por nome..." value="${searchQuery}" oninput="searchProducts(this.value)" />
          </div>
          <select class="filter-select" onchange="filterProductsByCategory(this.value)">
            <option value="all" ${filterCategory === 'all' ? 'selected' : ''}>Todas as Categorias</option>
            ${categoriesList.map(cat => `<option value="${cat}" ${filterCategory === cat ? 'selected' : ''}>${cat}</option>`).join('')}
          </select>
        </div>

        <!-- Products Table -->
        <div class="table-wrapper">
          ${paginated.length ? `
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Imagem</th>
                  <th>Nome do Produto</th>
                  <th>Categoria</th>
                  <th>Preço</th>
                  <th>Estoque</th>
                  <th>Vendas</th>
                  <th class="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                ${paginated.map(product => {
                  // Find sales from stats if loaded
                  const salesRecord = stats?.topProducts?.find(tp => tp.name === product.name);
                  const quantitySold = salesRecord ? salesRecord.sold : 0;

                  return `
                    <tr>
                      <td>
                        <img src="${product.images && product.images.length ? product.images[0] : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=40&q=80'}" style="width: 40px; height: 50px; object-fit: cover; border-radius: var(--admin-radius-sm);" />
                      </td>
                      <td>
                        <div class="fw-bold">${product.name}</div>
                        ${product.countInStock === 0 ? '<span class="admin-badge admin-badge-error" style="font-size:0.55rem; padding: 1px 4px;">Fora de estoque</span>' : ''}
                        ${product.countInStock > 0 && product.countInStock <= 5 ? '<span class="admin-badge admin-badge-warning" style="font-size:0.55rem; padding: 1px 4px;">Estoque Baixo</span>' : ''}
                      </td>
                      <td>${product.category || 'Geral'}</td>
                      <td class="fw-bold">R$ ${product.price.toFixed(2)}</td>
                      <td class="fw-bold">${product.countInStock}</td>
                      <td>${quantitySold} u.</td>
                      <td class="text-right">
                        <div style="display: flex; gap: 8px; justify-content: flex-end;">
                          <button class="admin-btn admin-btn-small" onclick="openProductForm('${product._id}')">Editar</button>
                          <button class="admin-btn admin-btn-small admin-btn-danger" onclick="deleteProduct('${product._id}')">Excluir</button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          ` : '<div class="empty-state"><i class="fas fa-tags"></i><h3>Nenhum produto cadastrado</h3></div>'}
        </div>

        <!-- Pagination -->
        ${totalPages > 1 ? `
          <div class="pagination-container">
            <span class="pagination-info">Exibindo de ${startIdx + 1} a ${Math.min(startIdx + itemsPerPage, totalItems)} de ${totalItems} produtos</span>
            <div class="pagination-buttons">
              <button class="admin-btn admin-btn-small" ${currentPage === 1 ? 'disabled' : ''} onclick="changeProductsPage(${currentPage - 1})">Anterior</button>
              <button class="admin-btn admin-btn-small" ${currentPage === totalPages ? 'disabled' : ''} onclick="changeProductsPage(${currentPage + 1})">Próximo</button>
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

window.searchProducts = function(val) {
  searchQuery = val;
  currentPage = 1;
  renderProductsTab(document.getElementById('admin-content-pane'));
};

window.filterProductsByCategory = function(val) {
  filterCategory = val;
  currentPage = 1;
  renderProductsTab(document.getElementById('admin-content-pane'));
};

window.changeProductsPage = function(page) {
  currentPage = page;
  renderProductsTab(document.getElementById('admin-content-pane'));
};

window.openProductForm = function(productId) {
  if (productId === 'new') {
    editingProduct = {
      name: '',
      description: '',
      category: 'Tops e Camisetas',
      price: 0.0,
      countInStock: 0,
      images: [],
    };
  } else {
    editingProduct = products.find(p => p._id === productId);
  }
  renderActiveTab();
};

window.closeProductForm = function() {
  editingProduct = null;
  renderActiveTab();
};

// Render Product Creation / Modification Form
function renderProductForm(container) {
  const isEdit = !!editingProduct._id;
  const categoriesList = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  container.innerHTML = `
    <div class="admin-section-card">
      <div class="card-header">
        <h3>${isEdit ? `Editar Produto: ${editingProduct.name}` : 'Criar Novo Produto'}</h3>
        <button class="admin-btn admin-btn-small" onclick="closeProductForm()">Voltar à lista</button>
      </div>
      <div class="card-content">
        <form id="product-edit-form" style="max-width: 600px;">
          <input type="hidden" id="prod-id" value="${editingProduct._id || ''}" />
          
          <div class="admin-form-group">
            <label for="prod-name">Nome do Produto</label>
            <input type="text" id="prod-name" class="admin-form-control" value="${editingProduct.name}" required />
          </div>

          <div class="admin-form-group">
            <label for="prod-desc">Descrição Detalhada</label>
            <textarea id="prod-desc" class="admin-form-control" rows="4" required>${editingProduct.description || ''}</textarea>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="admin-form-group">
              <label for="prod-price">Preço (R$)</label>
              <input type="number" id="prod-price" class="admin-form-control" value="${editingProduct.price}" step="0.01" min="0.01" required />
            </div>
            <div class="admin-form-group">
              <label for="prod-stock">Estoque Inicial</label>
              <input type="number" id="prod-stock" class="admin-form-control" value="${editingProduct.countInStock}" min="0" required />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="admin-form-group">
              <label for="prod-category">Categoria Principal</label>
              <select id="prod-category" class="admin-form-control">
                ${categoriesList.map(cat => `<option value="${cat}" ${editingProduct.category === cat ? 'selected' : ''}>${cat}</option>`).join('')}
                <option value="Geral" ${!editingProduct.category || editingProduct.category === 'Geral' ? 'selected' : ''}>Geral</option>
              </select>
            </div>
            <div class="admin-form-group">
              <label for="prod-new-category">Ou Criar Categoria</label>
              <input type="text" id="prod-new-category" class="admin-form-control" placeholder="Deixe em branco para usar a selecionada" />
            </div>
          </div>

          <div class="admin-form-group">
            <label for="prod-image-url">Imagem Principal (URL)</label>
            <input type="text" id="prod-image-url" class="admin-form-control" value="${editingProduct.images?.[0] || ''}" placeholder="https://..." />
          </div>

          <div class="admin-form-group">
            <label for="prod-image-file">Ou Enviar Imagem do Computador</label>
            <input type="file" id="prod-image-file" accept="image/*" class="admin-form-control" style="padding: 6px;" />
          </div>

          <div class="admin-form-group">
            <label for="prod-images-extra">Imagens Extras (URLs separadas por vírgula)</label>
            <textarea id="prod-images-extra" class="admin-form-control" rows="2" placeholder="https://..., https://...">${editingProduct.images && editingProduct.images.length > 1 ? editingProduct.images.slice(1).join(', ') : ''}</textarea>
          </div>

          <div id="image-form-preview" style="display: flex; gap: 8px; margin: 16px 0; overflow-x: auto; padding-bottom: 8px;"></div>

          <div style="display: flex; gap: 12px; margin-top: 24px;">
            <button type="submit" class="admin-btn admin-btn-accent" style="flex: 1; justify-content: center;">Salvar Produto</button>
            <button type="button" class="admin-btn" style="flex: 1; justify-content: center;" onclick="closeProductForm()">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  `;

  const fileInput = document.getElementById('prod-image-file');
  const urlInput = document.getElementById('prod-image-url');
  const extraInput = document.getElementById('prod-images-extra');
  const previewDiv = document.getElementById('image-form-preview');

  const updatePreview = () => {
    const urls = [urlInput.value.trim(), ...extraInput.value.split(',').map(s => s.trim())].filter(Boolean);
    previewDiv.innerHTML = urls.length 
      ? urls.map(u => `<img src="${u}" style="width: 60px; height: 75px; object-fit: cover; border-radius: var(--admin-radius-sm); border: 1px solid var(--admin-color-border);" />`).join('')
      : '<p class="hint" style="font-size:0.75rem; color:var(--admin-color-text-muted);">As fotos do produto aparecerão aqui.</p>';
  };

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        urlInput.value = reader.result;
        updatePreview();
      };
      reader.readAsDataURL(file);
    }
  });

  urlInput.addEventListener('input', updatePreview);
  extraInput.addEventListener('input', updatePreview);
  updatePreview();

  // Handle Form Submission
  document.getElementById('product-edit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('prod-id').value;
    const name = document.getElementById('prod-name').value.trim();
    const description = document.getElementById('prod-desc').value.trim();
    const price = parseFloat(document.getElementById('prod-price').value);
    const countInStock = parseInt(document.getElementById('prod-stock').value, 10);
    
    const newCategory = document.getElementById('prod-new-category').value.trim();
    const category = newCategory || document.getElementById('prod-category').value;

    const mainImg = urlInput.value.trim();
    const extraImgs = extraInput.value.split(',').map(s => s.trim()).filter(Boolean);
    const images = [mainImg, ...extraImgs].filter(Boolean);

    const payload = { name, description, price, countInStock, category, images };
    const url = id ? `/api/products/${id}` : '/api/products';
    const method = id ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(`Produto ${id ? 'atualizado' : 'criado'} com sucesso!`);
        editingProduct = null;
        renderActiveTab();
      } else {
        const error = await res.json();
        showToast(error.message || 'Erro ao salvar produto.', 'fa-exclamation-triangle');
      }
    } catch (err) {
      showToast('Falha ao enviar dados para o servidor.', 'fa-exclamation-triangle');
    }
  });
}

window.deleteProduct = async function(productId) {
  if (!confirm('Deseja realmente excluir este produto?')) return;

  try {
    const res = await fetch(`/api/products/${productId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.ok) {
      showToast('Produto excluído com sucesso!');
      products = products.filter(p => p._id !== productId);
      renderActiveTab();
    } else {
      showToast('Não foi possível excluir o produto.', 'fa-exclamation-triangle');
    }
  } catch (err) {
    showToast('Falha na comunicação com o servidor.', 'fa-exclamation-triangle');
  }
};

// --------------------------------------------------------------------------
// VIEW: Carts Overview
// --------------------------------------------------------------------------
function renderCartsTab(container) {
  let filtered = [...carts];

  if (filterStatus !== 'all') {
    filtered = filtered.filter(c => c.status === filterStatus);
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(c => c.username.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
  }

  container.innerHTML = `
    <div class="admin-section-card">
      <div class="card-header">
        <h3>Carrinhos Ativos e Abandonados (${filtered.length})</h3>
      </div>
      <div class="card-content">
        <!-- Filters -->
        <div class="filter-bar">
          <div class="search-input-wrapper">
            <i class="fas fa-search"></i>
            <input type="text" placeholder="Buscar por cliente..." value="${searchQuery}" oninput="searchCarts(this.value)" />
          </div>
          <select class="filter-select" onchange="filterCartsStatus(this.value)">
            <option value="all" ${filterStatus === 'all' ? 'selected' : ''}>Todos os Carrinhos</option>
            <option value="active" ${filterStatus === 'active' ? 'selected' : ''}>Ativos (Acesso < 24h)</option>
            <option value="abandoned" ${filterStatus === 'abandoned' ? 'selected' : ''}>Abandonados (Sem acesso > 24h)</option>
          </select>
        </div>

        <!-- Carts Table -->
        <div class="table-wrapper">
          ${filtered.length ? `
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Itens Únicos</th>
                  <th>Valor Total</th>
                  <th>Última Atividade</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.map(cart => `
                  <tr>
                    <td>
                      <div><strong>${cart.username}</strong></div>
                      <small class="text-muted">${cart.email}</small>
                    </td>
                    <td>${cart.itemCount} itens</td>
                    <td class="fw-bold text-success">R$ ${cart.totalValue.toFixed(2)}</td>
                    <td>${new Date(cart.lastActivity).toLocaleString('pt-BR')}</td>
                    <td>
                      <span class="admin-badge ${cart.status === 'active' ? 'admin-badge-success' : 'admin-badge-warning'}">
                        ${cart.status === 'active' ? 'Ativo' : 'Abandonado'}
                      </span>
                    </td>
                    <td>
                      <button class="admin-btn admin-btn-small" onclick="viewCartItems('${cart.userId}')">
                        <i class="fas fa-shopping-basket"></i> Detalhes
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<div class="empty-state"><i class="fas fa-shopping-cart"></i><h3>Nenhum carrinho ativo no momento</h3></div>'}
        </div>
      </div>
    </div>
  `;
}

window.searchCarts = function(val) {
  searchQuery = val;
  renderCartsTab(document.getElementById('admin-content-pane'));
};

window.filterCartsStatus = function(val) {
  filterStatus = val;
  renderCartsTab(document.getElementById('admin-content-pane'));
};

window.viewCartItems = function(userId) {
  const cart = carts.find(c => c.userId === userId);
  if (!cart) return;

  const modal = document.getElementById('admin-modal-overlay');
  modal.innerHTML = `
    <div class="admin-modal">
      <div class="admin-modal-header">
        <h3>Carrinho de ${cart.username}</h3>
        <button class="admin-modal-close" onclick="closeAdminModal()">&times;</button>
      </div>
      <div class="admin-modal-body">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Produto</th>
              <th class="text-center">Quantidade</th>
              <th>Preço</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${cart.items.map(item => `
              <tr>
                <td>
                  <div style="display:flex; gap:10px; align-items:center;">
                    ${item.productImage ? `<img src="${item.productImage}" style="width:30px; height:38px; object-fit:cover; border-radius: var(--admin-radius-sm);" />` : ''}
                    <div>
                      <strong>${item.productName}</strong>
                      ${item.size ? `<span class="admin-badge admin-badge-info" style="font-size:0.55rem; padding:1px 3px; margin-left:4px;">Tam: ${item.size}</span>` : ''}
                    </div>
                  </div>
                </td>
                <td class="text-center">${item.quantity}</td>
                <td>R$ ${item.price.toFixed(2)}</td>
                <td class="fw-bold">R$ ${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="text-align: right; margin-top: 24px;">
          <p style="font-size: 1.1rem; font-weight: 800;">Valor Total: <span class="text-success">R$ ${cart.totalValue.toFixed(2)}</span></p>
        </div>
      </div>
    </div>
  `;
  modal.classList.add('show');
};

// --------------------------------------------------------------------------
// VIEW: Notifications / Alertas
// --------------------------------------------------------------------------
function renderNotificationsTab(container) {
  const unreadCount = notifications.filter(n => !n.read).length;

  container.innerHTML = `
    <div class="admin-section-card">
      <div class="card-header">
        <h3>Alertas Recentes (${unreadCount} não lidas)</h3>
        ${unreadCount > 0 ? `
          <button class="admin-btn admin-btn-small" onclick="readAllNotifications()">
            Marcar todas como lidas
          </button>
        ` : ''}
      </div>
      <div class="card-content" style="padding:0;">
        ${notifications.length ? `
          <div class="notifications-list">
            ${notifications.map(n => `
              <div class="notification-item ${n.read ? '' : 'unread'}" id="notif-${n._id}">
                <div class="notification-icon-wrapper ${n.type}">
                  <i class="fas ${
                    n.type === 'new_order' ? 'fa-shopping-bag' :
                    n.type === 'new_customer' ? 'fa-user-plus' :
                    n.type === 'out_of_stock' ? 'fa-exclamation-triangle' :
                    n.type === 'low_stock' ? 'fa-exclamation-circle' :
                    n.type === 'order_canceled' ? 'fa-times-circle' :
                    n.type === 'order_shipped' ? 'fa-truck' :
                    'fa-bell'
                  }"></i>
                </div>
                <div class="notification-content">
                  <h4>${n.title}</h4>
                  <p>${n.message}</p>
                  <span class="notification-time">${new Date(n.createdAt).toLocaleString('pt-BR')}</span>
                </div>
                ${!n.read ? `
                  <button class="admin-btn admin-btn-small" onclick="readNotification('${n._id}')" style="align-self: center;">
                    Marcar lida
                  </button>
                ` : ''}
              </div>
            `).join('')}
          </div>
        ` : '<div class="empty-state" style="padding: 80px 24px;"><i class="fas fa-bell-slash"></i><h3>Sem notificações</h3><p>Tudo calmo na sua loja por enquanto.</p></div>'}
      </div>
    </div>
  `;
}

window.readNotification = async function(id) {
  try {
    const res = await fetch(`/api/admin/notifications/${id}/read`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      notifications = notifications.map(n => n._id === id ? { ...n, read: true } : n);
      renderActiveTab();
    }
  } catch (err) {
    showToast('Erro ao atualizar notificação.', 'fa-exclamation-triangle');
  }
};

window.readAllNotifications = async function() {
  try {
    const res = await fetch('/api/admin/notifications/read-all', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      notifications = notifications.map(n => ({ ...n, read: true }));
      renderActiveTab();
    }
  } catch (err) {
    showToast('Erro ao atualizar notificações.', 'fa-exclamation-triangle');
  }
};

// --------------------------------------------------------------------------
// VIEW: Relatórios com Chart.js
// --------------------------------------------------------------------------
function renderReportsTab(container) {
  if (!reportsData) return;

  container.innerHTML = `
    <div class="grid-2col">
      <!-- Sales Timeline Line chart -->
      <div class="admin-section-card" style="grid-column: span 2;">
        <div class="card-header">
          <h3>Evolução de Vendas Diárias (Últimos 30 dias)</h3>
        </div>
        <div class="card-content">
          <div class="chart-container">
            <canvas id="salesLineChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Monthly Sales Bar Chart -->
      <div class="admin-section-card">
        <div class="card-header">
          <h3>Faturamento por Mês (Últimos 12 meses)</h3>
        </div>
        <div class="card-content">
          <div class="chart-container">
            <canvas id="monthlyBarChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Categories Share Doughnut -->
      <div class="admin-section-card">
        <div class="card-header">
          <h3>Participação por Categoria (Receita)</h3>
        </div>
        <div class="card-content">
          <div class="chart-container">
            <canvas id="categoryDoughnutChart"></canvas>
          </div>
        </div>
      </div>
    </div>
  `;

  // Destroy previous Chart instances if they exist to prevent memory leaks
  if (salesChartInstance) salesChartInstance.destroy();
  if (categoryChartInstance) categoryChartInstance.destroy();

  // 1. Sales Daily Line Chart
  const lineCtx = document.getElementById('salesLineChart').getContext('2d');
  const lineLabels = reportsData.salesByDay.map(d => {
    // Format YYYY-MM-DD to DD/MM
    const parts = d.date.split('-');
    return `${parts[2]}/${parts[1]}`;
  });
  const lineData = reportsData.salesByDay.map(d => d.revenue);

  salesChartInstance = new Chart(lineCtx, {
    type: 'line',
    data: {
      labels: lineLabels,
      datasets: [{
        label: 'Receita Diária (R$)',
        data: lineData,
        borderColor: '#1a1a1a',
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => 'R$ ' + value.toFixed(0)
          }
        }
      }
    }
  });

  // 2. Monthly Bar Chart
  const barCtx = document.getElementById('monthlyBarChart').getContext('2d');
  const barLabels = reportsData.salesByMonth.map(m => {
    const parts = m.month.split('-');
    return `${parts[1]}/${parts[0]}`;
  });
  const barData = reportsData.salesByMonth.map(m => m.revenue);

  new Chart(barCtx, {
    type: 'bar',
    data: {
      labels: barLabels,
      datasets: [{
        label: 'Receita Mensal (R$)',
        data: barData,
        backgroundColor: '#000000',
        borderColor: '#000000',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => 'R$ ' + value.toFixed(0)
          }
        }
      }
    }
  });

  // 3. Category Doughnut Chart
  const doughnutCtx = document.getElementById('categoryDoughnutChart').getContext('2d');
  const doughnutLabels = reportsData.categoryData.map(c => c.name);
  const doughnutData = reportsData.categoryData.map(c => c.revenue);

  // Generate some high contrast colors
  const backgroundColors = [
    '#000000',
    '#343A40',
    '#6d7175',
    '#15803d',
    '#004c8f',
    '#d32f2f',
    '#b25e00'
  ];

  categoryChartInstance = new Chart(doughnutCtx, {
    type: 'doughnut',
    data: {
      labels: doughnutLabels,
      datasets: [{
        data: doughnutData,
        backgroundColor: backgroundColors.slice(0, doughnutLabels.length),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right'
        }
      }
    }
  });
}

// Initial application bootstrap
renderShell();
