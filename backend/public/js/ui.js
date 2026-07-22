export function renderNav(activePage) {
  const token = localStorage.getItem('md-essential-admin-token');

  const megaMenuData = {
    masculino: {
      columns: [
        { title: 'ROUPAS', links: [
          { label: 'Regatas', href: '/products?category=Regatas' },
          { label: 'Camisetas', href: '/products?category=Camisetas' },
          { label: 'Shorts', href: '/products?category=Shorts' },
          { label: 'Calças', href: '/products?category=Calças' },
          { label: 'Moletons', href: '/products?category=Moletom' },
        ]},
        { title: 'COLEÇÕES', links: [
          { label: 'Heavy', href: '/category.html?id=Heavy' },
          { label: 'Performance', href: '/category.html?id=Performance' },
          { label: 'Casual', href: '/category.html?id=Casual' },
          { label: 'Inverno', href: '/category.html?id=Moletom' },
        ]},
        { title: 'DESTAQUES', links: [
          { label: 'Mais vendidos', href: '/products' },
          { label: 'Promoções', href: '/products' },
          { label: 'Lançamentos', href: '/products' },
          { label: 'Novidades', href: '/products' },
        ]},
      ],
      image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=600&q=80',
      viewAllLabel: 'Ver tudo em Masculino',
      viewAllHref: '/products',
    },
    feminino: {
      columns: [
        { title: 'ROUPAS', links: [
          { label: 'Leggings', href: '/products?category=Leggings' },
          { label: 'Tops', href: '/products?category=Tops' },
          { label: 'Croppeds', href: '/products?category=Croppeds' },
          { label: 'Shorts', href: '/products?category=Shorts' },
        ]},
        { title: 'COLEÇÕES', links: [
          { label: 'Alpha Cut', href: '/category.html?id=AlphaCut' },
          { label: 'CoreFlex', href: '/category.html?id=CoreFlex' },
          { label: 'Performance', href: '/category.html?id=Performance' },
        ]},
        { title: 'DESTAQUES', links: [
          { label: 'Mais vendidos', href: '/products' },
          { label: 'Promoções', href: '/products' },
          { label: 'Lançamentos', href: '/products' },
        ]},
      ],
      image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=600&q=80',
      viewAllLabel: 'Ver tudo em Feminino',
      viewAllHref: '/products',
    },
    colecoes: {
      columns: [
        { title: 'DROPS', links: [
          { label: 'Drop 01', href: '/products' },
          { label: 'Drop 02', href: '/products' },
          { label: 'Drop 03', href: '/products' },
        ]},
        { title: 'LINHAS', links: [
          { label: 'Performance', href: '/category.html?id=Performance' },
          { label: 'Heavy', href: '/category.html?id=Heavy' },
          { label: 'Casual', href: '/category.html?id=Casual' },
        ]},
        { title: 'ESPECIAL', links: [
          { label: 'Inverno', href: '/category.html?id=Moletom' },
          { label: 'Verão', href: '/products' },
          { label: 'Kits', href: '/category.html?id=Kits' },
        ]},
      ],
      image: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=600&q=80',
      viewAllLabel: 'Ver todas as Coleções',
      viewAllHref: '/category',
    },
    acessorios: {
      columns: [
        { title: 'TIPOS', links: [
          { label: 'Bonés', href: '/products?category=Bonés' },
          { label: 'Meias', href: '/products?category=Meias' },
          { label: 'Luvas', href: '/products?category=Luvas' },
          { label: 'Mochilas', href: '/products?category=Mochilas' },
        ]},
        { title: 'DESTAQUES', links: [
          { label: 'Mais vendidos', href: '/products' },
          { label: 'Novidades', href: '/products' },
          { label: 'Kits', href: '/category.html?id=Kits' },
        ]},
        { title: '', links: [] },
      ],
      image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=600&q=80',
      viewAllLabel: 'Ver todos os Acessórios',
      viewAllHref: '/products',
    },
  };

  function renderMegaPanel(key, data) {
    return `
      <div class="mega-menu-container" id="mega-${key}" data-menu="${key}">
        <div class="mega-menu-inner">
          ${data.columns.map(col => col.title ? `
            <div class="mega-menu-column">
              <h4>${col.title}</h4>
              ${col.links.map(l => `<a href="${l.href}">${l.label}</a>`).join('')}
            </div>
          ` : '<div class="mega-menu-column"></div>').join('')}
          <div class="mega-menu-image">
            <img src="${data.image}" alt="${key}" loading="lazy" />
          </div>
          <div class="mega-menu-footer">
            <a href="${data.viewAllHref}">${data.viewAllLabel} →</a>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <!-- Announcement Bar -->
    <div class="announcement-bar" id="announcement-bar">
      <p>FRETE GRÁTIS ACIMA DE R$ 198 · 10% CASHBACK NA PRIMEIRA COMPRA</p>
    </div>

    <!-- Header -->
    <header class="app-header" id="app-header">
      <div class="container header-content">
        <!-- Mobile Menu Toggle -->
        <button id="mobile-menu-toggle" class="icon-button mobile-only">
          <i class="fas fa-bars"></i>
        </button>

        <!-- Main Navigation (Desktop) -->
        <nav class="main-nav desktop-only">
          <a class="nav-link" data-mega="masculino" href="/products">Masculino</a>
          <a class="nav-link" data-mega="feminino" href="/products">Feminino</a>
          <a class="nav-link" data-mega="colecoes" href="/category">Coleções</a>
          <a class="nav-link" data-mega="acessorios" href="/products">Acessórios</a>
        </nav>

        <!-- Logo (Centered) -->
        <div class="brand-link">
          <a href="/">MD ESSENTIAL</a>
        </div>

        <!-- Utility Icons -->
        <div class="nav-utility">
          <button id="search-toggle" class="icon-button"><i class="fas fa-search"></i></button>
          ${token ? `
            <a href="/account" class="icon-button ${activePage === 'account' ? 'active' : ''}"><i class="fas fa-user"></i></a>
          ` : `
            <button id="login-drawer-toggle" class="icon-button"><i class="fas fa-user"></i></button>
          `}
          <button id="cart-drawer-toggle" class="icon-button">
            <i class="fas fa-shopping-bag"></i>
            <span id="cart-count-badge" class="badge-count" style="display: none;">0</span>
          </button>
        </div>
      </div>

      <!-- Mega Menu Panels -->
      ${Object.entries(megaMenuData).map(([key, data]) => renderMegaPanel(key, data)).join('')}
    </header>

    <!-- Mega Menu Overlay -->
    <div class="mega-menu-overlay" id="mega-menu-overlay"></div>

    <!-- Mobile Menu Drawer -->
    <div class="mobile-menu-drawer" id="mobile-menu-drawer">
      <div class="drawer-header">
        <span class="brand-link"><a href="/">MD ESSENTIAL</a></span>
        <button class="close-drawers icon-button"><i class="fas fa-times"></i></button>
      </div>
      <div class="drawer-body" style="justify-content: flex-start; align-items: stretch; padding-top: 32px;">
        <a href="/products" class="nav-link" style="font-size: 1.25rem; padding: 16px 0; border-bottom: 1px solid var(--color-border);">Masculino</a>
        <a href="/products" class="nav-link" style="font-size: 1.25rem; padding: 16px 0; border-bottom: 1px solid var(--color-border);">Feminino</a>
        <a href="/category" class="nav-link" style="font-size: 1.25rem; padding: 16px 0; border-bottom: 1px solid var(--color-border);">Coleções</a>
        <a href="/products" class="nav-link" style="font-size: 1.25rem; padding: 16px 0; border-bottom: 1px solid var(--color-border);">Acessórios</a>
        ${!token ? `
          <button id="mobile-login-toggle" class="button" style="margin-top: 32px; width: 100%;">ENTRAR / CRIAR CONTA</button>
        ` : `
          <a href="/account" class="button" style="margin-top: 32px; width: 100%; text-align: center;">MINHA CONTA</a>
        `}
      </div>
    </div>

    <!-- Shared Overlay -->
    <div class="drawer-overlay" id="global-overlay"></div>

    <!-- Login Drawer -->
    <div class="login-drawer" id="login-drawer">
      <div class="drawer-header">
        <h2>Identificação</h2>
        <button class="close-drawers icon-button"><i class="fas fa-times"></i></button>
      </div>
      <div class="drawer-tabs">
        <button class="drawer-tab-btn active" id="tab-login-btn">Entrar</button>
        <button class="drawer-tab-btn" id="tab-register-btn">Cadastrar</button>
      </div>
      <div class="drawer-body">
        <!-- Login Form -->
        <div id="drawer-login-content">
          <form class="auth-form-drawer" id="drawer-login-form">
            <label>E-mail ou usuário</label>
            <input type="text" id="drawer-login-user" required placeholder="seu@email.com" />
            <label>Senha</label>
            <input type="password" id="drawer-login-pass" required placeholder="••••••••" />
            <button type="submit" class="button w-100 mb-3">ENTRAR</button>
            <p id="drawer-login-msg" class="text-danger small text-center"></p>
          </form>
        </div>
        <!-- Register Form -->
        <div id="drawer-register-content" style="display:none;">
          <form class="auth-form-drawer" id="drawer-register-form">
            <label>Nome de usuário</label>
            <input type="text" id="drawer-reg-user" required />
            <label>E-mail</label>
            <input type="email" id="drawer-reg-email" required />
            <label>Senha</label>
            <input type="password" id="drawer-reg-pass" required />
            <button type="submit" class="button w-100 mb-3">CRIAR CONTA</button>
            <p id="drawer-reg-msg" class="small text-center"></p>
          </form>
        </div>
      </div>
    </div>

    <!-- Cart Drawer -->
    <div class="cart-drawer" id="cart-drawer">
      <div class="cart-success-banner" id="cart-success-banner">
        <span>✓ Adicionado ao carrinho</span>
      </div>
      <div class="drawer-header">
        <h2>Seu Carrinho</h2>
        <button class="close-drawers icon-button"><i class="fas fa-times"></i></button>
      </div>
      
      <div class="shipping-bar-container">
        <span class="shipping-bar-text" id="shipping-msg">Faltam R$ 198,00 para FRETE GRÁTIS</span>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" id="shipping-progress"></div>
        </div>
      </div>

      <div class="drawer-body" id="drawer-items"></div>

      <div class="drawer-footer">
        <div class="subtotal-info">
          <span>Subtotal</span>
          <span id="drawer-subtotal">R$ 0,00</span>
        </div>
        <button class="button w-100" id="drawer-checkout" style="margin-bottom: 12px;">FINALIZAR COMPRA</button>
        <a href="/cart" class="button-as-link" style="display: block; text-align: center;">Continuar comprando →</a>
      </div>
    </div>

    <!-- Search Overlay (Fullscreen) -->
    <div class="search-overlay" id="search-overlay">
      <button class="search-overlay-close" id="search-overlay-close"><i class="fas fa-times"></i></button>
      <div class="search-overlay-input-wrapper">
        <input type="text" class="search-overlay-input" id="search-overlay-input" placeholder="Pesquisar por nome, cor (Preto, Azul...), tamanho (P, M, G)..." autocomplete="off" />
      </div>
      <div class="search-overlay-body" id="search-overlay-body">
        <div id="search-default-content">
          <p class="search-section-title"><i class="fas fa-palette"></i> Filtrar por Cor</p>
          <div class="search-chips" style="margin-bottom: 20px;">
            <button class="search-chip search-filter-btn" data-search="Preto"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#000;margin-right:6px;border:1px solid #666;"></span>Preto</button>
            <button class="search-chip search-filter-btn" data-search="Branco"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#fff;margin-right:6px;border:1px solid #ccc;"></span>Branco</button>
            <button class="search-chip search-filter-btn" data-search="Cinza"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#888;margin-right:6px;"></span>Cinza</button>
            <button class="search-chip search-filter-btn" data-search="Azul"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#0d6efd;margin-right:6px;"></span>Azul</button>
            <button class="search-chip search-filter-btn" data-search="Verde"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#198754;margin-right:6px;"></span>Verde</button>
            <button class="search-chip search-filter-btn" data-search="Vermelho"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#dc3545;margin-right:6px;"></span>Vermelho</button>
          </div>

          <p class="search-section-title"><i class="fas fa-ruler-combined"></i> Filtrar por Tamanho</p>
          <div class="search-chips" style="margin-bottom: 20px;">
            <button class="search-chip search-filter-btn" data-search="P">Tamanho P</button>
            <button class="search-chip search-filter-btn" data-search="M">Tamanho M</button>
            <button class="search-chip search-filter-btn" data-search="G">Tamanho G</button>
            <button class="search-chip search-filter-btn" data-search="GG">Tamanho GG</button>
          </div>

          <p class="search-section-title"><i class="fas fa-fire"></i> Buscas Populares</p>
          <div class="search-popular-list">
            <button class="search-filter-btn" data-search="Regata" style="background:none;border:none;cursor:pointer;color:var(--color-text-muted);padding:4px 0;font-size:0.9rem;">Regatas</button>
            <button class="search-filter-btn" data-search="Moletom" style="background:none;border:none;cursor:pointer;color:var(--color-text-muted);padding:4px 0;font-size:0.9rem;">Moletons</button>
            <button class="search-filter-btn" data-search="Legging" style="background:none;border:none;cursor:pointer;color:var(--color-text-muted);padding:4px 0;font-size:0.9rem;">Leggings</button>
            <button class="search-filter-btn" data-search="Shorts" style="background:none;border:none;cursor:pointer;color:var(--color-text-muted);padding:4px 0;font-size:0.9rem;">Shorts</button>
            <button class="search-filter-btn" data-search="Dry Fit" style="background:none;border:none;cursor:pointer;color:var(--color-text-muted);padding:4px 0;font-size:0.9rem;">Dry Fit</button>
          </div>
        </div>
        <div id="search-results-content" style="display: none;"></div>
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
  const searchOverlay = document.getElementById('search-overlay');
  const header = document.getElementById('app-header');
  const announcementBar = document.getElementById('announcement-bar');
  const megaMenuOverlay = document.getElementById('mega-menu-overlay');

  // ─── Close All Drawers ───
  function closeAllDrawers() {
    cartDrawer?.classList.remove('open');
    loginDrawer?.classList.remove('open');
    mobileMenuDrawer?.classList.remove('open');
    globalOverlay?.classList.remove('open');
    closeSearchOverlay();
    closeMegaMenus();
  }

  // ─── Mega Menu Logic (Hover with 150ms delay) ───
  let megaOpenTimer = null;
  let megaCloseTimer = null;
  let currentMegaMenu = null;

  function openMegaMenu(key) {
    clearTimeout(megaCloseTimer);
    // Close any other open menu
    document.querySelectorAll('.mega-menu-container.open').forEach(m => {
      if (m.id !== `mega-${key}`) m.classList.remove('open');
    });
    const menu = document.getElementById(`mega-${key}`);
    if (menu) {
      menu.classList.add('open');
      megaMenuOverlay?.classList.add('open');
      currentMegaMenu = key;
    }
  }

  function closeMegaMenus() {
    clearTimeout(megaOpenTimer);
    clearTimeout(megaCloseTimer);
    document.querySelectorAll('.mega-menu-container.open').forEach(m => m.classList.remove('open'));
    megaMenuOverlay?.classList.remove('open');
    currentMegaMenu = null;
  }

  // Attach hover events to nav links with data-mega attribute
  document.querySelectorAll('.nav-link[data-mega]').forEach(link => {
    link.addEventListener('mouseenter', () => {
      const key = link.dataset.mega;
      clearTimeout(megaCloseTimer);
      megaOpenTimer = setTimeout(() => openMegaMenu(key), 150);
    });
    link.addEventListener('mouseleave', () => {
      clearTimeout(megaOpenTimer);
      megaCloseTimer = setTimeout(() => closeMegaMenus(), 300);
    });
    // Prevent navigation on click when mega menu is open (let user browse menu)
    link.addEventListener('click', (e) => {
      if (currentMegaMenu === link.dataset.mega) {
        e.preventDefault();
      }
    });
  });

  // Keep mega menu open when hovering over it
  document.querySelectorAll('.mega-menu-container').forEach(menu => {
    menu.addEventListener('mouseenter', () => {
      clearTimeout(megaCloseTimer);
    });
    menu.addEventListener('mouseleave', () => {
      megaCloseTimer = setTimeout(() => closeMegaMenus(), 300);
    });
  });

  // Close mega menu on overlay click
  megaMenuOverlay?.addEventListener('click', closeMegaMenus);

  // ─── Header Scroll (Collapse/Expand + Announcement Bar) ───
  let lastScrollY = 0;
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    
    if (scrollY > 50) {
      header?.classList.add('compact');
      announcementBar?.classList.add('hidden');
      document.body.style.paddingTop = `${parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 100}px`;
    } else {
      header?.classList.remove('compact');
      announcementBar?.classList.remove('hidden');
      document.body.style.paddingTop = '';
    }
    
    lastScrollY = scrollY;
  }, { passive: true });

  // ─── Cart Drawer ───
  window.toggleCartDrawer = (open = true, showBanner = false) => {
    closeAllDrawers();
    if (open) {
      cartDrawer?.classList.add('open');
      globalOverlay?.classList.add('open');
      renderDrawerItems();
      
      // Show success banner
      if (showBanner) {
        const banner = document.getElementById('cart-success-banner');
        if (banner) {
          banner.classList.add('show');
          setTimeout(() => banner.classList.remove('show'), 3000);
        }
      }
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

  // ─── Search Overlay (Fullscreen) ───
  let searchDebounceTimer = null;

  function openSearchOverlay() {
    closeAllDrawers();
    searchOverlay?.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      document.getElementById('search-overlay-input')?.focus();
    }, 100);
  }

  function closeSearchOverlay() {
    searchOverlay?.classList.remove('open');
    document.body.style.overflow = '';
    const searchInput = document.getElementById('search-overlay-input');
    if (searchInput) searchInput.value = '';
    const defaultContent = document.getElementById('search-default-content');
    const resultsContent = document.getElementById('search-results-content');
    if (defaultContent) defaultContent.style.display = 'block';
    if (resultsContent) { resultsContent.style.display = 'none'; resultsContent.innerHTML = ''; }
  }

  window.toggleSearchOverlay = openSearchOverlay;

  document.getElementById('search-toggle')?.addEventListener('click', openSearchOverlay);
  document.getElementById('search-overlay-close')?.addEventListener('click', closeSearchOverlay);

  // Close search on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (searchOverlay?.classList.contains('open')) {
        closeSearchOverlay();
      }
      closeMegaMenus();
    }
  });

  // Debounced live search
  const searchInput = document.getElementById('search-overlay-input');
  const defaultContent = document.getElementById('search-default-content');
  const resultsContent = document.getElementById('search-results-content');

  function triggerLiveSearch(query) {
    if (searchInput) searchInput.value = query;
    if (!query) {
      if (defaultContent) defaultContent.style.display = 'block';
      if (resultsContent) { resultsContent.style.display = 'none'; resultsContent.innerHTML = ''; }
      return;
    }

    if (defaultContent) defaultContent.style.display = 'none';
    if (resultsContent) {
      resultsContent.style.display = 'block';
      resultsContent.innerHTML = '<p style="text-align: center; padding: 24px 0; color: var(--color-text-muted);"><i class="fas fa-spinner fa-spin"></i> Buscando produtos...</p>';
    }

    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(query)}`);
        const products = await res.json();

        if (!products || products.length === 0) {
          resultsContent.innerHTML = `
            <div style="text-align: center; padding: 32px 0;">
              <i class="fas fa-search" style="font-size: 2rem; color: var(--color-text-muted); margin-bottom: 12px;"></i>
              <p style="color: var(--color-text-muted); margin-bottom: 16px;">Nenhum produto encontrado para "${query}"</p>
              <button class="button button-small" onclick="document.getElementById('search-overlay-input').value=''; document.getElementById('search-default-content').style.display='block'; document.getElementById('search-results-content').style.display='none';">Ver categorias</button>
            </div>
          `;
        } else {
          resultsContent.innerHTML = `
            <div style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: var(--color-text-muted); margin-bottom: 16px;">
              ${products.length} resultado(s) encontrado(s)
            </div>
            <div class="search-results-grid">
              ${products.slice(0, 6).map(p => `
                <a href="/product?id=${p._id}" class="search-result-item" style="display:flex;gap:16px;align-items:center;padding:12px;border:1px solid var(--color-border);border-radius:var(--radius-sm);background:#fff;text-decoration:none;">
                  <img src="${p.image || (p.images && p.images[0]) || ''}" alt="${p.name}" style="width:70px;height:70px;object-fit:cover;border-radius:4px;" />
                  <div style="flex:1;">
                    <h4 style="font-size:0.9rem;font-weight:700;color:var(--color-text);margin-bottom:4px;">${p.name}</h4>
                    <span class="search-result-price" style="font-weight:800;color:var(--color-text);">R$ ${p.price.toFixed(2)}</span>
                    
                    <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px;">
                      ${p.sizes && p.sizes.length ? p.sizes.map(s => `<span style="font-size:0.65rem;font-weight:700;background:#e9ecef;color:#495057;padding:2px 5px;border-radius:3px;">${s}</span>`).join('') : ''}
                      ${p.colors && p.colors.length ? p.colors.map(c => `<span style="font-size:0.65rem;font-weight:700;background:#343a40;color:#fff;padding:2px 5px;border-radius:3px;">${c.name}</span>`).join('') : ''}
                    </div>
                  </div>
                </a>
              `).join('')}
            </div>
            ${products.length > 6 ? `
              <a href="/products?search=${encodeURIComponent(query)}" class="search-view-all" style="display:block;text-align:center;margin-top:20px;font-size:0.875rem;font-weight:700;color:var(--color-primary);">
                Ver todos os ${products.length} resultados →
              </a>
            ` : ''}
          `;
        }
      } catch (err) {
        resultsContent.innerHTML = '<p style="text-align: center; padding: 24px 0; color: var(--color-error);">Erro ao buscar produtos.</p>';
      }
    }, 250);
  }

  searchInput?.addEventListener('input', () => {
    triggerLiveSearch(searchInput.value.trim());
  });

  // Bind search filter chips (size, color, popular)
  document.querySelectorAll('.search-filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const searchTerm = btn.dataset.search;
      if (searchTerm) {
        triggerLiveSearch(searchTerm);
      }
    });
  });

  // ─── Button Bindings ───
  document.getElementById('cart-drawer-toggle')?.addEventListener('click', () => toggleCartDrawer(true));
  document.getElementById('login-drawer-toggle')?.addEventListener('click', () => toggleLoginDrawer(true));
  document.getElementById('mobile-menu-toggle')?.addEventListener('click', () => toggleMobileMenuDrawer(true));
  
  document.getElementById('mobile-login-toggle')?.addEventListener('click', () => {
    toggleMobileMenuDrawer(false);
    toggleLoginDrawer(true);
  });

  document.querySelectorAll('.close-drawers').forEach(btn => btn.addEventListener('click', closeAllDrawers));
  globalOverlay?.addEventListener('click', closeAllDrawers);

  // ─── Cart Drawer: Quantity Controls ───
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

  // ─── Login/Register Tabs ───
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

  // ─── Login Form Submit ───
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

  // ─── Register Form Submit ───
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

  // ─── Checkout Button ───
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
  const isKit = product.category && /kits/i.test(product.category);
  const image = product.image || (product.images && product.images.length ? product.images[0] : '');

  // Calculate original price for kits to show simulated discount
  const originalPriceHtml = isKit 
    ? `<span class="price-original">R$ ${(product.price * 1.66).toFixed(2)}</span>` 
    : '';

  const badgeHtml = isKit 
    ? `<div class="badge badge-kit">KIT -40%</div>` 
    : (product.badge ? `<div class="badge">${product.badge}</div>` : '');

  return `
    <article class="card product-card">
      <div class="product-image">
        ${badgeHtml}
        ${image ? `<img src="${image}" alt="${product.name}" />` : '<span>Sem imagem</span>'}
        <div class="product-card-overlay">
           <a class="button small" href="/product?id=${productId}">VER DETALHES</a>
        </div>
      </div>
      <div class="card-body">
        <h3 class="product-title">${product.name}</h3>
        <div class="product-price-row" style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
          ${originalPriceHtml}
          <span class="price-tag ${isKit ? 'price-promo' : ''}">R$ ${product.price.toFixed(2)}</span>
        </div>
        
        <div class="product-variations-preview">
          <div class="swatches-row">
            ${product.colors && product.colors.length ? product.colors.map(c => `
              <span class="swatch" style="background: ${c.hex}; border: 1px solid #ddd;" title="${c.name}"></span>
            `).join('') : `
              <span class="swatch" style="background: #000;"></span>
              <span class="swatch" style="background: #fff; border: 1px solid #ddd;"></span>
              <span class="swatch" style="background: #808080;"></span>
            `}
          </div>
          <div class="sizes-row">
            ${product.sizes && product.sizes.length ? product.sizes.map(s => `
              <span>${s}</span>
            `).join('') : `
              <span>P</span>
              <span>M</span>
              <span>G</span>
              <span>GG</span>
            `}
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
