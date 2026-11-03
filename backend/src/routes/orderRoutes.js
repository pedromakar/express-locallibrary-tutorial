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

// RASTREAMENTO PÚBLICO EM TEMPO REAL
// GET /api/orders/track/:query
router.get('/orders/track/:query', orderController.trackOrder);

// CÁLCULO DE FRETE EM TEMPO REAL
// POST /api/shipping/calculate
router.post('/shipping/calculate', orderController.calculateShipping);

// WEBHOOK BOT DE WHATSAPP
// POST /api/webhooks/whatsapp
router.post('/webhooks/whatsapp', orderController.handleWhatsAppWebhook);

// ADMIN ROUTES
// GET /api/admin/orders
router.get('/admin/orders', auth, admin, orderController.getAllOrders);

// PUT /api/admin/orders/:id/status
router.put('/admin/orders/:id/status', auth, admin, orderController.updateOrderStatus);

module.exports = router;
