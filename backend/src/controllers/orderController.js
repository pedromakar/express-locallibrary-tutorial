const Order = require('../models/order');
const mongoose = require('mongoose');

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

exports.createOrder = async (req, res) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    } = req.body;

    if (orderItems && orderItems.length === 0) {
      return res.status(400).json({ message: 'Nenhum item no pedido' });
    }

    if (!isDbConnected()) {
      return res.status(201).json({ message: 'Pedido simulado (Offline)', id: Date.now() });
    }

    const order = new Order({
      orderItems,
      user: req.user._id,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    });

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
  } catch (err) {
    res.status(400).json({ message: 'Erro ao criar pedido', error: err.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.json([]);
    }
    const orders = await Order.find({}).populate('user', 'id username email');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar pedidos' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, isPaid, isDelivered } = req.body;
    if (!isDbConnected()) {
      return res.status(400).json({ message: 'Database not connected' });
    }
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Pedido não encontrado' });

    order.status = status || order.status;
    if (isPaid !== undefined) {
        order.isPaid = isPaid;
        if (isPaid) order.paidAt = Date.now();
    }
    if (isDelivered !== undefined) {
        order.isDelivered = isDelivered;
        if (isDelivered) order.deliveredAt = Date.now();
    }

    await order.save();
    res.json({ message: 'Status do pedido atualizado', order });
  } catch (err) {
    res.status(400).json({ message: 'Dados inválidos' });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(400).json({ message: 'Database not connected' });
    }
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: 'Pedido não encontrado' });
    res.json({ message: 'Pedido removido' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao remover pedido' });
  }
};
