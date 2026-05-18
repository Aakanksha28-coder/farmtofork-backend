const nodemailer = require('nodemailer');

/**
 * Send an email via Gmail SMTP.
 * Creates a fresh transporter each call so env var changes are always picked up.
 */
const sendEmail = async (to, subject, html) => {
  const user = (process.env.EMAIL_USER || '').trim();
  const pass = (process.env.EMAIL_PASS || '').trim();

  if (!user || !pass) {
    console.warn('⚠️  EMAIL_USER / EMAIL_PASS not set — email skipped');
    return;
  }

  if (!to) return;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  });

  try {
    const info = await transporter.sendMail({
      from: `"FarmToFork 🌾" <${user}>`,
      to,
      subject,
      html
    });
    console.log(`✅ Email sent to ${to} — ${info.messageId}`);
    return info;
  } catch (err) {
    console.error(`❌ Email failed to ${to}:`, err.message);
    throw err; // re-throw so callers can handle/log
  }
};

module.exports = sendEmail;
