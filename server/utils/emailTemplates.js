// ── Shared styles ─────────────────────────────────────────────────────────────
const base = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .wrap { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #4CAF50, #2e7d32); padding: 28px 32px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 22px; letter-spacing: 0.5px; }
    .header p  { color: #c8e6c9; margin: 6px 0 0; font-size: 13px; }
    .body { padding: 28px 32px; color: #333; }
    .body h2 { color: #2e7d32; margin-top: 0; }
    .info-box { background: #f1f8e9; border-left: 4px solid #4CAF50; border-radius: 6px; padding: 14px 18px; margin: 18px 0; }
    .info-box p { margin: 5px 0; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th { background: #4CAF50; color: #fff; padding: 10px 12px; text-align: left; font-size: 13px; }
    td { padding: 9px 12px; border-bottom: 1px solid #eee; font-size: 13px; }
    tr:last-child td { border-bottom: none; }
    .total-row td { font-weight: 700; background: #f9fbe7; }
    .status-badge { display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .footer { background: #f9f9f9; padding: 16px 32px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; }
    .btn { display: inline-block; background: #4CAF50; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 700; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <h1>🌾 FarmToFork</h1>
      <p>Fresh from farm to your table</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">© ${new Date().getFullYear()} FarmToFork · You're receiving this because you placed an order with us.</div>
  </div>
</body>
</html>`;

const statusColor = {
  pending:   '#ff9800',
  confirmed: '#4CAF50',
  on_route:  '#2196F3',
  shipped:   '#2196F3',
  delivered: '#4CAF50',
  received:  '#4CAF50',
  cancelled: '#f44336'
};

const itemsTable = (items = []) => `
<table>
  <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead>
  <tbody>
    ${items.map(i => `
      <tr>
        <td>${i.name}</td>
        <td>${i.quantity}</td>
        <td>₹${i.price}</td>
        <td>₹${(i.price * i.quantity).toFixed(2)}</td>
      </tr>`).join('')}
  </tbody>
</table>`;

exports.verificationOtpEmail = ({ name, otp, brandName = 'FarmToFork', expiryMinutes = 5 }) => ({
  subject: `${brandName} Email Verification Code`,
  html: base(`
    <h2>Verify your email address</h2>
    <p>Hi ${name || 'there'},</p>
    <p>Use the one-time password below to finish setting up your account.</p>
    <div style="margin: 28px 0; text-align: center;">
      <div style="display: inline-block; padding: 16px 28px; border-radius: 14px; background: #f1f8e9; border: 1px solid #dce9c5;">
        <div style="font-size: 12px; letter-spacing: 1px; color: #5f6f52; text-transform: uppercase; margin-bottom: 8px;">Your OTP Code</div>
        <div style="font-size: 34px; letter-spacing: 8px; font-weight: 700; color: #1f2937;">${otp}</div>
      </div>
    </div>
    <div class="info-box">
      <p><strong>Brand:</strong> ${brandName}</p>
      <p><strong>Expires in:</strong> ${expiryMinutes} minutes</p>
      <p><strong>Security notice:</strong> Never share this code with anyone. Our team will never ask for your OTP.</p>
    </div>
    <p>If you did not request this code, you can safely ignore this email.</p>
  `),
  text: [
    `${brandName} email verification`,
    `Hi ${name || 'there'},`,
    `Your OTP code is ${otp}.`,
    `This code expires in ${expiryMinutes} minutes.`,
    'Never share this code with anyone.'
  ].join('\n')
});

// ── Template 1: Customer — order placed ───────────────────────────────────────
exports.orderPlacedCustomer = (order, customerName, farmerName) => ({
  subject: `✅ Order Confirmed — FarmToFork #${String(order._id).slice(-6).toUpperCase()}`,
  html: base(`
    <h2>Hi ${customerName}, your order is confirmed! 🎉</h2>
    <div class="info-box">
      <p><strong>Order ID:</strong> #${String(order._id).slice(-6).toUpperCase()}</p>
      <p><strong>Farmer:</strong> ${farmerName || 'N/A'}</p>
      <p><strong>Payment:</strong> ${(order.paymentMethod || 'cod').toUpperCase()}</p>
      <p><strong>Status:</strong> <span class="status-badge" style="background:${statusColor.pending};color:#fff">PENDING</span></p>
    </div>
    ${itemsTable(order.items)}
    <div class="info-box">
      <p><strong>Subtotal:</strong> ₹${order.total}</p>
      ${order.shippingPrice > 0 ? `<p><strong>Shipping:</strong> ₹${order.shippingPrice}</p>` : ''}
      <p><strong>Total:</strong> ₹${order.totalPrice}</p>
    </div>
    <p>We'll notify you as soon as the farmer confirms your order. Thank you for supporting local farmers! 🌿</p>
  `)
});

// ── Template 2: Farmer — new order received ───────────────────────────────────
exports.newOrderFarmer = (order, customerName, farmerName) => ({
  subject: `🔔 New Order Received — FarmToFork #${String(order._id).slice(-6).toUpperCase()}`,
  html: base(`
    <h2>Hi ${farmerName}, you have a new order! 🛒</h2>
    <div class="info-box">
      <p><strong>Order ID:</strong> #${String(order._id).slice(-6).toUpperCase()}</p>
      <p><strong>Customer:</strong> ${customerName}</p>
      <p><strong>Total:</strong> ₹${order.totalPrice}</p>
    </div>
    ${itemsTable(order.items)}
    <p>Please log in to your FarmToFork dashboard to confirm or update this order.</p>
    <a href="${process.env.FRONTEND_URL || 'https://farmtofork-frontend.onrender.com'}/farmer/orders" class="btn">View Orders</a>
  `)
});

// ── Template 3: Status update — sent to customer ──────────────────────────────
const STATUS_LABEL = {
  confirmed: 'Order Confirmed by Farmer 🌾',
  on_route:  'Order On the Way 🚚',
  shipped:   'Order Shipped 📦',
  delivered: 'Order Delivered ✅',
  received:  'Order Received 🥦',
  cancelled: 'Order Cancelled ❌',
  pending:   'Order Pending ⏳'
};

exports.statusUpdateCustomer = (order, status, note, customerName) => ({
  subject: `📬 Order Update: ${STATUS_LABEL[status] || status} — FarmToFork`,
  html: base(`
    <h2>Hi ${customerName},</h2>
    <p>Your order status has been updated.</p>
    <div class="info-box">
      <p><strong>Order ID:</strong> #${String(order._id).slice(-6).toUpperCase()}</p>
      <p><strong>New Status:</strong>
        <span class="status-badge" style="background:${statusColor[status] || '#555'};color:#fff">
          ${(status || '').toUpperCase()}
        </span>
      </p>
      ${note ? `<p><strong>Note from farmer:</strong> ${note}</p>` : ''}
    </div>
    <p>${STATUS_LABEL[status] || 'Your order has been updated.'}</p>
    <a href="${process.env.FRONTEND_URL || 'https://farmtofork-frontend.onrender.com'}/my-orders" class="btn">Track My Order</a>
  `)
});

// ── Template 4: Status update — sent to farmer (on delivered/received) ────────
exports.statusUpdateFarmer = (order, status, farmerName) => ({
  subject: `📬 Order Update: ${STATUS_LABEL[status] || status} — FarmToFork`,
  html: base(`
    <h2>Hi ${farmerName},</h2>
    <p>An order status has been updated.</p>
    <div class="info-box">
      <p><strong>Order ID:</strong> #${String(order._id).slice(-6).toUpperCase()}</p>
      <p><strong>Status:</strong>
        <span class="status-badge" style="background:${statusColor[status] || '#555'};color:#fff">
          ${(status || '').toUpperCase()}
        </span>
      </p>
    </div>
    <p>${STATUS_LABEL[status] || 'Order status updated.'}</p>
  `)
});
