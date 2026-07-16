import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [addedText, setAddedText] = useState('ADICIONAR AO CARRINHO');
  const [isActive, setIsActive] = useState(false);

  const productId = product._id || product.id;
  const stock = product.countInStock || 0;
  const isKit = product.category && /kits/i.test(product.category);
  const image = product.image || (product.images && product.images.length ? product.images[0] : '');

  const handleAddToCart = () => {
    addToCart(product, 1);
    setAddedText('ADICIONADO!');
    setIsActive(true);
    setTimeout(() => {
      setAddedText('ADICIONAR AO CARRINHO');
      setIsActive(false);
    }, 1200);
  };

  const originalPriceHtml = isKit ? (
    <span className="price-original">R$ {(product.price * 1.66).toFixed(2)}</span>
  ) : null;

  const badgeHtml = isKit ? (
    <div className="badge badge-kit">KIT -40%</div>
  ) : product.badge ? (
    <div className="badge">{product.badge}</div>
  ) : null;

  return (
    <article className="card product-card">
      <div className="product-image">
        {badgeHtml}
        {image ? <img src={image} alt={product.name} /> : <span>Sem imagem</span>}
        <div className="product-card-overlay">
          <Link className="button small" to={`/product/${productId}`}>
            VER DETALHES
          </Link>
        </div>
      </div>
      <div className="card-body">
        <h3 className="product-title">{product.name}</h3>
        <div className="product-price-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
          {originalPriceHtml}
          <span className={`price-tag ${isKit ? 'price-promo' : ''}`}>
            R$ {product.price.toFixed(2)}
          </span>
        </div>

        <div className="product-variations-preview">
          <div className="swatches-row">
            {product.colors && product.colors.length ? (
              product.colors.map((c, index) => (
                <span
                  key={index}
                  className="swatch"
                  style={{ background: c.hex, border: '1px solid #ddd' }}
                  title={c.name}
                ></span>
              ))
            ) : (
              <>
                <span className="swatch" style={{ background: '#000' }}></span>
                <span className="swatch" style={{ background: '#fff', border: '1px solid #ddd' }}></span>
                <span className="swatch" style={{ background: '#808080' }}></span>
              </>
            )}
          </div>
          <div className="sizes-row">
            {product.sizes && product.sizes.length ? (
              product.sizes.map((s, index) => <span key={index}>{s}</span>)
            ) : (
              <>
                <span>P</span>
                <span>M</span>
                <span>G</span>
                <span>GG</span>
              </>
            )}
          </div>
        </div>

        <div className="product-actions mt-auto">
          <button
            className={`button small w-100 add-to-cart-button ${isActive ? 'active' : ''}`}
            onClick={handleAddToCart}
            disabled={stock <= 0}
          >
            {stock <= 0 ? 'SEM ESTOQUE' : addedText}
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
