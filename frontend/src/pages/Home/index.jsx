import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import productService from '../../services/productService';
import api from '../../services/api';
import ProductCard from '../../components/products/ProductCard';
import CategoryCard from '../../components/products/CategoryCard';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [prodList, catRes] = await Promise.all([
          productService.getAll(),
          api.get('/products/categories')
        ]);
        setProducts(prodList || []);
        setCategories(catRes.data || []);
      } catch (err) {
        console.error('Error loading home data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadHomeData();
  }, []);

  const buildCategoryItems = (catList) => {
    const categoryPlaceholderImages = [
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80', // Gym
      'https://images.unsplash.com/photo-1571731956622-39ed2739cbbb?auto=format&fit=crop&w=800&q=80', // Training
      'https://images.unsplash.com/photo-1583454110551-21f2fa200181?auto=format&fit=crop&w=800&q=80', // Fitness
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80', // Lifestyle
    ];

    return catList.map((category, index) => ({
      id: encodeURIComponent(category.name),
      title: category.name,
      description: `${category.count} produto(s) nesta categoria`,
      image: categoryPlaceholderImages[index % categoryPlaceholderImages.length],
    }));
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.2rem', fontWeight: 600 }}>Carregando...</p>
      </div>
    );
  }

  const categoryItems = buildCategoryItems(categories);

  return (
    <div className="content">
      {/* Hero Section */}
      <section className="hero premium-hero">
        <div className="hero-overlay"></div>
        <div className="hero-content-box">
          <p className="eyebrow">Coleção Apex Pro - A Melhor do Brasil</p>
          <h1 className="text-uppercase-bold">O INVERNO É O NOSSO PONTO ZERO</h1>
          <p>Alta performance e isolamento térmico inteligente. Desenvolvido para superar o frio com atitude.</p>
          <div className="button-row" style={{ marginTop: '24px' }}>
            <Link className="button" to="/products?category=Moletom">VER COLEÇÃO</Link>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="section">
        <div className="container-custom">
          <h2 className="text-uppercase-bold text-center mb-5" style={{ fontSize: '2rem', marginBottom: '40px', letterSpacing: '1px' }}>Categorias</h2>
          <div className="grid-list">
            {categoryItems.map((cat) => (
              <CategoryCard key={cat.title} category={cat} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="section section--alt">
        <div className="container-custom">
          <h2 className="text-uppercase-bold text-center mb-5" style={{ fontSize: '2rem', marginBottom: '40px', letterSpacing: '1px' }}>Drops em Destaque</h2>
          <div className="grid-list">
            {products.slice(0, 6).map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Benefit Bar */}
      <section className="benefit-bar">
        <div className="container-custom benefit-grid">
          <div className="benefit-card">
            <i className="fas fa-shipping-fast"></i>
            <h3>ENVIO RÁPIDO</h3>
            <p>Despachamos em até 24h úteis.</p>
          </div>
          <div className="benefit-card">
            <i className="fas fa-sync-alt"></i>
            <h3>TROCA GRÁTIS</h3>
            <p>Primeira troca por nossa conta.</p>
          </div>
          <div className="benefit-card">
            <i className="fas fa-shield-alt"></i>
            <h3>COMPRA SEGURA</h3>
            <p>Ambiente 100% criptografado.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
