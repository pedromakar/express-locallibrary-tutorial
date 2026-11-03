const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');

// Public route to fetch store branding/design settings
router.get('/', settingsController.getSettings);

// Admin-only route to update store branding/design settings
router.put('/', auth, admin, settingsController.updateSettings);

module.exports = router;
