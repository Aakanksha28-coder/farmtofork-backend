const Product = require('../models/Product');

// Create a product (farmer only)
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, quantity, unit, offer, isUpcoming, availableDate } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
    const product = await Product.create({
      name,
      description,
      price: Number(price),
      quantity: Number(quantity),
      unit,
      offer,
      imageUrl,
      isUpcoming: !!isUpcoming,
      availableDate: availableDate ? new Date(availableDate) : undefined,
      farmer: req.user._id
    });
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get products (optionally upcoming, optionally mine)
exports.getProducts = async (req, res) => {
  try {
    const { upcoming, mine } = req.query;
    const query = {};
    if (upcoming === 'true') query.isUpcoming = true;
    if (upcoming === 'false') query.isUpcoming = false;
    if (mine === 'true' && req.user) query.farmer = req.user._id;

    // Check if database connection exists
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.error('Database not connected');
      return res.status(503).json({ message: 'Database connection not available' });
    }

    const products = await Product.find(query).populate('farmer', 'name email').sort({ createdAt: -1 });
    res.json(products || []);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch products' });
  }
};

exports.getMyProducts = async (req, res) => {
  try {
    // Check if database connection exists
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.error('Database not connected');
      return res.status(503).json({ message: 'Database connection not available' });
    }

    // Query products directly by the authenticated farmer
    const products = await Product.find({ farmer: req.user._id }).populate('farmer', 'name email').sort({ createdAt: -1 });
    res.json(products || []);
  } catch (error) {
    console.error('Get my products error:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch products' });
  }
};

// Get single product
exports.getProductById = async (req, res) => {
  try {
    // Check if database connection exists
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.error('Database not connected');
      return res.status(503).json({ message: 'Database connection not available' });
    }

    const product = await Product.findById(req.params.id).populate('farmer', 'name email');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch product' });
  }
};

// Update product (farmer only)
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (String(product.farmer) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    const fields = ['name', 'description', 'price', 'quantity', 'unit', 'offer', 'isUpcoming', 'availableDate'];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) product[f] = req.body[f];
    });

    if (req.file) {
      product.imageUrl = `/uploads/${req.file.filename}`;
    }

    await product.save();
    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete product (farmer only)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (String(product.farmer) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    await product.deleteOne();
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};