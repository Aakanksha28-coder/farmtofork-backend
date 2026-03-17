const PDFDocument = require('pdfkit');

/**
 * generateInvoice(order, customerName, farmerName)
 * Returns a Promise<Buffer> of the PDF
 */
const generateInvoice = (order, customerName, farmerName) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];
      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const green  = '#2e7d32';
      const orange = '#e65100';
      const grey   = '#555555';
      const light  = '#f5f5f5';

      // ── Header ──────────────────────────────────────────────
      doc.rect(0, 0, doc.page.width, 80).fill(green);
      doc.fillColor('#fff').fontSize(26).font('Helvetica-Bold')
         .text('🌾 FarmToFork', 50, 25, { align: 'left' });
      doc.fontSize(11).font('Helvetica')
         .text('Fresh From Farm To Your Table', 50, 55, { align: 'left' });
      doc.fillColor('#000');

      // ── Invoice title ────────────────────────────────────────
      doc.moveDown(2);
      doc.fontSize(18).font('Helvetica-Bold').fillColor(green)
         .text('ORDER INVOICE', { align: 'center' });
      doc.moveDown(0.4);
      doc.fontSize(10).font('Helvetica').fillColor(grey)
         .text(`Invoice Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, { align: 'center' });

      doc.moveDown(1);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(green).lineWidth(1.5).stroke();
      doc.moveDown(0.8);

      // ── Order meta ───────────────────────────────────────────
      const metaY = doc.y;
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#000');
      doc.text('Order ID:', 50, metaY);
      doc.font('Helvetica').fillColor(grey).text(String(order._id), 140, metaY);

      doc.font('Helvetica-Bold').fillColor('#000').text('Customer:', 50, metaY + 18);
      doc.font('Helvetica').fillColor(grey).text(customerName || 'N/A', 140, metaY + 18);

      doc.font('Helvetica-Bold').fillColor('#000').text('Farmer:', 50, metaY + 36);
      doc.font('Helvetica').fillColor(grey).text(farmerName || 'N/A', 140, metaY + 36);

      doc.font('Helvetica-Bold').fillColor('#000').text('Payment:', 50, metaY + 54);
      doc.font('Helvetica').fillColor(grey).text((order.paymentMethod || 'cod').toUpperCase(), 140, metaY + 54);

      doc.font('Helvetica-Bold').fillColor('#000').text('Status:', 50, metaY + 72);
      doc.font('Helvetica').fillColor(grey).text((order.status || 'pending').toUpperCase(), 140, metaY + 72);

      // Shipping address (right column)
      if (order.shippingAddress) {
        const sa = order.shippingAddress;
        const addr = [sa.name, sa.address || sa.addressLine1, sa.city, sa.state, sa.postalCode]
          .filter(Boolean).join(', ');
        doc.font('Helvetica-Bold').fillColor('#000').text('Ship To:', 320, metaY);
        doc.font('Helvetica').fillColor(grey).text(addr, 320, metaY + 14, { width: 220 });
      }

      doc.moveDown(5.5);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#ccc').lineWidth(0.5).stroke();
      doc.moveDown(0.6);

      // ── Items table header ───────────────────────────────────
      const tableTop = doc.y;
      doc.rect(50, tableTop, 495, 22).fill(light);
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#000');
      doc.text('Product',    60,  tableTop + 6);
      doc.text('Qty',        310, tableTop + 6);
      doc.text('Unit Price', 360, tableTop + 6);
      doc.text('Subtotal',   460, tableTop + 6);

      doc.moveTo(50, tableTop + 22).lineTo(545, tableTop + 22).strokeColor('#ccc').lineWidth(0.5).stroke();

      // ── Items rows ───────────────────────────────────────────
      let rowY = tableTop + 30;
      const items = order.items || [];
      items.forEach((item, i) => {
        const subtotal = (item.price * item.quantity).toFixed(2);
        if (i % 2 === 1) doc.rect(50, rowY - 4, 495, 20).fill('#fafafa');
        doc.fontSize(10).font('Helvetica').fillColor('#000');
        doc.text(item.name || 'Product', 60,  rowY, { width: 240 });
        doc.text(String(item.quantity),  310, rowY);
        doc.text(`₹${item.price}`,       360, rowY);
        doc.text(`₹${subtotal}`,         460, rowY);
        rowY += 22;
      });

      doc.moveTo(50, rowY).lineTo(545, rowY).strokeColor('#ccc').lineWidth(0.5).stroke();
      rowY += 10;

      // ── Totals ───────────────────────────────────────────────
      doc.fontSize(10).font('Helvetica').fillColor(grey);
      doc.text('Subtotal:',      360, rowY);
      doc.text(`₹${order.total || 0}`, 460, rowY);
      rowY += 18;

      if (order.shippingPrice > 0) {
        doc.text('Shipping:',    360, rowY);
        doc.text(`₹${order.shippingPrice}`, 460, rowY);
        rowY += 18;
      }

      doc.moveTo(360, rowY).lineTo(545, rowY).strokeColor(green).lineWidth(1).stroke();
      rowY += 8;
      doc.fontSize(12).font('Helvetica-Bold').fillColor(green);
      doc.text('TOTAL:',         360, rowY);
      doc.text(`₹${order.totalPrice || order.total || 0}`, 460, rowY);

      // ── Footer ───────────────────────────────────────────────
      doc.moveDown(4);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(green).lineWidth(1).stroke();
      doc.moveDown(0.5);
      doc.fontSize(9).font('Helvetica').fillColor(grey)
         .text('Thank you for shopping with FarmToFork! 🌾 Supporting local farmers, one order at a time.', { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = generateInvoice;
