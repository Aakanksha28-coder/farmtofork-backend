const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, default: 'kg' },
    offer: { type: String },
    imageUrl: { type: String },
    isUpcoming: { type: Boolean, default: false },
    availableDate: { type: Date },
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Pooja Paath fields
    category: { type: String, enum: ['general', 'vegetable', 'fruits', 'flowers', 'pooja'], default: 'general' },
    isOrganic: { type: Boolean, default: false },
    suitableFor: { type: String },   // e.g. "Ganesh Puja, Diwali"
    specialNotes: { type: String },
    tags: [{ type: String }]         // e.g. ["organic","festival-special","temple-grade"]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', ProductSchema);