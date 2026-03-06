const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/authorizeRoles');
const { createMessage, listMessages, getMessageById, updateStatus } = require('../controllers/contactController');

// Public: submit a contact message (token optional)
router.post('/', createMessage);

// Admin: list and manage messages
router.get('/', protect, authorizeRoles('admin'), listMessages);
router.get('/:id', protect, authorizeRoles('admin'), getMessageById);
router.put('/:id/status', protect, authorizeRoles('admin'), updateStatus);

module.exports = router;