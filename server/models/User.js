const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');

const UserSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  role:     { type: String, enum: ['customer', 'farmer', 'admin'], default: 'customer' },
  roleSpecificData: { type: Object, default: {} },

  // Email verification
  isEmailVerified:    { type: Boolean, default: false },
  emailVerifyToken:   { type: String },
  emailVerifyExpires: { type: Date },

  // Geospatial — stored as a plain object, index applied below
  // Using Mixed type avoids Mongoose's nested-type validation conflict
  location: { type: mongoose.Schema.Types.Mixed, default: undefined },

  createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) { next(err); }
});

UserSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Generate email verification token (raw token sent in email, hashed stored in DB)
UserSchema.methods.generateVerifyToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerifyToken   = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerifyExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return token;
};

// 2dsphere index — MongoDB handles GeoJSON validation at the DB level
UserSchema.index({ location: '2dsphere' }, { sparse: true });

module.exports = mongoose.model('User', UserSchema);
