const Order = require('../models/order');
const User = require('../models/user');
const Product = require('../models/product');
const Notification = require('../models/notification');

// Helper: get start of today
function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// Helper: get start of current month
function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

// GET /api/admin/stats
exports.getStats = async (req, res) => {
  try {
    const today = startOfToday();
    const monthStart = startOfMonth();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // --- Orders ---
    const allOrders = await Order.find({}).populate('user', 'username email').lean();

    const ordersToday = allOrders.filter(o => new Date(o.createdAt) >= today);
    const ordersPending = allOrders.filter(o => o.status === 'pending');
    const ordersShipped = allOrders.filter(o => o.status === 'shipped');
    const ordersCanceled = allOrders.filter(o => o.status === 'canceled');
    const ordersPaid = allOrders.filter(o => o.status === 'paid' || o.status === 'shipped');

    const revenueToday = ordersToday
      .filter(o => o.status !== 'canceled')
      .reduce((sum, o) => sum + o.totalPrice, 0);

    const revenueMonth = allOrders
      .filter(o => new Date(o.createdAt) >= monthStart && o.status !== 'canceled')
      .reduce((sum, o) => sum + o.totalPrice, 0);

    const revenueTotal = allOrders
      .filter(o => o.status !== 'canceled')
      .reduce((sum, o) => sum + o.totalPrice, 0);

    const paidOrders = allOrders.filter(o => o.status !== 'canceled');
    const avgTicket = paidOrders.length > 0 ? revenueTotal / paidOrders.length : 0;

    // --- Customers ---
    const totalCustomers = await User.countDocuments({ role: 'user' });
    const newCustomers = await User.countDocuments({
      role: 'user',
      createdAt: { $gte: sevenDaysAgo },
    });

    // --- Products ---
    const allProducts = await Product.find({}).lean();
    const totalProducts = allProducts.length;
    const outOfStock = allProducts.filter(p => p.countInStock === 0).length;
    const lowStock = allProducts.filter(p => p.countInStock > 0 && p.countInStock <= 5).length;

    // --- Top Products (by quantity sold across orders) ---
    const productSales = {};
    for (const order of allOrders) {
      if (order.status === 'canceled') continue;
      for (const item of order.items) {
        const key = item.name;
        if (!productSales[key]) {
          productSales[key] = { name: key, sold: 0, revenue: 0 };
        }
        productSales[key].sold += item.quantity;
        productSales[key].revenue += item.price * item.quantity;
      }
    }
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);

    // --- Top Categories ---
    const categorySales = {};
    for (const order of allOrders) {
      if (order.status === 'canceled') continue;
      for (const item of order.items) {
        // Find product category
        const prod = allProducts.find(p => p._id.toString() === (item.productId?.toString() || ''));
        const cat = prod?.category || 'Outros';
        if (!categorySales[cat]) {
          categorySales[cat] = { name: cat, sold: 0 };
        }
        categorySales[cat].sold += item.quantity;
      }
    }
    const topCategories = Object.values(categorySales)
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);

    // --- Abandoned Carts ---
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const usersWithCarts = await User.find({
      'cart.0': { $exists: true },
      role: 'user',
    }).populate('cart.product').lean();

    let abandonedCount = 0;
    let abandonedValue = 0;
    for (const u of usersWithCarts) {
      // Consider abandoned if lastLogin > 24h ago or no lastLogin
      const isAbandoned = !u.lastLogin || new Date(u.lastLogin) < twentyFourHoursAgo;
      if (isAbandoned) {
        abandonedCount++;
        for (const item of u.cart) {
          if (item.product) {
            abandonedValue += (item.product.price || 0) * (item.quantity || 1);
          }
        }
      }
    }

    // --- Recent Orders & Customers ---
    const recentOrders = allOrders.slice(0, 10);
    const recentCustomers = await User.find({ role: 'user' })
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // --- Unread Notifications ---
    const unreadNotifications = await Notification.countDocuments({ read: false });

    res.json({
      revenue: {
        today: revenueToday,
        month: revenueMonth,
        total: revenueTotal,
      },
      orders: {
        today: ordersToday.length,
        pending: ordersPending.length,
        shipped: ordersShipped.length,
        canceled: ordersCanceled.length,
        total: allOrders.length,
      },
      customers: {
        total: totalCustomers,
        new: newCustomers,
      },
      products: {
        total: totalProducts,
        outOfStock,
        lowStock,
      },
      avgTicket,
      topProducts,
      topCategories,
      recentOrders,
      recentCustomers,
      abandonedCarts: {
        count: abandonedCount,
        totalValue: abandonedValue,
      },
      unreadNotifications,
    });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao calcular estatísticas', error: err.message });
  }
};

// GET /api/admin/carts
exports.getCarts = async (req, res) => {
  try {
    const usersWithCarts = await User.find({
      'cart.0': { $exists: true },
      role: 'user',
    })
      .select('-password')
      .populate('cart.product')
      .lean();

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const carts = usersWithCarts.map(u => {
      const totalValue = u.cart.reduce((sum, item) => {
        return sum + ((item.product?.price || 0) * (item.quantity || 1));
      }, 0);

      const isAbandoned = !u.lastLogin || new Date(u.lastLogin) < twentyFourHoursAgo;

      return {
        userId: u._id,
        username: u.username,
        email: u.email,
        avatar: u.avatar,
        items: u.cart.map(item => ({
          productName: item.product?.name || 'Produto removido',
          productImage: item.product?.images?.[0] || '',
          price: item.product?.price || 0,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
        })),
        itemCount: u.cart.length,
        totalValue,
        lastActivity: u.lastLogin || u.createdAt,
        status: isAbandoned ? 'abandoned' : 'active',
      };
    });

    // Sort: abandoned first, then by value desc
    carts.sort((a, b) => {
      if (a.status === 'abandoned' && b.status !== 'abandoned') return -1;
      if (a.status !== 'abandoned' && b.status === 'abandoned') return 1;
      return b.totalValue - a.totalValue;
    });

    res.json(carts);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar carrinhos', error: err.message });
  }
};

// GET /api/admin/notifications
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar notificações', error: err.message });
  }
};

// PUT /api/admin/notifications/:id/read
exports.markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notificação não encontrada' });
    }
    notification.read = true;
    await notification.save();
    res.json({ message: 'Notificação marcada como lida' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar notificação', error: err.message });
  }
};

// PUT /api/admin/notifications/read-all
exports.markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany({ read: false }, { read: true });
    res.json({ message: 'Todas as notificações marcadas como lidas' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar notificações', error: err.message });
  }
};

// GET /api/admin/reports
exports.getReports = async (req, res) => {
  try {
    const allOrders = await Order.find({ status: { $ne: 'canceled' } }).lean();

    // --- Sales by day (last 30 days) ---
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dailySales = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      dailySales[key] = { date: key, orders: 0, revenue: 0 };
    }
    for (const order of allOrders) {
      const key = new Date(order.createdAt).toISOString().slice(0, 10);
      if (dailySales[key]) {
        dailySales[key].orders++;
        dailySales[key].revenue += order.totalPrice;
      }
    }
    const salesByDay = Object.values(dailySales).sort((a, b) => a.date.localeCompare(b.date));

    // --- Sales by month (last 12 months) ---
    const monthlySales = {};
    for (let i = 0; i < 12; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toISOString().slice(0, 7); // YYYY-MM
      monthlySales[key] = { month: key, orders: 0, revenue: 0 };
    }
    for (const order of allOrders) {
      const key = new Date(order.createdAt).toISOString().slice(0, 7);
      if (monthlySales[key]) {
        monthlySales[key].orders++;
        monthlySales[key].revenue += order.totalPrice;
      }
    }
    const salesByMonth = Object.values(monthlySales).sort((a, b) => a.month.localeCompare(b.month));

    // --- Top categories for chart ---
    const allProducts = await Product.find({}).lean();
    const categorySales = {};
    for (const order of allOrders) {
      for (const item of order.items) {
        const prod = allProducts.find(p => p._id.toString() === (item.productId?.toString() || ''));
        const cat = prod?.category || 'Outros';
        categorySales[cat] = (categorySales[cat] || 0) + (item.quantity * item.price);
      }
    }
    const categoryData = Object.entries(categorySales)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue);

    res.json({
      salesByDay,
      salesByMonth,
      categoryData,
    });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao gerar relatórios', error: err.message });
  }
};
