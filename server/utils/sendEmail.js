const nodemailer = require('nodemailer');

/**
 * Send email via Gmail SMTP — forced IPv4 to avoid Render's IPv6 block.
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
    host: 'smtp.gmail.com',   // explicit host instead of service:'gmail'
    port: 465,
    secure: true,             // SSL
    family: 4,                // ← force IPv4, avoids ENETUNREACH on Render
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
    throw err;
  }
};

module.exports = sendEmail;
