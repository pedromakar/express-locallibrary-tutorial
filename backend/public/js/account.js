import { renderNav, renderFooter, initDrawerEvents, updateCartBadge } from './ui.js?v=2';

const root = document.getElementById('page-root');
const token = localStorage.getItem('md-essential-admin-token');

// Redirect to login if not authenticated
if (!token) {
  window.location.href = '/login.html?redirect=account';
}

// State management
let userData = null;
let activeTab = 'perfil'; // 'perfil', 'enderecos', 'marketing'

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
        renderDashboard();
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

// Trigger initial load
loadUserProfile();
