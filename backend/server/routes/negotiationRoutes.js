const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/authorizeRoles');
const {
  startNegotiation,
  postMessage,
  acceptNegotiation,
  getNegotiationsByProduct
} = require('../controllers/negotiationController');

// Start negotiation (customer)
router.post('/:productId/start', protect, authorizeRoles('customer'), startNegotiation);

// Post message (customer or farmer)
router.post('/:id/message', protect, postMessage);

// Accept negotiation (farmer)
router.post('/:id/accept', protect, authorizeRoles('farmer'), acceptNegotiation);

// Get negotiations for a product (participants only)
router.get('/product/:productId', protect, getNegotiationsByProduct);

module.exports = router;