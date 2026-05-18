const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['customer', 'farmer', 'admin'], default: 'customer' },
  roleSpecificData: { type: Object, default: {} },
  // Email verification
  isEmailVerified: { type: Boolean, default: false },
  emailVerifyToken: { type: String },
  emailVerifyExpires: { type: Date },
  // GeoJSON location for geospatial queries (farmers) — only set when coordinates are provided
  location: {
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: [Number]  // [longitude, latitude] — sparse, only stored when provided
  },
  createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate email verification token
UserSchema.methods.generateVerifyToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerifyToken   = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerifyExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return token; // return raw token (sent in email)
};

// 2dsphere index for geospatial queries on farmer locations
UserSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('User', UserSchema);