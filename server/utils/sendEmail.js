const nodemailer = require('nodemailer');

// Lazily create transporter so missing env vars don't crash on startup
let transporter = null;
const getTransporter = () => {
  if (!transporter) {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;
    if (!user || !pass) {
      console.warn('⚠️  EMAIL_USER / EMAIL_PASS not set — email notifications disabled');
      return null;
    }
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass }
    });
  }
  return transporter;
};

/**
 * Send an email via Gmail SMTP.
 * @param {string} to      - recipient email
 * @param {string} subject - email subject
 * @param {string} html    - HTML body
 */
const sendEmail = async (to, subject, html) => {
  const t = getTransporter();
  if (!t || !to) return;
  try {
    const info = await t.sendMail({
      from: `"FarmToFork 🌾" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    console.log(`✅ Email sent to ${to} — ${info.messageId}`);
  } catch (err) {
    console.error(`❌ Email failed to ${to}:`, err.message);
  }
};

module.exports = sendEmail;
