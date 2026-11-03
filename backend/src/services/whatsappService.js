/**
 * WhatsApp Notification & Automation Service
 * Suporta integração com Evolution API, Z-API ou link direto WhatsApp API
 */

function sanitizePhone(phone) {
  if (!phone) return null;
  let cleaned = phone.toString().replace(/\D/g, '');
  if (cleaned.length === 10 || cleaned.length === 11) {
    cleaned = '55' + cleaned;
  }
  return cleaned;
}

/**
 * Envia notificação de WhatsApp via Evolution API / Z-API ou gera link direto
 */
async function dispatchWhatsAppMessage({ phone, message }) {
  const cleanPhone = sanitizePhone(phone);
  if (!cleanPhone) {
    console.log('[WHATSAPP] Telefone inválido ou não informado:', phone);
    return null;
  }

  // 1. Se houver API de WhatsApp configurada (ex: Evolution API ou Z-API)
  if (process.env.WHATSAPP_API_URL && process.env.WHATSAPP_API_KEY) {
    try {
      const response = await fetch(`${process.env.WHATSAPP_API_URL}/message/sendText/${process.env.WHATSAPP_INSTANCE_NAME || 'md-essential'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.WHATSAPP_API_KEY,
        },
        body: JSON.stringify({
          number: cleanPhone,
          text: message,
        }),
      });
      const data = await response.json();
      console.log('[WHATSAPP API] Notificação enviada com sucesso:', data);
      return { success: true, provider: 'api', data };
    } catch (err) {
      console.error('[WHATSAPP API ERROR]:', err.message);
    }
  }

  // 2. Modo fallback: Loga a mensagem formatada e URL direta de disparo
  const directUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
  console.log(`\n💬 [WHATSAPP NOTIFICATION BOT] Destinatário: +${cleanPhone}`);
  console.log(`Mensagem:\n${message}`);
  console.log(`🔗 Link de disparo manual/teste: ${directUrl}\n`);

  return { success: true, provider: 'direct_link', directUrl, cleanPhone, message };
}

/**
 * Notificação: Pedido Criado
 */
exports.notifyOrderCreated = async (order) => {
  const phone = order.shippingAddress?.phone || order.customerPhone;
  const recipient = order.shippingAddress?.recipientName || 'Cliente';
  const shortId = order._id.toString().slice(-6).toUpperCase();
  const trackingUrl = `${process.env.APP_URL || 'http://localhost:5001'}/tracking.html?code=${order._id}`;

  const message = 
`⚡ *MD ESSENTIAL - Pedido Recebido!* ⚡

Olá, *${recipient}*! Tudo bem?
Confirmamos o recebimento do seu pedido *#${shortId}*! 🛍️

📦 *Total:* R$ ${order.totalPrice.toFixed(2)}
💳 *Pagamento:* ${order.paymentMethod || 'Aguardando'}

Estamos separando os seus itens com o padrão de qualidade MD Essential.

📍 *Acompanhe em tempo real pelo link:*
${trackingUrl}

Qualquer dúvida estamos à disposição! 🔥`;

  return await dispatchWhatsAppMessage({ phone, message });
};

/**
 * Notificação: Pedido Enviado / Despachado com Rastreio
 */
exports.notifyOrderShipped = async (order) => {
  const phone = order.shippingAddress?.phone || order.customerPhone;
  const recipient = order.shippingAddress?.recipientName || 'Cliente';
  const shortId = order._id.toString().slice(-6).toUpperCase();
  const trackingCode = order.trackingCode || 'AGUARDANDO';
  const trackingUrl = `${process.env.APP_URL || 'http://localhost:5001'}/tracking.html?code=${trackingCode}`;

  const message = 
`🚚 *MD ESSENTIAL - Seu Pedido Foi Despachado!* 💨

Olá, *${recipient}*! Boas notícias:
O seu pedido *#${shortId}* acabou de sair do nosso centro de distribuição!

📦 *Transportadora:* ${order.carrier || 'Correios'}
📍 *Código de Rastreio:* \`${trackingCode}\`

Acompanhe cada etapa e localização do pacote em tempo real:
👉 ${trackingUrl}

Prepare-se para superar seus limites no próximo treino! 🚀`;

  return await dispatchWhatsAppMessage({ phone, message });
};

/**
 * Notificação: Pedido Entregue
 */
exports.notifyOrderDelivered = async (order) => {
  const phone = order.shippingAddress?.phone || order.customerPhone;
  const recipient = order.shippingAddress?.recipientName || 'Cliente';
  const shortId = order._id.toString().slice(-6).toUpperCase();
  const reviewUrl = `${process.env.APP_URL || 'http://localhost:5001'}/products.html`;

  const message = 
`✅ *MD ESSENTIAL - Pedido Entregue!* 🎉

Olá, *${recipient}*!
Consta em nosso sistema que seu pedido *#${shortId}* foi entregue com sucesso!

Esperamos que as peças superem todas as suas expectativas de conforto e alta performance.

⭐ Gostou da experiência?
Avalie nossos produtos no site e ganhe 10% de cashback no próximo drop:
${reviewUrl}

Muito obrigado por escolher a MD ESSENTIAL! 🔥`;

  return await dispatchWhatsAppMessage({ phone, message });
};

/**
 * Resposta automática para mensagens de Chatbot ("Onde está meu pedido?")
 */
exports.generateBotResponse = (query, order) => {
  if (!order) {
    return 'Desculpe, não localizei nenhum pedido com esse número ou código de rastreio. Poderia conferir e enviar novamente?';
  }

  const shortId = order._id.toString().slice(-6).toUpperCase();
  const statusLabels = {
    pending: 'Aguardando Pagamento ⏳',
    paid: 'Pagamento Confirmado / Em Separação 📦',
    processing: 'Em Preparação para Envio ⚙️',
    shipped: 'Em Trânsito / Despachado 🚚💨',
    delivered: 'Entregue com Sucesso! ✅',
    canceled: 'Cancelado ❌'
  };

  const currentStatus = statusLabels[order.status] || order.status;
  const trackingUrl = `${process.env.APP_URL || 'http://localhost:5001'}/tracking.html?code=${order.trackingCode || order._id}`;

  return `Encontrei seu pedido! 🔎\n\n` +
         `📋 *Pedido:* #${shortId}\n` +
         `📊 *Status Atual:* ${currentStatus}\n` +
         (order.trackingCode ? `📍 *Rastreio:* \`${order.trackingCode}\` (${order.carrier || 'Correios'})\n` : '') +
         `🔗 *Ver detalhes da rota em tempo real:*\n${trackingUrl}`;
};
