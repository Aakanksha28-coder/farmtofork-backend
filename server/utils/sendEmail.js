/**
 * All outbound email via Brevo Transactional API.
 * Env: BREVO_API_KEY, EMAIL_FROM="FarmToFork <verified@email.com>"
 */

const https = require('https');
const { getBrevoApiKey, parseEmailFrom } = require('./emailConfig');

const brevoSend = (payload, apiKey) =>
  new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);

    const req = https.request(
      {
        hostname: 'api.brevo.com',
        path: '/v3/smtp/email',
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json',
          'content-length': Buffer.byteLength(body)
        }
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
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

          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
            return;
          }

          const detail =
            data?.message ||
            data?.error ||
            (Array.isArray(data?.errors) && data.errors[0]?.message) ||
            raw ||
            `Brevo HTTP ${res.statusCode}`;
          reject(new Error(detail));
        });
      }
    );

    req.on('error', reject);
    req.write(body);
    req.end();
  });

const sendEmail = async (to, subject, html, text = '', { required = false } = {}) => {
  const apiKey = getBrevoApiKey();

  if (!apiKey) {
    const msg = 'BREVO_API_KEY is not configured on the server';
    if (required) throw new Error(msg);
    console.warn(`⚠️  ${msg} — email skipped`);
    return null;
  }

  const recipient = String(to || '').trim().toLowerCase();
  if (!recipient) return null;

  const sender = parseEmailFrom();

  const payload = {
    sender: { name: sender.name, email: sender.email },
    to: [{ email: recipient }],
    subject,
    htmlContent: html,
    ...(text ? { textContent: text } : {})
  };

  try {
    const data = await brevoSend(payload, apiKey);
    console.log(`✅ Brevo email sent to ${recipient} — messageId: ${data?.messageId || 'ok'}`);
    return data;
  } catch (err) {
    console.error(`❌ Brevo email failed to ${recipient}:`, err.message);
    console.error(`   Sender used: ${sender.name} <${sender.email}>`);
    throw err;
  }
};

module.exports = sendEmail;
