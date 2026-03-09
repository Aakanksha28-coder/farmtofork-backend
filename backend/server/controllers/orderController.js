const Order = require('../models/Order');
const Product = require('../models/Product');

// Create a new order
exports.createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod = 'cod', shippingPrice = 0 } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'No items in order' });
    }

    // Compute total from product prices to prevent tampering
    let itemsTotal = 0;
    const orderItems = [];
    let farmerId;
    for (const it of items) {
      const prod = await Product.findById(it.product);
      if (!prod) return res.status(404).json({ message: 'Product not found' });
      const qty = it.quantity || 1;
      orderItems.push({ product: prod._id, name: prod.name, price: prod.price, quantity: qty });
      itemsTotal += prod.price * qty;
      if (!farmerId && prod.farmer) farmerId = prod.farmer;
    }

    const shipping = Number(shippingPrice) || 0;
    const totalPrice = itemsTotal + shipping;

    const order = await Order.create({
      customer: req.user._id,
      farmer: orderItems.length === 1 ? farmerId : undefined,
      items: orderItems,
      total: itemsTotal,
      shippingPrice: shipping,
      totalPrice,
      paymentMethod,
      isPaid: paymentMethod === 'cod' ? false : false,
      shippingAddress,
      status: 'pending',
      tracking: [{ status: 'pending', note: 'Order created' }]
    });

    res.status(201).json(order);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get orders for current user
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get order by id (customer)
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const isCustomer = order.customer.toString() === req.user._id.toString();
    if (!isCustomer) return res.status(403).json({ message: 'Forbidden' });

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get orders for current farmer
exports.getOrdersForFarmer = async (req, res) => {
  try {
    const orders = await Order.find({ farmer: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Get farmer orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update order status and append tracking
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const allowed = ['pending', 'confirmed', 'on_route', 'shipped', 'delivered', 'received', 'cancelled'];
    if (status && !allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Only the farmer who owns the order or an admin can update status
    const isAdmin = req.user?.role === 'admin';
    const isFarmerOwner = order.farmer && order.farmer.toString() === req.user._id.toString();
    if (!isAdmin && !isFarmerOwner) {
      return res.status(403).json({ message: 'Forbidden: not allowed to update this order' });
    }

    order.status = status || order.status;
    order.tracking.push({ status: order.status, note: note || 'Status updated' });
    await order.save();
    res.json(order);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};