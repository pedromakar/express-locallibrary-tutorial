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
      <nav class="mobile-nav-links">
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

    <!-- Search Drawer -->
    <div class="search-drawer" id="search-drawer">
      <div class="drawer-header">
        <h2 class="text-uppercase-bold">BUSCAR PRODUTO</h2>
        <button class="close-drawers icon-button"><i class="fas fa-times"></i></button>
      </div>
      <div class="drawer-body">
        <form id="global-search-form" class="auth-form-drawer">
          <label>O QUE VOCÊ PROCURA?</label>
          <div class="position-relative">
            <input type="text" id="global-search-input" placeholder="Ex: Regata, T-shirt, Legging..." required />
            <button type="submit" class="icon-button" style="position: absolute; right: 10px; top: 10px; padding: 5px;">
              <i class="fas fa-search"></i>
            </button>
          </div>
        </form>
        <div id="search-results-preview" class="mt-4"></div>
      </div>
    </div>
  `;
}

export function getSafeCart() {
  try {
    const raw = localStorage.getItem('md-essential-cart');
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch (e) {
    console.error('Erro ao fazer parse do carrinho no localStorage:', e);
  }
  return {};
}

export function updateCartBadge() {
  const cart = getSafeCart();
  const count = Object.values(cart).reduce((sum, item) => sum + (item && typeof item === 'object' ? item.quantity : 0), 0);
  const badge = document.getElementById('cart-count-badge');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'block' : 'none';
  }
}

async function renderDrawerItems() {
  const container = document.getElementById('drawer-items');
  if (!container) return;
  const cart = getSafeCart();
  const cartKeys = Object.keys(cart);

  if (cartKeys.length === 0) {
    container.innerHTML = '<p class="text-center py-5">Seu carrinho está vazio.</p>';
    document.getElementById('drawer-subtotal').textContent = 'R$ 0,00';
    document.getElementById('shipping-progress').style.width = '0%';
    document.getElementById('shipping-msg').textContent = 'Faltam R$ 198,00 para FRETE GRÁTIS';
    return;
  }

  // Fetch products to get details
  const res = await fetch('/api/products');
  const allProducts = await res.json();

  let subtotal = 0;
  container.innerHTML = cartKeys.map(key => {
    const item = cart[key];
    if (!item) return '';
    const product = allProducts.find(p => p._id === item.productId);
    if (!product) return '';

    const qty = item.quantity;
    subtotal += product.price * qty;
    
    return `
      <div class="drawer-cart-item">
        <img src="${product.image || product.images[0]}" alt="${product.name}" />
        <div>
          <div class="d-flex justify-content-between">
            <h3 class="text-uppercase-bold" style="font-size: 0.7rem;">${product.name}</h3>
            <button class="drawer-remove-btn" data-action="remove" data-key="${key}" style="background:none; border:none; cursor:pointer;">&times;</button>
          </div>
          <div class="item-variations">
            ${item.size ? `<span class="item-variation">${item.size}</span>` : ''}
            ${item.color ? `<span class="item-variation">${item.color}</span>` : ''}
          </div>
          <span style="font-size: 0.75rem;">R$ ${product.price.toFixed(2)}</span>
          <div class="drawer-qty-control">
            <button class="drawer-qty-btn" data-action="decrease" data-key="${key}" data-stock="${product.countInStock}">-</button>
            <span style="font-size: 0.8rem;">${qty}</span>
            <button class="drawer-qty-btn" data-action="increase" data-key="${key}" data-stock="${product.countInStock}">+</button>
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

window.updateQty = async (key, newQty, stock) => {
  console.log('window.updateQty called with:', key, newQty, stock);
  const cart = getSafeCart();
  console.log('Current cart in localStorage:', cart);
  if (newQty <= 0) delete cart[key]; 
  else {
    if (cart[key]) {
      if (stock !== undefined && newQty > stock) {
        alert('Limite de estoque atingido para este produto.');
        return;
      }
      cart[key].quantity = newQty;
    } else {
      console.warn('Key not found in cart:', key);
    }
  }
  
  localStorage.setItem('md-essential-cart', JSON.stringify(cart));
  console.log('Updated cart in localStorage:', localStorage.getItem('md-essential-cart'));
  await syncCart();
};

export async function syncCart() {
  const token = localStorage.getItem('md-essential-admin-token');
  const cart = getSafeCart();
  
  if (token) {
    const formattedCart = Object.entries(cart).map(([key, item]) => ({
      product: item.productId,
      quantity: item.quantity,
      size: item.size || null,
      color: item.color || null
    }));
    
    try {
      await fetch('/api/users/cart', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ cart: formattedCart })
      });
    } catch (err) {
      console.error('Erro ao sincronizar carrinho:', err);
    }
  }
  
  updateCartBadge();
  await renderDrawerItems();

  if (typeof window.refreshCartPage === 'function') {
    window.refreshCartPage();
  }
}

export async function loadCartFromServer() {
  const token = localStorage.getItem('md-essential-admin-token');
  if (!token) return;

  try {
    const res = await fetch('/api/users/cart', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const cartItems = await res.json();
      const cart = {};
      cartItems.forEach(item => {
        const productId = typeof item.product === 'object' ? item.product._id : item.product;
        const key = `${productId}${item.size ? `_${item.size}` : ''}${item.color ? `_${item.color}` : ''}`;
        cart[key] = {
          productId,
          quantity: item.quantity,
          size: item.size || null,
          color: item.color || null
        };
      });
      localStorage.setItem('md-essential-cart', JSON.stringify(cart));
      updateCartBadge();
    }
  } catch (err) {
    console.error('Erro ao carregar carrinho do servidor:', err);
  }
}

// Inicializa o carrinho ao carregar o script
loadCartFromServer();

export function addToCart(productId, stock, size = null, color = null, quantity = 1, openDrawer = true) {
  const cart = getSafeCart();
  
  // Unique key for combinations: productId_size_color
  const cartKey = `${productId}${size ? `_${size}` : ''}${color ? `_${color}` : ''}`;
  
  const currentQty = cart[cartKey] ? cart[cartKey].quantity : 0;
  
  if (currentQty + quantity > stock) {
    alert('Limite de estoque atingido para este produto.');
    return false;
  }

  cart[cartKey] = {
    productId,
    quantity: currentQty + quantity,
    size,
    color
  };
  
  localStorage.setItem('md-essential-cart', JSON.stringify(cart));
  
  syncCart();
  if (openDrawer) window.toggleCartDrawer(true);
  return true;
}

export function bindGlobalAddButtons() {
  document.querySelectorAll('.add-to-cart-button').forEach((button) => {
    if (button.dataset.bound) return;
    button.dataset.bound = 'true';

    button.addEventListener('click', (e) => {
      e.preventDefault();
      const productId = button.dataset.id;
      const stock = parseInt(button.dataset.stock, 10);
      
      // For quick add from list, we might not have size/color, 
      // but the logic now supports them as null.
      addToCart(productId, stock);
      
      const originalText = button.textContent;
      button.textContent = 'ADICIONADO!';
      button.classList.add('active');
      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('active');
      }, 1200);
    });
  });
}

export function initDrawerEvents() {
  const globalOverlay = document.getElementById('global-overlay');
  const cartDrawer = document.getElementById('cart-drawer');
  const loginDrawer = document.getElementById('login-drawer');
  const mobileMenuDrawer = document.getElementById('mobile-menu-drawer');
  const searchDrawer = document.getElementById('search-drawer');

  function closeAllDrawers() {
    cartDrawer?.classList.remove('open');
    loginDrawer?.classList.remove('open');
    mobileMenuDrawer?.classList.remove('open');
    searchDrawer?.classList.remove('open');
    globalOverlay?.classList.remove('open');
  }

  window.toggleCartDrawer = (open = true) => {
    closeAllDrawers();
    if (open) {
      cartDrawer?.classList.add('open');
      globalOverlay?.classList.add('open');
      renderDrawerItems();
    }
  };

  window.toggleLoginDrawer = (open = true) => {
    closeAllDrawers();
    if (open) {
      loginDrawer?.classList.add('open');
      globalOverlay?.classList.add('open');
    }
  };

  window.toggleMobileMenuDrawer = (open = true) => {
    closeAllDrawers();
    if (open) {
      mobileMenuDrawer?.classList.add('open');
      globalOverlay?.classList.add('open');
    }
  };

  window.toggleSearchDrawer = (open = true) => {
    closeAllDrawers();
    if (open) {
      searchDrawer?.classList.add('open');
      globalOverlay?.classList.add('open');
      document.getElementById('global-search-input')?.focus();
    }
  };

  document.getElementById('cart-drawer-toggle')?.addEventListener('click', () => toggleCartDrawer(true));
  document.getElementById('login-drawer-toggle')?.addEventListener('click', () => toggleLoginDrawer(true));
  document.getElementById('mobile-menu-toggle')?.addEventListener('click', () => toggleMobileMenuDrawer(true));
  document.getElementById('search-toggle')?.addEventListener('click', () => toggleSearchDrawer(true));
  
  document.getElementById('mobile-login-toggle')?.addEventListener('click', () => {
    toggleMobileMenuDrawer(false);
    toggleLoginDrawer(true);
  });

  document.querySelectorAll('.close-drawers').forEach(btn => btn.addEventListener('click', closeAllDrawers));
  globalOverlay?.addEventListener('click', closeAllDrawers);

  // Event delegation for cart drawer item quantity controls and removal
  cartDrawer?.addEventListener('click', async (e) => {
    const button = e.target.closest('[data-action]');
    if (!button) return;
    
    e.preventDefault();
    const action = button.dataset.action;
    const key = button.dataset.key;
    const stock = button.dataset.stock ? parseInt(button.dataset.stock, 10) : undefined;
    
    const cart = getSafeCart();
    if (!cart[key]) return;
    
    let newQty = cart[key].quantity;
    if (action === 'increase') {
      newQty += 1;
    } else if (action === 'decrease') {
      newQty -= 1;
    } else if (action === 'remove') {
      newQty = 0;
    }
    
    await window.updateQty(key, newQty, stock);
  });

  // Global Search Functionality
  const searchForm = document.getElementById('global-search-form');
  const searchInput = document.getElementById('global-search-input');
  const searchResults = document.getElementById('search-results-preview');

  searchForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (!query) return;

    searchResults.innerHTML = '<p class="text-center py-3">Buscando...</p>';

    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(query)}`);
      const products = await res.json();

      if (products.length === 0) {
        searchResults.innerHTML = '<p class="text-center py-3">Nenhum produto encontrado.</p>';
      } else {
        searchResults.innerHTML = `
          <div class="search-grid-preview" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            ${products.slice(0, 4).map(p => `
              <a href="/product?id=${p._id}" class="search-item-preview" style="display: block; text-decoration: none; color: inherit;">
                <img src="${p.image || p.images[0]}" style="width: 100%; aspect-ratio: 3/4; object-fit: cover; border-radius: 4px;" />
                <h4 style="font-size: 0.7rem; margin-top: 5px; text-transform: uppercase;">${p.name}</h4>
                <p style="font-size: 0.75rem; font-weight: 800; color: var(--color-accent);">R$ ${p.price.toFixed(2)}</p>
              </a>
            `).join('')}
          </div>
          ${products.length > 4 ? `<a href="/products?search=${encodeURIComponent(query)}" class="button small w-100 mt-3">VER TODOS OS ${products.length} RESULTADOS</a>` : ''}
        `;
      }
    } catch (err) {
      searchResults.innerHTML = '<p class="text-center py-3">Erro ao buscar.</p>';
    }
  });

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
      localStorage.setItem('md-essential-user-id', data._id || data.id); // Storing user ID for history lookups
      location.reload();
    } catch (err) { msg.textContent = 'Erro ao conectar.'; btn.disabled = false; }
  });

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

  document.getElementById('drawer-checkout')?.addEventListener('click', () => {
    const cart = JSON.parse(localStorage.getItem('md-essential-cart') || '{}');
    if (Object.keys(cart).length === 0) {
      alert('Seu carrinho está vazio.');
      return;
    }
    closeAllDrawers();
    window.location.href = '/checkout';
  });
}

export function renderProductCard(product) {
  const productId = product._id || product.id;
  const stock = product.countInStock || 0;
  const badge = product.badge;
  const image = product.image || (product.images && product.images.length ? product.images[0] : '');

  return `
    <article class="card product-card">
      <div class="product-image">
        ${badge ? `<div class="badge">${badge}</div>` : ''}
        ${image ? `<img src="${image}" alt="${product.name}" />` : '<span>Sem imagem</span>'}
        <div class="product-card-overlay">
           <a class="button small" href="/product?id=${productId}">VER DETALHES</a>
        </div>
      </div>
      <div class="card-body">
        <h3 class="product-title">${product.name}</h3>
        <div class="product-price-row">
          <span class="price-tag">R$ ${product.price.toFixed(2)}</span>
        </div>
        
        <div class="product-variations-preview">
          <div class="swatches-row">
            <span class="swatch" style="background: #000;"></span>
            <span class="swatch" style="background: #fff; border: 1px solid #ddd;"></span>
            <span class="swatch" style="background: #808080;"></span>
          </div>
          <div class="sizes-row">
            <span>P</span>
            <span>M</span>
            <span>G</span>
            <span>GG</span>
          </div>
        </div>

        <div class="product-actions mt-auto">
          <button class="button small w-100 add-to-cart-button" 
                  data-id="${productId}" 
                  data-stock="${stock}">
            ADICIONAR AO CARRINHO
          </button>
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
