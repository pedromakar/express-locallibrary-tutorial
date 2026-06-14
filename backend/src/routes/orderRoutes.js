const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');

// POST /api/orders
router.post('/orders', auth, orderController.createOrder);

// GET /api/orders/:userId
router.get('/orders/:userId', auth, orderController.getOrdersByUser);

// GET /api/order/:id
router.get('/order/:id', auth, orderController.getOrderById);

// ADMIN ROUTES
// GET /api/admin/orders
router.get('/admin/orders', auth, admin, orderController.getAllOrders);

// PUT /api/admin/orders/:id/status
router.put('/admin/orders/:id/status', auth, admin, orderController.updateOrderStatus);

module.exports = router;
