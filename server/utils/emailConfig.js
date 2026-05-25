/** True when Brevo API key is set for outbound mail. */
const isEmailConfigured = () => !!(process.env.BREVO_API_KEY || '').trim();

module.exports = { isEmailConfigured };
