import React from 'react';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="container-custom">
        <p>&copy; {new Date().getFullYear()} MD Essential. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;
