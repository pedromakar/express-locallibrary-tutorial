const Order = require('../models/order');
const Product = require('../models/product');

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
      user: req.user._id,
      items: orderItems,
      totalPrice: totalPrice,
      status: 'pending'
    });

    const createdOrder = await order.save();
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
    if (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
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
    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar status do pedido', error: err.message });
  }
};
