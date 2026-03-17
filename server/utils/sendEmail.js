const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS   // Gmail App Password
  }
});

/**
 * sendEmail({ to, subject, html, attachments? })
 */
const sendEmail = async ({ to, subject, html, attachments = [] }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️  EMAIL_USER / EMAIL_PASS not set — skipping email');
    return;
  }
  try {
    await transporter.sendMail({
      from: `"FarmToFork 🌾" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      attachments
    });
    console.log(`✅ Email sent to ${to}`);
  } catch (err) {
    console.error('❌ Email send error:', err.message);
  }
};

module.exports = sendEmail;
