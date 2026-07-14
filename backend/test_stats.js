const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Order = require('./src/models/order');
const User = require('./src/models/user');
const Product = require('./src/models/product');
const Notification = require('./src/models/notification');

dotenv.config();

// Force Google DNS
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

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

async function run() {
  console.log("Connecting to database...");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected! Running stats calculation...");

  const today = startOfToday();
  const monthStart = startOfMonth();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // --- Orders ---
  console.log("Fetching orders...");
  const allOrders = await Order.find({}).populate('user', 'username email').lean();
  console.log(`Found ${allOrders.length} orders.`);

  const ordersToday = allOrders.filter(o => new Date(o.createdAt) >= today);
  const ordersPending = allOrders.filter(o => o.status === 'pending');
  const ordersShipped = allOrders.filter(o => o.status === 'shipped');
  const ordersCanceled = allOrders.filter(o => o.status === 'canceled');
  const ordersPaid = allOrders.filter(o => o.status === 'paid' || o.status === 'shipped');

  console.log("Calculating revenues...");
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
  console.log("Counting customers...");
  const totalCustomers = await User.countDocuments({ role: 'user' });
  const newCustomers = await User.countDocuments({
    role: 'user',
    createdAt: { $gte: sevenDaysAgo },
  });

  // --- Products ---
  console.log("Fetching products...");
  const allProducts = await Product.find({}).lean();
  const totalProducts = allProducts.length;
  const outOfStock = allProducts.filter(p => p.countInStock === 0).length;
  const lowStock = allProducts.filter(p => p.countInStock > 0 && p.countInStock <= 5).length;

  // --- Top Products ---
  console.log("Calculating top products...");
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
  console.log("Calculating top categories...");
  const categorySales = {};
  for (const order of allOrders) {
    if (order.status === 'canceled') continue;
    for (const item of order.items) {
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
  console.log("Calculating abandoned carts...");
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const usersWithCarts = await User.find({
    'cart.0': { $exists: true },
    role: 'user',
  }).populate('cart.product').lean();

  let abandonedCount = 0;
  let abandonedValue = 0;
  for (const u of usersWithCarts) {
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

  console.log("Counting unread notifications...");
  const unreadNotifications = await Notification.countDocuments({ read: false });

  console.log("Stats calculated successfully!");
  console.log("Summary stats:", {
    revenueTotal,
    totalCustomers,
    totalProducts,
    abandonedCount,
    unreadNotifications
  });

  mongoose.disconnect();
}

run().catch(console.error);
