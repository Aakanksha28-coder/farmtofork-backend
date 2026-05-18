const { Resend } = require('resend');

/**
 * Send email via Resend HTTPS API.
 *
 * IMPORTANT — Resend free/test mode restriction:
 *   Without a verified domain, you can ONLY send to the Resend account owner email.
 *   To send to any email: verify a domain at https://resend.com/domains
 *   Then set EMAIL_FROM=FarmToFork <noreply@yourdomain.com>
 *
 * Required Render env vars:
 *   RESEND_API_KEY  — from resend.com dashboard
 *   EMAIL_FROM      — e.g. "FarmToFork <onboarding@resend.dev>"  (test)
 *                     or   "FarmToFork <noreply@yourdomain.com>" (production)
 */
const sendEmail = async (to, subject, html) => {
  const apiKey = (process.env.RESEND_API_KEY || '').trim();

  if (!apiKey) {
    console.warn('⚠️  RESEND_API_KEY not set — email skipped');
    return;
  }
  if (!to) return;

  const from = (process.env.EMAIL_FROM || 'FarmToFork <onboarding@resend.dev>').trim();
  const resend = new Resend(apiKey);

  try {
    const { data, error } = await resend.emails.send({ from, to, subject, html });
    if (error) {
      console.error(`❌ Resend error to ${to}:`, error.message || JSON.stringify(error));
      throw new Error(error.message || 'Resend API error');
    }
    console.log(`✅ Email sent to ${to} — id: ${data?.id}`);
    return data;
  } catch (err) {
    console.error(`❌ Email failed to ${to}:`, err.message);
    throw err;
  }
};

module.exports = sendEmail;
