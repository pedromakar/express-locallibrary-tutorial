import { renderNav, renderFooter, initDrawerEvents, updateCartBadge } from './ui.js?v=2';

const root = document.getElementById('page-root');
const token = localStorage.getItem('md-essential-admin-token');

// Redirect to login if not authenticated
if (!token) {
  window.location.href = '/login.html?redirect=account';
}

// State management
let userData = null;
const urlParams = new URLSearchParams(window.location.search);
const initialTabParam = urlParams.get('tab') || (window.location.hash ? window.location.hash.replace('#', '') : '');
let activeTab = ['perfil', 'enderecos', 'marketing', 'pedidos'].includes(initialTabParam) ? initialTabParam : 'perfil';
let userOrders = [];

// Fetch user orders history
async function loadUserOrders() {
  if (!userData?._id) return;
  try {
    const response = await fetch(`/api/orders/${userData._id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (response.ok) {
      userOrders = await response.json();
    }
  } catch (err) {
    console.error('Erro ao buscar pedidos:', err);
  }
}


// Tooltip descriptions
const marketingTooltips = {
  emailPromo: 'Você receberá e-mails semanais com lançamentos de coleções e cupons exclusivos.',
  smsPromo: 'Enviaremos alertas SMS rápidos apenas em promoções relâmpago de estoque limitado.',
  whatsappPromo: 'Receba atendimento VIP e novidades sobre Drops diretamente no seu WhatsApp.',
  postPromo: 'Catálogos físicos impressos da coleção Inverno enviados sem custo para sua residência.'
};

// Render the loading skeleton screen
function renderSkeleton() {
  root.innerHTML = `
    ${renderNav('account')}
    <main class="content container-custom section">
      <div class="account-layout">
        <!-- Sidebar Skeleton -->
        <aside class="account-sidebar-menu">
          <div class="skeleton-pulse" style="height: 40px; width: 100%; border-radius: 6px;"></div>
          <div class="skeleton-pulse" style="height: 40px; width: 100%; border-radius: 6px;"></div>
          <div class="skeleton-pulse" style="height: 40px; width: 100%; border-radius: 6px;"></div>
        </aside>
        
        <!-- Main Content Skeleton -->
        <section class="box" style="background: #ffffff; border-radius: 10px; padding: 32px; border: 1px solid #e2e8f0;">
          <div class="skeleton-pulse skeleton-profile-pic"></div>
          <div class="skeleton-pulse skeleton-text" style="width: 40%; margin: 0 auto 24px; height: 24px; display: block;"></div>
          <div class="skeleton-pulse skeleton-text"></div>
          <div class="skeleton-pulse skeleton-text" style="width: 80%;"></div>
          <div class="skeleton-pulse skeleton-text" style="width: 90%;"></div>
          <div class="skeleton-pulse skeleton-card" style="margin-top: 30px;"></div>
        </section>
      </div>
    </main>
    ${renderFooter()}
  `;
}

// Fetch user profile data from API
async function loadUserProfile() {
  renderSkeleton();
  try {
    const response = await fetch('/api/users/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      userData = data.user;
      await loadUserOrders();
      renderDashboard();
    } else {
      localStorage.removeItem('md-essential-admin-token');
      localStorage.removeItem('username');
      window.location.href = '/login.html?redirect=account';
    }
  } catch (err) {
    console.error('Erro ao buscar dados do perfil:', err);
  }
}

// Main Dashboard Renderer
function renderDashboard() {
  const activeChannels = countActiveMarketingChannels();
  root.innerHTML = `
    ${renderNav('account')}
    
    <!-- Success Toast Notification -->
    <div id="toast-success" class="toast-notification">
      <span>🎉 Perfil atualizado com sucesso!</span>
    </div>

    <!-- Custom Logout Confirmation Modal -->
    <div id="logout-modal" class="custom-modal-overlay">
      <div class="custom-modal">
        <h3 class="custom-modal-title">Confirmar Saída</h3>
        <p class="custom-modal-text">Tem certeza que deseja sair? Você será desconectado da sua conta.</p>
        <div class="custom-modal-actions">
          <button id="modal-cancel-logout" class="button button-outline button-small">Cancelar</button>
          <button id="modal-confirm-logout" class="button button-small" style="background: var(--color-black); color: var(--color-white); border-color: var(--color-black);">Sair da Conta</button>
        </div>
      </div>
    </div>

    <main class="content container-custom section">
      <div class="account-layout">
        
        <!-- Sidebar Navigation Menu -->
        <aside class="account-sidebar-menu">
          ${userData && userData.role === 'admin' ? `
            <a href="/admin" class="button" style="background: var(--color-black); color: var(--color-white); border-color: var(--color-black); margin-bottom: 12px; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 0.75rem;">
              <i class="fas fa-user-shield"></i> PAINEL ADMIN
            </a>
          ` : ''}
          <div class="account-menu-item ${activeTab === 'perfil' ? 'active' : ''}" data-tab="perfil">
            <i class="fas fa-user-circle"></i> PERFIL
          </div>
          <div class="account-menu-item ${activeTab === 'pedidos' ? 'active' : ''}" data-tab="pedidos">
            <i class="fas fa-shopping-bag"></i> MEUS PEDIDOS
          </div>
          <div class="account-menu-item ${activeTab === 'enderecos' ? 'active' : ''}" data-tab="enderecos">
            <i class="fas fa-map-marker-alt"></i> ENDEREÇOS
          </div>
          <div class="account-menu-item ${activeTab === 'marketing' ? 'active' : ''}" data-tab="marketing">
            <i class="fas fa-envelope-open-text"></i> PREFERÊNCIAS
          </div>
          
          <div style="border-top: 1px solid var(--color-border); margin: 16px 0;"></div>
          
          <button id="btn-sidebar-logout" class="button button-outline button-small" style="color: var(--color-error); border-color: var(--color-error);">
            <i class="fas fa-sign-out-alt"></i> SAIR
          </button>
        </aside>

        <!-- Main Workspace Area -->
        <section class="box" style="background: #ffffff; border-radius: var(--radius-md); border: 1px solid var(--color-border); padding: 32px;">
          ${renderActiveTabContent(activeChannels)}
        </section>

      </div>
    </main>

    ${renderFooter()}
  `;

  // Init scripts, modules and actions
  initTabEvents();
  initFormActions();
  initDrawerEvents();
  updateCartBadge();
}

// Calculate subscribed marketing channels count
function countActiveMarketingChannels() {
  if (!userData || !userData.marketingPreferences) return 0;
  const prefs = userData.marketingPreferences;
  let count = 0;
  if (prefs.emailPromo) count++;
  if (prefs.smsPromo) count++;
  if (prefs.whatsappPromo) count++;
  if (prefs.postPromo) count++;
  return count;
}

// Switch between content rendering based on selected Tab
function renderActiveTabContent(activeChannels) {
  if (activeTab === 'pedidos') {
    return renderOrdersTabContent();
  }
  if (activeTab === 'perfil') {
    const avatarImg = userData.avatar || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=150&q=80';
    return `
      <div class="profile-header text-center" style="margin-bottom: 30px; position: relative;">
        <div style="position: relative; display: inline-block;">
          <img src="${avatarImg}" id="profile-avatar-preview" alt="${userData.username}" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 4px solid var(--color-border);" />
          <label for="avatar-file-input" style="position: absolute; bottom: 0; right: 0; background: var(--color-black); color: var(--color-white); width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 2px solid white; box-shadow: var(--shadow-sm);">
            <i class="fas fa-camera" style="font-size: 0.9rem;"></i>
          </label>
          <input type="file" id="avatar-file-input" accept="image/*" style="display: none;" />
        </div>
        <h2 style="font-family: var(--font-display); font-weight: 900; margin-top: 16px; text-transform: uppercase; letter-spacing: 0.05em;">Olá, ${userData.username}!</h2>
        <p style="color: var(--color-text-muted); font-size: 0.85rem; margin-bottom: var(--space-4);">Gerencie seus dados e senha de acesso à loja.</p>
        
        ${userData.role === 'admin' ? `
          <div style="background: var(--color-bg); border: 2px solid var(--color-black); border-radius: var(--radius-md); padding: 20px; margin: 16px auto 24px; max-width: 480px; text-align: center;">
            <p style="font-weight: 700; color: var(--color-text); margin-bottom: 12px; font-size: 0.95rem;">
              <i class="fas fa-user-shield" style="margin-right: 6px;"></i> Você está logado como Administrador.
            </p>
            <a href="/admin" class="button button-small" style="background: var(--color-black); color: var(--color-white); border-color: var(--color-black); display: inline-flex; align-items: center; gap: 8px;">
              <i class="fas fa-tachometer-alt"></i> Acessar Painel Administrativo
            </a>
          </div>
        ` : ''}
      </div>

      <form id="form-profile-info" style="display: flex; flex-direction: column; gap: 16px;">
        <div class="form-group">
          <label style="font-weight: 700; font-size: 0.8rem; text-transform: uppercase; margin-bottom: 6px; display: block;">Nome do Usuário</label>
          <input type="text" id="prof-username" value="${userData.username}" class="form-control" style="width: 100%; padding: 12px; border: 1px solid var(--color-border); border-radius: 6px;" required />
        </div>

        <div class="form-group">
          <label style="font-weight: 700; font-size: 0.8rem; text-transform: uppercase; margin-bottom: 6px; display: block;">Endereço de E-mail</label>
          <input type="email" id="prof-email" value="${userData.email}" class="form-control" style="width: 100%; padding: 12px; border: 1px solid var(--color-border); border-radius: 6px;" required />
          <span id="prof-email-error" class="field-error-msg" style="display: none;">Por favor, digite um e-mail válido com @.</span>
        </div>

        <div style="border-top: 1px solid var(--color-border); margin: 20px 0; padding-top: 20px;">
          <h3 style="font-family: var(--font-display); font-weight: 900; text-transform: uppercase; font-size: 0.95rem; margin-bottom: 12px;">Alterar Senha de Segurança</h3>
          <div class="form-group" style="margin-bottom: 12px;">
            <label style="font-weight: 700; font-size: 0.8rem; text-transform: uppercase; margin-bottom: 6px; display: block;">Nova Senha</label>
            <div class="password-input-wrapper">
              <input type="password" id="prof-password" placeholder="Digite apenas se desejar alterar a senha" class="form-control" style="width: 100%; padding: 12px; border: 1px solid var(--color-border); border-radius: 6px;" />
              <button type="button" class="password-toggle-btn" data-target="prof-password">
                <i class="fas fa-eye"></i>
              </button>
            </div>
          </div>
        </div>

        <button type="submit" class="button" style="margin-top: 12px;">SALVAR PERFIL</button>
      </form>
    `;
  } else if (activeTab === 'enderecos') {
    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div>
          <h2 style="font-family: var(--font-display); font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; font-size: 1.25rem;">Endereços de Logística</h2>
          <p style="color: var(--color-text-muted); font-size: 0.85rem;">Selecione o seu endereço padrão para entregas no checkout.</p>
        </div>
        <button id="btn-add-address" class="button button-small" style="padding: 10px 16px;">+ NOVO ENDEREÇO</button>
      </div>

      <!-- Add / Edit Address Form Container -->
      <div id="address-editor-container" style="display: none; background: #f8fafc; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 24px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 id="address-form-title" style="font-family: var(--font-display); font-weight: 900; text-transform: uppercase; font-size: 0.95rem;">Novo Endereço</h3>
          <button id="btn-maps-fill" class="button button-outline button-small" style="padding: 6px 12px; font-size: 0.65rem;">
            <i class="fas fa-map-marked-alt"></i> Usar dados do Google Maps
          </button>
        </div>
        <form id="form-address-editor" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <input type="hidden" id="addr-index" value="" />
          <div class="form-group" style="grid-column: span 2;">
            <label style="font-weight: 700; font-size: 0.75rem; text-transform: uppercase; margin-bottom: 4px; display: block;">CEP</label>
            <input type="text" id="addr-cep" class="form-control" placeholder="00000-000" style="width: 100%; padding: 10px; border: 1px solid var(--color-border); border-radius: 6px;" required />
          </div>
          <div class="form-group" style="grid-column: span 2;">
            <label style="font-weight: 700; font-size: 0.75rem; text-transform: uppercase; margin-bottom: 4px; display: block;">Rua / Logradouro</label>
            <input type="text" id="addr-street" class="form-control" style="width: 100%; padding: 10px; border: 1px solid var(--color-border); border-radius: 6px;" required />
          </div>
          <div class="form-group">
            <label style="font-weight: 700; font-size: 0.75rem; text-transform: uppercase; margin-bottom: 4px; display: block;">Número</label>
            <input type="text" id="addr-number" class="form-control" style="width: 100%; padding: 10px; border: 1px solid var(--color-border); border-radius: 6px;" required />
          </div>
          <div class="form-group">
            <label style="font-weight: 700; font-size: 0.75rem; text-transform: uppercase; margin-bottom: 4px; display: block;">Complemento</label>
            <input type="text" id="addr-complement" class="form-control" style="width: 100%; padding: 10px; border: 1px solid var(--color-border); border-radius: 6px;" />
          </div>
          <div class="form-group">
            <label style="font-weight: 700; font-size: 0.75rem; text-transform: uppercase; margin-bottom: 4px; display: block;">Bairro</label>
            <input type="text" id="addr-neighborhood" class="form-control" style="width: 100%; padding: 10px; border: 1px solid var(--color-border); border-radius: 6px;" required />
          </div>
          <div class="form-group">
            <label style="font-weight: 700; font-size: 0.75rem; text-transform: uppercase; margin-bottom: 4px; display: block;">Cidade</label>
            <input type="text" id="addr-city" class="form-control" style="width: 100%; padding: 10px; border: 1px solid var(--color-border); border-radius: 6px;" required />
          </div>
          <div class="form-group" style="grid-column: span 2;">
            <label style="font-weight: 700; font-size: 0.75rem; text-transform: uppercase; margin-bottom: 4px; display: block;">Estado (UF)</label>
            <input type="text" id="addr-state" class="form-control" placeholder="SP" style="width: 100%; padding: 10px; border: 1px solid var(--color-border); border-radius: 6px;" required />
          </div>
          <div class="form-group" style="grid-column: span 2; display: flex; align-items: center; gap: 8px; margin-top: 8px;">
            <input type="checkbox" id="addr-default" style="cursor: pointer;" />
            <label for="addr-default" style="font-weight: 700; font-size: 0.75rem; text-transform: uppercase; cursor: pointer;">Definir como Endereço Principal</label>
          </div>
          <div style="grid-column: span 2; display: flex; gap: 12px; margin-top: 12px;">
            <button type="submit" class="button button-small" style="flex: 1;">SALVAR ENDEREÇO</button>
            <button type="button" id="btn-cancel-address" class="button button-outline button-small" style="flex: 1;">CANCELAR</button>
          </div>
        </form>
      </div>

      <!-- Grid list of address cards -->
      <div class="address-grid">
        ${userData.addresses && userData.addresses.length ? userData.addresses.map((addr, idx) => `
          <div class="address-card ${addr.isDefault ? 'default' : ''}">
            <div class="address-card-header">
              <strong style="font-size: 0.9rem; text-transform: uppercase; font-family: var(--font-display);">${addr.neighborhood}</strong>
              ${addr.isDefault ? `<span class="address-badge">Principal</span>` : ''}
            </div>
            <div class="address-card-body">
              <p>${addr.street}, nº ${addr.number} ${addr.complement ? `(${addr.complement})` : ''}</p>
              <p>${addr.neighborhood} - CEP: ${addr.cep}</p>
              <p>${addr.city} / ${addr.state}</p>
            </div>
            <div class="address-card-actions">
              <button class="button button-outline button-small btn-edit-address" data-index="${idx}" style="padding: 6px 12px;">Editar</button>
              <button class="button button-outline button-small btn-delete-address" data-index="${idx}" style="padding: 6px 12px; color: var(--color-error); border-color: var(--color-error);">Excluir</button>
              ${!addr.isDefault ? `<button class="button button-small btn-default-address" data-index="${idx}" style="padding: 6px 12px; margin-left: auto;">Marcar Padrão</button>` : ''}
            </div>
          </div>
        `).join('') : `
          <div style="grid-column: span 3; text-align: center; padding: 40px 20px; color: var(--color-text-muted);">
            <i class="fas fa-map-marked" style="font-size: 2rem; margin-bottom: 12px; display: block;"></i>
            Nenhum endereço cadastrado no momento.
          </div>
        `}
      </div>
    `;
  } else if (activeTab === 'marketing') {
    const prefs = userData.marketingPreferences || {};
    return `
      <div style="margin-bottom: 24px; border-bottom: 1px solid var(--color-border); padding-bottom: 16px;">
        <h2 style="font-family: var(--font-display); font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; font-size: 1.25rem;">Preferências de Marketing</h2>
        <p style="color: var(--color-text-muted); font-size: 0.85rem; margin-top: 4px;">Escolha como deseja receber nossas promoções e alertas exclusivos.</p>
        
        <!-- Channels Tracker Badge Banner -->
        <div style="background: #f1f5f9; color: #1e293b; font-weight: 700; font-size: 0.8rem; padding: 10px 16px; border-radius: var(--radius-sm); display: inline-flex; align-items: center; gap: 8px; margin-top: 16px;">
          <i class="fas fa-bell"></i>
          <span>Você está inscrito em <strong id="channels-badge-counter">${activeChannels} de 4</strong> canais de notificação.</span>
        </div>
      </div>

      <form id="form-marketing-prefs" style="display: flex; flex-direction: column; gap: 12px;">
        
        <!-- Toggle Switch Email -->
        <div class="toggle-switch-container">
          <div class="toggle-switch-label">
            <i class="fas fa-envelope" style="width: 20px;"></i>
            <span>Ofertas por E-mail</span>
            <div class="tooltip-container">
              <span class="tooltip-icon">?</span>
              <span class="tooltip-text">${marketingTooltips.emailPromo}</span>
            </div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="mkt-email" ${prefs.emailPromo ? 'checked' : ''} />
            <span class="toggle-slider"></span>
          </label>
        </div>

        <!-- Toggle Switch SMS -->
        <div class="toggle-switch-container">
          <div class="toggle-switch-label">
            <i class="fas fa-sms" style="width: 20px; font-size: 1.1rem;"></i>
            <span>Alertas por SMS</span>
            <div class="tooltip-container">
              <span class="tooltip-icon">?</span>
              <span class="tooltip-text">${marketingTooltips.smsPromo}</span>
            </div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="mkt-sms" ${prefs.smsPromo ? 'checked' : ''} />
            <span class="toggle-slider"></span>
          </label>
        </div>

        <!-- Toggle Switch WhatsApp -->
        <div class="toggle-switch-container">
          <div class="toggle-switch-label">
            <i class="fab fa-whatsapp" style="width: 20px; font-size: 1.1rem;"></i>
            <span>Mensagens no WhatsApp</span>
            <div class="tooltip-container">
              <span class="tooltip-icon">?</span>
              <span class="tooltip-text">${marketingTooltips.whatsappPromo}</span>
            </div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="mkt-whatsapp" ${prefs.whatsappPromo ? 'checked' : ''} />
            <span class="toggle-slider"></span>
          </label>
        </div>

        <!-- Toggle Switch Post -->
        <div class="toggle-switch-container">
          <div class="toggle-switch-label">
            <i class="fas fa-mail-bulk" style="width: 20px;"></i>
            <span>Catálogo por Correio</span>
            <div class="tooltip-container">
              <span class="tooltip-icon">?</span>
              <span class="tooltip-text">${marketingTooltips.postPromo}</span>
            </div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="mkt-post" ${prefs.postPromo ? 'checked' : ''} />
            <span class="toggle-slider"></span>
          </label>
        </div>

        <button type="submit" class="button" style="margin-top: 16px;">SALVAR PREFERÊNCIAS</button>
      </form>
    `;
  }
  return '';
}

// Bind tabs clicks events
function initTabEvents() {
  document.querySelectorAll('.account-sidebar-menu .account-menu-item').forEach(item => {
    item.addEventListener('click', () => {
      const tab = item.getAttribute('data-tab');
      if (tab && tab !== activeTab) {
        activeTab = tab;
        if (tab === 'pedidos') {
          loadUserOrders().then(() => renderDashboard());
        } else {
          renderDashboard();
        }
      }
    });
  });

  // Handle Logout Confirmation triggers
  const logoutOverlay = document.getElementById('logout-modal');
  
  const triggerLogout = () => {
    logoutOverlay?.classList.add('show');
  };

  document.getElementById('btn-sidebar-logout')?.addEventListener('click', triggerLogout);

  document.getElementById('modal-cancel-logout')?.addEventListener('click', () => {
    logoutOverlay?.classList.remove('show');
  });

  document.getElementById('modal-confirm-logout')?.addEventListener('click', () => {
    localStorage.removeItem('md-essential-admin-token');
    localStorage.removeItem('username');
    window.location.href = '/';
  });
}

// Bind active form and buttons interactions
function initFormActions() {
  const toast = document.getElementById('toast-success');
  const triggerSuccessToast = () => {
    toast?.classList.add('show');
    setTimeout(() => {
      toast?.classList.remove('show');
    }, 3000);
  };

  // 1. Password reveal button logic
  document.querySelectorAll('.password-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (input) {
        const isPass = input.getAttribute('type') === 'password';
        input.setAttribute('type', isPass ? 'text' : 'password');
        btn.querySelector('i').className = isPass ? 'fas fa-eye-slash' : 'fas fa-eye';
      }
    });
  });

  // 2. Avatar profile file conversion
  document.getElementById('avatar-file-input')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result;
        // Save dynamically to preview
        document.getElementById('profile-avatar-preview').src = base64;
        
        // Update user state and fetch endpoint
        try {
          const res = await fetch('/api/users/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ avatar: base64 })
          });
          if (res.ok) {
            const data = await res.json();
            userData.avatar = data.user.avatar;
            triggerSuccessToast();
          }
        } catch (err) {
          console.error(err);
        }
      };
      reader.readAsDataURL(file);
    }
  });

  // 3. Save profile form
  document.getElementById('form-profile-info')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('prof-username').value.trim();
    const email = document.getElementById('prof-email').value.trim();
    const password = document.getElementById('prof-password').value;

    const emailInput = document.getElementById('prof-email');
    const emailError = document.getElementById('prof-email-error');

    // Email validation
    if (!email.includes('@')) {
      emailInput.classList.add('shake-error');
      emailError.style.display = 'block';
      
      // Remove shake after animation completes
      setTimeout(() => {
        emailInput.classList.remove('shake-error');
      }, 400);
      return;
    } else {
      emailError.style.display = 'none';
    }

    try {
      const payload = { username, email };
      if (password) payload.password = password;

      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        userData = data.user;
        localStorage.setItem('username', userData.username);
        triggerSuccessToast();
        // Clear password input
        document.getElementById('prof-password').value = '';
      } else {
        const errData = await res.json();
        alert(errData.message || 'Erro ao atualizar o perfil.');
      }
    } catch (err) {
      console.error(err);
    }
  });

  // 4. Marketing preferences live feedback
  document.getElementById('form-marketing-prefs')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const marketingPreferences = {
      emailPromo: document.getElementById('mkt-email').checked,
      smsPromo: document.getElementById('mkt-sms').checked,
      whatsappPromo: document.getElementById('mkt-whatsapp').checked,
      postPromo: document.getElementById('mkt-post').checked
    };

    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ marketingPreferences })
      });

      if (res.ok) {
        const data = await res.json();
        userData = data.user;
        triggerSuccessToast();
        
        // Update placar badge live
        const activeCount = countActiveMarketingChannels();
        const counter = document.getElementById('channels-badge-counter');
        if (counter) counter.innerText = `${activeCount} de 4`;
      }
    } catch (err) {
      console.error(err);
    }
  });

  // 5. Addresses UI editor show/hide triggers
  document.getElementById('btn-add-address')?.addEventListener('click', () => {
    document.getElementById('addr-index').value = '';
    document.getElementById('form-address-editor').reset();
    document.getElementById('address-form-title').innerText = 'Novo Endereço';
    document.getElementById('address-editor-container').style.display = 'block';
    document.getElementById('btn-add-address').style.display = 'none';
  });

  document.getElementById('btn-cancel-address')?.addEventListener('click', () => {
    document.getElementById('address-editor-container').style.display = 'none';
    document.getElementById('btn-add-address').style.display = 'inline-block';
  });

  // Google Maps mock filler button
  document.getElementById('btn-maps-fill')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('addr-cep').value = '01311-200';
    document.getElementById('addr-street').value = 'Avenida Paulista';
    document.getElementById('addr-number').value = '1000';
    document.getElementById('addr-complement').value = 'Ap 52';
    document.getElementById('addr-neighborhood').value = 'Bela Vista';
    document.getElementById('addr-city').value = 'São Paulo';
    document.getElementById('addr-state').value = 'SP';
  });

  // Save address (Add or Edit)
  document.getElementById('form-address-editor')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const idxVal = document.getElementById('addr-index').value;
    const cep = document.getElementById('addr-cep').value;
    const street = document.getElementById('addr-street').value;
    const number = document.getElementById('addr-number').value;
    const complement = document.getElementById('addr-complement').value;
    const neighborhood = document.getElementById('addr-neighborhood').value;
    const city = document.getElementById('addr-city').value;
    const state = document.getElementById('addr-state').value;
    const isDefault = document.getElementById('addr-default').checked;

    const newAddr = { cep, street, number, complement, neighborhood, city, state, isDefault };
    let updatedAddresses = [...(userData.addresses || [])];

    // If marked default, unmark others first
    if (isDefault) {
      updatedAddresses = updatedAddresses.map(a => ({ ...a, isDefault: false }));
    }

    if (idxVal === '') {
      // Create new
      if (updatedAddresses.length === 0) {
        newAddr.isDefault = true; // First address is default
      }
      updatedAddresses.push(newAddr);
    } else {
      // Edit existing
      const idx = parseInt(idxVal, 10);
      updatedAddresses[idx] = newAddr;
    }

    // Call update profile route
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ addresses: updatedAddresses })
      });

      if (res.ok) {
        const data = await res.json();
        userData = data.user;
        renderDashboard(); // Reload layout
        triggerSuccessToast();
      }
    } catch (err) {
      console.error(err);
    }
  });

  // Edit / Delete / Default button clicks on cards
  document.querySelectorAll('.btn-edit-address').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-index'), 10);
      const addr = userData.addresses[idx];

      document.getElementById('addr-index').value = idx;
      document.getElementById('addr-cep').value = addr.cep;
      document.getElementById('addr-street').value = addr.street;
      document.getElementById('addr-number').value = addr.number;
      document.getElementById('addr-complement').value = addr.complement || '';
      document.getElementById('addr-neighborhood').value = addr.neighborhood;
      document.getElementById('addr-city').value = addr.city;
      document.getElementById('addr-state').value = addr.state;
      document.getElementById('addr-default').checked = addr.isDefault;

      document.getElementById('address-form-title').innerText = 'Editar Endereço';
      document.getElementById('address-editor-container').style.display = 'block';
      document.getElementById('btn-add-address').style.display = 'none';
      
      // Scroll to editor
      document.getElementById('address-editor-container').scrollIntoView({ behavior: 'smooth' });
    });
  });

  document.querySelectorAll('.btn-delete-address').forEach(btn => {
    btn.addEventListener('click', async () => {
      const idx = parseInt(btn.getAttribute('data-index'), 10);
      let updatedAddresses = [...(userData.addresses || [])];
      
      const wasDefault = updatedAddresses[idx].isDefault;
      updatedAddresses.splice(idx, 1);

      // If we deleted the default, set first remaining as default
      if (wasDefault && updatedAddresses.length > 0) {
        updatedAddresses[0].isDefault = true;
      }

      try {
        const res = await fetch('/api/users/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ addresses: updatedAddresses })
        });

        if (res.ok) {
          const data = await res.json();
          userData = data.user;
          renderDashboard();
          triggerSuccessToast();
        }
      } catch (err) {
        console.error(err);
      }
    });
  });

  document.querySelectorAll('.btn-default-address').forEach(btn => {
    btn.addEventListener('click', async () => {
      const idx = parseInt(btn.getAttribute('data-index'), 10);
      let updatedAddresses = userData.addresses.map((addr, i) => ({
        ...addr,
        isDefault: i === idx
      }));

      try {
        const res = await fetch('/api/users/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ addresses: updatedAddresses })
        });

        if (res.ok) {
          const data = await res.json();
          userData = data.user;
          renderDashboard();
          triggerSuccessToast();
        }
      } catch (err) {
        console.error(err);
      }
    });
  });
}

// Render Orders Tab Content
function renderOrdersTabContent() {
  if (!userOrders || userOrders.length === 0) {
    return `
      <div style="text-align: center; padding: 48px 24px;">
        <i class="fas fa-shopping-bag" style="font-size: 3rem; color: var(--color-text-muted); margin-bottom: 16px; display: block;"></i>
        <h3 style="font-family: var(--font-display); font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; font-size: 1.15rem; margin-bottom: 8px;">Nenhum pedido encontrado</h3>
        <p style="color: var(--color-text-muted); font-size: 0.875rem;">Você ainda não realizou compras na nossa loja.</p>
        <a class="button" href="/products" style="margin-top: 24px; display: inline-block;">Ver Produtos</a>
      </div>
    `;
  }

  // Status steps definition
  const STATUS_STEPS = ['pending', 'paid', 'processing', 'shipped', 'delivered'];
  const STATUS_LABELS = {
    pending: 'Pendente',
    paid: 'Pago',
    processing: 'Em Preparo',
    shipped: 'Enviado',
    delivered: 'Entregue',
    canceled: 'Cancelado'
  };
  const STATUS_ICONS = {
    pending: 'fa-clock',
    paid: 'fa-check',
    processing: 'fa-box-open',
    shipped: 'fa-truck',
    delivered: 'fa-home',
    canceled: 'fa-times'
  };

  // Location status info generator
  function getLocationInfo(order) {
    const status = order.status || 'pending';
    switch(status) {
      case 'pending':
        return {
          title: 'Aguardando Pagamento',
          location: 'Denitex Family (Em frente à Magazine Luiza) — Centro, Sombrio / SC',
          desc: 'Assim que o pagamento for confirmado, seu pedido entrará em separação.',
          icon: 'fa-clock'
        };
      case 'paid':
        return {
          title: 'Pagamento Confirmado',
          location: 'Centro de Logística — Sombrio / SC',
          desc: 'Pagamento aprovado. Preparando pedido para entrega no Denitex Family (Centro, Sombrio/SC).',
          icon: 'fa-check-circle'
        };
      case 'processing':
        return {
          title: 'Em Separação e Embalagem',
          location: 'Centro de Distribuição MD Essential — Sombrio / SC',
          desc: 'Encomenda em embalagem para entrega local no Denitex Family (em frente à Magazine Luiza).',
          icon: 'fa-box'
        };
      case 'shipped':
        return {
          title: 'Em Rota de Entrega Local',
          location: 'Em trânsito para Denitex Family / Centro (Sombrio - SC)',
          desc: 'Entregador local a caminho do seu endereço em frente à Magazine Luiza.',
          icon: 'fa-motorcycle'
        };
      case 'delivered':
        return {
          title: 'Pedido Entregue',
          location: 'Denitex Family — Em frente à Magazine Luiza (Sombrio / SC)',
          desc: 'Entregue com sucesso no endereço de destino.',
          icon: 'fa-home'
        };
      default:
        return {
          title: 'Status do Pedido',
          location: 'Denitex Family — Sombrio / SC',
          desc: 'Processando atualização de envio.',
          icon: 'fa-info-circle'
        };
    }
  }

  function renderTimeline(currentStatus) {
    if (currentStatus === 'canceled') {
      return `
        <div style="display:flex;align-items:center;gap:8px;padding:14px 20px;color:var(--color-error);background:#fff5f5;border-bottom:1px solid var(--color-border);">
          <i class="fas fa-times-circle"></i>
          <span style="font-size:0.85rem;font-weight:700;">Pedido Cancelado</span>
        </div>
      `;
    }
    const currentIdx = STATUS_STEPS.indexOf(currentStatus);
    return `
      <div class="order-status-timeline" style="padding:20px 20px 12px;background:#ffffff;border-bottom:1px solid var(--color-border);">
        ${STATUS_STEPS.map((step, i) => {
          const isDone = i < currentIdx;
          const isActive = i === currentIdx;
          const cls = isDone ? 'done' : isActive ? 'active' : '';
          return `
            <div class="timeline-step ${cls}">
              <div class="timeline-step-dot">
                <i class="fas ${isDone ? 'fa-check' : STATUS_ICONS[step]}" style="font-size:0.65rem;"></i>
              </div>
              <div class="timeline-step-label">${STATUS_LABELS[step]}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderPaymentDetails(order) {
    const method = order.paymentMethod || 'pix'; // fallback to pix if not stored on legacy order
    const pixCode = order.pixCode || `00020126330014br.gov.bcb.pix01${order._id}52040000530398654${order.totalPrice.toFixed(2).replace('.','').padStart(6,'0')}5802BR5910MDEssential6008Sombrio62070503***6304ABCD`;
    const boletoLine = order.boletoCode || `34191.75000 ${Math.floor(Math.random()*100000).toString().padStart(5,'0')}.${Math.floor(Math.random()*1000000).toString().padStart(6,'0')} ${Math.floor(Math.random()*1000000).toString().padStart(6,'0')} 1 ${Date.now().toString().slice(-14)} ${order.totalPrice.toFixed(2).replace('.','').padStart(10,'0')}`;

    return `
      <div style="border:1px solid var(--color-border);border-radius:var(--radius-sm);background:#ffffff;padding:18px;margin-top:16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid var(--color-border);">
          <div style="font-size:0.8rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text);display:flex;align-items:center;gap:8px;">
            <i class="fas fa-credit-card" style="color:var(--color-primary);"></i>
            Dados de Pagamento (${method === 'boleto' ? 'Boleto Bancário' : method === 'credit' || method === 'debit' ? 'Cartão' : 'PIX'})
          </div>
          <span style="font-size:0.72rem;font-weight:700;color:${order.status==='paid'?'var(--color-success)':'var(--color-text-muted)'};">
            ${order.status === 'paid' ? '<i class="fas fa-check-circle"></i> PAGO' : '<i class="fas fa-clock"></i> PENDENTE'}
          </span>
        </div>

        ${method === 'boleto' ? `
          <!-- Boleto View -->
          <div style="background:var(--color-bg);border:1px solid var(--color-border);border-radius:6px;padding:14px;">
            <div style="font-size:0.75rem;font-weight:700;color:var(--color-text-muted);margin-bottom:6px;display:flex;align-items:center;gap:6px;">
              <i class="fas fa-barcode"></i> Linha Digitável do Boleto:
            </div>
            <div style="font-family:monospace;font-size:0.85rem;font-weight:700;color:var(--color-text);background:#fff;border:1px solid var(--color-border);padding:10px;border-radius:4px;word-break:break-all;margin-bottom:10px;">
              ${boletoLine}
            </div>
            <button onclick="copyToClipboard('${boletoLine}', 'Linha digitável do boleto copiada!')" class="button button-small" style="font-size:0.75rem;padding:8px 14px;display:inline-flex;align-items:center;gap:6px;">
              <i class="fas fa-copy"></i> Copiar Linha Digitável
            </button>
          </div>
        ` : `
          <!-- PIX View (Default / PIX) -->
          <div style="display:flex;gap:20px;flex-wrap:wrap;align-items:center;">
            <div style="background:#fff;border:2px solid var(--color-border);border-radius:8px;padding:10px;display:inline-block;box-shadow:var(--shadow-sm);">
              <svg width="110" height="110" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
                <rect width="160" height="160" fill="white"/>
                <rect x="10" y="10" width="50" height="50" fill="none" stroke="black" stroke-width="4"/>
                <rect x="18" y="18" width="34" height="34" fill="black"/>
                <rect x="100" y="10" width="50" height="50" fill="none" stroke="black" stroke-width="4"/>
                <rect x="108" y="18" width="34" height="34" fill="black"/>
                <rect x="10" y="100" width="50" height="50" fill="none" stroke="black" stroke-width="4"/>
                <rect x="18" y="108" width="34" height="34" fill="black"/>
                <rect x="68" y="10" width="8" height="8" fill="black"/>
                <rect x="80" y="10" width="8" height="8" fill="black"/>
                <rect x="68" y="24" width="8" height="8" fill="black"/>
                <rect x="80" y="34" width="8" height="8" fill="black"/>
                <rect x="68" y="50" width="8" height="8" fill="black"/>
                <rect x="68" y="68" width="8" height="8" fill="black"/>
                <rect x="80" y="76" width="8" height="8" fill="black"/>
                <rect x="100" y="68" width="8" height="8" fill="black"/>
                <rect x="120" y="68" width="8" height="8" fill="black"/>
                <rect x="136" y="68" width="8" height="8" fill="black"/>
                <rect x="100" y="84" width="8" height="8" fill="black"/>
                <rect x="116" y="84" width="8" height="8" fill="black"/>
                <rect x="100" y="100" width="8" height="8" fill="black"/>
                <rect x="124" y="100" width="8" height="8" fill="black"/>
                <rect x="68" y="100" width="8" height="8" fill="black"/>
                <rect x="80" y="116" width="8" height="8" fill="black"/>
                <rect x="68" y="132" width="8" height="8" fill="black"/>
              </svg>
            </div>
            <div style="flex:1;min-width:220px;">
              <div style="font-size:0.75rem;font-weight:700;color:var(--color-text-muted);margin-bottom:6px;display:flex;align-items:center;gap:6px;">
                <i class="fas fa-qrcode"></i> Código PIX Copia e Cola:
              </div>
              <div style="background:var(--color-bg);border:1px solid var(--color-border);border-radius:4px;padding:10px;font-size:0.7rem;font-family:monospace;word-break:break-all;color:var(--color-text-muted);margin-bottom:10px;max-height:54px;overflow:hidden;">
                ${pixCode}
              </div>
              <button onclick="copyToClipboard('${pixCode}', 'Código PIX copiado com sucesso!')" class="button button-small" style="font-size:0.75rem;padding:8px 14px;display:inline-flex;align-items:center;gap:6px;">
                <i class="fas fa-copy"></i> Copiar Código PIX
              </button>
            </div>
          </div>
        `}
      </div>
    `;
  }

  return `
    <div style="margin-bottom: 24px;">
      <h2 style="font-family: var(--font-display); font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; font-size: 1.25rem;">Meus Pedidos</h2>
      <p style="color: var(--color-text-muted); font-size: 0.85rem; margin-bottom: 24px;">Acompanhe o status, rastreamento e detalhes de pagamento das suas compras.</p>
    </div>
    
    <div style="display: flex; flex-direction: column; gap: 20px;">
      ${userOrders.map((order, index) => {
        const badgeColor = order.status === 'paid' || order.status === 'delivered' ? 'var(--color-success)'
          : order.status === 'shipped' || order.status === 'processing' ? 'var(--color-primary)'
          : order.status === 'canceled' ? 'var(--color-error)'
          : '#b25e00';

        const location = getLocationInfo(order);
        const isFirst = index === 0; // Auto-expand most recent order

        return `
        <div style="border: 1px solid var(--color-border); border-radius: var(--radius-md); overflow: hidden; background-color: #ffffff; box-shadow: var(--shadow-sm);">
          
          <!-- Order Header (clickable to toggle) -->
          <div onclick="toggleOrderDetails('${order._id}')" style="background-color: var(--color-bg); padding: 18px 20px; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; cursor: pointer; user-select: none;">
            <div>
              <span style="font-size: 0.68rem; font-weight: 700; color: var(--color-text-muted); display: block; text-transform: uppercase; letter-spacing: 0.05em;">NÚMERO DO PEDIDO</span>
              <strong style="font-size: 1rem; font-family: var(--font-display); color: var(--color-text);">#${order._id.slice(-6).toUpperCase()}</strong>
            </div>
            <div>
              <span style="font-size: 0.68rem; font-weight: 700; color: var(--color-text-muted); display: block; text-transform: uppercase; letter-spacing: 0.05em;">DATA</span>
              <strong style="font-size: 0.875rem; color: var(--color-text);">${new Date(order.createdAt).toLocaleDateString('pt-BR')}</strong>
            </div>
            <div>
              <span style="font-size: 0.68rem; font-weight: 700; color: var(--color-text-muted); display: block; text-transform: uppercase; letter-spacing: 0.05em;">VALOR TOTAL</span>
              <strong style="font-size: 1rem; color: var(--color-text);">R$ ${order.totalPrice.toFixed(2)}</strong>
            </div>
            <div>
              <span style="font-size: 0.68rem; font-weight: 700; color: var(--color-text-muted); display: block; margin-bottom: 3px; text-transform: uppercase; letter-spacing: 0.05em;">STATUS</span>
              <span style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; padding: 4px 12px; border-radius: 12px; display: inline-flex; align-items: center; gap: 6px; background: ${badgeColor}18; color: ${badgeColor}; border: 1px solid ${badgeColor}40;">
                <i class="fas ${STATUS_ICONS[order.status] || 'fa-circle'}"></i>
                ${STATUS_LABELS[order.status] || order.status}
              </span>
            </div>
            <button class="button button-small" style="background: #fff; border: 1px solid var(--color-border); color: var(--color-text); font-size: 0.75rem; padding: 8px 14px; display: flex; align-items: center; gap: 6px;" id="toggle-${order._id}">
              <i class="fas ${isFirst ? 'fa-chevron-up' : 'fa-chevron-down'}" id="icon-${order._id}"></i>
              <span id="label-${order._id}">${isFirst ? 'Ocultar' : 'Ver Detalhes'}</span>
            </button>
          </div>

          <!-- Status Timeline -->
          ${renderTimeline(order.status)}

          <!-- Expandable Details -->
          <div id="details-${order._id}" style="display: ${isFirst ? 'block' : 'none'}; padding: 22px; background: #fff;">
            
            <!-- Location & Delivery Tracking Box -->
            <div style="background: var(--color-bg); border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: 16px; margin-bottom: 20px;">
              <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-text); margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
                <i class="fas ${location.icon}" style="color: var(--color-primary);"></i>
                Rastreamento e Localização
              </div>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; font-size: 0.85rem;">
                <div>
                  <span style="font-size: 0.7rem; color: var(--color-text-muted); display: block; font-weight: 600;">LOCALIZAÇÃO ATUAL:</span>
                  <strong style="color: var(--color-text);"><i class="fas fa-map-marker-alt" style="color:var(--color-primary);margin-right:4px;"></i>${location.location}</strong>
                </div>
                <div>
                  <span style="font-size: 0.7rem; color: var(--color-text-muted); display: block; font-weight: 600;">STATUS DE ENVIO:</span>
                  <span style="color: var(--color-text); font-weight: 600;">${location.desc}</span>
                </div>
              </div>

              ${order.trackingCode ? `
                <div style="margin-top: 14px; padding-top: 12px; border-top: 1px dashed var(--color-border); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
                  <div>
                    <span style="font-size: 0.7rem; color: var(--color-text-muted); font-weight: 700; text-transform: uppercase;">CÓDIGO DE RASTREIO CORREIOS:</span>
                    <div style="font-family: monospace; font-size: 1rem; font-weight: 800; color: var(--color-text);">${order.trackingCode}</div>
                  </div>
                  <a href="https://rastreamento.correios.com.br/app/index.php?numero=${order.trackingCode}" target="_blank" class="button button-small" style="font-size: 0.75rem; padding: 8px 14px; display: inline-flex; align-items: center; gap: 6px;">
                    <i class="fas fa-external-link-alt"></i> Rastrear nos Correios
                  </a>
                </div>
              ` : ''}
            </div>

            <!-- Items Purchased -->
            <div style="margin-bottom: 20px;">
              <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-text-muted); margin-bottom: 12px;">
                Itens do Pedido (${order.items.length})
              </div>
              <div style="display: flex; flex-direction: column; gap: 10px;">
                ${order.items.map(item => `
                  <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.875rem; padding: 12px 14px; background: var(--color-bg); border-radius: var(--radius-sm); border: 1px solid var(--color-border);">
                    <div>
                      <strong style="color: var(--color-text); font-size: 0.9rem;">${item.name}</strong>
                      <div style="display:flex;gap:6px;margin-top:4px;">
                        ${item.size ? `<span style="font-size: 0.68rem; font-weight: 700; color: var(--color-text-muted); background: #fff; border: 1px solid var(--color-border); padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">TAM: ${item.size}</span>` : ''}
                        ${item.color ? `<span style="font-size: 0.68rem; font-weight: 700; color: var(--color-text-muted); background: #fff; border: 1px solid var(--color-border); padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">COR: ${item.color}</span>` : ''}
                      </div>
                    </div>
                    <div style="text-align: right;">
                      <span style="font-size: 0.75rem; color: var(--color-text-muted); display: block;">${item.quantity}x R$ ${item.price.toFixed(2)}</span>
                      <strong style="color: var(--color-text); font-size: 0.9rem;">R$ ${(item.quantity * item.price).toFixed(2)}</strong>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Payment Details Section -->
            ${renderPaymentDetails(order)}

          </div>
        </div>
      `}).join('')}
    </div>
  `;
}

// Global helper to copy text to clipboard with feedback
window.copyToClipboard = function(text, message) {
  navigator.clipboard.writeText(text).then(() => {
    alert(message || 'Copiado com sucesso!');
  }).catch(() => {
    alert('Erro ao copiar. Selecione o código manualmente.');
  });
};

// Toggle order details expansion
window.toggleOrderDetails = function(orderId) {
  const details = document.getElementById(`details-${orderId}`);
  const icon = document.getElementById(`icon-${orderId}`);
  const label = document.getElementById(`label-${orderId}`);
  if (!details) return;
  const isOpen = details.style.display !== 'none';
  details.style.display = isOpen ? 'none' : 'block';
  if (icon) icon.className = isOpen ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
  if (label) label.textContent = isOpen ? 'Ver Detalhes' : 'Ocultar';
};


// Trigger initial load
loadUserProfile();
