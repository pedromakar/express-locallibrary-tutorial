import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import authService from '../../services/authService';
import orderService from '../../services/orderService';
import api from '../../services/api';

const Account = () => {
  const { user, token, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('perfil'); // 'perfil', 'pedidos', 'enderecos', 'marketing'
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Profile Form States
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Marketing Form States
  const [mktEmail, setMktEmail] = useState(false);
  const [mktSms, setMktSms] = useState(false);
  const [mktWhatsapp, setMktWhatsapp] = useState(false);
  const [mktPost, setMktPost] = useState(false);

  // Address Editor States
  const [addressEditorOpen, setAddressEditorOpen] = useState(false);
  const [editIndex, setEditIndex] = useState(null); // null means adding new address
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [isAddrDefault, setIsAddrDefault] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setEmail(user.email || '');
      if (user.marketingPreferences) {
        setMktEmail(!!user.marketingPreferences.emailPromo);
        setMktSms(!!user.marketingPreferences.smsPromo);
        setMktWhatsapp(!!user.marketingPreferences.whatsappPromo);
        setMktPost(!!user.marketingPreferences.postPromo);
      }
    }
  }, [user]);

  // Load orders when 'pedidos' tab is activated
  useEffect(() => {
    if (activeTab === 'pedidos' && user) {
      const loadOrders = async () => {
        setLoadingOrders(true);
        try {
          const list = await orderService.getByUser(user._id || user.id);
          setOrders(list || []);
        } catch (err) {
          console.error('Error fetching orders:', err);
        } finally {
          setLoadingOrders(false);
        }
      };
      loadOrders();
    }
  }, [activeTab, user]);

  const triggerSuccessToast = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result;
        try {
          const res = await authService.updateProfile({ avatar: base64 });
          updateUser(res.user);
          triggerSuccessToast();
        } catch (err) {
          console.error('Error updating avatar:', err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!email.includes('@')) {
      setEmailError(true);
      return;
    }
    setEmailError(false);

    try {
      const payload = { username, email };
      if (password) payload.password = password;

      const res = await authService.updateProfile(payload);
      updateUser(res.user);
      localStorage.setItem('username', res.user.username);
      triggerSuccessToast();
      setPassword('');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Erro ao atualizar o perfil.');
    }
  };

  const handleMarketingSubmit = async (e) => {
    e.preventDefault();
    const marketingPreferences = {
      emailPromo: mktEmail,
      smsPromo: mktSms,
      whatsappPromo: mktWhatsapp,
      postPromo: mktPost
    };
    try {
      const res = await authService.updateProfile({ marketingPreferences });
      updateUser(res.user);
      triggerSuccessToast();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMapsFill = (e) => {
    e.preventDefault();
    setCep('01311-200');
    setStreet('Avenida Paulista');
    setNumber('1000');
    setComplement('Ap 52');
    setNeighborhood('Bela Vista');
    setCity('São Paulo');
    setStateCode('SP');
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    const newAddr = {
      cep,
      street,
      number,
      complement,
      neighborhood,
      city,
      state: stateCode,
      isDefault: isAddrDefault
    };

    let updatedAddresses = [...(user.addresses || [])];

    if (isAddrDefault) {
      updatedAddresses = updatedAddresses.map(a => ({ ...a, isDefault: false }));
    }

    if (editIndex === null) {
      if (updatedAddresses.length === 0) {
        newAddr.isDefault = true;
      }
      updatedAddresses.push(newAddr);
    } else {
      updatedAddresses[editIndex] = newAddr;
    }

    try {
      const res = await authService.updateProfile({ addresses: updatedAddresses });
      updateUser(res.user);
      triggerSuccessToast();
      closeAddressEditor();
    } catch (err) {
      console.error(err);
    }
  };

  const closeAddressEditor = () => {
    setAddressEditorOpen(false);
    setEditIndex(null);
    setCep('');
    setStreet('');
    setNumber('');
    setComplement('');
    setNeighborhood('');
    setCity('');
    setStateCode('');
    setIsAddrDefault(false);
  };

  const openEditAddress = (idx) => {
    const addr = user.addresses[idx];
    setEditIndex(idx);
    setCep(addr.cep);
    setStreet(addr.street);
    setNumber(addr.number);
    setComplement(addr.complement || '');
    setNeighborhood(addr.neighborhood);
    setCity(addr.city);
    setStateCode(addr.state);
    setIsAddrDefault(addr.isDefault);
    setAddressEditorOpen(true);
  };

  const handleDeleteAddress = async (idx) => {
    let updatedAddresses = [...(user.addresses || [])];
    const wasDefault = updatedAddresses[idx].isDefault;
    updatedAddresses.splice(idx, 1);

    if (wasDefault && updatedAddresses.length > 0) {
      updatedAddresses[0].isDefault = true;
    }

    try {
      const res = await authService.updateProfile({ addresses: updatedAddresses });
      updateUser(res.user);
      triggerSuccessToast();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAddressDefault = async (idx) => {
    const updatedAddresses = user.addresses.map((addr, i) => ({
      ...addr,
      isDefault: i === idx
    }));

    try {
      const res = await authService.updateProfile({ addresses: updatedAddresses });
      updateUser(res.user);
      triggerSuccessToast();
    } catch (err) {
      console.error(err);
    }
  };

  const countActiveMarketingChannels = () => {
    let count = 0;
    if (mktEmail) count++;
    if (mktSms) count++;
    if (mktWhatsapp) count++;
    if (mktPost) count++;
    return count;
  };

  const handleLogoutConfirm = () => {
    setShowLogoutModal(false);
    logout();
    navigate('/');
  };

  if (!user) return null;

  const activeChannels = countActiveMarketingChannels();
  const avatarImg = user.avatar || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=150&q=80';

  return (
    <div className="account-wrapper-content">
      {/* Toast Notification */}
      <div className={`toast-notification ${showToast ? 'show' : ''}`} id="toast-success">
        <span>🎉 Perfil atualizado com sucesso!</span>
      </div>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="custom-modal-overlay show" id="logout-modal" onClick={() => setShowLogoutModal(false)}>
          <div className="custom-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="custom-modal-title">Confirmar Saída</h3>
            <p className="custom-modal-text">Tem certeza que deseja sair? Você será desconectado da sua conta.</p>
            <div className="custom-modal-actions">
              <button className="button button-outline button-small" onClick={() => setShowLogoutModal(false)}>Cancelar</button>
              <button
                className="button button-small"
                onClick={handleLogoutConfirm}
                style={{ background: 'var(--color-black)', color: 'var(--color-white)', borderColor: 'var(--color-black)' }}
              >
                Sair da Conta
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="content container-custom section" style={{ padding: '40px 20px' }}>
        <div className="account-layout">
          {/* Sidebar Navigation */}
          <aside className="account-sidebar-menu">
            {user.role === 'admin' && (
              <Link
                to="/admin"
                className="button"
                style={{
                  background: 'var(--color-black)',
                  color: 'var(--color-white)',
                  borderColor: 'var(--color-black)',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '0.75rem',
                  textDecoration: 'none'
                }}
              >
                <i className="fas fa-user-shield"></i> PAINEL ADMIN
              </Link>
            )}
            <div className={`account-menu-item ${activeTab === 'perfil' ? 'active' : ''}`} onClick={() => setActiveTab('perfil')}>
              <i className="fas fa-user-circle"></i> PERFIL
            </div>
            <div className={`account-menu-item ${activeTab === 'pedidos' ? 'active' : ''}`} onClick={() => setActiveTab('pedidos')}>
              <i className="fas fa-shopping-bag"></i> MEUS PEDIDOS
            </div>
            <div className={`account-menu-item ${activeTab === 'enderecos' ? 'active' : ''}`} onClick={() => setActiveTab('enderecos')}>
              <i className="fas fa-map-marker-alt"></i> ENDEREÇOS
            </div>
            <div className={`account-menu-item ${activeTab === 'marketing' ? 'active' : ''}`} onClick={() => setActiveTab('marketing')}>
              <i className="fas fa-envelope-open-text"></i> PREFERÊNCIAS
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', margin: '16px 0' }}></div>

            <button className="button button-outline button-small" onClick={() => setShowLogoutModal(true)} style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)', width: '100%' }}>
              <i className="fas fa-sign-out-alt"></i> SAIR
            </button>
          </aside>

          {/* Workspace Area */}
          <section className="box" style={{ background: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: '32px', flexGrow: 1 }}>
            {activeTab === 'perfil' && (
              <>
                <div className="profile-header text-center" style={{ marginBottom: '30px', position: 'relative', textAlign: 'center' }}>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img src={avatarImg} id="profile-avatar-preview" alt={user.username} style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--color-border)' }} />
                    <label htmlFor="avatar-file-input" style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--color-black)', color: 'var(--color-white)', width: '34px', height: '34px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid white', boxShadow: 'var(--shadow-sm)' }}>
                      <i className="fas fa-camera" style={{ fontSize: '0.9rem' }}></i>
                    </label>
                    <input type="file" id="avatar-file-input" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
                  </div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, marginTop: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Olá, {user.username}!</h2>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: 'var(--space-4)' }}>Gerencie seus dados e senha de acesso à loja.</p>

                  {user.role === 'admin' && (
                    <div style={{ background: 'var(--color-bg)', border: '2px solid var(--color-black)', borderRadius: 'var(--radius-md)', padding: '20px', margin: '16px auto 24px', maxWidth: '480px', textAlign: 'center' }}>
                      <p style={{ fontWeight: 700, color: 'var(--color-text)', marginBottom: '12px', fontSize: '0.95rem' }}>
                        <i className="fas fa-user-shield" style={{ marginRight: '6px' }}></i> Você está logado como Administrador.
                      </p>
                      <Link to="/admin" className="button button-small" style={{ background: 'var(--color-black)', color: 'var(--color-white)', borderColor: 'var(--color-black)', display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                        <i className="fas fa-tachometer-alt"></i> Acessar Painel Administrativo
                      </Link>
                    </div>
                  )}
                </div>

                <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label style={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Nome do Usuário</label>
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="form-control" style={{ width: '100%', padding: '12px', border: '1px solid var(--color-border)', borderRadius: '6px' }} required />
                  </div>

                  <div className="form-group">
                    <label style={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Endereço de E-mail</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-control" style={{ width: '100%', padding: '12px', border: '1px solid var(--color-border)', borderRadius: '6px' }} required />
                    {emailError && (
                      <span id="prof-email-error" className="field-error-msg" style={{ display: 'block', color: 'var(--color-error)', fontSize: '0.75rem', marginTop: '4px' }}>
                        Por favor, digite um e-mail válido com @.
                      </span>
                    )}
                  </div>

                  <div style={{ borderTop: '1px solid var(--color-border)', margin: '20px 0', paddingTop: '20px' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, textTransform: 'uppercase', fontSize: '0.95rem', marginBottom: '12px' }}>Alterar Senha de Segurança</h3>
                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label style={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Nova Senha</label>
                      <div className="password-input-wrapper" style={{ position: 'relative' }}>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Digite apenas se desejar alterar a senha"
                          className="form-control"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          style={{ width: '100%', padding: '12px', border: '1px solid var(--color-border)', borderRadius: '6px', paddingRight: '40px' }}
                        />
                        <button
                          type="button"
                          className="password-toggle-btn"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          <i className={showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                        </button>
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="button" style={{ marginTop: '12px' }}>SALVAR PERFIL</button>
                </form>
              </>
            )}

            {activeTab === 'pedidos' && (
              <>
                <div style={{ marginBottom: '24px' }}>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', fontSize: '1.25rem' }}>Meus Pedidos</h2>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>Acompanhe o status e histórico de todas as suas compras.</p>
                </div>

                {loadingOrders ? (
                  <p style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>Buscando histórico...</p>
                ) : orders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                    <i className="fas fa-shopping-bag" style={{ fontSize: '3rem', color: 'var(--color-text-muted)', marginBottom: '16px', display: 'block' }}></i>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '1.15rem', marginBottom: '8px' }}>Nenhum pedido encontrado</h3>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Você ainda não realizou compras na nossa loja.</p>
                    <Link className="button" to="/products" style={{ marginTop: '24px', display: 'inline-block', textDecoration: 'none' }}>Ver Produtos</Link>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {orders.map((order) => (
                      <div key={order._id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: '#ffffff' }}>
                        <div style={{ backgroundColor: 'var(--color-bg)', padding: '16px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                          <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>PEDIDO</span>
                            <strong style={{ fontSize: '0.9rem', fontFamily: 'var(--font-display)' }}>#{order._id.slice(-6).toUpperCase()}</strong>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>REALIZADO EM</span>
                            <strong style={{ fontSize: '0.9rem' }}>{new Date(order.createdAt).toLocaleDateString('pt-BR')}</strong>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>TOTAL</span>
                            <strong style={{ fontSize: '0.9rem', color: 'var(--color-black)' }}>R$ {order.totalPrice.toFixed(2)}</strong>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '2px' }}>STATUS</span>
                            <span
                              className={`badge ${
                                order.status === 'paid' ? 'badge-success' :
                                order.status === 'shipped' ? 'badge-info' :
                                order.status === 'canceled' ? 'badge-error' :
                                'badge-warning'
                              }`}
                              style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', padding: '4px 8px', borderRadius: '12px', display: 'inline-block' }}
                            >
                              {order.status === 'pending' ? 'Pendente' :
                               order.status === 'paid' ? 'Pago' :
                               order.status === 'shipped' ? 'Enviado' :
                               order.status === 'canceled' ? 'Cancelado' : order.status}
                            </span>
                          </div>
                        </div>
                        <div style={{ padding: '20px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {order.items?.map((item, idx) => (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                                <div>
                                  <strong style={{ color: 'var(--color-text)' }}>{item.name}</strong>
                                  {item.size && <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginLeft: '8px' }}>Tamanho: {item.size}</span>}
                                  {item.color && <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginLeft: '8px' }}>Cor: {item.color}</span>}
                                </div>
                                <div style={{ color: 'var(--color-text-muted)' }}>
                                  {item.quantity}x R$ {item.price.toFixed(2)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'enderecos' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '1.25rem' }}>Endereços de Logística</h2>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Selecione o seu endereço padrão para entregas no checkout.</p>
                  </div>
                  {!addressEditorOpen && (
                    <button className="button button-small" onClick={() => setAddressEditorOpen(true)} style={{ padding: '10px 16px' }}>
                      + NOVO ENDEREÇO
                    </button>
                  )}
                </div>

                {addressEditorOpen && (
                  <div id="address-editor-container" style={{ background: '#f8fafc', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '24px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, textTransform: 'uppercase', fontSize: '0.95rem' }}>
                        {editIndex === null ? 'Novo Endereço' : 'Editar Endereço'}
                      </h3>
                      <button className="button button-outline button-small" onClick={handleMapsFill} style={{ padding: '6px 12px', fontSize: '0.65rem' }}>
                        <i className="fas fa-map-marked-alt"></i> Usar dados do Google Maps
                      </button>
                    </div>
                    <form onSubmit={handleAddressSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>CEP</label>
                        <input type="text" className="form-control" value={cep} onChange={(e) => setCep(e.target.value)} placeholder="00000-000" style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '6px' }} required />
                      </div>
                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Rua / Logradouro</label>
                        <input type="text" className="form-control" value={street} onChange={(e) => setStreet(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '6px' }} required />
                      </div>
                      <div className="form-group">
                        <label style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Número</label>
                        <input type="text" className="form-control" value={number} onChange={(e) => setNumber(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '6px' }} required />
                      </div>
                      <div className="form-group">
                        <label style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Complemento</label>
                        <input type="text" className="form-control" value={complement} onChange={(e) => setComplement(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '6px' }} />
                      </div>
                      <div className="form-group">
                        <label style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Bairro</label>
                        <input type="text" className="form-control" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '6px' }} required />
                      </div>
                      <div className="form-group">
                        <label style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Cidade</label>
                        <input type="text" className="form-control" value={city} onChange={(e) => setCity(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '6px' }} required />
                      </div>
                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Estado (UF)</label>
                        <input type="text" className="form-control" value={stateCode} onChange={(e) => setStateCode(e.target.value)} placeholder="SP" style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '6px' }} required />
                      </div>
                      <div className="form-group" style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                        <input type="checkbox" id="addr-default" checked={isAddrDefault} onChange={(e) => setIsAddrDefault(e.target.checked)} style={{ cursor: 'pointer' }} />
                        <label htmlFor="addr-default" style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', cursor: 'pointer' }}>Definir como Endereço Principal</label>
                      </div>
                      <div style={{ gridColumn: 'span 2', display: 'flex', gap: '12px', marginTop: '12px' }}>
                        <button type="submit" className="button button-small" style={{ flex: 1 }}>SALVAR ENDEREÇO</button>
                        <button type="button" className="button button-outline button-small" onClick={closeAddressEditor} style={{ flex: 1 }}>CANCELAR</button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="address-grid">
                  {user.addresses && user.addresses.length > 0 ? (
                    user.addresses.map((addr, idx) => (
                      <div className={`address-card ${addr.isDefault ? 'default' : ''}`} key={idx}>
                        <div className="address-card-header">
                          <strong style={{ fontSize: '0.9rem', textTransform: 'uppercase', fontFamily: 'var(--font-display)' }}>{addr.neighborhood}</strong>
                          {addr.isDefault && <span className="address-badge">Principal</span>}
                        </div>
                        <div className="address-card-body">
                          <p>{addr.street}, nº {addr.number} {addr.complement ? `(${addr.complement})` : ''}</p>
                          <p>{addr.neighborhood} - CEP: {addr.cep}</p>
                          <p>{addr.city} / {addr.state}</p>
                        </div>
                        <div className="address-card-actions">
                          <button className="button button-outline button-small" onClick={() => openEditAddress(idx)} style={{ padding: '6px 12px' }}>Editar</button>
                          <button className="button button-outline button-small" onClick={() => handleDeleteAddress(idx)} style={{ padding: '6px 12px', color: 'var(--color-error)', borderColor: 'var(--color-error)' }}>Excluir</button>
                          {!addr.isDefault && (
                            <button className="button button-small" onClick={() => handleMarkAddressDefault(idx)} style={{ padding: '6px 12px', marginLeft: 'auto' }}>
                              Marcar Padrão
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-muted)' }}>
                      <i className="fas fa-map-marked" style={{ fontSize: '2rem', marginBottom: '12px', display: 'block' }}></i>
                      Nenhum endereço cadastrado no momento.
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'marketing' && (
              <>
                <div style={{ marginBottom: '24px', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '1.25rem' }}>Preferências de Marketing</h2>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>Escolha como deseja receber nossas promoções e alertas exclusivos.</p>

                  <div style={{ background: '#f1f5f9', color: '#1e293b', fontWeight: 700, fontSize: '0.8rem', padding: '10px 16px', borderRadius: 'var(--radius-sm)', display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
                    <i className="fas fa-bell"></i>
                    <span>Você está inscrito em <strong id="channels-badge-counter">{activeChannels} de 4</strong> canais de notificação.</span>
                  </div>
                </div>

                <form onSubmit={handleMarketingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Toggle Switch Email */}
                  <div className="toggle-switch-container">
                    <div className="toggle-switch-label">
                      <i className="fas fa-envelope" style={{ width: '20px' }}></i>
                      <span>Ofertas por E-mail</span>
                      <div className="tooltip-container">
                        <span className="tooltip-icon">?</span>
                        <span className="tooltip-text">Você receberá e-mails semanais com lançamentos de coleções e cupons exclusivos.</span>
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" checked={mktEmail} onChange={(e) => setMktEmail(e.target.checked)} />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  {/* Toggle Switch SMS */}
                  <div className="toggle-switch-container">
                    <div className="toggle-switch-label">
                      <i className="fas fa-sms" style={{ width: '20px', fontSize: '1.1rem' }}></i>
                      <span>Alertas por SMS</span>
                      <div className="tooltip-container">
                        <span className="tooltip-icon">?</span>
                        <span className="tooltip-text">Enviaremos alertas SMS rápidos apenas em promoções relâmpago de estoque limitado.</span>
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" checked={mktSms} onChange={(e) => setMktSms(e.target.checked)} />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  {/* Toggle Switch WhatsApp */}
                  <div className="toggle-switch-container">
                    <div className="toggle-switch-label">
                      <i className="fab fa-whatsapp" style={{ width: '20px', fontSize: '1.1rem' }}></i>
                      <span>Mensagens no WhatsApp</span>
                      <div className="tooltip-container">
                        <span className="tooltip-icon">?</span>
                        <span className="tooltip-text">Receba atendimento VIP e novidades sobre Drops diretamente no seu WhatsApp.</span>
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" checked={mktWhatsapp} onChange={(e) => setMktWhatsapp(e.target.checked)} />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  {/* Toggle Switch Post */}
                  <div className="toggle-switch-container">
                    <div className="toggle-switch-label">
                      <i className="fas fa-mail-bulk" style={{ width: '20px' }}></i>
                      <span>Catálogo por Correio</span>
                      <div className="tooltip-container">
                        <span className="tooltip-icon">?</span>
                        <span className="tooltip-text">Catálogos físicos impressos da coleção Inverno enviados sem custo para sua residência.</span>
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" checked={mktPost} onChange={(e) => setMktPost(e.target.checked)} />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <button type="submit" className="button" style={{ marginTop: '16px' }}>SALVAR PREFERÊNCIAS</button>
                </form>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default Account;
