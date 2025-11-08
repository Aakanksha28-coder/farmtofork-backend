const mongoose = require('mongoose');

const impactStorySchema = mongoose.Schema(
  {
    title: { type: String, required: true },
    role: { type: String, required: true, enum: ['Farmer', 'Customer'] },
    name: { type: String, required: true },
    location: { type: String, required: true },
    quote: { type: String, required: true },
    stats: [{ type: String }],
    imageUrl: { type: String },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },
  { timestamps: true }
);

const ImpactStory = mongoose.model('ImpactStory', impactStorySchema);

module.exports = ImpactStory;