const Notification = require('../models/Notification');
const sendEmail = require('./sendEmail');
const { isEmailConfigured } = require('./emailConfig');

const sendTemplateEmail = async (to, template) => {
  if (!to || !template || !isEmailConfigured()) return;
  try {
    await sendEmail(to, template.subject, template.html);
  } catch (err) {
    console.error(`Brevo order email failed (${to}):`, err.message);
  }
};

/** In-app notification + Brevo email (when template provided). */
const notifyUser = async ({ userId, orderId, title, message, email, template }) => {
  const tasks = [Notification.create({ user: userId, orderId, title, message })];
  if (email && template) tasks.push(sendTemplateEmail(email, template));
  await Promise.allSettled(tasks);
};

module.exports = { notifyUser, sendTemplateEmail };
