const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [orderItemSchema],
  total: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'on_route', 'shipped', 'delivered', 'received', 'cancelled'], default: 'pending' },
  // Payment fields for COD and online
  paymentMethod: { type: String, enum: ['cod', 'online'], default: 'cod' },
  isPaid: { type: Boolean, default: false },
  paidAt: { type: Date },
  // Pricing breakdown
  shippingPrice: { type: Number, default: 0 },
  totalPrice: { type: Number, default: 0 },
  // Shipping address supports both old and new field names
  shippingAddress: {
    name: String,
    phone: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
    // New simplified fields used by frontend
    address: String,
  },
  tracking: [{
    status: String,
    note: String,
    timestamp: { type: Date, default: Date.now }
  }],
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);