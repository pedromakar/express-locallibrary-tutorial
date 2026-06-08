import { renderNav, renderFooter, syncCart } from './ui.js';

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
    syncCart();
  } catch (err) {
    window.location.href = '/login';
  }
}

function renderProfile(user) {
  root.innerHTML = `
    ${renderNav('account')}
    <main class="container-custom py-5">
      <section class="section-grid">
        <div class="grid-header text-start border-0 mb-5">
          <h1 class="text-uppercase-bold" style="font-size: 2.5rem;">MINHA CONTA</h1>
        </div>
        
        <div class="row g-5">
          <div class="col-lg-4">
            <div class="summary-box" style="background: #f9f9f9; padding: 40px; border-radius: var(--radius-sm);">
              <p class="mb-2" style="font-size: 0.65rem; letter-spacing: 0.2em; color: var(--accent-red); font-weight: 900;">PERFIL</p>
              <h2 class="text-uppercase-bold mb-4" style="font-size: 1.2rem;">${user.username}</h2>
              
              <div class="mb-4">
                <label style="font-size: 0.6rem; opacity: 0.6;">EMAIL</label>
                <p class="fw-bold" style="font-size: 0.9rem;">${user.email}</p>
              </div>
              
              <div class="mb-5">
                <label style="font-size: 0.6rem; opacity: 0.6;">TIPO DE CONTA</label>
                <p class="text-muted text-uppercase small" style="letter-spacing: 0.1em;">${user.role === 'admin' ? 'Administrador' : 'Cliente'}</p>
              </div>
              
              <button id="logout-button" class="button button-outline w-100">SAIR DA CONTA</button>
              
              ${user.role === 'admin' ? `
                <div class="mt-4 pt-4 border-top">
                  <p class="small text-uppercase mb-3" style="font-size: 0.6rem; opacity: 0.6; font-weight: 900;">ACESSO ADMINISTRATIVO</p>
                  <a href="/admin" class="button button-accent w-100">PAINEL DE CONTROLE</a>
                </div>
              ` : ''}
            </div>
          </div>
          
          <div class="col-lg-8">
            <div class="grid-header text-start border-0 mb-4">
              <h2 class="text-uppercase-bold" style="font-size: 1.2rem;">HISTÓRICO DE PEDIDOS</h2>
            </div>
            <div id="order-history" class="text-center py-5" style="background: #fdfdfd; border: 1px dashed var(--border-light);">
              <p class="text-muted small text-uppercase" style="letter-spacing: 0.1em;">Você ainda não realizou nenhum pedido.</p>
              <a href="/products" class="button button-small mt-4">COMEÇAR A COMPRAR</a>
            </div>
          </div>
        </div>
      </section>
    </main>
    ${renderFooter()}
  `;

  document.getElementById('logout-button').addEventListener('click', () => {
    localStorage.removeItem('md-essential-admin-token');
    localStorage.removeItem('md-essential-cart'); // Clear the local cart on logout
    window.location.href = '/';
  });
  initDrawerEvents(); // Add this line
}

fetchProfile();
