const mongoose = require('mongoose');

const marketPriceSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  category: { type: String },
  unit: { type: String, default: 'kg' },
  price: { type: Number, required: true },
  source: { type: String, default: 'uploaded' },
  recordedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('MarketPrice', marketPriceSchema);