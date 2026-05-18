const User    = require('../models/User');
const jwt     = require('jsonwebtoken');
const sendSms = require('../utils/sendSms');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '30d' });

const makeOTP = () => String(Math.floor(100000 + Math.random() * 900000));

// ── Register ──────────────────────────────────────────────────────────────────
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role, roleSpecificData, phone, lat, lng } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password are required' });
    if (!phone)
      return res.status(400).json({ message: 'Mobile number is required for verification' });
    if (role === 'admin')
      return res.status(403).json({ message: 'Admin registration is restricted' });
    if (await User.findOne({ email }))
      return res.status(400).json({ message: 'User already exists with this email' });

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    const location  = (!isNaN(parsedLat) && !isNaN(parsedLng))
      ? { type: 'Point', coordinates: [parsedLng, parsedLat] }
      : undefined;

    const otp = makeOTP();

    const user = await User.create({
      name, email, password,
      phone: String(phone).replace(/\D/g, '').slice(-10),
      role: role || 'customer',
      roleSpecificData: roleSpecificData || {},
      ...(location ? { location } : {}),
      phoneOtp:        otp,
      phoneOtpExpires: new Date(Date.now() + 10 * 60 * 1000),
      isPhoneVerified: false
    });

    // Send OTP via SMS
    const smsSent = await sendSms(phone, `FarmToFork: Your OTP is ${otp}. Valid for 10 minutes. Do not share.`);

    if (!smsSent) {
      // SMS not configured — auto-verify so user isn't blocked
      console.log(`🔐 OTP for ${phone}: ${otp}`);
      user.isPhoneVerified = true;
      user.phoneOtp        = undefined;
      user.phoneOtpExpires = undefined;
      await user.save({ validateBeforeSave: false });
    }

    res.status(201).json({
      _id: user._id, name: user.name, email: user.email,
      phone: user.phone, role: user.role,
      roleSpecificData: user.roleSpecificData,
      isPhoneVerified: user.isPhoneVerified,
      token: generateToken(user._id),
      requiresOtp: !user.isPhoneVerified,
      message: smsSent
        ? `OTP sent to ${user.phone.slice(0,2)}XXXXXXXX${user.phone.slice(-2)}`
        : 'Account created successfully!'
    });
  } catch (error) {
    console.error('Register error:', error.message);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(error.errors).map(e => e.message).join(', ') });
    }
    if (error.code === 11000)
      return res.status(400).json({ message: 'User already exists' });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ── Verify OTP ────────────────────────────────────────────────────────────────
exports.verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp)
      return res.status(400).json({ message: 'Phone and OTP are required' });

    const digits = String(phone).replace(/\D/g, '').slice(-10);
    const user   = await User.findOne({ phone: digits });
    if (!user)
      return res.status(404).json({ message: 'No account found with this number' });

    if (user.isPhoneVerified)
      return res.json({ message: 'Phone already verified', alreadyVerified: true,
        token: generateToken(user._id), _id: user._id, name: user.name,
        email: user.email, phone: user.phone, role: user.role,
        roleSpecificData: user.roleSpecificData, isPhoneVerified: true });

    if (!user.phoneOtp || user.phoneOtp !== String(otp))
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });

    if (user.phoneOtpExpires < Date.now())
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });

    user.isPhoneVerified = true;
    user.phoneOtp        = undefined;
    user.phoneOtpExpires = undefined;
    await user.save({ validateBeforeSave: false });

    // Welcome SMS
    await sendSms(user.phone, `Welcome to FarmToFork, ${user.name}! Your account is verified. Start ${user.role === 'farmer' ? 'listing your produce' : 'shopping fresh produce'} now.`);

    res.json({
      message: `Welcome to FarmToFork, ${user.name}! 🌾`,
      token: generateToken(user._id),
      _id: user._id, name: user.name, email: user.email,
      phone: user.phone, role: user.role,
      roleSpecificData: user.roleSpecificData,
      isPhoneVerified: true
    });
  } catch (error) {
    console.error('Verify OTP error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Resend OTP ────────────────────────────────────────────────────────────────
exports.resendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    const digits = String(phone || '').replace(/\D/g, '').slice(-10);
    const user   = await User.findOne({ phone: digits });
    if (!user)    return res.status(404).json({ message: 'No account with that number' });
    if (user.isPhoneVerified) return res.json({ message: 'Phone already verified' });

    const otp = makeOTP();
    user.phoneOtp        = otp;
    user.phoneOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const sent = await sendSms(digits, `FarmToFork: Your new OTP is ${otp}. Valid for 10 minutes.`);
    if (!sent) console.log(`🔐 Resend OTP for ${digits}: ${otp}`);

    res.json({ message: 'New OTP sent to your mobile number.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Login ─────────────────────────────────────────────────────────────────────
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' });

    // Block login only if SMS is configured and phone not verified
    const smsConfigured = !!(process.env.FAST2SMS_API_KEY);
    if (smsConfigured && !user.isPhoneVerified)
      return res.status(403).json({
        message: 'Please verify your mobile number to continue.',
        needsVerification: true,
        phone: user.phone
      });

    res.json({
      _id: user._id, name: user.name, email: user.email,
      phone: user.phone, role: user.role,
      roleSpecificData: user.roleSpecificData,
      isPhoneVerified: user.isPhoneVerified,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ── Get Profile ───────────────────────────────────────────────────────────────
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
