const https = require('https');

/**
 * Send a WhatsApp message via CallMeBot (free, no account needed).
 *
 * IMPORTANT — each recipient must activate CallMeBot once:
 *   1. Save +34 644 59 78 19 in contacts as "CallMeBot"
 *   2. Send this message to that number on WhatsApp:
 *      "I allow callmebot to send me messages"
 *   3. They'll receive an API key — store it in their profile (callmebotApiKey field)
 *
 * @param {string} phone  - recipient phone with country code, e.g. "919876543210"
 * @param {string} apiKey - the CallMeBot API key for that specific phone number
 * @param {string} text   - message body
 */
const sendWhatsApp = async (phone, apiKey, text) => {
  if (!phone || !apiKey) {
    console.warn('⚠️  WhatsApp skipped — missing phone or CallMeBot API key');
    return;
  }

  // Normalise: strip non-digits, add 91 if no country code
  const digits = phone.replace(/\D/g, '');
  const number = digits.startsWith('91') ? digits : `91${digits}`;

  const encoded = encodeURIComponent(text);
  const url = `https://api.callmebot.com/whatsapp.php?phone=${number}&text=${encoded}&apikey=${apiKey}`;

  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`✅ WhatsApp sent to ${number}`);
        } else {
          console.error(`❌ WhatsApp failed to ${number} — status ${res.statusCode}: ${data}`);
        }
        resolve();
      });
    }).on('error', (err) => {
      console.error(`❌ WhatsApp request error to ${number}:`, err.message);
      resolve();
    });
  });
};

module.exports = sendWhatsApp;
