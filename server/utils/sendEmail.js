/**
 * Send email via Brevo (formerly Sendinblue) — HTTPS API, works on Render free tier.
 * Free plan: 300 emails/day, sends to ANY email, no domain verification needed.
 *
 * Setup (2 minutes):
 *   1. Sign up at https://app.brevo.com (free)
 *   2. Go to SMTP & API → API Keys → Generate API key
 *   3. Add to Render env: BREVO_API_KEY=your_key
 *   4. Add to Render env: EMAIL_FROM=FarmToFork <aakankshamore2805@gmail.com>
 *      (must be a verified sender — verify at Brevo → Senders & IPs → Senders)
 */

const sendEmail = async (to, subject, html, text = '') => {
  const apiKey = (process.env.BREVO_API_KEY || '').trim();

  if (!apiKey) {
    console.warn('⚠️  BREVO_API_KEY not set — email skipped');
    return null;
  }
  if (!to) return null;

  const fromRaw  = (process.env.EMAIL_FROM || 'FarmToFork <aakankshamore2805@gmail.com>').trim();
  // Parse "Name <email>" format
  const match    = fromRaw.match(/^(.*?)\s*<(.+?)>$/);
  const fromName  = match ? match[1].trim() : 'FarmToFork';
  const fromEmail = match ? match[2].trim() : fromRaw;

  const payload = {
    sender:   { name: fromName, email: fromEmail },
    to:       [{ email: to }],
    subject,
    htmlContent: html,
    ...(text ? { textContent: text } : {})
  };

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method:  'POST',
      headers: {
        'accept':       'application/json',
        'api-key':      apiKey,
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

    console.log(`✅ Email sent to ${to} — messageId: ${data?.messageId}`);
    return data;
  } catch (err) {
    console.error(`❌ Email failed to ${to}:`, err.message);
    throw err;
  }
};

module.exports = sendEmail;
