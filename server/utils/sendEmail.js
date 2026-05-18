const nodemailer = require('nodemailer');
const dns = require('dns');

// Force Node.js to resolve DNS using IPv4 — fixes ENETUNREACH on Render's IPv6-blocked network
dns.setDefaultResultOrder('ipv4first');

/**
 * Send email via Gmail SMTP.
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
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: { user, pass },
    tls: { rejectUnauthorized: false }
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
    throw err;
  }
};

module.exports = sendEmail;
