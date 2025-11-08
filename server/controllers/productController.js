const Product = require('../models/Product');

// Create a product (farmer only)
exports.createProduct = async (req, res, next) => {
  try {
    // Ensure database connection
    const connectDB = require('../config/db');
    const conn = await connectDB();
    if (!conn) {
      console.error('Database connection failed');
      return res.status(500).json({ message: 'Database connection unavailable' });
    }

    // Validate required fields
    const { name, description, price, quantity, unit, offer, isUpcoming, availableDate } = req.body;
    
    if (!name || !price || !quantity) {
      return res.status(400).json({ message: 'Name, price, and quantity are required' });
    }

    // Handle image URL
    let imageUrl = undefined;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }
    
    const product = await Product.create({
      name: String(name).trim(),
      description: description ? String(description).trim() : undefined,
      price: Number(price),
      quantity: Number(quantity),
      unit: unit || 'kg',
      offer: offer ? String(offer).trim() : undefined,
      imageUrl,
      isUpcoming: isUpcoming === 'true' || isUpcoming === true,
      availableDate: availableDate ? new Date(availableDate) : undefined,
      farmer: req.user._id
    });
    
    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    // Pass error to global error handler
    next(error);
  }
};

// Get products (optionally upcoming, optionally mine)
exports.getProducts = async (req, res) => {
  try {
    // Ensure database connection
    const connectDB = require('../config/db');
    const conn = await connectDB();
    if (!conn) {
      console.error('Database connection failed');
      return res.status(500).json({ message: 'Database connection unavailable' });
    }

    const { upcoming, mine } = req.query;
    const query = {};
    if (upcoming === 'true') query.isUpcoming = true;
    if (upcoming === 'false') query.isUpcoming = false;
    if (mine === 'true' && req.user) query.farmer = req.user._id;

    const products = await Product.find(query).populate('farmer', 'name email').sort({ createdAt: -1 });
    res.json(products || []);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch products' });
  }
};

exports.getMyProducts = async (req, res) => {
  try {
    // Ensure database connection
    const connectDB = require('../config/db');
    const conn = await connectDB();
    if (!conn) {
      console.error('Database connection failed');
      return res.status(500).json({ message: 'Database connection unavailable' });
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
    // Ensure database connection
    const connectDB = require('../config/db');
    const conn = await connectDB();
    if (!conn) {
      console.error('Database connection failed');
      return res.status(500).json({ message: 'Database connection unavailable' });
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
    // Ensure database connection
    const connectDB = require('../config/db');
    const conn = await connectDB();
    if (!conn) {
      console.error('Database connection failed');
      return res.status(500).json({ message: 'Database connection unavailable' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (String(product.farmer) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    const fields = ['name', 'description', 'price', 'quantity', 'unit', 'offer', 'isUpcoming', 'availableDate'];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) product[f] = req.body[f];
    });

    // Handle image update
    if (req.file) {
      product.imageUrl = `/uploads/${req.file.filename}`;
    }

    await product.save();
    res.json(product);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(400).json({ message: error.message || 'Failed to update product' });
  }
};

// Delete product (farmer only)
exports.deleteProduct = async (req, res) => {
  try {
    // Ensure database connection
    const connectDB = require('../config/db');
    const conn = await connectDB();
    if (!conn) {
      console.error('Database connection failed');
      return res.status(500).json({ message: 'Database connection unavailable' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (String(product.farmer) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    await product.deleteOne();
    res.json({ message: 'Product deleted' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: error.message || 'Failed to delete product' });
  }
};