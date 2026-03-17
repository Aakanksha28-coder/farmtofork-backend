const green  = '#2e7d32';
const orange = '#e65100';

const baseLayout = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .wrap { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .header { background: ${green}; color: #fff; padding: 24px 32px; }
    .header h1 { margin: 0; font-size: 22px; }
    .header p  { margin: 4px 0 0; font-size: 13px; opacity: 0.85; }
    .body { padding: 28px 32px; color: #333; }
    .body h2 { color: ${green}; margin-top: 0; }
    .table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    .table th { background: #f0f7f0; color: ${green}; text-align: left; padding: 8px 12px; font-size: 13px; }
    .table td { padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 13px; }
    .total-row td { font-weight: bold; color: ${green}; font-size: 15px; border-top: 2px solid ${green}; }
    .badge { display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 13px; font-weight: bold; }
    .footer { background: #f9f9f9; padding: 16px 32px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <h1>🌾 FarmToFork</h1>
      <p>Fresh From Farm To Your Table</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">© FarmToFork · Supporting local farmers, one order at a time.</div>
  </div>
</body>
</html>`;

// ── Order confirmation email ──────────────────────────────────────────────────
exports.orderConfirmationEmail = (order, customerName) => {
  const rows = (order.items || []).map(item => `
    <tr>
      <td>${item.name}</td>
      <td>${item.quantity}</td>
      <td>₹${item.price}</td>
      <td>₹${(item.price * item.quantity).toFixed(2)}</td>
    </tr>`).join('');

  const content = `
    <h2>Order Confirmed ✅</h2>
    <p>Hi <strong>${customerName}</strong>, your order has been placed successfully!</p>
    <p><strong>Order ID:</strong> ${order._id}</p>
    <p><strong>Date:</strong> ${new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>

    <table class="table">
      <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead>
      <tbody>
        ${rows}
        ${order.shippingPrice > 0 ? `<tr><td colspan="3">Shipping</td><td>₹${order.shippingPrice}</td></tr>` : ''}
        <tr class="total-row"><td colspan="3">Total</td><td>₹${order.totalPrice || order.total}</td></tr>
      </tbody>
    </table>

    <p><strong>Payment:</strong> ${(order.paymentMethod || 'cod').toUpperCase()}</p>
    <p style="color:#888; font-size:13px;">📎 Your invoice is attached to this email.</p>
    <p>Thank you for supporting local farmers! 🌱</p>`;

  return baseLayout(content);
};

// ── Status update email ───────────────────────────────────────────────────────
const STATUS_META = {
  confirmed:  { emoji: '✅', color: green,   msg: 'Your order has been accepted by the farmer 🌾' },
  accepted:   { emoji: '✅', color: green,   msg: 'Your order has been accepted by the farmer 🌾' },
  on_route:   { emoji: '🚚', color: orange,  msg: 'Your order is on the way! Hang tight 🚚' },
  shipped:    { emoji: '🚚', color: orange,  msg: 'Your order has been shipped and is on the way 🚚' },
  delivered:  { emoji: '🎉', color: green,   msg: 'Your order has been delivered successfully ✅' },
  received:   { emoji: '🎉', color: green,   msg: 'Order marked as received. Enjoy your fresh produce! 🌿' },
  cancelled:  { emoji: '❌', color: '#c62828', msg: 'Your order has been cancelled.' },
  pending:    { emoji: '⏳', color: '#f57f17', msg: 'Your order is pending confirmation.' },
};

exports.orderStatusEmail = (order, customerName, status) => {
  const meta = STATUS_META[status] || { emoji: '📦', color: green, msg: `Order status updated to: ${status}` };

  const content = `
    <h2>${meta.emoji} Order Update</h2>
    <p>Hi <strong>${customerName}</strong>,</p>
    <p style="font-size:16px; color:${meta.color}; font-weight:bold;">${meta.msg}</p>
    <p><strong>Order ID:</strong> ${order._id}</p>
    <p><strong>Status:</strong> <span class="badge" style="background:${meta.color}; color:#fff;">${status.toUpperCase()}</span></p>
    ${order.tracking?.length ? `<p><strong>Note:</strong> ${order.tracking[order.tracking.length - 1]?.note || ''}</p>` : ''}
    <p style="margin-top:20px;">Track your order in the <strong>My Orders</strong> section of the app.</p>`;

  return baseLayout(content);
};
