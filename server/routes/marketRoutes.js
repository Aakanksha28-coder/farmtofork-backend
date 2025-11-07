const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { uploadPrice, getLatestPrice, listPrices, getIndianPrices } = require('../controllers/marketController');

// Public: list and latest price
router.get('/prices', listPrices);
router.get('/latest', getLatestPrice);
// Indian live prices
router.get('/india/prices', getIndianPrices);

// Authenticated upload (farmers/admin)
router.post('/prices', protect, uploadPrice);

module.exports = router;