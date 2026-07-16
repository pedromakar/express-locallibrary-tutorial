import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import ProductCard from '../../components/products/ProductCard';

const Products = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const searchVal = searchParams.get('search');
  const categoryVal = searchParams.get('category');

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        let url = '/products';
        const params = new URLSearchParams();
        
        if (searchVal) {
          params.append('search', searchVal);
        }
        if (categoryVal) {
          params.append('category', categoryVal);
        }

        const queryString = params.toString();
        if (queryString) {
          url += `?${queryString}`;
        }

        const res = await api.get(url);
        setProducts(res.data || []);
      } catch (err) {
        console.error('Error loading products:', err);
        setError('Falha ao carregar produtos. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [searchVal, categoryVal]);

  const getPageTitle = () => {
    if (searchVal) return `Resultados para "${searchVal}"`;
    if (categoryVal) return `${categoryVal}`;
    return 'Todos os produtos';
  };

  const getPageSubtitle = () => {
    if (searchVal) return `Encontramos ${products.length} produto(s).`;
    if (categoryVal) return `Explore itens na categoria "${categoryVal}".`;
    return 'Explore nossa coleção completa de roupas e acessórios de treino.';
  };

  return (
    <main className="content">
      <section className="box">
        <h1 style={{ fontSize: '2.2rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
          {getPageTitle()}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '32px' }}>
          {getPageSubtitle()}
        </p>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '1.2rem', fontWeight: 600 }}>
              Carregando catálogo...
            </p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ color: 'var(--color-error)', fontSize: '1.1rem', fontWeight: 600 }}>
              {error}
            </p>
          </div>
        ) : (
          <div className="grid-list">
            {products.length > 0 ? (
              products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))
            ) : (
              <p className="text-center py-5" style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                Nenhum produto encontrado.
              </p>
            )}
          </div>
        )}
      </section>
    </main>
  );
};

export default Products;
