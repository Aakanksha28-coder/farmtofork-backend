const Order   = require('../models/Order');
const Product = require('../models/Product');
const User    = require('../models/User');
const sendWhatsApp = require('../utils/whatsapp');
const sendEmail    = require('../utils/sendEmail');
const tmpl         = require('../utils/emailTemplates');

// ── WhatsApp message builders ─────────────────────────────────────────────────

const STATUS_TEXT = {
  confirmed: 'Your order has been accepted by the farmer. 🌾',
  on_route:  'Your order is on the way! 🚚',
  shipped:   'Your order has been shipped. 📦',
  delivered: 'Your order has been delivered successfully. ✅',
  received:  'Order marked as received. Enjoy your fresh produce! 🥦',
  cancelled: 'Your order has been cancelled. ❌',
  pending:   'Your order is pending confirmation. ⏳'
};

const waOrderConfirm = (order, customerName, farmerName) =>
  [
    `*FarmToFork — Order Confirmed* 🛒`,
    `Hi ${customerName}, your order is placed!`,
    ``,
    `Order ID: #${String(order._id).slice(-6).toUpperCase()}`,
    `Farmer: ${farmerName || 'N/A'}`,
    ``,
    `*Items:*`,
    ...(order.items || []).map(i => `  • ${i.name} x${i.quantity} @ ₹${i.price}`),
    ``,
    `*Total: ₹${order.totalPrice}*`,
    `Payment: ${(order.paymentMethod || 'cod').toUpperCase()}`,
    ``,
    `Thank you for shopping with FarmToFork! 🌿`
  ].join('\n');

const waNewOrderFarmer = (order, customerName) =>
  [
    `*FarmToFork — New Order* 🔔`,
    `Hi! New order from ${customerName}.`,
    ``,
    `Order ID: #${String(order._id).slice(-6).toUpperCase()}`,
    ...(order.items || []).map(i => `  • ${i.name} x${i.quantity}`),
    ``,
    `*Total: ₹${order.totalPrice}*`,
    `Log in to confirm the order.`
  ].join('\n');

const waStatusUpdate = (order, status, note, recipientName) =>
  [
    `*FarmToFork — Order Update* 📬`,
    `Hi ${recipientName},`,
    ``,
    `Order #${String(order._id).slice(-6).toUpperCase()}`,
    `Status: *${status.toUpperCase()}*`,
    note ? `Note: ${note}` : null,
    ``,
    STATUS_TEXT[status] || 'Your order has been updated.'
  ].filter(Boolean).join('\n');

// ── Fire-and-forget dual notifications (WhatsApp + Email) ────────────────────
const notifyUser = async ({ phone, email, waMsg, emailSubject, emailHtml }) => {
  await Promise.allSettled([
    phone ? sendWhatsApp(phone, waMsg) : Promise.resolve(),
    email ? sendEmail(email, emailSubject, emailHtml) : Promise.resolve()
  ]);
};

// ── Controllers ───────────────────────────────────────────────────────────────

// POST /api/orders — customer places an order
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

    // ── Notify customer + farmer ──────────────────────────────
    try {
      const customer = await User.findById(req.user._id).select('name email whatsapp');
      const farmer   = farmerId ? await User.findById(farmerId).select('name email whatsapp') : null;

      // Customer: order confirmation
      const custEmail = tmpl.orderPlacedCustomer(order, customer?.name, farmer?.name);
      await notifyUser({
        phone:        customer?.whatsapp,
        email:        customer?.email,
        waMsg:        waOrderConfirm(order, customer?.name, farmer?.name),
        emailSubject: custEmail.subject,
        emailHtml:    custEmail.html
      });

      // Farmer: new order alert
      if (farmer) {
        const farmEmail = tmpl.newOrderFarmer(order, customer?.name, farmer?.name);
        await notifyUser({
          phone:        farmer.whatsapp,
          email:        farmer.email,
          waMsg:        waNewOrderFarmer(order, customer?.name),
          emailSubject: farmEmail.subject,
          emailHtml:    farmEmail.html
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

// PUT /api/orders/:id/status — farmer updates order status → notify customer (+ farmer on delivery)
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

    // ── Notify customer (always) + farmer (on delivered/received) ────────────
    try {
      const customer = await User.findById(order.customer).select('name email whatsapp');
      const farmer   = order.farmer ? await User.findById(order.farmer).select('name email whatsapp') : null;

      // Always notify customer
      const custEmail = tmpl.statusUpdateCustomer(order, status, note, customer?.name);
      await notifyUser({
        phone:        customer?.whatsapp,
        email:        customer?.email,
        waMsg:        waStatusUpdate(order, status, note, customer?.name || 'Customer'),
        emailSubject: custEmail.subject,
        emailHtml:    custEmail.html
      });

      // Notify farmer when order is delivered or received
      if (farmer && (status === 'delivered' || status === 'received')) {
        const farmEmail = tmpl.statusUpdateFarmer(order, status, farmer.name);
        await notifyUser({
          phone:        farmer.whatsapp,
          email:        farmer.email,
          waMsg:        waStatusUpdate(order, status, note, farmer.name || 'Farmer'),
          emailSubject: farmEmail.subject,
          emailHtml:    farmEmail.html
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
