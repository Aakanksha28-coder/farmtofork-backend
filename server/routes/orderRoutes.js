const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/authorizeRoles');
const { createOrder, getMyOrders, getOrderById, updateOrderStatus, getOrdersForFarmer, updateOrderLocation, getOrderLocation } = require('../controllers/orderController');

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

// Update current GPS location (courier/farmer/admin)
router.put('/:id/location', protect, authorizeRoles('farmer', 'admin'), updateOrderLocation);

// Get current GPS location (customer/farmer/admin)
router.get('/:id/location', protect, getOrderLocation);

module.exports = router;