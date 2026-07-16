import React, { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import CartDrawer from './CartDrawer';
import LoginDrawer from './LoginDrawer';
import SearchOverlay from './SearchOverlay';

const Layout = ({ children }) => {
  const [cartOpen, setCartOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeAll = () => {
    setCartOpen(false);
    setLoginOpen(false);
    setSearchOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <div className="layout-wrapper" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header
        onOpenCart={() => { closeAll(); setCartOpen(true); }}
        onOpenLogin={() => { closeAll(); setLoginOpen(true); }}
        onOpenSearch={() => { closeAll(); setSearchOpen(true); }}
        onOpenMobileMenu={() => { closeAll(); setMobileMenuOpen(true); }}
        mobileMenuOpen={mobileMenuOpen}
        onCloseMobileMenu={() => setMobileMenuOpen(false)}
      />

      {/* Main content wrapper */}
      <main className="main-content" style={{ flexGrow: 1, paddingTop: '100px' }}>
        {children}
      </main>

      <Footer />

      {/* Drawers */}
      <CartDrawer isOpen={cartOpen} onClose={closeAll} />
      <LoginDrawer isOpen={loginOpen} onClose={closeAll} />
      <SearchOverlay isOpen={searchOpen} onClose={closeAll} />
    </div>
  );
};

export default Layout;
