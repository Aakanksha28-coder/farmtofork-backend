const { Resend } = require('resend');

/**
 * Send email via Resend (HTTPS API — works on Render free tier, no SMTP port blocking).
 * Free plan: 3000 emails/month, 100/day.
 *
 * Setup:
 *   1. Sign up at https://resend.com (free)
 *   2. Add & verify your domain OR use the free onboarding address
 *   3. Create an API key → add to Render env as RESEND_API_KEY
 *   4. Set EMAIL_FROM to your verified sender e.g. "FarmToFork <noreply@yourdomain.com>"
 *      (or use Resend's shared domain: "FarmToFork <onboarding@resend.dev>" for testing)
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
