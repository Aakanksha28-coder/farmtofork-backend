const express = require('express');
const router = express.Router();
const { createStory, getStories } = require('../controllers/impactController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/').get(getStories).post(protect, upload.single('image'), createStory);

module.exports = router;