import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import productService from '../../services/productService';
import { useCart } from '../../contexts/CartContext';

const Product = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selections
  const [activeImage, setActiveImage] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [addedText, setAddedText] = useState('ADICIONAR AO CARRINHO');

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await productService.getById(id);
        setProduct(data);
        if (data) {
          setActiveImage(data.images?.[0] || data.image || '');
          if (data.sizes?.length > 0) setSelectedSize(data.sizes[0]);
          if (data.colors?.length > 0) setSelectedColor(data.colors[0].name);
        }
      } catch (err) {
        console.error('Error loading product:', err);
        setError('Produto não encontrado ou falha de conexão.');
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.2rem', fontWeight: 600 }}>Carregando produto...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <main className="content">
        <section className="box" style={{ textAlign: 'center', padding: '60px 0' }}>
          <h1 style={{ color: 'var(--color-error)' }}>Produto não encontrado</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '12px' }}>
            Desculpe, o item que você está procurando não existe ou foi removido.
          </p>
        </section>
      </main>
    );
  }

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedSize, selectedColor);
    setAddedText('✓ ADICIONADO!');
    setTimeout(() => {
      setAddedText('ADICIONAR AO CARRINHO');
    }, 1500);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity, selectedSize, selectedColor);
    navigate('/checkout');
  };

  const handleQtyMinus = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleQtyPlus = () => {
    if (quantity < product.countInStock) {
      setQuantity(quantity + 1);
    }
  };

  return (
    <main className="content">
      <section className="container-custom py-5" style={{ padding: '40px 20px' }}>
        <div className="product-premium-layout">
          {/* Gallery */}
          <div className="product-gallery">
            <div className="main-image-wrapper">
              <img id="main-product-image" src={activeImage} alt={product.name} />
              {product.badge && <span className="badge premium">{product.badge}</span>}
            </div>
            <div className="thumbnail-grid">
              {product.images?.map((img, idx) => (
                <div
                  key={idx}
                  className={`thumb-item ${img === activeImage ? 'active' : ''}`}
                  onClick={() => setActiveImage(img)}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="product-premium-info">
            <p className="category-eyebrow" style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
              {product.category}
            </p>
            <h1 className="text-uppercase-bold" style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '12px' }}>
              {product.name}
            </h1>
            <p className="price-premium" style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-black)', marginBottom: '16px' }}>
              R$ {product.price.toFixed(2)}
            </p>
            <p className="stock-status" style={{ fontSize: '0.85rem', fontWeight: 700, color: product.countInStock > 0 ? '#22c55e' : '#ef4444', marginTop: '-8px', marginBottom: '16px' }}>
              {product.countInStock > 0 ? (
                <>
                  <i className="fas fa-check"></i> Disponível em estoque ({product.countInStock} unidades)
                </>
              ) : (
                <>
                  <i className="fas fa-times-circle"></i> Esgotado
                </>
              )}
            </p>
            
            <div className="divider"></div>

            <p className="description-text" style={{ lineHeight: '1.6', color: 'var(--color-text)', marginBottom: '24px' }}>
              {product.description}
            </p>

            {/* Color Selector */}
            {product.colors && product.colors.length > 0 && (
              <div className="selector-box">
                <label className="selector-label">
                  COR: <span id="selected-color-name" style={{ fontWeight: 800 }}>{selectedColor}</span>
                </label>
                <div className="color-swatches">
                  {product.colors.map((c) => (
                    <button
                      key={c.name}
                      className={`swatch-btn ${c.name === selectedColor ? 'active' : ''}`}
                      style={{ background: c.hex }}
                      title={c.name}
                      onClick={() => setSelectedColor(c.name)}
                    ></button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="selector-box">
                <div className="d-flex justify-content-between align-items-center mb-2" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="selector-label">TAMANHO</label>
                  <button
                    className="text-link small"
                    onClick={() => setModalOpen(true)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                  >
                    TABELA DE MEDIDAS
                  </button>
                </div>
                <div className="size-grid">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      className={`size-btn ${s === selectedSize ? 'active' : ''}`}
                      onClick={() => setSelectedSize(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="selector-box">
              <label className="selector-label">QUANTIDADE</label>
              <div className="qty-selector">
                <button className="qty-selector-btn" onClick={handleQtyMinus}>−</button>
                <span className="qty-selector-value">{quantity}</span>
                <button className="qty-selector-btn" onClick={handleQtyPlus}>+</button>
              </div>
            </div>

            {/* Benefits */}
            {product.benefits && product.benefits.length > 0 && (
              <div className="benefits-premium">
                {product.benefits.map((b, idx) => (
                  <div className="benefit-item" key={idx}>
                    <i className="fas fa-check"></i>
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="product-buy-actions" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
              {product.countInStock > 0 ? (
                <>
                  <button className="button w-100" onClick={handleAddToCart}>
                    <i className="fas fa-shopping-cart"></i> {addedText}
                  </button>
                  <button className="button button-accent w-100" onClick={handleBuyNow}>
                    <i className="fas fa-bolt"></i> COMPRAR AGORA
                  </button>
                </>
              ) : (
                <button className="button w-100" disabled style={{ backgroundColor: '#6b7280', cursor: 'not-allowed', opacity: 0.6 }}>
                  <i className="fas fa-times-circle"></i> PRODUTO INDISPONÍVEL
                </button>
              )}
            </div>

            <div className="shipping-preview" style={{ marginTop: '20px' }}>
              <i className="fas fa-truck"></i>
              <span>Frete grátis em compras acima de R$ 198</span>
            </div>
          </div>
        </div>
      </section>

      {/* Measurements Modal */}
      {modalOpen && (
        <div className="modal-overlay open" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>TABELA DE MEDIDAS</h3>
              <button id="close-modal" onClick={() => setModalOpen(false)}><i className="fas fa-times"></i></button>
            </div>
            <div className="modal-body text-center" style={{ textAlign: 'center', padding: '20px' }}>
              <img
                src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80"
                alt="Tabela de medidas"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
              <p className="mt-3 small" style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginTop: '12px' }}>
                Valores aproximados em centímetros.
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Product;
