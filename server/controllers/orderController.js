const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const sendWhatsApp = require('../utils/whatsapp');

// ── Message builders ──────────────────────────────────────────────────────────

const STATUS_TEXT = {
  confirmed: 'Your order has been accepted by the farmer. 🌾',
  on_route:  'Your order is on the way! 🚚',
  shipped:   'Your order has been shipped and is on the way. 📦',
  delivered: 'Your order has been delivered successfully. ✅',
  received:  'Order marked as received. Enjoy your fresh produce! 🥦',
  cancelled: 'Your order has been cancelled. ❌',
  pending:   'Your order is pending confirmation. ⏳'
};

const orderConfirmationMsg = (order, customerName, farmerName) =>
  [
    `*FarmToFork — Order Confirmed* 🛒`,
    ``,
    `Hi ${customerName},`,
    `Your order has been placed successfully!`,
    ``,
    `Order ID: ${order._id}`,
    `Farmer: ${farmerName || 'N/A'}`,
    ``,
    `*Items:*`,
    ...(order.items || []).map(
      i => `  • ${i.name} x${i.quantity} @ ₹${i.price} = ₹${(i.price * i.quantity).toFixed(2)}`
    ),
    ``,
    `Subtotal: ₹${order.total}`,
    order.shippingPrice > 0 ? `Shipping: ₹${order.shippingPrice}` : null,
    `*Total: ₹${order.totalPrice}*`,
    `Payment: ${(order.paymentMethod || 'cod').toUpperCase()}`,
    ``,
    `Thank you for shopping with FarmToFork! 🌿`
  ]
    .filter(l => l !== null)
    .join('\n');

const newOrderFarmerMsg = (order, customerName) =>
  [
    `*FarmToFork — New Order Received* 🔔`,
    ``,
    `Hi! You have a new order from ${customerName}.`,
    ``,
    `Order ID: ${order._id}`,
    ``,
    `*Items:*`,
    ...(order.items || []).map(i => `  • ${i.name} x${i.quantity}`),
    ``,
    `*Total: ₹${order.totalPrice}*`,
    ``,
    `Please log in to FarmToFork to confirm the order.`
  ].join('\n');

const statusUpdateMsg = (order, status, note, recipientName) =>
  [
    `*FarmToFork — Order Update* 📬`,
    ``,
    `Hi ${recipientName},`,
    ``,
    `Order ID: ${order._id}`,
    `Status: *${status.toUpperCase()}*`,
    note ? `Note: ${note}` : null,
    ``,
    STATUS_TEXT[status] || 'Your order status has been updated.'
  ]
    .filter(Boolean)
    .join('\n');

// ── Helper: fire-and-forget WhatsApp to multiple recipients ──────────────────
const notify = async (recipients) => {
  // recipients: [{ phone, message }]
  await Promise.allSettled(
    recipients
      .filter(r => r.phone)
      .map(r => sendWhatsApp(r.phone, r.message))
  );
};

// ── Controllers ───────────────────────────────────────────────────────────────

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

    // ── Send WhatsApp notifications automatically ─────────────
    try {
      const customer = await User.findById(req.user._id).select('name whatsapp');
      const farmer   = farmerId ? await User.findById(farmerId).select('name whatsapp') : null;

      await notify([
        {
          phone: customer?.whatsapp,
          message: orderConfirmationMsg(order, customer?.name, farmer?.name)
        },
        {
          phone: farmer?.whatsapp,
          message: newOrderFarmerMsg(order, customer?.name)
        }
      ]);
    } catch (err) {
      console.error('WhatsApp notification error:', err.message);
    }

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

    const isAdmin = req.user?.role === 'admin';
    const isFarmerOwner = order.farmer && order.farmer.toString() === req.user._id.toString();
    if (!isAdmin && !isFarmerOwner) {
      return res.status(403).json({ message: 'Forbidden: not allowed to update this order' });
    }

    order.status = status || order.status;
    order.tracking.push({ status: order.status, note: note || 'Status updated' });
    await order.save();

    // ── Send WhatsApp status update automatically ─────────────
    try {
      const customer = await User.findById(order.customer).select('name whatsapp');
      const farmer   = order.farmer ? await User.findById(order.farmer).select('name whatsapp') : null;

      await notify([
        {
          phone: customer?.whatsapp,
          message: statusUpdateMsg(order, status, note, customer?.name || 'Customer')
        },
        // Also notify farmer on certain statuses (e.g. customer marked received)
        ...(status === 'received' || status === 'delivered'
          ? [{
              phone: farmer?.whatsapp,
              message: statusUpdateMsg(order, status, note, farmer?.name || 'Farmer')
            }]
          : [])
      ]);
    } catch (err) {
      console.error('WhatsApp status notification error:', err.message);
    }

    res.json(order);
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
