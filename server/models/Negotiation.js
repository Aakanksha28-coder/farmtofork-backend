const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String },
    price: { type: Number },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const NegotiationSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    messages: [MessageSchema],
    status: { type: String, enum: ['open', 'accepted', 'rejected'], default: 'open' },
    finalPrice: { type: Number }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Negotiation', NegotiationSchema);