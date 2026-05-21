const mongoose = require('mongoose'); 
const bcrypt   = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, trim: true, lowercase: true },
  phone:    { type: String, trim: true, default: '' },
  password: { type: String, required: true },
  role:     { type: String, enum: ['customer', 'farmer', 'admin'], default: 'customer' },
  roleSpecificData: { type: Object, default: {} },
  isVerified: { type: Boolean, default: false },
  otp:        { type: String, default: null },
  otpExpiry:  { type: Date, default: null },
  otpRequestedAt: { type: Date, default: null },

  // Geospatial (Mixed avoids Mongoose schema conflict with 2dsphere)
  location: { type: mongoose.Schema.Types.Mixed },

  createdAt: { type: Date, default: Date.now }
});

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

UserSchema.methods.clearOtp = function () {
  this.otp = null;
  this.otpExpiry = null;
  return this;
};

module.exports = mongoose.model('User', UserSchema);
