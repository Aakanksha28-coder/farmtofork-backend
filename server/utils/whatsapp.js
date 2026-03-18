const twilio = require('twilio');

// Lazily initialise client so missing env vars don't crash the server
let client = null;
const getClient = () => {
  if (!client) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) {
      console.warn('⚠️  TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN not set — WhatsApp disabled');
      return null;
    }
    client = twilio(sid, token);
  }
  return client;
};

/**
 * Send a WhatsApp message via Twilio.
 * @param {string} to   - recipient phone, e.g. "9876543210" or "+919876543210"
 * @param {string} body - message text
 */
const sendWhatsApp = async (to, body) => {
  const c = getClient();
  if (!c) return;

  // Normalise to E.164 with India default (+91)
  const digits = to.replace(/\D/g, '');
  const e164 = digits.startsWith('91') ? `+${digits}` : `+91${digits}`;

  const from = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'; // Twilio sandbox default

  try {
    const msg = await c.messages.create({
      from: `whatsapp:${from.replace('whatsapp:', '')}`,
      to: `whatsapp:${e164}`,
      body
    });
    console.log(`✅ WhatsApp sent to ${e164} — SID: ${msg.sid}`);
  } catch (err) {
    console.error(`❌ WhatsApp send failed to ${e164}:`, err.message);
  }
};

module.exports = sendWhatsApp;
