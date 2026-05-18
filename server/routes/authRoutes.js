const express = require('express');
const router  = express.Router();
const {
  registerUser, loginUser, getUserProfile,
  verifyOtp, resendOtp
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register',   registerUser);
router.post('/login',      loginUser);
router.get('/profile',     protect, getUserProfile);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);

module.exports = router;
