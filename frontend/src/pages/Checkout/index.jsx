import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import productService from '../../services/productService';
import orderService from '../../services/orderService';
import authService from '../../services/authService';

const Checkout = () => {
  const { token, logout } = useAuth();
  const { cart, subtotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [profileUser, setProfileUser] = useState(null);
  const [checkoutItems, setCheckoutItems] = useState([]);

  // Customer Data Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');

  // Address Fields
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [stateCode, setStateCode] = useState('');

  // Shipping Selection
  const [shippingMethod, setShippingMethod] = useState('');
  const [shippingCost, setShippingCost] = useState(0);

  // Payment Selection
  const [paymentMethod, setPaymentMethod] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Success Order State
  const [successOrder, setSuccessOrder] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) {
      alert('Você precisa estar logado para finalizar a compra.');
      navigate('/login', { replace: true });
      return;
    }

    const initCheckout = async () => {
      setLoading(true);
      try {
        // 1. Fetch user profile
        const profile = await authService.getProfile();
        const u = profile.user;
        setProfileUser(u);
        setName(u.username || '');
        setEmail(u.email || '');
        setCpf(u.cpf || '');
        setPhone(u.phone || '');

        const defaultAddr = u.addresses?.find((addr) => addr.isDefault) || u.addresses?.[0];
        if (defaultAddr) {
          setCep(defaultAddr.cep || '');
          setStreet(defaultAddr.street || '');
          setNumber(defaultAddr.number || '');
          setComplement(defaultAddr.complement || '');
          setNeighborhood(defaultAddr.neighborhood || '');
          setCity(defaultAddr.city || '');
          setStateCode(defaultAddr.state || '');
        }

        // 2. Fetch products to get details
        const allProducts = await productService.getAll();
        const resolvedItems = Object.keys(cart)
          .map((key) => {
            const item = cart[key];
            const prod = allProducts.find((p) => p._id === item.productId);
            if (!prod) return null;
            return {
              ...item,
              product: prod,
              total: prod.price * item.quantity
            };
          })
          .filter(Boolean);

        setCheckoutItems(resolvedItems);
      } catch (err) {
        console.error('Error initializing checkout:', err);
        logout();
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    initCheckout();
  }, [token, cart, navigate]);

  // Shipping Cost Calculations
  const shippingOptions = [
    { id: 'pac', name: 'PAC — Correios', price: 18.9, days: '8 a 12 dias úteis' },
    { id: 'sedex', name: 'SEDEX — Correios', price: 32.5, days: '3 a 5 dias úteis' },
    { id: 'free', name: 'Frete Grátis', price: 0, days: '10 a 15 dias úteis', minOrder: 198 }
  ];

  const availableShipping = shippingOptions.filter((s) => !s.minOrder || subtotal >= s.minOrder);

  // Set default shipping method when available
  useEffect(() => {
    if (availableShipping.length > 0 && !shippingMethod) {
      setShippingMethod(availableShipping[0].id);
      setShippingCost(availableShipping[0].price);
    }
  }, [availableShipping, shippingMethod]);

  const handleShippingChange = (s) => {
    setShippingMethod(s.id);
    setShippingCost(s.price);
  };

  // Mask Formatters
  const formatCPF = (val) => {
    let v = val.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    setCpf(v);
  };

  const formatPhone = (val) => {
    let v = val.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    v = v.replace(/(\d{2})(\d)/, '($1) $2');
    v = v.replace(/(\d{5})(\d)/, '$1-$2');
    setPhone(v);
  };

  const formatCEP = (val) => {
    let v = val.replace(/\D/g, '');
    if (v.length > 8) v = v.slice(0, 8);
    v = v.replace(/(\d{5})(\d)/, '$1-$2');
    setCep(v);
  };

  const formatCardNumber = (val) => {
    let v = val.replace(/\D/g, '');
    if (v.length > 16) v = v.slice(0, 16);
    v = v.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(v);
  };

  const formatCardExpiry = (val) => {
    let v = val.replace(/\D/g, '');
    if (v.length > 4) v = v.slice(0, 4);
    v = v.replace(/(\d{2})(\d)/, '$1/$2');
    setCardExpiry(v);
  };

  const handleFinalizeOrder = async () => {
    // Validate fields
    if (!name.trim() || !email.trim() || !phone.trim() || !cep.trim() || !street.trim() || !number.trim() || !neighborhood.trim() || !city.trim() || !stateCode) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (!paymentMethod) {
      alert('Por favor, selecione uma forma de pagamento.');
      return;
    }

    setProcessing(true);
    try {
      const orderItems = checkoutItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        size: item.size || '',
        color: item.color || ''
      }));

      const payload = {
        items: orderItems,
        shippingAddress: { cep, street, number, complement, neighborhood, city, state: stateCode },
        paymentMethod,
        shippingMethod
      };

      const res = await orderService.create(payload);

      setSuccessOrder({
        orderId: res.orderId,
        total: subtotal + shippingCost
      });

      clearCart();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Falha na comunicação com o servidor.');
    } finally {
      setProcessing(false);
    }
  };

  const getPaymentName = (method) => {
    const names = {
      pix: 'PIX',
      credit: 'Cartão de Crédito',
      debit: 'Cartão de Débito',
      boleto: 'Boleto Bancário'
    };
    return names[method] || method;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.2rem', fontWeight: 600 }}>Carregando dados do checkout...</p>
      </div>
    );
  }

  if (successOrder) {
    const activeShippingOpt = availableShipping.find((s) => s.id === shippingMethod) || availableShipping[0];
    return (
      <main className="content">
        <section className="container-custom py-5" style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
          <div className="checkout-success" style={{ textAlign: 'center' }}>
            <div className="success-icon" style={{ fontSize: '4rem', color: 'var(--color-success)', marginBottom: '20px' }}>
              <i className="fas fa-check-circle"></i>
            </div>
            <h2 className="text-uppercase-bold" style={{ fontSize: '1.8rem', fontWeight: 800 }}>Pedido Realizado com Sucesso!</h2>
            <p style={{ fontSize: '1rem', marginTop: '12px' }}>
              Seu pedido <strong>#{successOrder.orderId.slice(-6).toUpperCase()}</strong> foi registrado.
            </p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Você receberá um e-mail de confirmação em breve.</p>

            <div className="success-details" style={{ margin: '30px 0', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '20px', backgroundColor: 'var(--color-bg)' }}>
              <div className="success-detail-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span>Método de pagamento</span>
                <strong>{getPaymentName(paymentMethod)}</strong>
              </div>
              <div className="success-detail-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span>Entrega</span>
                <strong>{activeShippingOpt?.name} — {activeShippingOpt?.days}</strong>
              </div>
              <div className="success-detail-row" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                <span>Total pago</span>
                <strong>R$ {successOrder.total.toFixed(2)}</strong>
              </div>
            </div>

            <div className="success-actions" style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <Link className="button" to="/products" style={{ textDecoration: 'none' }}>Continuar Comprando</Link>
              <Link className="button button-outline" to="/account" style={{ textDecoration: 'none' }}>Ir para Minha Conta</Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (checkoutItems.length === 0) {
    return (
      <main className="content">
        <section className="box text-center" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <i className="fas fa-shopping-bag" style={{ fontSize: '3rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}></i>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Carrinho vazio</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '8px' }}>Adicione produtos antes de finalizar a compra.</p>
          <Link className="button" to="/products" style={{ marginTop: '24px', display: 'inline-block', textDecoration: 'none' }}>
            Ver Produtos
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="content">
      <section className="container-custom py-5" style={{ padding: '40px 20px' }}>
        <div className="checkout-header" style={{ marginBottom: '30px' }}>
          <h1 className="text-uppercase-bold" style={{ fontSize: '2.2rem', fontWeight: 800 }}>Checkout</h1>
          <div className="checkout-steps">
            <span className="checkout-step active"><i className="fas fa-shopping-cart"></i> Carrinho</span>
            <span className="checkout-step-divider"></span>
            <span className="checkout-step active"><i className="fas fa-credit-card"></i> Pagamento</span>
            <span className="checkout-step-divider"></span>
            <span className="checkout-step"><i className="fas fa-check-circle"></i> Confirmação</span>
          </div>
        </div>

        <div className="checkout-layout">
          {/* LEFT: Forms */}
          <div className="checkout-forms">
            
            {/* Customer Data */}
            <div className="checkout-card">
              <div className="checkout-card-header">
                <i className="fas fa-user"></i>
                <h2>Dados do Cliente</h2>
              </div>
              <div className="checkout-card-body">
                <div className="checkout-form-grid">
                  <div className="form-group">
                    <label>NOME COMPLETO *</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome completo" required />
                  </div>
                  <div className="form-group">
                    <label>E-MAIL *</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required />
                  </div>
                  <div className="form-group">
                    <label>CPF (OPCIONAL)</label>
                    <input type="text" value={cpf} onChange={(e) => formatCPF(e.target.value)} placeholder="000.000.000-00" maxLength={14} />
                  </div>
                  <div className="form-group">
                    <label>TELEFONE *</label>
                    <input type="text" value={phone} onChange={(e) => formatPhone(e.target.value)} placeholder="(00) 00000-0000" maxLength={15} required />
                  </div>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="checkout-card">
              <div className="checkout-card-header">
                <i className="fas fa-map-marker-alt"></i>
                <h2>Endereço de Entrega</h2>
              </div>
              <div className="checkout-card-body">
                <div className="checkout-form-grid">
                  <div className="form-group" style={{ gridColumn: '1 / -1', maxWidth: '200px' }}>
                    <label>CEP *</label>
                    <input type="text" value={cep} onChange={(e) => formatCEP(e.target.value)} placeholder="00000-000" maxLength={9} required />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>RUA *</label>
                    <input type="text" value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Nome da rua" required />
                  </div>
                  <div className="form-group">
                    <label>NÚMERO *</label>
                    <input type="text" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Nº" required />
                  </div>
                  <div className="form-group">
                    <label>COMPLEMENTO</label>
                    <input type="text" value={complement} onChange={(e) => setComplement(e.target.value)} placeholder="Apto, bloco..." />
                  </div>
                  <div className="form-group">
                    <label>BAIRRO *</label>
                    <input type="text" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Bairro" required />
                  </div>
                  <div className="form-group">
                    <label>CIDADE *</label>
                    <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Cidade" required />
                  </div>
                  <div className="form-group">
                    <label>ESTADO *</label>
                    <select value={stateCode} onChange={(e) => setStateCode(e.target.value)} required>
                      <option value="">Selecione</option>
                      {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map((st) => (
                        <option value={st} key={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping */}
            <div className="checkout-card">
              <div className="checkout-card-header">
                <i className="fas fa-truck"></i>
                <h2>Método de Entrega</h2>
              </div>
              <div className="checkout-card-body">
                <div className="shipping-options" id="shipping-options">
                  {availableShipping.map((s) => (
                    <label
                      key={s.id}
                      className={`shipping-option ${shippingMethod === s.id ? 'selected' : ''}`}
                      onClick={() => handleShippingChange(s)}
                    >
                      <input type="radio" name="shipping" value={s.id} checked={shippingMethod === s.id} readOnly />
                      <div className="shipping-option-info">
                        <strong>{s.name}</strong>
                        <span className="shipping-days"><i className="fas fa-clock"></i> {s.days}</span>
                      </div>
                      <span className="shipping-price">{s.price === 0 ? 'GRÁTIS' : `R$ ${s.price.toFixed(2)}`}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="checkout-card">
              <div className="checkout-card-header">
                <i className="fas fa-credit-card"></i>
                <h2>Forma de Pagamento</h2>
              </div>
              <div className="checkout-card-body">
                <div className="payment-methods" id="payment-methods">
                  {['pix', 'credit', 'debit', 'boleto'].map((method) => (
                    <label
                      key={method}
                      className={`payment-method ${paymentMethod === method ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod(method)}
                    >
                      <input type="radio" name="payment" value={method} checked={paymentMethod === method} readOnly />
                      <div className="payment-icon">
                        {method === 'pix' && <i className="fas fa-qrcode"></i>}
                        {method === 'credit' && <i className="fas fa-credit-card"></i>}
                        {method === 'debit' && <i className="fas fa-credit-card"></i>}
                        {method === 'boleto' && <i className="fas fa-barcode"></i>}
                      </div>
                      <span style={{ textTransform: 'capitalize' }}>
                        {method === 'pix' ? 'PIX' : method === 'credit' ? 'Crédito' : method === 'debit' ? 'Débito' : 'Boleto'}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Card Form */}
                {(paymentMethod === 'credit' || paymentMethod === 'debit') && (
                  <div id="card-form" className="card-form-section" style={{ display: 'block' }}>
                    <div className="divider" style={{ margin: '24px 0' }}></div>
                    <div className="checkout-form-grid">
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label>NÚMERO DO CARTÃO</label>
                        <input type="text" value={cardNumber} onChange={(e) => formatCardNumber(e.target.value)} placeholder="0000 0000 0000 0000" maxLength={19} />
                      </div>
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label>NOME NO CARTÃO</label>
                        <input type="text" value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Nome impresso no cartão" />
                      </div>
                      <div className="form-group">
                        <label>VALIDADE</label>
                        <input type="text" value={cardExpiry} onChange={(e) => formatCardExpiry(e.target.value)} placeholder="MM/AA" maxLength={5} />
                      </div>
                      <div className="form-group">
                        <label>CVV</label>
                        <input type="text" value={cardCvv} onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="000" maxLength={4} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT: Order Summary */}
          <div className="checkout-sidebar">
            <div className="checkout-card checkout-summary-card">
              <div className="checkout-card-header">
                <i className="fas fa-receipt"></i>
                <h2>Resumo do Pedido</h2>
              </div>
              <div className="checkout-card-body">
                <div className="checkout-items">
                  {checkoutItems.map((item) => (
                    <div className="checkout-item" key={`${item.productId}-${item.size}-${item.color}`}>
                      <div className="checkout-item-image">
                        <img src={item.image || item.product.images?.[0]} alt={item.name} />
                        <span className="checkout-item-qty-badge">{item.quantity}</span>
                      </div>
                      <div className="checkout-item-details">
                        <strong>{item.name}</strong>
                        <div className="item-variations">
                          {item.size && <span className="item-variation">{item.size}</span>}
                          {item.color && <span className="item-variation">{item.color}</span>}
                        </div>
                      </div>
                      <span className="checkout-item-price">R$ {item.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="checkout-totals">
                  <div className="checkout-total-row">
                    <span>Subtotal</span>
                    <span>R$ {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="checkout-total-row">
                    <span>Frete</span>
                    <span>{shippingCost === 0 ? 'GRÁTIS' : `R$ ${shippingCost.toFixed(2)}`}</span>
                  </div>
                  <div className="checkout-total-row total-final">
                    <strong>Total</strong>
                    <strong>R$ {(subtotal + shippingCost).toFixed(2)}</strong>
                  </div>
                </div>

                <button className="button w-100 checkout-finalize-btn" onClick={handleFinalizeOrder} disabled={processing}>
                  {processing ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> PROCESSANDO...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-lock"></i> FINALIZAR PEDIDO
                    </>
                  )}
                </button>

                <div className="checkout-secure">
                  <i className="fas fa-shield-alt"></i>
                  <span>Compra 100% segura e criptografada</span>
                </div>
              </div>
            </div>

            <Link to="/products" className="button button-outline w-100" style={{ marginTop: '16px', display: 'block', textAlign: 'center', textDecoration: 'none' }}>
              <i className="fas fa-arrow-left"></i> Voltar ao Catálogo
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Checkout;
