import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';

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
        { label: 'Heavy', href: '/products?category=Heavy' },
        { label: 'Performance', href: '/products?category=Performance' },
        { label: 'Casual', href: '/products?category=Casual' },
        { label: 'Inverno', href: '/products?category=Moletom' },
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
        { label: 'Alpha Cut', href: '/products?category=AlphaCut' },
        { label: 'CoreFlex', href: '/products?category=CoreFlex' },
        { label: 'Performance', href: '/products?category=Performance' },
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
        { label: 'Performance', href: '/products?category=Performance' },
        { label: 'Heavy', href: '/products?category=Heavy' },
        { label: 'Casual', href: '/products?category=Casual' },
      ]},
      { title: 'ESPECIAL', links: [
        { label: 'Inverno', href: '/products?category=Moletom' },
        { label: 'Verão', href: '/products' },
        { label: 'Kits', href: '/products?category=Kits' },
      ]},
    ],
    image: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=600&q=80',
    viewAllLabel: 'Ver todas as Coleções',
    viewAllHref: '/products',
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
        { label: 'Kits', href: '/products?category=Kits' },
      ]},
      { title: '', links: [] },
    ],
    image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=600&q=80',
    viewAllLabel: 'Ver todos os Acessórios',
    viewAllHref: '/products',
  },
};

const Header = ({
  onOpenCart,
  onOpenLogin,
  onOpenSearch,
  onOpenMobileMenu,
  mobileMenuOpen,
  onCloseMobileMenu
}) => {
  const { token, user } = useAuth();
  const { itemCount } = useCart();
  const [activeMega, setActiveMega] = useState(null);
  const [isCompact, setIsCompact] = useState(false);
  const navigate = useNavigate();

  let megaTimer = null;

  // Handle header collapse on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsCompact(true);
      } else {
        setIsCompact(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMouseEnter = (key) => {
    clearTimeout(megaTimer);
    setActiveMega(key);
  };

  const handleMouseLeave = () => {
    megaTimer = setTimeout(() => {
      setActiveMega(null);
    }, 200);
  };

  const handleMobileLoginClick = () => {
    onCloseMobileMenu();
    onOpenLogin();
  };

  return (
    <>
      {/* Announcement Bar */}
      <div className={`announcement-bar ${isCompact ? 'hidden' : ''}`} id="announcement-bar">
        <p>FRETE GRÁTIS ACIMA DE R$ 198 · 10% CASHBACK NA PRIMEIRA COMPRA</p>
      </div>

      {/* Header */}
      <header className={`app-header ${isCompact ? 'compact' : ''}`} id="app-header">
        <div className="container header-content">
          {/* Mobile Menu Toggle */}
          <button onClick={onOpenMobileMenu} className="icon-button mobile-only" aria-label="Menu">
            <i className="fas fa-bars"></i>
          </button>

          {/* Main Navigation (Desktop) */}
          <nav className="main-nav desktop-only">
            {Object.keys(megaMenuData).map((key) => (
              <Link
                key={key}
                className="nav-link"
                to="/products"
                onMouseEnter={() => handleMouseEnter(key)}
                onMouseLeave={handleMouseLeave}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </Link>
            ))}
          </nav>

          {/* Logo (Centered) */}
          <div className="brand-link">
            <Link to="/">MD ESSENTIAL</Link>
          </div>

          {/* Utility Icons */}
          <div className="nav-utility">
            <button onClick={onOpenSearch} className="icon-button" aria-label="Buscar">
              <i className="fas fa-search"></i>
            </button>
            {token ? (
              <Link to="/account" className="icon-button">
                <i className="fas fa-user"></i>
              </Link>
            ) : (
              <button onClick={onOpenLogin} className="icon-button" aria-label="Perfil">
                <i className="fas fa-user"></i>
              </button>
            )}
            <button onClick={onOpenCart} className="icon-button" aria-label="Carrinho">
              <i className="fas fa-shopping-bag"></i>
              {itemCount > 0 && (
                <span id="cart-count-badge" className="badge-count" style={{ display: 'block' }}>
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mega Menu Panels */}
        {Object.entries(megaMenuData).map(([key, data]) => (
          <div
            key={key}
            className={`mega-menu-container ${activeMega === key ? 'open' : ''}`}
            id={`mega-${key}`}
            onMouseEnter={() => handleMouseEnter(key)}
            onMouseLeave={handleMouseLeave}
          >
            <div className="mega-menu-inner">
              {data.columns.map((col, idx) =>
                col.title ? (
                  <div className="mega-menu-column" key={idx}>
                    <h4>{col.title}</h4>
                    {col.links.map((l, lIdx) => (
                      <Link key={lIdx} to={l.href}>
                        {l.label}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="mega-menu-column" key={idx}></div>
                )
              )}
              <div className="mega-menu-image">
                <img src={data.image} alt={key} loading="lazy" />
              </div>
              <div className="mega-menu-footer">
                <Link to={data.viewAllHref}>{data.viewAllLabel} →</Link>
              </div>
            </div>
          </div>
        ))}
      </header>

      {/* Mega Menu Overlay */}
      {activeMega && (
        <div className="mega-menu-overlay open" onClick={() => setActiveMega(null)}></div>
      )}

      {/* Mobile Menu Drawer */}
      <div className={`mobile-menu-drawer ${mobileMenuOpen ? 'open' : ''}`} id="mobile-menu-drawer">
        <div className="drawer-header">
          <span className="brand-link">
            <Link to="/" onClick={onCloseMobileMenu}>MD ESSENTIAL</Link>
          </span>
          <button className="close-drawers icon-button" onClick={onCloseMobileMenu}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="drawer-body" style={{ justifyContent: 'flex-start', alignItems: 'stretch', paddingTop: '32px' }}>
          <Link to="/products" className="nav-link" onClick={onCloseMobileMenu} style={{ fontSize: '1.25rem', padding: '16px 0', borderBottom: '1px solid var(--color-border)' }}>Masculino</Link>
          <Link to="/products" className="nav-link" onClick={onCloseMobileMenu} style={{ fontSize: '1.25rem', padding: '16px 0', borderBottom: '1px solid var(--color-border)' }}>Feminino</Link>
          <Link to="/products?category=Kits" className="nav-link" onClick={onCloseMobileMenu} style={{ fontSize: '1.25rem', padding: '16px 0', borderBottom: '1px solid var(--color-border)' }}>Coleções</Link>
          <Link to="/products" className="nav-link" onClick={onCloseMobileMenu} style={{ fontSize: '1.25rem', padding: '16px 0', borderBottom: '1px solid var(--color-border)' }}>Acessórios</Link>
          {!token ? (
            <button onClick={handleMobileLoginClick} className="button" style={{ marginTop: '32px', width: '100%' }}>ENTRAR / CRIAR CONTA</button>
          ) : (
            <Link to="/account" onClick={onCloseMobileMenu} className="button" style={{ marginTop: '32px', width: '100%', display: 'block', textAlign: 'center', boxSizing: 'border-box' }}>MINHA CONTA</Link>
          )}
        </div>
      </div>
    </>
  );
};

export default Header;
