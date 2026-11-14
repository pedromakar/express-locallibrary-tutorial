const Order = require('../models/order');
const Product = require('../models/product');
const Notification = require('../models/notification');
const User = require('../models/user');
const emailService = require('../services/emailService');
const whatsappService = require('../services/whatsappService');
const shippingService = require('../services/shippingService');
const mercadoPagoService = require('../services/mercadoPagoService');

// POST /api/orders
exports.createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, customerPhone, customerEmail } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Nenhum item no pedido' });
    }

    // Backend as source of truth: fetch each product to get current price and validate existence
    let totalPrice = 0;
    const orderItems = [];

    for (const item of items) {
      const dbProduct = await Product.findById(item.productId);
      if (!dbProduct) {
        return res.status(404).json({ message: `Produto ${item.productId} não encontrado` });
      }

      if (dbProduct.countInStock < item.quantity) {
        return res.status(400).json({ message: `Estoque insuficiente para o produto ${dbProduct.name}` });
      }

      const itemTotal = dbProduct.price * item.quantity;
      totalPrice += itemTotal;

      orderItems.push({
        productId: dbProduct._id,
        name: dbProduct.name,
        price: dbProduct.price,
        quantity: item.quantity,
        size: item.size,
        color: item.color
      });

      // Update stock
      dbProduct.countInStock -= item.quantity;
      await dbProduct.save();
    }

    const shippingPrice = req.body.shippingPrice || 0;
    const finalTotal = totalPrice + shippingPrice;

    // Obtém dados do usuário logado se disponíveis
    let userRecord = null;
    const userId = req.user?.id || req.user?._id;
    if (userId) {
      userRecord = await User.findById(userId);
    }

    const order = new Order({
      user: userId || req.user?.id || req.user?._id,
      items: orderItems,
      totalPrice: finalTotal,
      status: 'pending',
      paymentMethod: req.body.paymentMethod || 'PIX',
      shippingMethod: req.body.shippingMethod || 'Correios PAC',
      shippingPrice: shippingPrice,
      shippingAddress: shippingAddress || {},
      customerPhone: customerPhone || shippingAddress?.phone || userRecord?.phone || '',
      customerEmail: customerEmail || userRecord?.email || '',
      pixCode: req.body.pixCode || '',
      boletoCode: req.body.boletoCode || '',
      carrier: req.body.carrier || 'Correios',
      trackingEvents: [
        {
          status: 'PEDIDO_CRIADO',
          description: 'Pedido recebido pelo sistema da MD Essential.',
          location: 'Sombrio/SC',
          date: new Date()
        }
      ]
    });

    const createdOrder = await order.save();

    // 1. Notificação interna no painel admin
    Notification.create({
      type: 'new_order',
      title: 'Novo pedido recebido',
      message: `Pedido #${createdOrder._id.toString().slice(-6).toUpperCase()} — R$ ${finalTotal.toFixed(2)}`,
      relatedId: createdOrder._id.toString(),
    }).catch(() => {});

    // 2. Disparo Automático de E-mail de Confirmação
    emailService.sendOrderConfirmationEmail({
      order: createdOrder,
      user: userRecord || { username: shippingAddress?.recipientName || 'Cliente', email: customerEmail }
    }).catch(err => console.error('[EMAIL NOTIFY ERR]:', err.message));

    // 3. Disparo Automático de WhatsApp Bot
    whatsappService.notifyOrderCreated(createdOrder).catch(err => console.error('[WHATSAPP NOTIFY ERR]:', err.message));

    // 4. Verificação de estoque baixo/zerado
    for (const item of orderItems) {
      const prod = await Product.findById(item.productId).lean();
      if (prod && prod.countInStock === 0) {
        Notification.create({
          type: 'out_of_stock',
          title: 'Produto sem estoque',
          message: `"${prod.name}" está com estoque zerado.`,
          relatedId: prod._id.toString(),
        }).catch(() => {});
      } else if (prod && prod.countInStock > 0 && prod.countInStock <= 5) {
        Notification.create({
          type: 'low_stock',
          title: 'Estoque baixo',
          message: `"${prod.name}" tem apenas ${prod.countInStock} unidades.`,
          relatedId: prod._id.toString(),
        }).catch(() => {});
      }
    }

    // 5. Integração com Mercado Pago Checkout Pro (se selecionado)
    let mpPreference = null;
    if (req.body.paymentMethod === 'mercadopago') {
      try {
        mpPreference = await mercadoPagoService.createPreference({
          order: createdOrder,
          items: orderItems,
          payer: {
            name: shippingAddress?.recipientName || userRecord?.username,
            email: customerEmail || userRecord?.email,
            phone: customerPhone || shippingAddress?.phone || userRecord?.phone
          }
        });
        if (mpPreference) {
          createdOrder.mercadopagoPreferenceId = mpPreference.id;
          await createdOrder.save();
        }
      } catch (mpErr) {
        console.error('[MERCADO PAGO CREATE PREF WARN]:', mpErr.message);
      }
    }

    res.status(201).json({ 
      message: 'Pedido criado com sucesso', 
      orderId: createdOrder._id,
      totalPrice: createdOrder.totalPrice,
      preference: mpPreference
    });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao criar pedido', error: err.message });
  }
};

// GET /api/orders/:userId
exports.getOrdersByUser = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.params.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar histórico de pedidos', error: err.message });
  }
};

// GET /api/order/:id
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }
    
    const userId = req.user?.id || req.user?._id;
    if (order.user && order.user.toString() !== userId?.toString() && !req.user?.isAdmin) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar detalhes do pedido', error: err.message });
  }
};

// GET /api/admin/orders
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).populate('user', 'username email').sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar todos os pedidos', error: err.message });
  }
};

// PUT /api/admin/orders/:id/status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, trackingCode, carrier, trackingEventDescription, trackingLocation } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }

    order.status = status;
    if (trackingCode) order.trackingCode = trackingCode;
    if (carrier) order.carrier = carrier;

    // Adiciona evento de rastreio correspondente
    if (status === 'shipped') {
      const generatedCode = trackingCode || order.trackingCode || `MD${Math.floor(100000000 + Math.random() * 900000000)}BR`;
      order.trackingCode = generatedCode;

      order.trackingEvents.push({
        status: 'EM_TRANSITO',
        description: trackingEventDescription || 'Objeto postado e em trânsito para o destino.',
        location: trackingLocation || 'Centro de Distribuição - Sombrio/SC',
        date: new Date()
      });

      // Dispara E-mail de Despacho
      emailService.sendOrderShippedEmail({
        order,
        user: { username: order.shippingAddress?.recipientName || 'Cliente', email: order.customerEmail }
      }).catch(() => {});

      // Dispara WhatsApp Bot de Despacho
      whatsappService.notifyOrderShipped(order).catch(() => {});

      Notification.create({
        type: 'order_shipped',
        title: 'Pedido enviado',
        message: `Pedido #${order._id.toString().slice(-6).toUpperCase()} despachado (${generatedCode}).`,
        relatedId: order._id.toString(),
      }).catch(() => {});
    } else if (status === 'delivered') {
      order.trackingEvents.push({
        status: 'ENTREGUE',
        description: trackingEventDescription || 'Objeto entregue ao destinatário com sucesso.',
        location: order.shippingAddress?.city ? `${order.shippingAddress.city}/${order.shippingAddress.state}` : 'Endereço de Entrega',
        date: new Date()
      });

      // Dispara WhatsApp Bot de Pedido Entregue
      whatsappService.notifyOrderDelivered(order).catch(() => {});
    } else if (status === 'canceled') {
      Notification.create({
        type: 'order_canceled',
        title: 'Pedido cancelado',
        message: `Pedido #${order._id.toString().slice(-6).toUpperCase()} foi cancelado.`,
        relatedId: order._id.toString(),
      }).catch(() => {});
    }

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar status do pedido', error: err.message });
  }
};

/**
 * PUT /api/admin/orders/:id
 * Edição completa do pedido pelo administrador (status, frete, endereço, rastreamento, eventos)
 */
exports.adminUpdateOrder = async (req, res) => {
  try {
    const {
      status,
      trackingCode,
      carrier,
      shippingPrice,
      shippingMethod,
      shippingAddress,
      customerPhone,
      customerEmail,
      trackingEventDescription,
      trackingLocation
    } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }

    const previousStatus = order.status;

    if (status) order.status = status;
    if (trackingCode !== undefined) order.trackingCode = trackingCode;
    if (carrier !== undefined) order.carrier = carrier;
    if (shippingPrice !== undefined) order.shippingPrice = Number(shippingPrice);
    if (shippingMethod !== undefined) order.shippingMethod = shippingMethod;
    if (customerPhone !== undefined) order.customerPhone = customerPhone;
    if (customerEmail !== undefined) order.customerEmail = customerEmail;
    if (shippingAddress) {
      order.shippingAddress = {
        ...order.shippingAddress,
        ...shippingAddress
      };
    }

    // Se foi adicionado um evento customizado de rastreio
    if (trackingEventDescription && trackingEventDescription.trim()) {
      order.trackingEvents.push({
        status: status ? status.toUpperCase() : 'ATUALIZACAO',
        description: trackingEventDescription.trim(),
        location: trackingLocation || (order.shippingAddress?.city ? `${order.shippingAddress.city}/${order.shippingAddress.state}` : 'Centro Logístico - Sombrio/SC'),
        date: new Date()
      });
    }

    // Disparos automáticos se o status mudou para 'shipped' ou 'delivered'
    if (status === 'shipped' && previousStatus !== 'shipped') {
      const generatedCode = trackingCode || order.trackingCode || `MD${Math.floor(100000000 + Math.random() * 900000000)}BR`;
      order.trackingCode = generatedCode;

      if (!trackingEventDescription) {
        order.trackingEvents.push({
          status: 'EM_TRANSITO',
          description: 'Objeto postado e em trânsito para o destino.',
          location: 'Centro de Distribuição - Sombrio/SC',
          date: new Date()
        });
      }

      emailService.sendOrderShippedEmail({
        order,
        user: { username: order.shippingAddress?.recipientName || 'Cliente', email: order.customerEmail }
      }).catch(() => {});

      whatsappService.notifyOrderShipped(order).catch(() => {});

      Notification.create({
        type: 'order_shipped',
        title: 'Pedido enviado',
        message: `Pedido #${order._id.toString().slice(-6).toUpperCase()} despachado (${generatedCode}).`,
        relatedId: order._id.toString(),
      }).catch(() => {});
    } else if (status === 'delivered' && previousStatus !== 'delivered') {
      if (!trackingEventDescription) {
        order.trackingEvents.push({
          status: 'ENTREGUE',
          description: 'Objeto entregue ao destinatário com sucesso.',
          location: order.shippingAddress?.city ? `${order.shippingAddress.city}/${order.shippingAddress.state}` : 'Endereço de Entrega',
          date: new Date()
        });
      }
      whatsappService.notifyOrderDelivered(order).catch(() => {});
    } else if (status === 'canceled' && previousStatus !== 'canceled') {
      // Estorna produtos ao estoque
      for (const item of order.items) {
        const p = await Product.findById(item.productId);
        if (p) {
          p.countInStock += item.quantity;
          await p.save();
        }
      }
      Notification.create({
        type: 'order_canceled',
        title: 'Pedido cancelado',
        message: `Pedido #${order._id.toString().slice(-6).toUpperCase()} cancelado e estoque estornado.`,
        relatedId: order._id.toString(),
      }).catch(() => {});
    }

    const updated = await order.save();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar pedido', error: err.message });
  }
};

/**
 * GET /api/orders/track/:query
 * Rastreamento público de pedidos em tempo real (por código de rastreio ou ID do pedido)
 */
exports.trackOrder = async (req, res) => {
  try {
    const query = req.params.query?.trim();
    if (!query) {
      return res.status(400).json({ message: 'Código de rastreamento ou ID não informado' });
    }

    let order = null;

    // Busca por código de rastreamento exato
    order = await Order.findOne({ trackingCode: { $regex: new RegExp(`^${query}$`, 'i') } });

    // Se não encontrou, tenta por ID do MongoDB
    if (!order && query.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findById(query);
    }

    // Se não encontrou, tenta pelos últimos 6 caracteres do ID
    if (!order && query.length >= 4) {
      const allRecent = await Order.find({}).sort({ createdAt: -1 }).limit(100);
      order = allRecent.find(o => o._id.toString().toUpperCase().endsWith(query.toUpperCase()));
    }

    if (!order) {
      return res.status(404).json({ message: 'Nenhum pedido ou código de rastreio encontrado com este código.' });
    }

    // Retorna payload higienizado para visualização pública
    res.json({
      orderId: order._id,
      shortId: order._id.toString().slice(-6).toUpperCase(),
      status: order.status,
      carrier: order.carrier || 'Correios',
      trackingCode: order.trackingCode || null,
      shippingMethod: order.shippingMethod,
      shippingPrice: order.shippingPrice,
      totalPrice: order.totalPrice,
      recipientName: order.shippingAddress?.recipientName || 'Cliente',
      destinationCity: order.shippingAddress?.city || null,
      destinationState: order.shippingAddress?.state || null,
      destinationZip: order.shippingAddress?.zipCode ? `${order.shippingAddress.zipCode.slice(0, 5)}-***` : null,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items.map(i => ({ name: i.name, quantity: i.quantity, size: i.size, color: i.color })),
      trackingEvents: (order.trackingEvents && order.trackingEvents.length > 0) ? order.trackingEvents : [
        {
          status: 'PROCESSANDO',
          description: 'Pedido em processamento no centro logístico.',
          location: 'Sombrio/SC',
          date: order.createdAt
        }
      ]
    });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao rastrear pedido', error: err.message });
  }
};

/**
 * POST /api/shipping/calculate
 * Cotação instantânea de fretes (Melhor Envio / Correios)
 */
exports.calculateShipping = async (req, res) => {
  try {
    const { destinationCep, items, cartTotal } = req.body;
    if (!destinationCep) {
      return res.status(400).json({ message: 'CEP de destino é obrigatório' });
    }

    const options = await shippingService.calculateShipping({
      destinationCep,
      items: items || [],
      cartTotal: cartTotal || 0
    });

    res.json({
      originCep: '88960-000',
      destinationCep,
      options
    });
  } catch (err) {
    res.status(400).json({ message: err.message || 'Erro ao calcular frete' });
  }
};

/**
 * POST /api/webhooks/whatsapp
 * Webhook para respostas automáticas do Bot de WhatsApp
 */
exports.handleWhatsAppWebhook = async (req, res) => {
  try {
    const { message, from } = req.body;
    console.log(`[WHATSAPP WEBHOOK] Mensagem recebida de ${from}: "${message}"`);

    // Procura se tem algum código de pedido ou rastreio na mensagem
    let reply = 'Olá! Sou o assistente virtual da MD ESSENTIAL. Digite o número do seu pedido (ex: #1042) ou seu código de rastreio para ver o status em tempo real.';
    
    const codeMatch = (message || '').match(/([0-9a-fA-F]{6,24}|MD\d+BR)/i);
    if (codeMatch) {
      const code = codeMatch[0];
      const order = await Order.findOne({
        $or: [
          { trackingCode: { $regex: new RegExp(code, 'i') } },
          ...(code.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: code }] : [])
        ]
      });
      reply = whatsappService.generateBotResponse(code, order);
    }

    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/checkout/mercadopago/create-preference
 * Cria ou recupera preferência de pagamento Checkout Pro
 */
exports.createMercadoPagoPreference = async (req, res) => {
  try {
    const { orderId, payer } = req.body;
    if (!orderId) {
      return res.status(400).json({ message: 'ID do pedido é obrigatório' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }

    // Valida permissão do usuário
    const userId = req.user?.id || req.user?._id;
    if (order.user && order.user.toString() !== userId?.toString() && !req.user?.isAdmin) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    const preference = await mercadoPagoService.createPreference({
      order,
      items: order.items,
      payer: payer || {
        name: order.shippingAddress?.recipientName,
        email: order.customerEmail,
        phone: order.customerPhone || order.shippingAddress?.phone
      }
    });

    order.mercadopagoPreferenceId = preference.id;
    order.paymentMethod = 'mercadopago';
    await order.save();

    res.json({
      success: true,
      orderId: order._id,
      preferenceId: preference.id,
      init_point: preference.init_point,
      sandbox_init_point: preference.sandbox_init_point,
      isSimulated: preference.isSimulated
    });
  } catch (err) {
    console.error('[MERCADO PAGO PREFERENCE CONTROLLER ERR]:', err);
    res.status(500).json({ message: 'Erro ao gerar preferência do Mercado Pago', error: err.message });
  }
};

/**
 * POST /api/checkout/mercadopago/webhook
 * Recebe notificações Webhook do Mercado Pago (v1 e v2)
 */
exports.handleMercadoPagoWebhook = async (req, res) => {
  // 1. Responde HTTP 200 imediatamente para o Mercado Pago não retentar em loop
  res.status(200).send('OK');

  try {
    const body = req.body || {};
    const query = req.query || {};
    const headers = req.headers || {};

    const type = body.type || body.action || query.type || query.topic;
    const dataId = body.data?.id || body.id || query['data.id'] || query.id;

    console.log(`[MERCADO PAGO WEBHOOK] Evento recebido: type=${type}, dataId=${dataId}`);

    if (!dataId) {
      return;
    }

    // 2. Validação da assinatura HMAC do Webhook (quando o secret estiver configurado)
    const signatureHeader = headers['x-signature'];
    const requestIdHeader = headers['x-request-id'];
    const isSignatureValid = mercadoPagoService.verifyWebhookSignature({
      signatureHeader,
      requestIdHeader,
      dataId: dataId.toString()
    });

    if (!isSignatureValid) {
      console.warn(`[MERCADO PAGO WEBHOOK] Assinatura inválida descartada para dataId ${dataId}`);
      return;
    }

    // 3. Processamento de eventos de pagamento
    if (type === 'payment' || (typeof type === 'string' && type.startsWith('payment'))) {
      const payment = await mercadoPagoService.getPayment(dataId);
      if (!payment) {
        console.warn(`[MERCADO PAGO WEBHOOK] Detalhes do pagamento ${dataId} não localizados`);
        return;
      }

      console.log(`[MERCADO PAGO WEBHOOK] Pagamento ${payment.id}: status=${payment.status}, ref=${payment.external_reference}`);

      const orderId = payment.external_reference;
      let order = null;

      if (orderId && orderId.match(/^[0-9a-fA-F]{24}$/)) {
        order = await Order.findById(orderId);
      }

      if (!order) {
        order = await Order.findOne({
          $or: [
            { mercadopagoPreferenceId: payment.preference_id },
            { mercadopagoPaymentId: payment.id?.toString() }
          ]
        });
      }

      if (!order) {
        console.warn(`[MERCADO PAGO WEBHOOK] Nenhum pedido associado ao pagamento ${payment.id} (ref: ${orderId})`);
        return;
      }

      // Atualiza dados do pagamento
      order.mercadopagoPaymentId = payment.id?.toString();
      order.mercadopagoStatus = payment.status;

      if (payment.status === 'approved') {
        const wasAlreadyPaid = order.status === 'paid' || order.isPaid;
        order.status = 'paid';
        order.isPaid = true;
        order.paidAt = new Date(payment.date_approved || Date.now());

        if (!wasAlreadyPaid) {
          order.trackingEvents.push({
            status: 'PAGAMENTO_APROVADO',
            description: `Pagamento aprovado via Mercado Pago Checkout Pro (${payment.payment_method_id?.toUpperCase() || 'Cartão/Pix'}).`,
            location: 'Mercado Pago Gateway',
            date: new Date()
          });

          // Notificação Admin
          Notification.create({
            type: 'payment_confirmed',
            title: 'Pagamento Mercado Pago aprovado',
            message: `Pedido #${order._id.toString().slice(-6).toUpperCase()} pago com sucesso (R$ ${order.totalPrice.toFixed(2)}).`,
            relatedId: order._id.toString()
          }).catch(() => {});

          // Disparos automáticos
          let userRecord = null;
          if (order.user) {
            userRecord = await User.findById(order.user);
          }
          emailService.sendOrderConfirmationEmail({
            order,
            user: userRecord || { username: order.shippingAddress?.recipientName || 'Cliente', email: order.customerEmail }
          }).catch(err => console.error('[EMAIL NOTIFY ERR]:', err.message));

          whatsappService.notifyOrderCreated(order)
            .catch(err => console.error('[WHATSAPP NOTIFY ERR]:', err.message));
        }
      } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
        order.status = 'canceled';
        order.trackingEvents.push({
          status: 'PAGAMENTO_RECUSADO',
          description: `Pagamento ${payment.status === 'rejected' ? 'recusado' : 'cancelado'} no Mercado Pago (${payment.status_detail || ''}).`,
          location: 'Mercado Pago Gateway',
          date: new Date()
        });
      }

      await order.save();
      console.log(`[MERCADO PAGO WEBHOOK] Pedido #${order._id.toString().slice(-6).toUpperCase()} atualizado para status: ${order.status}`);
    }
  } catch (err) {
    console.error('[MERCADO PAGO WEBHOOK HANDLER ERR]:', err);
  }
};

/**
 * GET /api/checkout/mercadopago/status/:orderId
 * Retorna status verificado do pagamento no Mercado Pago
 */
exports.getMercadoPagoStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }

    res.json({
      orderId: order._id,
      shortId: order._id.toString().slice(-6).toUpperCase(),
      status: order.status,
      isPaid: Boolean(order.isPaid || order.status === 'paid'),
      paidAt: order.paidAt || null,
      paymentMethod: order.paymentMethod,
      mercadopagoStatus: order.mercadopagoStatus || null,
      mercadopagoPaymentId: order.mercadopagoPaymentId || null,
      totalPrice: order.totalPrice
    });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao verificar status do pagamento', error: err.message });
  }
};


