const Negotiation = require('../models/Negotiation');
const Product = require('../models/Product');

// Start negotiation (customer)
exports.startNegotiation = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    const farmerId = product.farmer;

    // Check if existing open negotiation
    let negotiation = await Negotiation.findOne({ product: productId, customer: req.user._id, status: 'open' });
    if (!negotiation) {
      negotiation = await Negotiation.create({
        product: productId,
        farmer: farmerId,
        customer: req.user._id,
        messages: []
      });
    }

    res.status(201).json(negotiation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Post message (customer or farmer)
exports.postMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, price } = req.body;

    const negotiation = await Negotiation.findById(id);
    if (!negotiation) return res.status(404).json({ message: 'Negotiation not found' });

    const isParticipant = [String(negotiation.customer), String(negotiation.farmer)].includes(String(req.user._id));
    if (!isParticipant) return res.status(403).json({ message: 'Not authorized to post in this negotiation' });

    negotiation.messages.push({ sender: req.user._id, text, price });
    await negotiation.save();

    res.json(negotiation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Accept negotiation (farmer)
exports.acceptNegotiation = async (req, res) => {
  try {
    const { id } = req.params;
    const { finalPrice } = req.body;

    const negotiation = await Negotiation.findById(id);
    if (!negotiation) return res.status(404).json({ message: 'Negotiation not found' });

    if (String(negotiation.farmer) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only farmer can accept negotiation' });
    }

    negotiation.status = 'accepted';
    negotiation.finalPrice = finalPrice ?? negotiation.messages.length ? negotiation.messages[negotiation.messages.length - 1].price : undefined;
    await negotiation.save();

    res.json(negotiation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get negotiations for a product (participants only)
exports.getNegotiationsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const negotiations = await Negotiation.find({ product: productId, status: 'open' }).populate('customer farmer', 'name email role');

    // Filter to only show negotiations where current user is participant
    const filtered = negotiations.filter(n => [String(n.customer._id), String(n.farmer._id)].includes(String(req.user._id)));
    res.json(filtered);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};