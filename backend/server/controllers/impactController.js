const asyncHandler = require('express-async-handler');
const ImpactStory = require('../models/ImpactStory');

// @desc    Get all impact stories
// @route   GET /api/impact
// @access  Public
const getStories = asyncHandler(async (req, res) => {
  // Ensure database connection
  const connectDB = require('../config/db');
  const conn = await connectDB();
  if (!conn) {
    console.error('Database connection failed');
    return res.status(500).json({ message: 'Database connection unavailable' });
  }

  const stories = await ImpactStory.find({}).populate('author', 'name role');
  res.json(stories || []);
});

// @desc    Create an impact story
// @route   POST /api/impact
// @access  Private
const createStory = asyncHandler(async (req, res) => {
  // Ensure database connection
  const connectDB = require('../config/db');
  const conn = await connectDB();
  if (!conn) {
    console.error('Database connection failed');
    return res.status(500).json({ message: 'Database connection unavailable' });
  }

  const { title, role, name, location, quote, stats } = req.body;

  const story = new ImpactStory({
    title,
    role,
    name,
    location,
    quote,
    stats: JSON.parse(stats),
    author: req.user._id,
    imageUrl: req.file ? `/uploads/${req.file.filename}` : '',
  });

  const createdStory = await story.save();
  res.status(201).json(createdStory);
});

module.exports = { getStories, createStory };