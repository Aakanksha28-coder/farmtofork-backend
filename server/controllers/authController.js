const User      = require('../models/User');
const jwt       = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '30d' });

const FRONTEND = process.env.FRONTEND_URL || 'https://farmtofork-frontend.onrender.com';

// Generate a 6-digit OTP
const makeOTP = () => String(Math.floor(100000 + Math.random() * 900000));

// ── Welcome email ─────────────────────────────────────────────────────────────
const sendWelcomeEmail = async (email, name, role) => {
  const roleMsg = role === 'farmer'
    ? 'Start listing your fresh produce and connect with customers near you.'
    : 'Discover fresh produce directly from local farmers near you.';

  await sendEmail(email, '🌾 Welcome to FarmToFork!', `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1)">
      <div style="background:linear-gradient(135deg,#4CAF50,#2e7d32);padding:32px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:26px">🌾 FarmToFork</h1>
        <p style="color:#c8e6c9;margin:8px 0 0;font-size:14px">Fresh from farm to your table</p>
      </div>
      <div style="padding:32px;background:#fff">
        <h2 style="color:#2e7d32;margin-top:0">Welcome, ${name}! 🎉</h2>
        <p style="color:#555;line-height:1.7">Your account has been verified successfully. ${roleMsg}</p>
        <a href="${FRONTEND}" style="display:inline-block;background:#4CAF50;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;margin:16px 0">
          Go to FarmToFork →
        </a>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <p style="color:#888;font-size:12px">If you didn't create this account, please ignore this email.</p>
      </div>
    </div>`);
};

// ── Register ──────────────────────────────────────────────────────────────────
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role, roleSpecificData, lat, lng } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password are required' });

    if (role === 'admin')
      return res.status(403).json({ message: 'Admin registration is restricted' });

    if (await User.findOne({ email }))
      return res.status(400).json({ message: 'User already exists' });

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    const location  = (!isNaN(parsedLat) && !isNaN(parsedLng))
      ? { type: 'Point', coordinates: [parsedLng, parsedLat] }
      : undefined;

    const otp        = makeOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await User.create({
      name, email, password,
      role: role || 'customer',
      roleSpecificData: roleSpecificData || {},
      ...(location ? { location } : {}),
      emailOtp:        otp,
      emailOtpExpires: otpExpires,
      isEmailVerified: false
    });

    // Send OTP email
    const emailConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
    if (emailConfigured) {
      try {
        await sendEmail(email, '🔐 Your FarmToFork Verification Code', `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1)">
            <div style="background:linear-gradient(135deg,#4CAF50,#2e7d32);padding:28px;text-align:center">
              <h1 style="color:#fff;margin:0;font-size:22px">🌾 FarmToFork</h1>
            </div>
            <div style="padding:32px;background:#fff;text-align:center">
              <h2 style="color:#2e7d32;margin-top:0">Verify Your Email</h2>
              <p style="color:#555">Hi <strong>${name}</strong>, use this OTP to verify your account:</p>
              <div style="background:#f1f8e9;border:2px dashed #4CAF50;border-radius:12px;padding:20px;margin:20px 0;display:inline-block">
                <span style="font-size:40px;font-weight:900;letter-spacing:12px;color:#2e7d32">${otp}</span>
              </div>
              <p style="color:#888;font-size:13px">This OTP expires in <strong>10 minutes</strong>.</p>
              <p style="color:#aaa;font-size:12px">If you didn't sign up for FarmToFork, ignore this email.</p>
            </div>
          </div>`);
        console.log(`✅ OTP email sent to ${email}`);
      } catch (emailErr) {
        console.error(`❌ OTP email FAILED for ${email}:`, emailErr.message);
        // Still return success — user can use resend
      }
    } else {
      console.log('📧 Email not configured — auto-verifying user');
      // No email configured — auto-verify
      user.isEmailVerified = true;
      user.emailOtp        = undefined;
      user.emailOtpExpires = undefined;
      await user.save({ validateBeforeSave: false });
    }

    const token = generateToken(user._id);
    res.status(201).json({
      _id: user._id, name: user.name, email: user.email,
      role: user.role, roleSpecificData: user.roleSpecificData,
      isEmailVerified: user.isEmailVerified, token,
      requiresOtp: emailConfigured,
      message: emailConfigured
        ? 'OTP sent to your email. Please verify to continue.'
        : 'Account created successfully!'
    });
  } catch (error) {
    console.error('Register error:', error.message);
    if (error.name === 'ValidationError') {
      const msg = Object.values(error.errors).map(e => e.message).join(', ');
      return res.status(400).json({ message: msg });
    }
    if (error.code === 11000)
      return res.status(400).json({ message: 'User already exists' });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ── Verify OTP ────────────────────────────────────────────────────────────────
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ message: 'Email and OTP are required' });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: 'No account found with this email' });

    if (user.isEmailVerified)
      return res.json({ message: 'Email already verified', alreadyVerified: true });

    if (!user.emailOtp || user.emailOtp !== String(otp))
      return res.status(400).json({ message: 'Invalid OTP. Please check and try again.' });

    if (user.emailOtpExpires < Date.now())
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });

    user.isEmailVerified = true;
    user.emailOtp        = undefined;
    user.emailOtpExpires = undefined;
    await user.save({ validateBeforeSave: false });

    // Send welcome email
    await sendWelcomeEmail(user.email, user.name, user.role);

    res.json({
      message: 'Email verified successfully! Welcome to FarmToFork 🌾',
      token: generateToken(user._id),
      _id: user._id, name: user.name, email: user.email,
      role: user.role, roleSpecificData: user.roleSpecificData,
      isEmailVerified: true
    });
  } catch (error) {
    console.error('Verify OTP error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Resend OTP ────────────────────────────────────────────────────────────────
exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user)      return res.status(404).json({ message: 'No account with that email' });
    if (user.isEmailVerified) return res.json({ message: 'Email already verified' });

    const otp        = makeOTP();
    user.emailOtp        = otp;
    user.emailOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    await sendEmail(email, '🔐 Your new FarmToFork OTP', `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;text-align:center;border-radius:12px;border:1px solid #e0e0e0">
        <h2 style="color:#2e7d32">New Verification Code</h2>
        <div style="background:#f1f8e9;border:2px dashed #4CAF50;border-radius:12px;padding:20px;margin:20px 0;display:inline-block">
          <span style="font-size:40px;font-weight:900;letter-spacing:12px;color:#2e7d32">${otp}</span>
        </div>
        <p style="color:#888;font-size:13px">Expires in 10 minutes.</p>
      </div>`);

    res.json({ message: 'New OTP sent to your email.' });
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

    const emailConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
    if (emailConfigured && !user.isEmailVerified)
      return res.status(403).json({
        message: 'Please verify your email before logging in.',
        needsVerification: true,
        email: user.email
      });

    res.json({
      _id: user._id, name: user.name, email: user.email,
      role: user.role, roleSpecificData: user.roleSpecificData,
      isEmailVerified: user.isEmailVerified,
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
