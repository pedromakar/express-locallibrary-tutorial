const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');

// All routes require auth + admin
router.use(auth, admin);

// Dashboard stats
router.get('/stats', adminController.getStats);

// Carts
router.get('/carts', adminController.getCarts);

// Notifications
router.get('/notifications', adminController.getNotifications);
router.put('/notifications/read-all', adminController.markAllNotificationsRead);
router.put('/notifications/:id/read', adminController.markNotificationRead);

// Reports
router.get('/reports', adminController.getReports);

module.exports = router;
