const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/authorizeRoles');
const { createOrder, getMyOrders, getOrderById, updateOrderStatus, getOrdersForFarmer } = require('../controllers/orderController');

// Create order
router.post('/', protect, createOrder);

// Get current user's orders
router.get('/mine', protect, getMyOrders);

// Get orders for current farmer
router.get('/farmer', protect, authorizeRoles('farmer', 'admin'), getOrdersForFarmer);

// Get single order
router.get('/:id', protect, getOrderById);

// Update status
router.put('/:id/status', protect, updateOrderStatus);

module.exports = router;