const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');

router.get('/', auth, admin, userController.getUsers);
router.put('/:id/role', auth, admin, userController.updateUserRole);
router.put('/:id', auth, admin, userController.updateUser);
router.delete('/:id', auth, admin, userController.deleteUser);

router.get('/cart', auth, userController.getCart);
router.post('/cart', auth, userController.updateCart);

router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, userController.updateProfile);

module.exports = router;
