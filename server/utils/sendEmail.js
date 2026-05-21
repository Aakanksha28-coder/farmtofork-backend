const { Resend } = require('resend');

/**
 * Send email via Resend HTTPS API (no SMTP, works on Render free tier).
 * Env vars needed on Render:
 *   RESEND_API_KEY  — from resend.com dashboard
 *   EMAIL_FROM      — e.g. "FarmToFork <onboarding@resend.dev>"
 *                     Use onboarding@resend.dev for testing (sends only to Resend account email)
 *                     For production: verify domain at resend.com/domains
 */
const sendEmail = async (to, subject, html, text = '') => {
  const apiKey = (process.env.RESEND_API_KEY || '').trim();

  if (!apiKey) {
    console.warn('⚠️  RESEND_API_KEY not set — email skipped');
    console.log(`📧 Would have sent to ${to}: ${subject}`);
    return null;
  }

  if (!to) throw new Error('Recipient email is required');

  const from = (process.env.EMAIL_FROM || 'FarmToFork <onboarding@resend.dev>').trim();
  const resend = new Resend(apiKey);

  try {
    const { data, error } = await resend.emails.send({
      from, to, subject, html,
      ...(text ? { text } : {})
    });

    if (error) {
      console.error(`❌ Resend error to ${to}:`, error.message || JSON.stringify(error));
      throw new Error(error.message || 'Email send failed');
    }

    console.log(`✅ Email sent to ${to} — id: ${data?.id}`);
    return data;
  } catch (err) {
    console.error(`❌ Email failed to ${to}:`, err.message);
    throw err;
  }
};

module.exports = sendEmail;
