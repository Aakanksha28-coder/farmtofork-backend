const express = require('express');
const router  = express.Router();
const {
  registerUser,
  loginUser,
  getCurrentUser,
  verifyOtp,
  resendOtp
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { registerRateLimit, resendOtpRateLimit } = require('../middleware/otpRateLimit');
const {
  registerValidator,
  loginValidator,
  otpEmailValidator,
  otpVerificationValidator
} = require('../middleware/validateAuthInput');

router.post('/register', registerValidator, registerRateLimit, registerUser);
router.post('/verify-otp', otpVerificationValidator, verifyOtp);
router.post('/resend-otp', otpEmailValidator, resendOtpRateLimit, resendOtp);
router.post('/login', loginValidator, loginUser);
router.get('/me', protect, getCurrentUser);
router.get('/profile', protect, getCurrentUser);

module.exports = router;
