const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const { verificationOtpEmail } = require('../utils/emailTemplates');

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

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

const sendOtpForUser = async (user) => {
  const otp = generateOtp();
  user.otp = otp;
  user.otpExpiry = new Date(Date.now() + OTP_EXPIRY_MS);
  user.otpRequestedAt = new Date();
  await user.save({ validateBeforeSave: false });

  const template = verificationOtpEmail({
    name: user.name,
    otp,
    brandName: process.env.BRAND_NAME || 'FarmToFork',
    expiryMinutes: 5
  });

  await sendEmail(user.email, template.subject, template.html, template.text);
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
        // Resend OTP and redirect to verify
        try { await sendOtpForUser(existingUser); } catch (e) { console.error('OTP resend error:', e.message); }
        return res.status(200).json({
          message: 'Account exists but not verified. A new OTP has been sent.',
          email: existingUser.email,
          requiresVerification: true,
          resendAvailableIn: 0,
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

    const emailConfigured = !!(process.env.RESEND_API_KEY);
    let emailSent = false;

    if (emailConfigured) {
      try {
        await sendOtpForUser(user);
        emailSent = true;
      } catch (emailError) {
        console.error('OTP email send error:', emailError.message);
        // Always log OTP so it can be retrieved from Render logs during testing
        console.log(`\n🔐 ===== OTP FOR TESTING =====`);
        console.log(`📧 Email: ${user.email}`);
        console.log(`🔑 OTP:   ${user.otp}`);
        console.log(`⏰ Expires: ${user.otpExpiry}`);
        console.log(`==============================\n`);
      }
    } else {
      // No email configured — auto-verify so user isn't blocked
      console.log(`🔐 No email configured. OTP for ${user.email}: auto-verified`);
      user.isVerified = true;
      user.otp = null;
      user.otpExpiry = null;
      await user.save({ validateBeforeSave: false });
    }

    return res.status(201).json({
      message: emailSent
        ? 'Account created! Check your inbox for the 6-digit verification code.'
        : emailConfigured
          ? 'Account created. OTP email failed — use Resend OTP.'
          : 'Account created successfully!',
      email: user.email,
      requiresVerification: !user.isVerified,
      resendAvailableIn: 60,
      user: sanitizeUser(user)
    });
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

    const lastRequestedAt = user.otpRequestedAt ? user.otpRequestedAt.getTime() : 0;
    const remainingMs = RESEND_COOLDOWN_MS - (Date.now() - lastRequestedAt);

    if (remainingMs > 0) {
      return res.status(429).json({
        message: 'Please wait before requesting another OTP.',
        retryIn: Math.ceil(remainingMs / 1000)
      });
    }

    await sendOtpForUser(user);

    return res.json({
      message: 'A new OTP has been sent to your email address.',
      resendAvailableIn: 60
    });
  } catch (error) {
    console.error('Resend OTP error:', error.message);
    return res.status(500).json({ message: 'Server error while resending OTP' });
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
      return res.status(403).json({
        message: 'Please verify your email before logging in.',
        needsVerification: true,
        email: user.email
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

function existingAccountMessage(user) {
  if (user.isVerified) {
    return 'An account with this email already exists. Please sign in instead.';
  }

  return 'An account with this email already exists but is not verified yet. Please verify your email or resend the OTP.';
}
