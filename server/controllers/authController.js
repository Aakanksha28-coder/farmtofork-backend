const crypto = require('crypto');
const User      = require('../models/User');
const jwt       = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '30d' });

const FRONTEND = process.env.FRONTEND_URL || 'https://farmtofork-frontend.onrender.com';

// ── Register ──────────────────────────────────────────────────────────────────
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role, roleSpecificData, lat, lng } = req.body;

    if (role === 'admin')
      return res.status(403).json({ message: 'Admin registration is restricted' });

    if (await User.findOne({ email }))
      return res.status(400).json({ message: 'User already exists' });

    const location = (lat != null && lng != null)
      ? { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] }
      : undefined;

    const user = await User.create({
      name, email, password, role,
      roleSpecificData: roleSpecificData || {},
      ...(location ? { location } : {})
    });

    // Generate email verification token and send
    const rawToken = user.generateVerifyToken();
    await user.save({ validateBeforeSave: false });

    const verifyUrl = `${FRONTEND}/verify-email?token=${rawToken}`;
    await sendEmail(
      email,
      '✅ Verify your FarmToFork email',
      `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:24px;border-radius:10px;border:1px solid #e0e0e0">
        <h2 style="color:#2e7d32">Welcome to FarmToFork, ${name}! 🌾</h2>
        <p>Please verify your email address to activate your account.</p>
        <a href="${verifyUrl}"
           style="display:inline-block;background:#4CAF50;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:700;margin:16px 0">
          Verify Email
        </a>
        <p style="color:#888;font-size:12px">This link expires in 24 hours. If you didn't sign up, ignore this email.</p>
      </div>`
    );

    const token = generateToken(user._id);
    res.status(201).json({
      _id: user._id, name: user.name, email: user.email,
      role: user.role, roleSpecificData: user.roleSpecificData,
      isEmailVerified: false, token,
      message: 'Account created! Please check your email to verify your account.'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ── Verify Email ──────────────────────────────────────────────────────────────
exports.verifyEmail = async (req, res) => {
  try {
    const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      emailVerifyToken:   hashed,
      emailVerifyExpires: { $gt: Date.now() }
    });

    if (!user)
      return res.status(400).json({ message: 'Invalid or expired verification link' });

    user.isEmailVerified   = true;
    user.emailVerifyToken   = undefined;
    user.emailVerifyExpires = undefined;
    await user.save({ validateBeforeSave: false });

    res.json({ message: 'Email verified successfully! You can now log in.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Login ─────────────────────────────────────────────────────────────────────
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' });

    if (!user.isEmailVerified)
      return res.status(403).json({
        message: 'Please verify your email before logging in. Check your inbox.',
        needsVerification: true
      });

    res.json({
      _id: user._id, name: user.name, email: user.email,
      role: user.role, roleSpecificData: user.roleSpecificData,
      isEmailVerified: user.isEmailVerified,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ── Resend Verification Email ─────────────────────────────────────────────────
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No account with that email' });
    if (user.isEmailVerified) return res.json({ message: 'Email already verified' });

    const rawToken = user.generateVerifyToken();
    await user.save({ validateBeforeSave: false });

    const verifyUrl = `${FRONTEND}/verify-email?token=${rawToken}`;
    await sendEmail(
      email,
      '✅ Verify your FarmToFork email',
      `<p>Click <a href="${verifyUrl}">here</a> to verify your email. Link expires in 24 hours.</p>`
    );

    res.json({ message: 'Verification email resent. Check your inbox.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Get Profile ───────────────────────────────────────────────────────────────
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) res.json(user);
    else res.status(404).json({ message: 'User not found' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
