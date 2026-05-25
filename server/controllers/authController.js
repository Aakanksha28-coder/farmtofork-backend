const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const { isEmailConfigured } = require('../utils/emailConfig');
const { verificationOtpEmail } = require('../utils/emailTemplates');

const OTP_EXPIRY_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 30 * 1000;

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'your_jwt_secret', {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  roleSpecificData: user.roleSpecificData || {},
  isVerified: user.isVerified,
  createdAt: user.createdAt
});

const createLocationPayload = ({ lat, lng }) => {
  const parsedLat = Number.parseFloat(lat);
  const parsedLng = Number.parseFloat(lng);

  if (Number.isNaN(parsedLat) || Number.isNaN(parsedLng)) {
    return undefined;
  }

  return { type: 'Point', coordinates: [parsedLng, parsedLat] };
};

const logOtpForOps = (user) => {
  console.log('\n🔐 ===== OTP FOR TESTING =====');
  console.log(`📧 Email: ${user.email}`);
  console.log(`🔑 OTP:   ${user.otp}`);
  console.log(`⏰ Expires: ${user.otpExpiry}`);
  console.log('==============================\n');
};

const canResendOtp = (user) => {
  const last = user.otpRequestedAt ? user.otpRequestedAt.getTime() : 0;
  if (!last) return true;
  return Date.now() - last >= RESEND_COOLDOWN_MS;
};

const sendOtpForUser = async (user) => {
  if (!isEmailConfigured()) {
    throw new Error('Email service is not configured (set BREVO_API_KEY on the server)');
  }

  const otp = generateOtp();
  user.otp = otp;
  user.otpExpiry = new Date(Date.now() + OTP_EXPIRY_MS);
  user.otpRequestedAt = new Date();

  const template = verificationOtpEmail({
    name: user.name,
    otp,
    brandName: process.env.BRAND_NAME || 'FarmToFork',
    expiryMinutes: 10
  });

  // Send first — only persist OTP if Brevo accepts the message
  await sendEmail(user.email, template.subject, template.html, template.text, { required: true });
  await user.save({ validateBeforeSave: false });
};

const trySendOtp = async (user) => {
  if (!canResendOtp(user)) {
    return { sent: false, retryIn: Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - user.otpRequestedAt.getTime())) / 1000) };
  }
  await sendOtpForUser(user);
  return { sent: true, retryIn: 30 };
};

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role, roleSpecificData, phone, lat, lng } = req.body;

    if (role === 'admin') {
      return res.status(403).json({ message: 'Admin registration is restricted' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (!existingUser.isVerified) {
        if (!isEmailConfigured()) {
          return res.status(503).json({
            message: 'Email verification is not configured on the server.',
            email: existingUser.email,
            requiresVerification: true
          });
        }

        let otpResult = { sent: false, retryIn: 0 };
        try {
          otpResult = await trySendOtp(existingUser);
        } catch (e) {
          console.error('OTP resend error:', e.message);
          logOtpForOps(existingUser);
        }

        return res.status(200).json({
          message: otpResult.sent
            ? 'Account exists but not verified. A new OTP has been sent to your email.'
            : 'Account exists but not verified. Use Resend OTP on the verification page.',
          email: existingUser.email,
          requiresVerification: true,
          resendAvailableIn: otpResult.sent ? otpResult.retryIn : otpResult.retryIn || 30,
          user: sanitizeUser(existingUser)
        });
      }
      return res.status(409).json({
        message: 'An account with this email already exists. Please sign in.',
        requiresVerification: false,
        email: existingUser.email
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone: String(phone || '').trim(),
      role: role || 'customer',
      roleSpecificData: roleSpecificData || {},
      location: createLocationPayload({ lat, lng }),
      isVerified: false
    });

    if (!isEmailConfigured()) {
      await User.findByIdAndDelete(user._id);
      return res.status(503).json({
        message: 'Email verification is not available. Please try again later.'
      });
    }

    try {
      await sendOtpForUser(user);
      return res.status(201).json({
        message: 'Account created! Check your inbox (and spam) for the 6-digit verification code.',
        email: user.email,
        requiresVerification: true,
        resendAvailableIn: 30,
        user: sanitizeUser(user)
      });
    } catch (emailError) {
      console.error('OTP email send error:', emailError.message);
      logOtpForOps(user);
      return res.status(502).json({
        message:
          'Account created but the verification email could not be sent. Check Brevo sender settings or use Resend OTP.',
        email: user.email,
        requiresVerification: true,
        resendAvailableIn: 0,
        user: sanitizeUser(user)
      });
    }
  } catch (error) {
    console.error('Register error:', error.message);
    if (error.code === 11000) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }
    return res.status(500).json({ message: 'Server error while creating the account' });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'No account found for this email address' });
    }

    if (user.isVerified) {
      return res.json({
        message: 'Email already verified',
        token: generateToken(user._id),
        user: sanitizeUser(user)
      });
    }

    if (!user.otp || !user.otpExpiry) {
      return res.status(400).json({ message: 'No active OTP found. Please request a new code.' });
    }

    if (user.otpExpiry.getTime() < Date.now()) {
      user.clearOtp();
      await user.save({ validateBeforeSave: false });
      return res.status(400).json({ message: 'OTP expired. Please request a new code.' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }

    user.isVerified = true;
    user.clearOtp();
    await user.save({ validateBeforeSave: false });

    return res.json({
      message: 'Email verified successfully. Welcome aboard.',
      token: generateToken(user._id),
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error('Verify OTP error:', error.message);
    return res.status(500).json({ message: 'Server error while verifying OTP' });
  }
};

exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'No account found for this email address' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'This email is already verified' });
    }

    if (!isEmailConfigured()) {
      return res.status(503).json({
        message: 'Email delivery is not configured. Please contact support.'
      });
    }

    const lastRequestedAt = user.otpRequestedAt ? user.otpRequestedAt.getTime() : 0;
    const remainingMs = RESEND_COOLDOWN_MS - (Date.now() - lastRequestedAt);

    if (remainingMs > 0) {
      const retryIn = Math.ceil(remainingMs / 1000);
      return res.status(429).json({
        message: `Please wait ${retryIn} seconds before requesting another OTP.`,
        retryIn
      });
    }

    await sendOtpForUser(user);

    return res.json({
      message: 'A new OTP has been sent to your email. Check your spam folder if you do not see it.',
      resendAvailableIn: 30
    });
  } catch (error) {
    console.error('Resend OTP error:', error.message);

    const isEmailFailure = /brevo|email|sender|api|key|configured|invalid|not activated/i.test(
      error.message || ''
    );
    return res.status(isEmailFailure ? 502 : 500).json({
      message: isEmailFailure
        ? `Could not send email: ${error.message}. Ensure BREVO_API_KEY and a verified EMAIL_FROM are set on Render.`
        : 'Server error while resending OTP'
    });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isVerified) {
      let otpResult = { sent: false, retryIn: 30 };
      if (isEmailConfigured()) {
        try {
          otpResult = await trySendOtp(user);
        } catch (e) {
          console.error('Login OTP send error:', e.message);
          logOtpForOps(user);
        }
      }

      return res.status(403).json({
        message: otpResult.sent
          ? 'Please verify your email. A new verification code was sent to your inbox.'
          : 'Please verify your email before logging in.',
        needsVerification: true,
        email: user.email,
        resendAvailableIn: otpResult.retryIn
      });
    }

    return res.json({
      message: 'Login successful',
      token: generateToken(user._id),
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({ message: 'Server error while logging in' });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ message: 'Server error while fetching user details' });
  }
};

exports.cleanupExpiredOtps = async () => {
  try {
    await User.updateMany(
      { otpExpiry: { $lt: new Date() } },
      { $set: { otp: null, otpExpiry: null } }
    );
  } catch (error) {
    console.error('Expired OTP cleanup error:', error.message);
  }
};

