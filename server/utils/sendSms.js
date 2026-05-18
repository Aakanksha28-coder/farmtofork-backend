const axios = require('axios');

/**
 * Send SMS via Fast2SMS (India, free tier).
 * Sign up at https://fast2sms.com → Dev API → copy API key
 * Add to Render env: FAST2SMS_API_KEY=your_key
 */
const sendSms = async (phone, message) => {
  const apiKey = (process.env.FAST2SMS_API_KEY || '').trim();
  if (!apiKey) {
    console.warn('⚠️  FAST2SMS_API_KEY not set — SMS skipped, message:', message);
    return false;
  }

  const digits = String(phone).replace(/\D/g, '').replace(/^91/, '').slice(-10);
  if (digits.length !== 10) {
    console.warn(`⚠️  Invalid phone: ${phone}`);
    return false;
  }

  try {
    const res = await axios.post(
      'https://www.fast2sms.com/dev/bulkV2',
      { route: 'q', message, language: 'english', flash: 0, numbers: digits },
      { headers: { authorization: apiKey, 'Content-Type': 'application/json' } }
    );
    if (res.data?.return === true) {
      console.log(`✅ SMS sent to ${digits}`);
      return true;
    }
    console.error(`❌ SMS failed to ${digits}:`, JSON.stringify(res.data));
    return false;
  } catch (err) {
    console.error(`❌ SMS error to ${digits}:`, err.message);
    return false;
  }
};

module.exports = sendSms;
