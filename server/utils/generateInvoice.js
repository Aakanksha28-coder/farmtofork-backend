const PDFDocument = require('pdfkit');

/**
 * generateInvoice(order, customerName, farmerName)
 * Returns Promise<Buffer>
 */
const generateInvoice = (order, customerName, farmerName) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];
      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end',  () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const green = '#2e7d32';
      const grey  = '#555555';
      const light = '#f5f5f5';

      // ── Header bar ───────────────────────────────────────────
      doc.rect(0, 0, doc.page.width, 75).fill(green);
      doc.fillColor('#fff')
         .fontSize(24).font('Helvetica-Bold').text('FarmToFork', 50, 22);
      doc.fontSize(11).font('Helvetica')
         .text('Fresh From Farm To Your Table', 50, 52);
      doc.fillColor('#000');

      // ── Title ────────────────────────────────────────────────
      doc.moveDown(2.5);
      doc.fontSize(18).font('Helvetica-Bold').fillColor(green)
         .text('ORDER INVOICE', { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica').fillColor(grey)
         .text(`Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, { align: 'center' });

      doc.moveDown(1);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(green).lineWidth(1.5).stroke();
      doc.moveDown(0.8);

      // ── Meta block ───────────────────────────────────────────
      const my = doc.y;
      const col1 = 50, col2 = 150, col3 = 320;

      const meta = [
        ['Order ID',  String(order._id)],
        ['Customer',  customerName || 'N/A'],
        ['Farmer',    farmerName   || 'N/A'],
        ['Payment',   (order.paymentMethod || 'cod').toUpperCase()],
        ['Status',    (order.status || 'pending').toUpperCase()],
      ];

      meta.forEach(([label, value], i) => {
        const y = my + i * 18;
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#000').text(label + ':', col1, y);
        doc.font('Helvetica').fillColor(grey).text(value, col2, y);
      });

      // Shipping address right column
      if (order.shippingAddress) {
        const sa = order.shippingAddress;
        const addr = [sa.name, sa.address || sa.addressLine1, sa.city, sa.state, sa.postalCode]
          .filter(Boolean).join(', ');
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#000').text('Ship To:', col3, my);
        doc.font('Helvetica').fillColor(grey).text(addr, col3, my + 14, { width: 210 });
      }

      doc.moveDown(6);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#ccc').lineWidth(0.5).stroke();
      doc.moveDown(0.6);

      // ── Table header ─────────────────────────────────────────
      const th = doc.y;
      doc.rect(50, th, 495, 22).fill(light);
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#000');
      doc.text('Product',    60,  th + 6);
      doc.text('Qty',        310, th + 6);
      doc.text('Unit Price', 360, th + 6);
      doc.text('Subtotal',   460, th + 6);
      doc.moveTo(50, th + 22).lineTo(545, th + 22).strokeColor('#ccc').lineWidth(0.5).stroke();

      // ── Table rows ───────────────────────────────────────────
      let ry = th + 30;
      (order.items || []).forEach((item, i) => {
        const sub = (item.price * item.quantity).toFixed(2);
        if (i % 2 === 1) doc.rect(50, ry - 4, 495, 20).fill('#fafafa');
        doc.fontSize(10).font('Helvetica').fillColor('#000');
        doc.text(item.name || 'Product', 60,  ry, { width: 240 });
        doc.text(String(item.quantity),  310, ry);
        doc.text(`Rs.${item.price}`,     360, ry);
        doc.text(`Rs.${sub}`,            460, ry);
        ry += 22;
      });

      doc.moveTo(50, ry).lineTo(545, ry).strokeColor('#ccc').lineWidth(0.5).stroke();
      ry += 10;

      // ── Totals ───────────────────────────────────────────────
      doc.fontSize(10).font('Helvetica').fillColor(grey);
      doc.text('Subtotal:', 360, ry);
      doc.text(`Rs.${order.total || 0}`, 460, ry);
      ry += 18;

      if (order.shippingPrice > 0) {
        doc.text('Shipping:', 360, ry);
        doc.text(`Rs.${order.shippingPrice}`, 460, ry);
        ry += 18;
      }

      doc.moveTo(360, ry).lineTo(545, ry).strokeColor(green).lineWidth(1).stroke();
      ry += 8;
      doc.fontSize(12).font('Helvetica-Bold').fillColor(green);
      doc.text('TOTAL:', 360, ry);
      doc.text(`Rs.${order.totalPrice || order.total || 0}`, 460, ry);

      // ── Footer ───────────────────────────────────────────────
      doc.moveDown(5);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(green).lineWidth(1).stroke();
      doc.moveDown(0.5);
      doc.fontSize(9).font('Helvetica').fillColor(grey)
         .text('Thank you for shopping with FarmToFork! Supporting local farmers, one order at a time.', { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = generateInvoice;
