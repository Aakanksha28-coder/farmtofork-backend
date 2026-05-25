const https = require('https');

/** Brevo API key from env (supports legacy Sendinblue name). */
const getBrevoApiKey = () =>
  (process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY || '').trim();

const isEmailConfigured = () => !!getBrevoApiKey();

/** Parse EMAIL_FROM / EMAIL_USER into { name, email }. */
const parseEmailFrom = () => {
  const fromEnv =
    process.env.EMAIL_FROM ||
    (process.env.EMAIL_USER ? `FarmToFork <${process.env.EMAIL_USER}>` : '') ||
    'FarmToFork <farmtofork291@gmail.com>';

  const raw = fromEnv.replace(/^["']|["']$/g, '').trim();
  const match = raw.match(/^(.*?)\s*<([^>]+)>$/);

  if (match) {
    return { name: match[1].trim() || 'FarmToFork', email: match[2].trim().toLowerCase() };
  }

  if (raw.includes('@')) {
    return { name: 'FarmToFork', email: raw.toLowerCase() };
  }

  const fallback = (process.env.EMAIL_USER || 'farmtofork291@gmail.com').trim().toLowerCase();
  return { name: 'FarmToFork', email: fallback };
};

/** User-safe message for API responses (no secrets). */
const friendlyEmailError = (errMessage = '') => {
  const msg = String(errMessage);

  if (/key not found|unauthorized|invalid.*key|401/i.test(msg)) {
    return 'Email API key is invalid. In Brevo go to SMTP & API → API Keys, create a new v3 key, and set BREVO_API_KEY on Render.';
  }
  if (/sender|from|not verified|not authorised/i.test(msg)) {
    const { email } = parseEmailFrom();
    return `Sender ${email} is not verified in Brevo. Go to Senders & IPs → Senders and verify that email.`;
  }
  if (/not configured/i.test(msg)) {
    return 'Email is not configured on the server (BREVO_API_KEY missing).';
  }

  return 'Verification email could not be sent. Check spam folder or try Resend OTP in a minute.';
};

const brevoGet = (path, apiKey) =>
  new Promise((resolve, reject) => {
    https
      .get(
        {
          hostname: 'api.brevo.com',
          path,
          headers: { accept: 'application/json', 'api-key': apiKey }
        },
        (res) => {
          let raw = '';
          res.on('data', (c) => {
            raw += c;
          });
          res.on('end', () => {
            let data = {};
            if (raw) {
              try {
                data = JSON.parse(raw);
              } catch {
                data = { raw };
              }
            }
            if (res.statusCode >= 200 && res.statusCode < 300) resolve(data);
            else {
              reject(
                new Error(data?.message || data?.error || raw || `Brevo HTTP ${res.statusCode}`)
              );
            }
          });
        }
      )
      .on('error', reject);
  });

/** Call on startup to catch bad API keys early. */
const validateBrevoOnStartup = async () => {
  const apiKey = getBrevoApiKey();
  if (!apiKey) {
    console.warn('⚠️  BREVO_API_KEY not set — OTP emails will not work');
    return false;
  }

  const sender = parseEmailFrom();
  try {
    await brevoGet('/v3/account', apiKey);
    console.log(`✅ Brevo API key valid — sender: ${sender.email}`);
    return true;
  } catch (err) {
    console.error(`❌ Brevo API key check failed: ${err.message}`);
    console.error('   Create a new key at https://app.brevo.com → SMTP & API → API Keys');
    return false;
  }
};

module.exports = {
  getBrevoApiKey,
  isEmailConfigured,
  parseEmailFrom,
  friendlyEmailError,
  validateBrevoOnStartup
};
