import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import productService from '../../services/productService';
import api from '../../services/api';

const SearchOverlay = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Focus input when overlay opens
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setResults([]);
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Debounced search query
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    const delayDebounce = setTimeout(async () => {
      try {
        const res = await api.get(`/products?search=${encodeURIComponent(query)}`);
        setResults(res.data || []);
      } catch (err) {
        console.error('Search error:', err);
        setError('Erro ao buscar produtos.');
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  // Close search overlay on Escape press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePopularSearch = (term) => {
    onClose();
    navigate(`/products?search=${encodeURIComponent(term)}`);
  };

  return (
    <div className="search-overlay open" id="search-overlay">
      <button className="search-overlay-close" onClick={onClose}>
        <i className="fas fa-times"></i>
      </button>
      <div className="search-overlay-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          className="search-overlay-input"
          placeholder="Pesquisar produtos..."
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="search-overlay-body">
        {!query.trim() && (
          <div id="search-default-content">
            <p className="search-section-title">Buscas populares</p>
            <div className="search-popular-list">
              {['Regata', 'Shorts', 'Legging', 'Moletom', 'Dry Fit'].map((term) => (
                <button
                  key={term}
                  className="button-as-link"
                  onClick={() => handlePopularSearch(term.toLowerCase())}
                  style={{ textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {term}
                </button>
              ))}
            </div>
            <p className="search-section-title">Categorias</p>
            <div className="search-chips">
              <Link to="/products" className="search-chip" onClick={onClose}>Masculino</Link>
              <Link to="/products" className="search-chip" onClick={onClose}>Feminino</Link>
              <Link to="/products?category=Kits" className="search-chip" onClick={onClose}>Kits</Link>
              <Link to="/products" className="search-chip" onClick={onClose}>Acessórios</Link>
            </div>
          </div>
        )}

        {query.trim() && (
          <div id="search-results-content">
            {loading && (
              <p style={{ textAlign: 'center', padding: '24px 0', color: 'var(--color-text-muted)' }}>
                Buscando...
              </p>
            )}

            {error && (
              <p style={{ textAlign: 'center', padding: '24px 0', color: 'var(--color-error)' }}>
                {error}
              </p>
            )}

            {!loading && !error && results.length === 0 && (
              <>
                <p style={{ textAlign: 'center', padding: '24px 0', color: 'var(--color-text-muted)' }}>
                  Nenhum produto encontrado para "{query}"
                </p>
                <p className="search-section-title">Tente buscar por</p>
                <div className="search-chips">
                  <button className="search-chip" onClick={() => setQuery('regata')}>Regata</button>
                  <button className="search-chip" onClick={() => setQuery('shorts')}>Shorts</button>
                  <button className="search-chip" onClick={() => setQuery('moletom')}>Moletom</button>
                </div>
              </>
            )}

            {!loading && !error && results.length > 0 && (
              <>
                <div className="search-results-grid">
                  {results.slice(0, 4).map((p) => (
                    <Link
                      key={p._id}
                      to={`/product/${p._id}`}
                      className="search-result-item"
                      onClick={onClose}
                    >
                      <img src={p.image || p.images?.[0] || ''} alt={p.name} />
                      <h4>{p.name}</h4>
                      <span className="search-result-price">R$ {p.price.toFixed(2)}</span>
                    </Link>
                  ))}
                </div>
                {results.length > 4 && (
                  <Link
                    to={`/products?search=${encodeURIComponent(query)}`}
                    className="search-view-all"
                    onClick={onClose}
                  >
                    Ver todos os {results.length} resultados →
                  </Link>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchOverlay;
