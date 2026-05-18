const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  role:     { type: String, enum: ['customer', 'farmer', 'admin'], default: 'customer' },
  roleSpecificData: { type: Object, default: {} },

  // Email verification
  isEmailVerified:    { type: Boolean, default: false },
  emailOtp:           { type: String },
  emailOtpExpires:    { type: Date },

  // Geospatial coordinates stored as plain object { type, coordinates }
  // Index is created manually as sparse to avoid startup crash on Mixed fields
  location: { type: mongoose.Schema.Types.Mixed },

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

// NOTE: 2dsphere index is created directly in MongoDB/Atlas, not via Mongoose
// to avoid startup crash with Mixed type fields.
// Run this once in MongoDB shell if needed:
// db.users.createIndex({ location: "2dsphere" }, { sparse: true })

module.exports = mongoose.model('User', UserSchema);
