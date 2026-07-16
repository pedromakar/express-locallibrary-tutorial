import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import adminService from '../../services/adminService';
import productService from '../../services/productService';
import api from '../../services/api';
import '../../styles/admin.css';

// ChartJS imports
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

const Admin = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Tab state
  const [currentTab, setCurrentTab] = useState('dashboard');
  
  // Dashboard & Lists Data
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [carts, setCarts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [reportsData, setReportsData] = useState(null);

  // Loaders
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Pagination & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Editing Product states
  const [editingProduct, setEditingProduct] = useState(null); // null, 'new', or product object
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState(0);
  const [prodCategory, setProdCategory] = useState('');
  const [prodStock, setProdStock] = useState(0);
  const [prodDesc, setProdDesc] = useState('');
  const [prodImage, setProdImage] = useState('');
  const [prodColors, setProdColors] = useState('');
  const [prodSizes, setProdSizes] = useState('');
  const [prodBenefits, setProdBenefits] = useState('');

  // Editing Client/Customer states
  const [editingUser, setEditingUser] = useState(null); // null or user object
  const [userEditName, setUserEditName] = useState('');
  const [userEditEmail, setUserEditEmail] = useState('');
  const [userEditAvatar, setUserEditAvatar] = useState('');
  const [userEditOrders, setUserEditOrders] = useState([]);
  const [loadingUserOrders, setLoadingUserOrders] = useState(false);

  // Toast alert
  const [toastMessage, setToastMessage] = useState('');
  const [toastIcon, setToastIcon] = useState('fa-check-circle');

  const triggerToast = (msg, icon = 'fa-check-circle') => {
    setToastMessage(msg);
    setToastIcon(icon);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Fetch initial stats and list data
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        const [statsData, prodList, orderList, userList, cartList, notifList, reportsList] = await Promise.all([
          adminService.getStats(),
          productService.getAll(),
          adminService.getOrders(),
          api.get('/users').then(res => res.data),
          adminService.getCarts(),
          adminService.getNotifications(),
          adminService.getReports()
        ]);

        setStats(statsData);
        setProducts(prodList);
        setOrders(orderList);
        setUsers(userList);
        setCarts(cartList);
        setNotifications(notifList);
        setReportsData(reportsList);
      } catch (err) {
        console.error('Error fetching admin data:', err);
        triggerToast('Erro ao carregar dados administrativos.', 'fa-times-circle');
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  const refreshStats = async () => {
    try {
      const statsData = await adminService.getStats();
      setStats(statsData);
    } catch (e) {
      console.error(e);
    }
  };

  const refreshProducts = async () => {
    try {
      const prodList = await productService.getAll();
      setProducts(prodList);
    } catch (e) {
      console.error(e);
    }
  };

  const refreshOrders = async () => {
    try {
      const orderList = await adminService.getOrders();
      setOrders(orderList);
    } catch (e) {
      console.error(e);
    }
  };

  const refreshUsers = async () => {
    try {
      const userList = await api.get('/users').then(res => res.data);
      setUsers(userList);
    } catch (e) {
      console.error(e);
    }
  };

  const refreshNotifications = async () => {
    try {
      const notifList = await adminService.getNotifications();
      setNotifications(notifList);
    } catch (e) {
      console.error(e);
    }
  };

  // Orders Actions
  const handleUpdateStatus = async (orderId, newStatus) => {
    setActionLoading(true);
    try {
      await adminService.updateOrderStatus(orderId, newStatus);
      triggerToast('Status do pedido atualizado!');
      refreshOrders();
      refreshStats();
    } catch (err) {
      console.error(err);
      triggerToast('Erro ao atualizar status.', 'fa-times-circle');
    } finally {
      setActionLoading(false);
    }
  };

  // Customers Actions
  const handleUpdateRole = async (userId, newRole) => {
    setActionLoading(true);
    try {
      await api.put(`/users/${userId}/role`, { role: newRole });
      triggerToast('Cargo do usuário alterado!');
      refreshUsers();
    } catch (err) {
      console.error(err);
      triggerToast('Erro ao alterar cargo.', 'fa-times-circle');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Tem certeza que deseja remover este cliente?')) return;
    setActionLoading(true);
    try {
      await api.delete(`/users/${userId}`);
      triggerToast('Cliente removido com sucesso.');
      refreshUsers();
    } catch (err) {
      console.error(err);
      triggerToast('Erro ao remover cliente.', 'fa-times-circle');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEditUser = async (u) => {
    setEditingUser(u);
    setUserEditName(u.username || '');
    setUserEditEmail(u.email || '');
    setUserEditAvatar(u.avatar || '');
    setUserEditOrders([]);
    setLoadingUserOrders(true);
    try {
      const list = await orderService.getByUser(u._id || u.id);
      setUserEditOrders(list || []);
    } catch (err) {
      console.error('Error fetching user orders:', err);
    } finally {
      setLoadingUserOrders(false);
    }
  };

  const handleUserEditSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.put(`/users/${editingUser._id}`, {
        username: userEditName,
        email: userEditEmail,
        avatar: userEditAvatar
      });
      triggerToast('Informações do cliente atualizadas!');
      setEditingUser(null);
      refreshUsers();
    } catch (err) {
      console.error(err);
      triggerToast(err.response?.data?.message || 'Erro ao atualizar dados do cliente.', 'fa-times-circle');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditUserAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setUserEditAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Notifications Actions
  const handleReadNotification = async (id) => {
    try {
      await adminService.readNotification(id);
      refreshNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const handleReadAllNotifications = async () => {
    try {
      await adminService.readAllNotifications();
      triggerToast('Todas as notificações lidas.');
      refreshNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  // Product CRUD
  const handleOpenNewProduct = () => {
    setEditingProduct('new');
    setProdName('');
    setProdPrice(0);
    setProdCategory('');
    setProdStock(0);
    setProdDesc('');
    setProdImage('');
    setProdColors('');
    setProdSizes('');
    setProdBenefits('');
  };

  const handleOpenEditProduct = (p) => {
    setEditingProduct(p);
    setProdName(p.name || '');
    setProdPrice(p.price || 0);
    setProdCategory(p.category || '');
    setProdStock(p.countInStock || 0);
    setProdDesc(p.description || '');
    setProdImage(p.image || '');
    setProdColors(p.colors ? p.colors.map(c => `${c.name}:${c.hex}`).join(', ') : '');
    setProdSizes(p.sizes ? p.sizes.join(', ') : '');
    setProdBenefits(p.benefits ? p.benefits.join(', ') : '');
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);

    const colorsArr = prodColors
      ? prodColors.split(',').map((c) => {
          const parts = c.trim().split(':');
          return { name: parts[0]?.trim() || '', hex: parts[1]?.trim() || '#000000' };
        })
      : [];

    const sizesArr = prodSizes ? prodSizes.split(',').map((s) => s.trim()) : [];
    const benefitsArr = prodBenefits ? prodBenefits.split(',').map((b) => b.trim()) : [];

    const payload = {
      name: prodName,
      price: Number(prodPrice),
      category: prodCategory,
      countInStock: Number(prodStock),
      description: prodDesc,
      image: prodImage,
      images: [prodImage],
      colors: colorsArr,
      sizes: sizesArr,
      benefits: benefitsArr
    };

    try {
      if (editingProduct === 'new') {
        await productService.create(payload);
        triggerToast('Produto cadastrado com sucesso!');
      } else {
        await productService.update(editingProduct._id, payload);
        triggerToast('Produto atualizado com sucesso!');
      }
      setEditingProduct(null);
      refreshProducts();
      refreshStats();
    } catch (err) {
      console.error(err);
      triggerToast('Erro ao gravar produto.', 'fa-times-circle');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProduct = async (prodId) => {
    if (!window.confirm('Tem certeza que deseja excluir este produto?')) return;
    setActionLoading(true);
    try {
      await productService.delete(prodId);
      triggerToast('Produto excluído com sucesso.');
      refreshProducts();
      refreshStats();
    } catch (err) {
      console.error(err);
      triggerToast('Erro ao excluir produto.', 'fa-times-circle');
    } finally {
      setActionLoading(false);
    }
  };

  // Render Helpers
  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc' }}>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.2rem', fontWeight: 600 }}>Carregando Painel Administrativo...</p>
      </div>
    );
  }

  // Dashboard Chart Configuration
  const monthlyBilling = reportsData?.billingOverTime || [
    { month: 'Janeiro', total: 1200 },
    { month: 'Fevereiro', total: 1900 },
    { month: 'Março', total: 3200 },
    { month: 'Abril', total: 5000 },
    { month: 'Maio', total: 4200 },
    { month: 'Junho', total: 6800 }
  ];

  const salesChartData = {
    labels: monthlyBilling.map((item) => item.month),
    datasets: [
      {
        label: 'Faturamento Mensal (R$)',
        data: monthlyBilling.map((item) => item.total),
        borderColor: '#212529',
        backgroundColor: 'rgba(33, 37, 41, 0.1)',
        fill: true,
        tension: 0.3
      }
    ]
  };

  const catBilling = reportsData?.categorySales || [
    { category: 'Regatas', count: 12 },
    { category: 'Shorts', count: 8 },
    { category: 'Leggings', count: 15 },
    { category: 'Moletons', count: 5 }
  ];

  const categoryChartData = {
    labels: catBilling.map((item) => item.category),
    datasets: [
      {
        data: catBilling.map((item) => item.count),
        backgroundColor: ['#212529', '#6c757d', '#adb5bd', '#dee2e6', '#f8f9fa'],
        borderWidth: 1
      }
    ]
  };

  // Filters calculation
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredOrders = orders.filter((o) => {
    const matchesSearch = o._id.slice(-6).toUpperCase().includes(searchQuery.toUpperCase()) || o.user?.username?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || o.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="admin-layout-container" style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: 'var(--font-body)' }}>
      {toastMessage && (
        <div className="admin-toast show" id="admin-toast">
          <i className={`fas ${toastIcon}`}></i> <span>{toastMessage}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="admin-sidebar" style={{ width: '260px', background: '#212529', display: 'flex', flexDirection: 'column', color: '#fff', padding: '24px 0' }}>
        <div className="admin-logo" style={{ fontSize: '1.25rem', fontWeight: 800, textAlign: 'center', paddingBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', letterSpacing: '1px' }}>
          <i className="fas fa-bolt"></i> MD ESSENTIAL
        </div>
        <nav className="admin-nav" style={{ flexGrow: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button className={`admin-nav-item ${currentTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setCurrentTab('dashboard'); setEditingProduct(null); }}>
            <i className="fas fa-chart-pie"></i> <span>Dashboard</span>
          </button>
          <button className={`admin-nav-item ${currentTab === 'orders' ? 'active' : ''}`} onClick={() => { setCurrentTab('orders'); setEditingProduct(null); }}>
            <i className="fas fa-shopping-bag"></i> <span>Pedidos</span>
          </button>
          <button className={`admin-nav-item ${currentTab === 'customers' ? 'active' : ''}`} onClick={() => { setCurrentTab('customers'); setEditingProduct(null); }}>
            <i className="fas fa-users"></i> <span>Clientes</span>
          </button>
          <button className={`admin-nav-item ${currentTab === 'products' ? 'active' : ''}`} onClick={() => { setCurrentTab('products'); setEditingProduct(null); }}>
            <i className="fas fa-tags"></i> <span>Produtos</span>
          </button>
          <button className={`admin-nav-item ${currentTab === 'carts' ? 'active' : ''}`} onClick={() => { setCurrentTab('carts'); setEditingProduct(null); }}>
            <i className="fas fa-shopping-cart"></i> <span>Carrinhos</span>
          </button>
          <button className={`admin-nav-item ${currentTab === 'notifications' ? 'active' : ''}`} onClick={() => { setCurrentTab('notifications'); setEditingProduct(null); }}>
            <i className="fas fa-bell"></i> <span>Notificações</span>
            {unreadNotificationsCount > 0 && <span className="badge" style={{ backgroundColor: 'var(--color-error)', color: '#fff', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '10px', marginLeft: '6px' }}>{unreadNotificationsCount}</span>}
          </button>
          <button className={`admin-nav-item ${currentTab === 'reports' ? 'active' : ''}`} onClick={() => { setCurrentTab('reports'); setEditingProduct(null); }}>
            <i className="fas fa-chart-line"></i> <span>Relatórios</span>
          </button>
        </nav>
        <div className="admin-sidebar-footer" style={{ padding: '0 16px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
          <Link to="/" className="admin-nav-item" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', fontSize: '0.85rem' }}>
            <i className="fas fa-store"></i> <span>Ver Loja</span>
          </Link>
          <button onClick={handleLogout} className="admin-nav-item text-danger" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', width: '100%', color: 'var(--color-error)' }}>
            <i className="fas fa-sign-out-alt"></i> <span>Desconectar</span>
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main className="admin-main" style={{ flexGrow: 1, padding: '40px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
        
        {/* TAB: DASHBOARD */}
        {currentTab === 'dashboard' && stats && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <div>
                <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>DASHBOARD</h1>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>Resultados gerais de logística, faturamento e tráfego da MD Essential.</p>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="admin-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '30px' }}>
              <div className="metric-card" style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Faturamento Bruto</span>
                <strong style={{ fontSize: '1.6rem', fontWeight: 800 }}>R$ {stats.totalRevenue?.toFixed(2)}</strong>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-success)' }}><i className="fas fa-arrow-up"></i> Crescimento estável</span>
              </div>
              <div className="metric-card" style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Pedidos Criados</span>
                <strong style={{ fontSize: '1.6rem', fontWeight: 800 }}>{stats.totalOrders}</strong>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Média R$ {(stats.totalRevenue / (stats.totalOrders || 1)).toFixed(2)}/ticket</span>
              </div>
              <div className="metric-card" style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Clientes Registrados</span>
                <strong style={{ fontSize: '1.6rem', fontWeight: 800 }}>{stats.totalUsers}</strong>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-success)' }}><i className="fas fa-user-plus"></i> Novas inscrições</span>
              </div>
              <div className="metric-card" style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Carrinhos Abandonados</span>
                <strong style={{ fontSize: '1.6rem', fontWeight: 800 }}>{stats.abandonedCartsCount}</strong>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-error)' }}><i className="fas fa-shopping-cart"></i> Potenciais vendas pendentes</span>
              </div>
            </div>

            {/* Charts Panel */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
              <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '24px' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '1rem', textTransform: 'uppercase', fontWeight: 800 }}>Faturamento Recente</h3>
                <div style={{ height: '300px' }}>
                  <Line data={salesChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>
              <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '24px' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '1rem', textTransform: 'uppercase', fontWeight: 800 }}>Vendas por Categoria</h3>
                <div style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
                  <Doughnut data={categoryChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: ORDERS */}
        {currentTab === 'orders' && (
          <div>
            <div style={{ marginBottom: '30px' }}>
              <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>GERENCIAMENTO DE PEDIDOS</h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>Visualize compras dos clientes e faça alterações no fluxo de despacho logístico.</p>
            </div>

            {/* Filter controls */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              <input
                type="text"
                placeholder="Pesquisar por ID ou Cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '10px 16px', border: '1px solid var(--color-border)', borderRadius: '6px', flexGrow: 1 }}
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ padding: '10px 16px', border: '1px solid var(--color-border)', borderRadius: '6px', width: '180px' }}
              >
                <option value="all">Status: Todos</option>
                <option value="pending">Pendente</option>
                <option value="paid">Pago</option>
                <option value="shipped">Enviado</option>
                <option value="canceled">Cancelado</option>
              </select>
            </div>

            <div className="table-responsive" style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#212529', color: '#fff', textAlign: 'left' }}>
                    <th style={{ padding: '16px' }}>PEDIDO ID</th>
                    <th style={{ padding: '16px' }}>CLIENTE</th>
                    <th style={{ padding: '16px' }}>DATA</th>
                    <th style={{ padding: '16px' }}>ITENS</th>
                    <th style={{ padding: '16px' }}>TOTAL</th>
                    <th style={{ padding: '16px' }}>STATUS</th>
                    <th style={{ padding: '16px' }}>AÇÕES</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                      <tr key={order._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '16px', fontWeight: 700 }}>#{order._id.slice(-6).toUpperCase()}</td>
                        <td style={{ padding: '16px' }}>{order.user?.username || 'Usuário Deletado'}</td>
                        <td style={{ padding: '16px' }}>{new Date(order.createdAt).toLocaleDateString('pt-BR')}</td>
                        <td style={{ padding: '16px' }}>{order.items?.length || 0} produto(s)</td>
                        <td style={{ padding: '16px', fontWeight: 700 }}>R$ {order.totalPrice?.toFixed(2)}</td>
                        <td style={{ padding: '16px' }}>
                          <span
                            className={`badge ${
                              order.status === 'paid' ? 'badge-success' :
                              order.status === 'shipped' ? 'badge-info' :
                              order.status === 'canceled' ? 'badge-error' :
                              'badge-warning'
                            }`}
                            style={{ padding: '4px 8px', fontSize: '0.65rem', textTransform: 'uppercase', borderRadius: '12px' }}
                          >
                            {order.status === 'pending' ? 'Pendente' :
                             order.status === 'paid' ? 'Pago' :
                             order.status === 'shipped' ? 'Enviado' :
                             order.status === 'canceled' ? 'Cancelado' : order.status}
                          </span>
                        </td>
                        <td style={{ padding: '16px', display: 'flex', gap: '8px' }}>
                          <select
                            value={order.status}
                            onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                            disabled={actionLoading}
                            style={{ padding: '6px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                          >
                            <option value="pending">Pendente</option>
                            <option value="paid">Pago</option>
                            <option value="shipped">Enviado</option>
                            <option value="canceled">Cancelado</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-muted)' }}>Nenhum pedido encontrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: CUSTOMERS */}
        {currentTab === 'customers' && (
          <div>
            {editingUser === null ? (
              <div>
                <div style={{ marginBottom: '30px' }}>
                  <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>GERENCIAMENTO DE CLIENTES</h1>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>Modifique níveis de acesso (Admin/User) e remova contas de clientes.</p>
                </div>

                <div className="table-responsive" style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: '#212529', color: '#fff', textAlign: 'left' }}>
                        <th style={{ padding: '16px' }}>AVATAR</th>
                        <th style={{ padding: '16px' }}>NOME</th>
                        <th style={{ padding: '16px' }}>E-MAIL</th>
                        <th style={{ padding: '16px' }}>CARGO</th>
                        <th style={{ padding: '16px' }}>CADASTRO</th>
                        <th style={{ padding: '16px' }}>AÇÕES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '16px' }}>
                            <img
                              src={u.avatar || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=50&q=80'}
                              alt={u.username}
                              style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                          </td>
                          <td style={{ padding: '16px', fontWeight: 700 }}>{u.username}</td>
                          <td style={{ padding: '16px' }}>{u.email}</td>
                          <td style={{ padding: '16px', textTransform: 'uppercase', fontWeight: 700 }}>{u.role}</td>
                          <td style={{ padding: '16px' }}>{new Date(u.createdAt || Date.now()).toLocaleDateString('pt-BR')}</td>
                          <td style={{ padding: '16px', display: 'flex', gap: '8px' }}>
                            <select
                              value={u.role}
                              onChange={(e) => handleUpdateRole(u._id, e.target.value)}
                              disabled={actionLoading}
                              style={{ padding: '6px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </select>
                            <button
                              onClick={() => handleOpenEditUser(u)}
                              className="button button-outline"
                              style={{ padding: '4px 10px', fontSize: '0.7rem' }}
                            >
                              Editar/Ver
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u._id)}
                              disabled={actionLoading}
                              className="button button-outline"
                              style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)', padding: '4px 10px', fontSize: '0.7rem' }}
                            >
                              Remover
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '32px' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '24px', textTransform: 'uppercase' }}>
                  Editar Perfil & Histórico: {editingUser.username}
                </h2>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                  {/* Left: Info edit form */}
                  <form onSubmit={handleUserEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                      <img
                        src={userEditAvatar || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=150&q=80'}
                        alt="Preview"
                        style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--color-border)', display: 'block', margin: '0 auto 10px' }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                        <label htmlFor="admin-user-avatar-file" className="button button-outline button-small" style={{ display: 'inline-block', cursor: 'pointer', padding: '6px 12px', fontSize: '0.75rem' }}>
                          Carregar Foto
                        </label>
                        <input type="file" id="admin-user-avatar-file" accept="image/*" onChange={handleEditUserAvatarChange} style={{ display: 'none' }} />
                        <input
                          type="text"
                          value={userEditAvatar}
                          onChange={(e) => setUserEditAvatar(e.target.value)}
                          placeholder="Ou cole a URL da imagem aqui"
                          style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: '6px', fontSize: '0.85rem', marginTop: '4px' }}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Nome do Cliente</label>
                      <input type="text" value={userEditName} onChange={(e) => setUserEditName(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '6px' }} required />
                    </div>

                    <div className="form-group">
                      <label style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>E-mail</label>
                      <input type="email" value={userEditEmail} onChange={(e) => setUserEditEmail(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '6px' }} required />
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                      <button type="submit" className="button" style={{ flex: 1 }} disabled={actionLoading}>Salvar Dados</button>
                      <button type="button" className="button button-outline" onClick={() => setEditingUser(null)} style={{ flex: 1 }}>Voltar</button>
                    </div>
                  </form>

                  {/* Right: User Purchases history */}
                  <div style={{ borderLeft: '1px solid var(--color-border)', paddingLeft: '30px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '16px' }}>Histórico de Compras</h3>
                    {loadingUserOrders ? (
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Carregando pedidos...</p>
                    ) : userEditOrders.length === 0 ? (
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Nenhum pedido realizado por este cliente.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
                        {userEditOrders.map((order) => (
                          <div key={order._id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '12px', background: '#f8fafc' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.8rem' }}>
                              <strong>#{order._id.slice(-6).toUpperCase()}</strong>
                              <span style={{ color: 'var(--color-text-muted)' }}>{new Date(order.createdAt).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '4px', margin: '8px 0' }}>
                              {order.items?.map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span>{item.name} {item.size && `(${item.size})`}</span>
                                  <span>{item.quantity}x R$ {item.price?.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
                              <span>Status: {order.status}</span>
                              <span>Total: R$ {order.totalPrice?.toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: PRODUCTS */}
        {currentTab === 'products' && (
          <div>
            {editingProduct === null ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                  <div>
                    <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>CATÁLOGO DE PRODUTOS</h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>Crie novos itens, gerencie preços e controle o estoque físico da loja.</p>
                  </div>
                  <button className="button button-small" onClick={handleOpenNewProduct} style={{ padding: '10px 20px' }}>
                    + NOVO PRODUTO
                  </button>
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                  <input
                    type="text"
                    placeholder="Pesquisar por nome ou categoria..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ padding: '10px 16px', border: '1px solid var(--color-border)', borderRadius: '6px', flexGrow: 1 }}
                  />
                </div>

                <div className="table-responsive" style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: '#212529', color: '#fff', textAlign: 'left' }}>
                        <th style={{ padding: '16px' }}>IMAGEM</th>
                        <th style={{ padding: '16px' }}>NOME</th>
                        <th style={{ padding: '16px' }}>CATEGORIA</th>
                        <th style={{ padding: '16px' }}>PREÇO</th>
                        <th style={{ padding: '16px' }}>ESTOQUE</th>
                        <th style={{ padding: '16px' }}>AÇÕES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((p) => (
                        <tr key={p._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '16px' }}>
                            <img src={p.image || p.images?.[0]} alt={p.name} style={{ width: '40px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                          </td>
                          <td style={{ padding: '16px', fontWeight: 700 }}>{p.name}</td>
                          <td style={{ padding: '16px' }}>{p.category}</td>
                          <td style={{ padding: '16px', fontWeight: 700 }}>R$ {p.price?.toFixed(2)}</td>
                          <td style={{ padding: '16px' }}>
                            <span style={{ color: p.countInStock <= 5 ? 'var(--color-error)' : 'inherit', fontWeight: p.countInStock <= 5 ? 700 : 'normal' }}>
                              {p.countInStock} un. {p.countInStock <= 5 && '⚠️'}
                            </span>
                          </td>
                          <td style={{ padding: '16px', display: 'flex', gap: '8px', alignItems: 'center', height: '100%' }}>
                            <button className="button button-outline" onClick={() => handleOpenEditProduct(p)} style={{ padding: '6px 12px', fontSize: '0.75rem' }}>Editar</button>
                            <button className="button button-outline" onClick={() => handleDeleteProduct(p._id)} style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)', padding: '6px 12px', fontSize: '0.75rem' }}>Excluir</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              // Add / Edit Product Form Workspace
              <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '32px' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '24px', textTransform: 'uppercase' }}>
                  {editingProduct === 'new' ? 'Novo Produto' : 'Editar Produto'}
                </h2>
                <form onSubmit={handleProductSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Nome do Produto *</label>
                      <input type="text" value={prodName} onChange={(e) => setProdName(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '6px' }} required />
                    </div>
                    <div className="form-group">
                      <label style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Categoria *</label>
                      <input type="text" value={prodCategory} onChange={(e) => setProdCategory(e.target.value)} placeholder="Ex: Regatas, Camisetas, Shorts, Moletom" style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '6px' }} required />
                    </div>
                    <div className="form-group">
                      <label style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Preço Unitário (R$) *</label>
                      <input type="number" step="0.01" value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '6px' }} required />
                    </div>
                    <div className="form-group">
                      <label style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Quantidade em Estoque *</label>
                      <input type="number" value={prodStock} onChange={(e) => setProdStock(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '6px' }} required />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>URL da Imagem de Destaque *</label>
                      <input type="text" value={prodImage} onChange={(e) => setProdImage(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '6px' }} required />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Cores (Formato: Nome:Hex, separados por vírgula)</label>
                      <input type="text" value={prodColors} onChange={(e) => setProdColors(e.target.value)} placeholder="Ex: Preto:#000000, Cinza Mescla:#808080" style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '6px' }} />
                    </div>
                    <div className="form-group">
                      <label style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Tamanhos (separados por vírgula)</label>
                      <input type="text" value={prodSizes} onChange={(e) => setProdSizes(e.target.value)} placeholder="Ex: P, M, G, GG" style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '6px' }} />
                    </div>
                    <div className="form-group">
                      <label style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Destaques e Benefícios (separados por vírgula)</label>
                      <input type="text" value={prodBenefits} onChange={(e) => setProdBenefits(e.target.value)} placeholder="Ex: Modelagem slim, Proteção UV50+" style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '6px' }} />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Descrição do Produto</label>
                      <textarea value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} style={{ width: '100%', height: '100px', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '6px', fontFamily: 'var(--font-body)' }}></textarea>
                    </div>
                  </div>
                  <div className="form-actions" style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                    <button type="submit" className="button" style={{ flex: 1 }} disabled={actionLoading}>GRAVAR PRODUTO</button>
                    <button type="button" className="button button-outline" onClick={() => setEditingProduct(null)} style={{ flex: 1 }}>VOLTAR</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* TAB: CARTS */}
        {currentTab === 'carts' && (
          <div>
            <div style={{ marginBottom: '30px' }}>
              <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>CARRINHOS ATIVOS</h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>Monitore os itens atualmente adicionados ao carrinho pelos clientes.</p>
            </div>

            <div className="table-responsive" style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#212529', color: '#fff', textAlign: 'left' }}>
                    <th style={{ padding: '16px' }}>CLIENTE</th>
                    <th style={{ padding: '16px' }}>E-MAIL</th>
                    <th style={{ padding: '16px' }}>QTD DE PRODUTOS</th>
                    <th style={{ padding: '16px' }}>ITENS NO CARRINHO</th>
                    <th style={{ padding: '16px' }}>ÚLTIMA MODIFICAÇÃO</th>
                  </tr>
                </thead>
                <tbody>
                  {carts.length > 0 ? (
                    carts.map((c, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '16px', fontWeight: 700 }}>{c.username}</td>
                        <td style={{ padding: '16px' }}>{c.email}</td>
                        <td style={{ padding: '16px', fontWeight: 700 }}>
                          {c.cart?.reduce((sum, item) => sum + item.quantity, 0)} un.
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {c.cart?.map((item, itemIdx) => (
                              <span key={itemIdx} style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                {item.product?.name} ({item.quantity}x)
                              </span>
                            ))}
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          {new Date(c.updatedAt || Date.now()).toLocaleDateString('pt-BR')} às {new Date(c.updatedAt || Date.now()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-muted)' }}>Nenhum carrinho ativo no momento.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: NOTIFICATIONS */}
        {currentTab === 'notifications' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <div>
                <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>NOTIFICAÇÕES</h1>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>Avisos rápidos sobre novos pedidos, registros de clientes ou estoque zerado.</p>
              </div>
              <button className="button button-outline button-small" onClick={handleReadAllNotifications} style={{ padding: '10px 16px' }}>
                MARCAR TODAS COMO LIDAS
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <div
                    key={n._id}
                    style={{
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '20px',
                      backgroundColor: n.read ? '#ffffff' : '#f8fafc',
                      borderLeft: n.read ? '1px solid var(--color-border)' : '4px solid var(--color-black)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', display: 'block', fontWeight: 700 }}>
                        {n.type === 'new_order' ? 'Novo Pedido' : n.type === 'new_customer' ? 'Novo Cliente' : 'Alerta de Estoque'}
                      </span>
                      <strong style={{ fontSize: '0.95rem', display: 'block', margin: '4px 0' }}>{n.title}</strong>
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: 0 }}>{n.message}</p>
                    </div>
                    {!n.read && (
                      <button
                        className="button button-outline button-small"
                        onClick={() => handleReadNotification(n._id)}
                        style={{ padding: '6px 12px', fontSize: '0.7rem' }}
                      >
                        Marcar como lida
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                  Nenhuma notificação registrada.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: REPORTS */}
        {currentTab === 'reports' && (
          <div>
            <div style={{ marginBottom: '30px' }}>
              <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>RELATÓRIOS E FATURAMENTO</h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>Auditoria técnica detalhada de faturamento, pedidos e carrinhos por categoria.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '24px' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '1rem', textTransform: 'uppercase', fontWeight: 800 }}>Histórico de Receita Mensal</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {monthlyBilling.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.9rem' }}>
                      <span>{item.month}</span>
                      <strong>R$ {item.total?.toFixed(2)}</strong>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '24px' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '1rem', textTransform: 'uppercase', fontWeight: 800 }}>Receita por Categoria</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {catBilling.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.9rem' }}>
                      <span>{item.category}</span>
                      <strong>{item.count} venda(s)</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default Admin;
