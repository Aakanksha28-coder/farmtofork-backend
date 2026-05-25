/**
 * All outbound email via Brevo Transactional API (HTTPS).
 * Render env: BREVO_API_KEY, EMAIL_FROM="FarmToFork <verified@email.com>"
 */

const sendEmail = async (to, subject, html, text = '', { required = false } = {}) => {
  const apiKey = (process.env.BREVO_API_KEY || '').trim();

  if (!apiKey) {
    const msg = 'BREVO_API_KEY is not configured on the server';
    if (required) throw new Error(msg);
    console.warn(`⚠️  ${msg} — email skipped`);
    return null;
  }
  if (!to) return null;

  const fromRaw = (process.env.EMAIL_FROM || 'FarmToFork <farmtofork291@gmail.com>').trim();
  const match = fromRaw.match(/^(.*?)\s*<(.+?)>$/);
  const fromName = match ? match[1].trim() : 'FarmToFork';
  const fromEmail = match ? match[2].trim() : fromRaw;

  const payload = {
    sender: { name: fromName, email: fromEmail },
    to: [{ email: to }],
    subject,
    htmlContent: html,
    ...(text ? { textContent: text } : {})
  };

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      const msg = data?.message || JSON.stringify(data);
      console.error(`❌ Brevo error to ${to}:`, msg);
      throw new Error(msg);
    }

    console.log(`✅ Brevo email sent to ${to} — messageId: ${data?.messageId}`);
    return data;
  } catch (err) {
    console.error(`❌ Brevo email failed to ${to}:`, err.message);
    throw err;
  }
};

module.exports = sendEmail;
