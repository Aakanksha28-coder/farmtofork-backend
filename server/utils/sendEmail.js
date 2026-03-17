const nodemailer = require('nodemailer');

// Debug: log env var status on startup
console.log('📧 EMAIL_USER:', process.env.EMAIL_USER || 'NOT SET');
console.log('📧 EMAIL_PASS:', process.env.EMAIL_PASS ? 'Loaded ✅' : 'NOT SET ❌');

/**
 * Create transporter lazily so env vars are read at call time, not module load time.
 * This is critical on Render where env vars may not be injected at require() time.
 */
const getTransporter = () =>
  nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

/**
 * sendEmail({ to, subject, html, attachments? })
 */
const sendEmail = async ({ to, subject, html, attachments = [] }) => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    console.warn('⚠️  EMAIL_USER / EMAIL_PASS not set — skipping email to:', to);
    return { skipped: true };
  }

  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from: `"FarmToFork 🌾" <${user}>`,
      to,
      subject,
      html,
      attachments
    });
    console.log(`✅ Email sent to ${to} — Response: ${info.response}`);
    return { success: true, response: info.response };
  } catch (err) {
    console.error(`❌ Email send error to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
};

module.exports = sendEmail;
