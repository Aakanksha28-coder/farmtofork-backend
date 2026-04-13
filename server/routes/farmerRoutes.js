const express = require('express');
const router = express.Router();
const { getNearbyFarmers } = require('../controllers/farmerController');

// GET /api/farmers/nearby?lat=&lng=&radius=
router.get('/nearby', getNearbyFarmers);

module.exports = router;
