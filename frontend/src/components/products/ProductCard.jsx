import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [addedText, setAddedText] = useState('ADICIONAR AO CARRINHO');
  const [isActive, setIsActive] = useState(false);
  const [selectedSize, setSelectedSize] = useState(null);
  const [addedSize, setAddedSize] = useState(null);

  const productId = product._id || product.id;
  const stock = product.countInStock || 0;
  const isKit = product.category && /kits/i.test(product.category);
  const image = product.image || (product.images && product.images.length ? product.images[0] : '');

  const standardApparel = ['P', 'M', 'G', 'GG'];
  const pSizes = Array.isArray(product.sizes) && product.sizes.length ? product.sizes : standardApparel;
  const isStandard = pSizes.some((s) => standardApparel.includes(s));
  const sizesToRender = isStandard ? standardApparel : pSizes;

  const handleQuickAddSize = (size, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (stock <= 0) return;

    setSelectedSize(size);
    setAddedSize(size);
    addToCart(product, 1, size);

    setAddedText(`ADICIONADO (${size})! ✓`);
    setIsActive(true);

    setTimeout(() => {
      setAddedSize(null);
      setAddedText('ADICIONAR AO CARRINHO');
      setIsActive(false);
    }, 1500);
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (stock <= 0) return;

    const sizeToUse = selectedSize || (pSizes.length ? pSizes[0] : null);
    addToCart(product, 1, sizeToUse);
    setAddedText(sizeToUse ? `ADICIONADO (${sizeToUse})! ✓` : 'ADICIONADO! ✓');
    setIsActive(true);
    setTimeout(() => {
      setAddedText('ADICIONAR AO CARRINHO');
      setIsActive(false);
    }, 1500);
  };

  const originalPriceHtml = isKit ? (
    <span className="price-original">R$ {(product.price * 1.66).toFixed(2)}</span>
  ) : null;

  const badgeHtml = isKit ? (
    <div className="badge badge-kit">KIT -40%</div>
  ) : product.badge ? (
    <div className="badge">{product.badge}</div>
  ) : stock <= 0 ? (
    <div className="badge" style={{ background: '#dc3545' }}>ESGOTADO</div>
  ) : null;

  return (
    <article className="card product-card" data-product-id={productId}>
      <div className="product-image product-card-image-wrap">
        {badgeHtml}
        {image ? <img src={image} alt={product.name} /> : <span>Sem imagem</span>}
        <div className="product-card-overlay">
          <Link className="button small" to={`/product/${productId}`}>
            VER DETALHES
          </Link>
        </div>
        <div className="quick-buy-overlay">
          <span className="quick-buy-label">SELECIONE O TAMANHO:</span>
          <div className="quick-buy-sizes-row">
            {sizesToRender.map((s, idx) => {
              const isAvailable = pSizes.includes(s) && stock > 0;
              const isSelected = selectedSize === s;
              const isThisAdded = addedSize === s;

              return isAvailable ? (
                <button
                  key={idx}
                  type="button"
                  className={`quick-buy-btn is-available ${isSelected ? 'selected' : ''} ${isThisAdded ? 'btn-added' : ''}`}
                  title={`Tamanho ${s} disponível`}
                  onClick={(e) => handleQuickAddSize(s, e)}
                >
                  {isThisAdded ? `${s} ✓` : s}
                </button>
              ) : (
                <button
                  key={idx}
                  type="button"
                  className="quick-buy-btn is-unavailable"
                  disabled
                  title={`Tamanho ${s} indisponível`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="card-body">
        <h3 className="product-title">
          <Link to={`/product/${productId}`} style={{ color: 'inherit', textDecoration: 'none' }}>
            {product.name}
          </Link>
        </h3>
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
