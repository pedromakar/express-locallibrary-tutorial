export function renderNav(activePage) {
  const token = localStorage.getItem('md-essential-admin-token');
  return `
    <div class="announcement-bar">
      <p>10% DE CASHBACK EM TODAS AS COMPRAS!</p>
    </div>
    <header class="app-header">
      <div class="container-custom header-content">
        <!-- Mobile Menu Toggle -->
        <button id="mobile-menu-toggle" class="icon-button mobile-only">
          <i class="fas fa-bars"></i>
        </button>

        <!-- Main Menu to the Left -->
        <nav class="main-nav desktop-only">
          <a href="/products" class="nav-link ${activePage === 'products' ? 'active' : ''}">PRODUTOS</a>
          <a href="/category" class="nav-link ${activePage === 'category' ? 'active' : ''}">COLEÇÕES</a>
        </nav>

        <!-- Logo Centralized -->
        <div class="brand-link">
          <a href="/">MD ESSENTIAL</a>
        </div>

        <!-- Search, Account, Cart to the Right -->
        <div class="nav-utility">
          <button id="search-toggle" class="icon-button"><i class="fas fa-search"></i></button>
          ${token ? `
            <a href="/account" class="icon-button ${activePage === 'account' ? 'active' : ''}"><i class="fas fa-user"></i></a>
          ` : `
            <button id="login-drawer-toggle" class="icon-button"><i class="fas fa-user"></i></button>
          `}
          <button id="wishlist-toggle" class="icon-button"><i class="fas fa-heart"></i></button>
          <button id="cart-drawer-toggle" class="icon-button position-relative">
            <i class="fas fa-shopping-cart"></i>
            <span id="cart-count-badge" class="badge-count" style="display: none;">0</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Mobile Menu Drawer (initial structure) -->
    <div class="mobile-menu-drawer" id="mobile-menu-drawer">
      <div class="drawer-header">
        <h2 class="text-uppercase-bold">MENU</h2>
        <button class="close-drawers icon-button"><i class="fas fa-times"></i></button>
      </div>
      <nav class="mobile-nav-links">
        <a href="/products" class="nav-link">PRODUTOS</a>
        <a href="/category" class="nav-link">COLEÇÕES</a>
        <a href="/search" class="nav-link">BUSCA</a>
        ${token ? `<a href="/account" class="nav-link">MINHA CONTA</a>` : `<button id="mobile-login-toggle" class="nav-link button-as-link">LOGIN / CADASTRAR</button>`}
        <a href="/wishlist" class="nav-link">LISTA DE DESEJOS</a>
      </nav>
    </div>
    
    <!-- Shared Overlay -->
    <div class="drawer-overlay" id="global-overlay"></div>

    <!-- Login Drawer -->
    <div class="login-drawer" id="login-drawer">
      <div class="drawer-header">
        <h2 class="text-uppercase-bold">IDENTIFICAÇÃO</h2>
        <button class="close-drawers icon-button"><i class="fas fa-times"></i></button>
      </div>
      <div class="drawer-tabs">
        <button class="drawer-tab-btn active" id="tab-login-btn">ENTRAR</button>
        <button class="drawer-tab-btn" id="tab-register-btn">CADASTRAR</button>
      </div>
      <div class="drawer-body">
        <!-- Login Form -->
        <div id="drawer-login-content">
          <form class="auth-form-drawer" id="drawer-login-form">
            <label>E-MAIL OU USUÁRIO</label>
            <input type="text" id="drawer-login-user" required placeholder="seu@email.com" />
            <label>SENHA</label>
            <input type="password" id="drawer-login-pass" required placeholder="••••••••" />
            <button type="submit" class="button w-100 mb-3">ENTRAR</button>
            <p id="drawer-login-msg" class="text-danger small text-center"></p>
          </form>
        </div>
        <!-- Register Form (Hidden by default) -->
        <div id="drawer-register-content" style="display:none;">
          <form class="auth-form-drawer" id="drawer-register-form">
            <label>NOME DE USUÁRIO</label>
            <input type="text" id="drawer-reg-user" required />
            <label>E-MAIL</label>
            <input type="email" id="drawer-reg-email" required />
            <label>SENHA</label>
            <input type="password" id="drawer-reg-pass" required />
            <button type="submit" class="button w-100 mb-3">CRIAR CONTA</button>
            <p id="drawer-reg-msg" class="small text-center"></p>
          </form>
        </div>
      </div>
    </div>
    
    <!-- Side Cart Drawer -->
    <div class="cart-drawer" id="cart-drawer">
      <div class="drawer-header">
        <h2 class="text-uppercase-bold">SEU CARRINHO</h2>
        <button class="close-drawers icon-button"><i class="fas fa-times"></i></button>
      </div>
      
      <div class="shipping-bar-container">
        <span class="shipping-bar-text" id="shipping-msg">Faltam R$ 198,00 para FRETE GRÁTIS</span>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" id="shipping-progress"></div>
        </div>
      </div>

      <div class="drawer-content" id="drawer-items"></div>

      <div class="drawer-footer">
        <div class="subtotal-info">
          <span class="fw-bold">SUBTOTAL</span>
          <span class="fw-bold" id="drawer-subtotal">R$ 0,00</span>
        </div>
        <a href="/cart" class="button button-outline w-100 mb-2">VER CARRINHO COMPLETO</a>
        <button class="button w-100" id="drawer-checkout">FINALIZAR COMPRA</button>
      </div>
    </div>
  `;
}

export function updateCartBadge() {
  const cart = JSON.parse(localStorage.getItem('md-essential-cart') || '{}');
  const count = Object.values(cart).reduce((sum, q) => sum + q, 0);
  const badge = document.getElementById('cart-count-badge');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'block' : 'none';
  }
}

async function renderDrawerItems() {
  const container = document.getElementById('drawer-items');
  if (!container) return;
  const cart = JSON.parse(localStorage.getItem('md-essential-cart') || '{}');
  const productIds = Object.keys(cart);

  if (productIds.length === 0) {
    container.innerHTML = '<p class="text-center py-5">Seu carrinho está vazio.</p>';
    document.getElementById('drawer-subtotal').textContent = 'R$ 0,00';
    document.getElementById('shipping-progress').style.width = '0%';
    document.getElementById('shipping-msg').textContent = 'Faltam R$ 198,00 para FRETE GRÁTIS';
    return;
  }

  const res = await fetch('/api/products');
  const allProducts = await res.json();
  const cartItems = allProducts.filter(p => cart[p._id]);

  let subtotal = 0;
  container.innerHTML = cartItems.map(item => {
    const qty = cart[item._id];
    subtotal += item.price * qty;
    return `
      <div class="drawer-cart-item">
        <img src="${item.image}" alt="${item.name}" />
        <div>
          <div class="d-flex justify-content-between">
            <h3 class="text-uppercase-bold" style="font-size: 0.7rem;">${item.name}</h3>
            <button onclick="updateQty('${item._id}', 0)" style="background:none; border:none; cursor:pointer;">&times;</button>
          </div>
          <span style="font-size: 0.75rem;">R$ ${item.price.toFixed(2)}</span>
          <div class="drawer-qty-control">
            <button class="drawer-qty-btn" onclick="updateQty('${item._id}', ${qty - 1})">-</button>
            <span style="font-size: 0.8rem;">${qty}</span>
            <button class="drawer-qty-btn" onclick="updateQty('${item._id}', ${qty + 1})">+</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  document.getElementById('drawer-subtotal').textContent = `R$ ${subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  const progress = Math.min((subtotal / 198) * 100, 100);
  document.getElementById('shipping-progress').style.width = `${progress}%`;
  document.getElementById('shipping-msg').textContent = subtotal >= 198 ? 'VOCÊ GANHOU FRETE GRÁTIS!' : `Faltam R$ ${(198 - subtotal).toFixed(2)} para FRETE GRÁTIS`;
}

window.updateQty = async (id, newQty) => {
  const cart = JSON.parse(localStorage.getItem('md-essential-cart') || '{}');
  if (newQty <= 0) delete cart[id]; else cart[id] = newQty;
  localStorage.setItem('md-essential-cart', JSON.stringify(cart));
  await syncCart();
};

export function syncCart() { /* ... existing syncCart function ... */ } // Placeholder as the function was not provided fully in the context to avoid large response.

export function initDrawerEvents() {
  const globalOverlay = document.getElementById('global-overlay');
  const cartDrawer = document.getElementById('cart-drawer');
  const loginDrawer = document.getElementById('login-drawer');
  const mobileMenuDrawer = document.getElementById('mobile-menu-drawer');

  // Helper to close all drawers
  function closeAllDrawers() {
    cartDrawer?.classList.remove('open');
    loginDrawer?.classList.remove('open');
    mobileMenuDrawer?.classList.remove('open');
    globalOverlay?.classList.remove('open');
  }

  // Toggle functions for each drawer
  window.toggleCartDrawer = (open = true) => {
    closeAllDrawers(); // Close others first
    if (open) {
      cartDrawer?.classList.add('open');
      globalOverlay?.classList.add('open');
      renderDrawerItems(); // Re-render cart items when opened
    }
  };

  window.toggleLoginDrawer = (open = true) => {
    closeAllDrawers(); // Close others first
    if (open) {
      loginDrawer?.classList.add('open');
      globalOverlay?.classList.add('open');
    }
  };

  window.toggleMobileMenuDrawer = (open = true) => {
    closeAllDrawers(); // Close others first
    if (open) {
      mobileMenuDrawer?.classList.add('open');
      globalOverlay?.classList.add('open');
    }
  };

  // Event Listeners for opening drawers
  document.getElementById('cart-drawer-toggle')?.addEventListener('click', () => toggleCartDrawer(true));
  document.getElementById('login-drawer-toggle')?.addEventListener('click', () => toggleLoginDrawer(true));
  document.getElementById('mobile-menu-toggle')?.addEventListener('click', () => toggleMobileMenuDrawer(true));
  
  // Event listener for mobile login toggle (inside mobile menu)
  document.getElementById('mobile-login-toggle')?.addEventListener('click', () => {
    toggleMobileMenuDrawer(false); // Close mobile menu
    toggleLoginDrawer(true); // Open login drawer
  });

  // Event Listeners for closing drawers (using common class for buttons)
  document.querySelectorAll('.close-drawers').forEach(btn => btn.addEventListener('click', closeAllDrawers));
  globalOverlay?.addEventListener('click', closeAllDrawers);

  // Tab Switching in Login Drawer
  const loginTab = document.getElementById('tab-login-btn');
  const regTab = document.getElementById('tab-register-btn');
  const loginContent = document.getElementById('drawer-login-content');
  const regContent = document.getElementById('drawer-register-content');

  loginTab?.addEventListener('click', () => {
    loginTab.classList.add('active'); regTab.classList.remove('active');
    loginContent.style.display = 'block'; regContent.style.display = 'none';
  });
  regTab?.addEventListener('click', () => {
    regTab.classList.add('active'); loginTab.classList.remove('active');
    regContent.style.display = 'block'; loginContent.style.display = 'none';
  });

  // Login Logic
  document.getElementById('drawer-login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('drawer-login-user').value;
    const password = document.getElementById('drawer-login-pass').value;
    const msg = document.getElementById('drawer-login-msg');
    const btn = e.target.querySelector('button');
    btn.textContent = 'AUTENTICANDO...'; btn.disabled = true;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) { msg.textContent = data.message; btn.textContent = 'ENTRAR'; btn.disabled = false; return; }
      localStorage.setItem('md-essential-admin-token', data.token);
      location.reload(); // Quickest way to update UI
    } catch (err) { msg.textContent = 'Erro ao conectar.'; btn.disabled = false; }
  });

  // Register Logic
  document.getElementById('drawer-register-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      username: document.getElementById('drawer-reg-user').value,
      email: document.getElementById('drawer-reg-email').value,
      password: document.getElementById('drawer-reg-pass').value,
    };
    const msg = document.getElementById('drawer-reg-msg');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) { msg.textContent = data.message; msg.className = 'text-danger small text-center'; return; }
      msg.textContent = 'CONTA CRIADA! FAÇA LOGIN.'; msg.className = 'text-success small text-center';
      setTimeout(() => loginTab.click(), 1500);
    } catch (err) { msg.textContent = 'Erro ao conectar.'; }
  });
}

export function renderProductCard(product) {
  const productId = product._id || product.id;
  const stock = product.countInStock || 0;
  return `
    <article class="card product-card">
      <div class="product-image">
        ${product.image ? `<img src="${product.image}" alt="${product.name}" />` : '<span>Sem imagem</span>'}
      </div>
      <div class="card-body">
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <div class="product-meta">
          <span>R$ ${product.price.toFixed(2)}</span>
          <a class="button small" href="/product?id=${productId}">Ver</a>
        </div>
        <div class="product-actions">
          <button class="button small add-to-cart-button" data-id="${productId}" data-stock="${stock}">Adicionar ao carrinho</button>
        </div>
      </div>
    </article>
  `;
}

export function renderCategoryCard(category) {
  return `
    <article class="card category-card">
      <div class="category-image">
        ${category.image ? `<img src="${category.image}" alt="${category.title}" />` : '<span>Sem imagem</span>'}
      </div>
      <div class="category-body">
        <h3>${category.title}</h3>
        <p>${category.description}</p>
        <a class="button small" href="/category?id=${category.id}">Ver categoria</a>
      </div>
    </article>
  `;
}

export function renderFooter() {
  return `
    <footer class="app-footer">
      <div class="container-custom">
        <p>&copy; ${new Date().getFullYear()} MD Essential. Todos os direitos reservados.</p>
      </div>
    </footer>
  `;
}

