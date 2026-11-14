const crypto = require('crypto');

/**
 * MD ESSENTIAL — Mercado Pago Checkout Pro Service
 * Gerencia preferências de pagamento, consulta de pagamentos e validação de webhooks.
 */

const getAccessToken = () => process.env.MP_ACCESS_TOKEN || '';
const getPublicKey = () => process.env.MP_PUBLIC_KEY || '';
const getWebhookSecret = () => process.env.MP_WEBHOOK_SECRET || '';

// Mercado Pago não aceita localhost como back_urls ou notification_url
const getPublicStoreUrl = () => {
  const url = process.env.STORE_URL || 'https://md-essential-api.onrender.com';
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    return 'https://md-essential-api.onrender.com';
  }
  return url.replace(/\/$/, '');
};

const isConfigured = () => {
  const token = getAccessToken();
  return Boolean(token && !token.includes('change_this') && !token.includes('xxxxxxxx'));
};

/**
 * Cria a preferência de pagamento no Mercado Pago (Checkout Pro)
 * @param {Object} params
 * @param {Object} params.order Documento do pedido
 * @param {Array} params.items Itens comprados
 * @param {Object} params.payer Informações do comprador
 */
async function createPreference({ order, items, payer = {} }) {
  const publicStoreUrl = getPublicStoreUrl();
  const orderId = order._id.toString();

  // 1. Mapeia itens para o formato do Mercado Pago
  const mpItems = (items || order.items || []).map(item => {
    let title = item.name || 'Produto MD Essential';
    const variations = [];
    if (item.size) variations.push(`Tam: ${item.size}`);
    if (item.color) variations.push(`Cor: ${item.color}`);
    if (variations.length > 0) {
      title += ` (${variations.join(' - ')})`;
    }

    return {
      id: item.productId?.toString() || item._id?.toString() || 'item',
      title: title.slice(0, 255),
      description: (item.name || 'MD Essential').slice(0, 255),
      quantity: Number(item.quantity) || 1,
      unit_price: Number(item.price) || 0,
      currency_id: 'BRL',
    };
  });

  // 2. Extrai telefone (DDD + Número)
  const rawPhone = (payer.phone || order.customerPhone || order.shippingAddress?.phone || '').replace(/\D/g, '');
  const areaCode = rawPhone.length >= 10 ? rawPhone.slice(0, 2) : '11';
  const phoneNumber = rawPhone.length >= 10 ? rawPhone.slice(2) : (rawPhone || '999999999');

  // 3. Estrutura do Payer
  const mpPayer = {
    name: (payer.name || order.shippingAddress?.recipientName || 'Cliente MD').slice(0, 100),
    email: payer.email || order.customerEmail || 'cliente@mdessential.com',
    phone: {
      area_code: areaCode,
      number: phoneNumber
    },
    address: {
      zip_code: (order.shippingAddress?.zipCode || '').replace(/\D/g, '').slice(0, 8),
      street_name: (order.shippingAddress?.street || 'Rua').slice(0, 100),
      street_number: parseInt(order.shippingAddress?.number, 10) || 1
    }
  };

  // 4. Back URLs obrigatórias (Checkout Pro)
  const backUrls = {
    success: `${publicStoreUrl}/account?status=approved&order_id=${orderId}`,
    pending: `${publicStoreUrl}/account?status=pending&order_id=${orderId}`,
    failure: `${publicStoreUrl}/checkout?status=failure&order_id=${orderId}`,
  };

  // 5. Notification URL (Webhook)
  const notificationUrl = `${publicStoreUrl}/api/checkout/mercadopago/webhook`;

  // Payload da Preferência
  const preferencePayload = {
    items: mpItems,
    payer: mpPayer,
    back_urls: backUrls,
    auto_return: 'approved',
    notification_url: notificationUrl,
    external_reference: orderId,
    statement_descriptor: 'MD ESSENTIAL',
    payment_methods: {
      excluded_payment_types: [],
      installments: 12
    }
  };

  // Adiciona custo de frete se houver
  if (order.shippingPrice && Number(order.shippingPrice) > 0) {
    preferencePayload.shipments = {
      cost: Number(order.shippingPrice),
      mode: 'not_specified'
    };
  }

  // Se o token estiver configurado, envia a requisição oficial para a API do Mercado Pago
  if (isConfigured()) {
    try {
      const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferencePayload)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('[MERCADO PAGO ERR] Erro ao criar preferência na API:', data);
        throw new Error(data.message || 'Falha ao registrar preferência no Mercado Pago');
      }

      console.log(`[MERCADO PAGO] Preferência ${data.id} criada com sucesso para o pedido ${orderId}`);

      return {
        id: data.id,
        init_point: data.init_point,
        sandbox_init_point: data.sandbox_init_point || data.init_point,
        publicKey: getPublicKey(),
        isSimulated: false
      };
    } catch (err) {
      console.error('[MERCADO PAGO EXCEPTION]:', err.message);
      throw err;
    }
  }

  // MODO DE TESTE/SIMULAÇÃO LOCAL (quando o usuário ainda não adicionou o MP_ACCESS_TOKEN oficial no .env)
  console.warn(`[MERCADO PAGO WARN] MP_ACCESS_TOKEN não configurado no .env. Gerando preferência simulada para testes locais do pedido ${orderId}.`);
  const simulatedId = `pref_sim_${orderId}_${Date.now()}`;
  const simulatedInitPoint = `/account?status=approved&order_id=${orderId}&simulated=true`;

  return {
    id: simulatedId,
    init_point: simulatedInitPoint,
    sandbox_init_point: simulatedInitPoint,
    publicKey: getPublicKey() || 'TEST-PUBLIC-KEY-SIMULATED',
    isSimulated: true
  };
}

/**
 * Consulta os detalhes de um pagamento na API do Mercado Pago
 * @param {string} paymentId ID do pagamento retornado no Webhook ou URL
 */
async function getPayment(paymentId) {
  if (!paymentId) return null;

  if (isConfigured()) {
    try {
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`[MERCADO PAGO] Erro ao buscar pagamento ${paymentId}:`, errorData);
        return null;
      }

      const payment = await response.json();
      return payment;
    } catch (err) {
      console.error(`[MERCADO PAGO] Falha de conexão ao consultar pagamento ${paymentId}:`, err.message);
      return null;
    }
  }

  // Fallback simulado para testes
  return {
    id: paymentId,
    status: 'approved',
    status_detail: 'accredited',
    transaction_amount: 199.90,
    date_approved: new Date().toISOString(),
    payment_method_id: 'pix',
    payment_type_id: 'bank_transfer',
    isSimulated: true
  };
}

/**
 * Validação de Assinatura Webhook (HMAC SHA-256)
 * Conforme especificação oficial do Mercado Pago:
 * x-signature: "ts=...,v1=..."
 * x-request-id: "uuid"
 * manifest = "id:[data.id];request-id:[x-request-id];ts:[ts];"
 */
function verifyWebhookSignature({ signatureHeader, requestIdHeader, dataId }) {
  const secret = getWebhookSecret();

  // Se o secret não foi cadastrado no .env, avisa no log e permite validação direta via API de pagamentos
  if (!secret || secret.includes('change_this') || secret.includes('xxxxxxxx')) {
    console.warn('[MERCADO PAGO] MP_WEBHOOK_SECRET não configurado. Verificação feita diretamente via consulta de pagamento na API.');
    return true;
  }

  if (!signatureHeader || !requestIdHeader || !dataId) {
    return false;
  }

  try {
    const parts = signatureHeader.split(',').reduce((acc, part) => {
      const [k, v] = part.split('=');
      if (k && v) acc[k.trim()] = v.trim();
      return acc;
    }, {});

    const ts = parts.ts;
    const v1 = parts.v1;

    if (!ts || !v1) return false;

    const manifest = `id:${dataId};request-id:${requestIdHeader};ts:${ts};`;
    const computedHmac = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

    return computedHmac === v1;
  } catch (err) {
    console.error('[MERCADO PAGO] Erro ao verificar assinatura HMAC:', err.message);
    return false;
  }
}

module.exports = {
  isConfigured,
  createPreference,
  getPayment,
  verifyWebhookSignature,
  getPublicStoreUrl,
  getPublicKey,
  getAccessToken
};
