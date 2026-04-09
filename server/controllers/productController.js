const Product = require('../models/Product');

// Create a product (farmer only)
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, quantity, unit, offer, isUpcoming, availableDate,
            category, isOrganic, suitableFor, specialNotes, tags } = req.body;
    // Convert uploaded file to base64 data URL — stored directly in MongoDB, no filesystem needed
    let imageUrl = undefined;
    if (req.file) {
      imageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }
    const product = await Product.create({
      name, description,
      price: Number(price),
      quantity: Number(quantity),
      unit, offer, imageUrl,
      isUpcoming: !!isUpcoming,
      availableDate: availableDate ? new Date(availableDate) : undefined,
      farmer: req.user._id,
      category: category || 'general',
      isOrganic: !!isOrganic,
      suitableFor, specialNotes,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : []
    });
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get products (optionally upcoming, optionally mine)
exports.getProducts = async (req, res) => {
  try {
    const { upcoming, mine, category } = req.query;
    const query = {};
    if (upcoming === 'true') query.isUpcoming = true;
    if (upcoming === 'false') query.isUpcoming = false;
    if (mine === 'true' && req.user) query.farmer = req.user._id;
    if (category) query.category = category;

    const products = await Product.find(query)
      .populate('farmer', 'name roleSpecificData')
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMyProducts = async (req, res) => {
  try {
    // Query products directly by the authenticated farmer
    const products = await Product.find({ farmer: req.user._id }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single product
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
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

    const fields = ['name', 'description', 'price', 'quantity', 'unit', 'offer',
                    'isUpcoming', 'availableDate', 'category', 'isOrganic', 'suitableFor', 'specialNotes', 'tags'];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) product[f] = req.body[f];
    });

    if (req.file) {
      product.imageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
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

// GET /api/products/pooja — public, returns only pooja category products
exports.getPoojaProducts = async (req, res) => {
  try {
    const { organic, festival, minPrice, maxPrice } = req.query;
    const query = { category: 'pooja' };
    if (organic === 'true') query.isOrganic = true;
    if (festival) query.suitableFor = { $regex: festival, $options: 'i' };
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    const products = await Product.find(query)
      .populate('farmer', 'name')
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
