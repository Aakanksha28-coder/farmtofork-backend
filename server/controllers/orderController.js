const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const generateInvoice = require('../utils/generateInvoice');

// Build a WhatsApp wa.me URL with order summary text
const buildWhatsAppUrl = (phone, text) => {
  if (!phone) return null;
  // Strip non-digits, ensure country code (default +91 India)
  const digits = phone.replace(/\D/g, '');
  const number = digits.startsWith('91') ? digits : `91${digits}`;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
};

const buildOrderMessage = (order, customerName, farmerName) => {
  const lines = [
    `*FarmToFork Order Confirmation*`,
    ``,
    `Order ID: ${order._id}`,
    `Customer: ${customerName}`,
    `Farmer: ${farmerName || 'N/A'}`,
    ``,
    `*Items:*`,
    ...(order.items || []).map(i => `  - ${i.name} x${i.quantity} @ Rs.${i.price} = Rs.${(i.price * i.quantity).toFixed(2)}`),
    ``,
    `Subtotal: Rs.${order.total}`,
    order.shippingPrice > 0 ? `Shipping: Rs.${order.shippingPrice}` : null,
    `*Total: Rs.${order.totalPrice}*`,
    `Payment: ${(order.paymentMethod || 'cod').toUpperCase()}`,
    ``,
    `Thank you for shopping with FarmToFork!`
  ].filter(l => l !== null).join('\n');
  return lines;
};

const buildStatusMessage = (order, status, note) => [
  `*FarmToFork Order Update*`,
  ``,
  `Order ID: ${order._id}`,
  `Status: *${status.toUpperCase()}*`,
  note ? `Note: ${note}` : null,
  ``,
  STATUS_TEXT[status] || `Your order status has been updated.`
].filter(Boolean).join('\n');

const STATUS_TEXT = {
  confirmed:  'Your order has been accepted by the farmer.',
  on_route:   'Your order is on the way!',
  shipped:    'Your order has been shipped and is on the way.',
  delivered:  'Your order has been delivered successfully.',
  received:   'Order marked as received. Enjoy your fresh produce!',
  cancelled:  'Your order has been cancelled.',
  pending:    'Your order is pending confirmation.'
};

// Create a new order
exports.createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod = 'cod', shippingPrice = 0 } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'No items in order' });
    }

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
      isPaid: false,
      shippingAddress,
      status: 'pending',
      tracking: [{ status: 'pending', note: 'Order created' }]
    });

    // ── Build WhatsApp notification URLs ─────────────────────
    let whatsappCustomer = null;
    let whatsappFarmer   = null;
    try {
      const customer = await User.findById(req.user._id).select('name whatsapp');
      const farmer   = farmerId ? await User.findById(farmerId).select('name whatsapp') : null;

      const msg = buildOrderMessage(order, customer?.name, farmer?.name);

      if (customer?.whatsapp) {
        whatsappCustomer = buildWhatsAppUrl(customer.whatsapp, msg);
      }
      if (farmer?.whatsapp) {
        // Farmer gets a notification too
        const farmerMsg = [
          `*FarmToFork New Order*`,
          ``,
          `Order ID: ${order._id}`,
          `Customer: ${customer?.name || 'Customer'}`,
          ``,
          ...(order.items || []).map(i => `  - ${i.name} x${i.quantity}`),
          ``,
          `*Total: Rs.${order.totalPrice}*`
        ].join('\n');
        whatsappFarmer = buildWhatsAppUrl(farmer.whatsapp, farmerMsg);
      }
    } catch (err) {
      console.error('WhatsApp URL build error:', err.message);
    }

    res.status(201).json({ ...order.toObject(), whatsappCustomer, whatsappFarmer });
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

    const isAdmin = req.user?.role === 'admin';
    const isFarmerOwner = order.farmer && order.farmer.toString() === req.user._id.toString();
    if (!isAdmin && !isFarmerOwner) {
      return res.status(403).json({ message: 'Forbidden: not allowed to update this order' });
    }

    order.status = status || order.status;
    order.tracking.push({ status: order.status, note: note || 'Status updated' });
    await order.save();

    // ── Build WhatsApp status update URL ─────────────────────
    let whatsappCustomer = null;
    try {
      const customer = await User.findById(order.customer).select('name whatsapp');
      if (customer?.whatsapp) {
        const msg = buildStatusMessage(order, status, note);
        whatsappCustomer = buildWhatsAppUrl(customer.whatsapp, msg);
      }
    } catch (err) {
      console.error('WhatsApp status URL error:', err.message);
    }

    res.json({ ...order.toObject(), whatsappCustomer });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Courier or system updates current GPS coordinates
exports.updateOrderLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ message: 'lat and lng must be numbers' });
    }
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    const isAdmin = req.user?.role === 'admin';
    const isFarmerOwner = order.farmer && order.farmer.toString() === req.user._id.toString();
    if (!isAdmin && !isFarmerOwner) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    order.currentLocation = { lat, lng, updatedAt: new Date() };
    await order.save();
    res.json({ lat: order.currentLocation.lat, lng: order.currentLocation.lng, updatedAt: order.currentLocation.updatedAt });
  } catch (error) {
    console.error('Update order location error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Customer polls current location
exports.getOrderLocation = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    const isCustomer = order.customer.toString() === req.user._id.toString();
    const isAdmin = req.user?.role === 'admin';
    const isFarmerOwner = order.farmer && order.farmer.toString() === req.user._id.toString();
    if (!isCustomer && !isAdmin && !isFarmerOwner) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (!order.currentLocation) return res.status(404).json({ message: 'No location available' });
    res.json({ lat: order.currentLocation.lat, lng: order.currentLocation.lng, updatedAt: order.currentLocation.updatedAt });
  } catch (error) {
    console.error('Get order location error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};