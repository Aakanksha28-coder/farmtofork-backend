const https = require('https');

/**
 * Send a WhatsApp message via GREEN-API (free plan, unlimited sendMessage).
 *
 * Setup (one-time, done by YOU the app owner):
 *   1. Register at https://console.green-api.com
 *   2. Create a free Developer instance
 *   3. Scan the QR code with your WhatsApp to authorise
 *   4. Copy idInstance and apiTokenInstance into Render env vars:
 *        GREEN_API_INSTANCE_ID=your_idInstance
 *        GREEN_API_TOKEN=your_apiTokenInstance
 *
 * Recipients need NO opt-in — messages arrive like normal WhatsApp messages.
 *
 * @param {string} phone - recipient number e.g. "9876543210" or "+919876543210"
 * @param {string} text  - message body
 */
const sendWhatsApp = async (phone, text) => {
  const instanceId = process.env.GREEN_API_INSTANCE_ID;
  const token      = process.env.GREEN_API_TOKEN;

  if (!instanceId || !token) {
    console.warn('⚠️  GREEN_API_INSTANCE_ID / GREEN_API_TOKEN not set — WhatsApp skipped');
    return;
  }

  if (!phone) return;

  // Normalise to chatId format: digits only + @c.us
  const digits = phone.replace(/\D/g, '');
  const chatId = (digits.startsWith('91') ? digits : `91${digits}`) + '@c.us';

  const body = JSON.stringify({ chatId, message: text });
  const url  = `https://api.green-api.com/waInstance${instanceId}/sendMessage/${token}`;

  return new Promise((resolve) => {
    const req = https.request(
      url,
      { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
      (res) => {
        let data = '';
        res.on('data', c => { data += c; });
        res.on('end', () => {
          if (res.statusCode === 200) {
            console.log(`✅ WhatsApp sent to ${chatId}`);
          } else {
            console.error(`❌ WhatsApp failed to ${chatId} — ${res.statusCode}: ${data}`);
          }
          resolve();
        });
      }
    );
    req.on('error', (err) => {
      console.error(`❌ WhatsApp request error:`, err.message);
      resolve();
    });
    req.write(body);
    req.end();
  });
};

module.exports = sendWhatsApp;
