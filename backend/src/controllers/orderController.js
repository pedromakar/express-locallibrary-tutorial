const Order = require('../models/order');
const Product = require('../models/product');
const Notification = require('../models/notification');

// POST /api/orders
exports.createOrder = async (req, res) => {
  try {
    const { items } = req.body;

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

    const order = new Order({
      user: req.user.id || req.user._id,
      items: orderItems,
      totalPrice: totalPrice,
      status: 'pending'
    });

    const createdOrder = await order.save();

    // Fire-and-forget notifications
    Notification.create({
      type: 'new_order',
      title: 'Novo pedido recebido',
      message: `Pedido #${createdOrder._id.toString().slice(-6).toUpperCase()} — R$ ${totalPrice.toFixed(2)}`,
      relatedId: createdOrder._id.toString(),
    }).catch(() => {});

    // Check for out of stock products
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

    res.status(201).json({ 
      message: 'Pedido criado com sucesso', 
      orderId: createdOrder._id,
      totalPrice: createdOrder.totalPrice
    });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao criar pedido', error: err.message });
  }
};

// GET /api/orders/:userId
exports.getOrdersByUser = async (req, res) => {
  try {
    // Ensure user can only see their own orders unless admin (simplified: only own)
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
    
    // Check ownership
    const userId = req.user.id || req.user._id;
    if (order.user.toString() !== userId.toString() && !req.user.isAdmin) {
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
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }

    order.status = status;
    const updatedOrder = await order.save();

    // Notify on cancellation
    if (status === 'canceled') {
      Notification.create({
        type: 'order_canceled',
        title: 'Pedido cancelado',
        message: `Pedido #${order._id.toString().slice(-6).toUpperCase()} foi cancelado.`,
        relatedId: order._id.toString(),
      }).catch(() => {});
    }
    if (status === 'shipped') {
      Notification.create({
        type: 'order_shipped',
        title: 'Pedido enviado',
        message: `Pedido #${order._id.toString().slice(-6).toUpperCase()} foi marcado como enviado.`,
        relatedId: order._id.toString(),
      }).catch(() => {});
    }

    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar status do pedido', error: err.message });
  }
};
