const Order        = require('../models/Order');
const Product      = require('../models/Product');
const User         = require('../models/User');
const Notification = require('../models/Notification');
const sendEmail    = require('../utils/sendEmail');
const tmpl         = require('../utils/emailTemplates');

// ── Helper: create in-app notification + send email ──────────────────────────
const notify = async ({ userId, orderId, title, message, email, emailSubject, emailHtml }) => {
  await Promise.allSettled([
    // 1. Save in-app notification to DB
    Notification.create({ user: userId, orderId, title, message }),
    // 2. Send email (silently skipped if EMAIL_USER/PASS not set)
    email ? sendEmail(email, emailSubject, emailHtml) : Promise.resolve()
  ]);
};

// ── Controllers ───────────────────────────────────────────────────────────────

// POST /api/orders
exports.createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod = 'cod', shippingPrice = 0 } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0)
      return res.status(400).json({ message: 'No items in order' });

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

    const shipping   = Number(shippingPrice) || 0;
    const totalPrice = itemsTotal + shipping;

    const order = await Order.create({
      customer: req.user._id,
      farmer: farmerId || undefined,
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

    // ── Notifications ─────────────────────────────────────────
    try {
      const customer = await User.findById(req.user._id).select('name email');
      const farmer   = farmerId ? await User.findById(farmerId).select('name email') : null;
      const shortId  = `#${String(order._id).slice(-6).toUpperCase()}`;

      // Customer notification
      const custTmpl = tmpl.orderPlacedCustomer(order, customer?.name, farmer?.name);
      await notify({
        userId:      customer._id,
        orderId:     order._id,
        title:       `Order ${shortId} Confirmed`,
        message:     `Your order has been placed. Total: ₹${order.totalPrice}`,
        email:       customer?.email,
        emailSubject: custTmpl.subject,
        emailHtml:   custTmpl.html
      });

      // Farmer notification
      if (farmer) {
        const farmTmpl = tmpl.newOrderFarmer(order, customer?.name, farmer?.name);
        await notify({
          userId:      farmer._id,
          orderId:     order._id,
          title:       `New Order ${shortId}`,
          message:     `${customer?.name} placed an order. Total: ₹${order.totalPrice}`,
          email:       farmer?.email,
          emailSubject: farmTmpl.subject,
          emailHtml:   farmTmpl.html
        });
      }
    } catch (err) {
      console.error('Notification error (createOrder):', err.message);
    }

    res.status(201).json(order);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/orders/mine
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/orders/:id
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.customer.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Forbidden' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/orders/farmer
exports.getOrdersForFarmer = async (req, res) => {
  try {
    const orders = await Order.find({ farmer: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/orders/:id/status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const allowed = ['pending','confirmed','on_route','shipped','delivered','received','cancelled'];
    if (status && !allowed.includes(status))
      return res.status(400).json({ message: 'Invalid status' });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const isAdmin       = req.user?.role === 'admin';
    const isFarmerOwner = order.farmer && order.farmer.toString() === req.user._id.toString();
    if (!isAdmin && !isFarmerOwner)
      return res.status(403).json({ message: 'Forbidden' });

    order.status = status || order.status;
    order.tracking.push({ status: order.status, note: note || 'Status updated' });
    await order.save();

    // ── Notifications ─────────────────────────────────────────
    try {
      const customer = await User.findById(order.customer).select('name email');
      const farmer   = order.farmer ? await User.findById(order.farmer).select('name email') : null;
      const shortId  = `#${String(order._id).slice(-6).toUpperCase()}`;

      const STATUS_LABEL = {
        confirmed: 'Confirmed by farmer 🌾',
        on_route:  'On the way 🚚',
        shipped:   'Shipped 📦',
        delivered: 'Delivered ✅',
        received:  'Received 🥦',
        cancelled: 'Cancelled ❌',
        pending:   'Pending ⏳'
      };
      const label = STATUS_LABEL[status] || status;

      // Always notify customer
      const custTmpl = tmpl.statusUpdateCustomer(order, status, note, customer?.name);
      await notify({
        userId:      customer._id,
        orderId:     order._id,
        title:       `Order ${shortId}: ${label}`,
        message:     note || custTmpl.subject,
        email:       customer?.email,
        emailSubject: custTmpl.subject,
        emailHtml:   custTmpl.html
      });

      // Notify farmer on delivered / received
      if (farmer && (status === 'delivered' || status === 'received')) {
        const farmTmpl = tmpl.statusUpdateFarmer(order, status, farmer.name);
        await notify({
          userId:      farmer._id,
          orderId:     order._id,
          title:       `Order ${shortId}: ${label}`,
          message:     `Order marked as ${status}`,
          email:       farmer?.email,
          emailSubject: farmTmpl.subject,
          emailHtml:   farmTmpl.html
        });
      }
    } catch (err) {
      console.error('Notification error (updateOrderStatus):', err.message);
    }

    res.json(order);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/orders/:id/location
exports.updateOrderLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (typeof lat !== 'number' || typeof lng !== 'number')
      return res.status(400).json({ message: 'lat and lng must be numbers' });
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    const isAdmin       = req.user?.role === 'admin';
    const isFarmerOwner = order.farmer && order.farmer.toString() === req.user._id.toString();
    if (!isAdmin && !isFarmerOwner) return res.status(403).json({ message: 'Forbidden' });
    order.currentLocation = { lat, lng, updatedAt: new Date() };
    await order.save();
    res.json(order.currentLocation);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/orders/:id/location
exports.getOrderLocation = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    const isCustomer    = order.customer.toString() === req.user._id.toString();
    const isAdmin       = req.user?.role === 'admin';
    const isFarmerOwner = order.farmer && order.farmer.toString() === req.user._id.toString();
    if (!isCustomer && !isAdmin && !isFarmerOwner)
      return res.status(403).json({ message: 'Forbidden' });
    if (!order.currentLocation)
      return res.status(404).json({ message: 'No location available' });
    res.json(order.currentLocation);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
