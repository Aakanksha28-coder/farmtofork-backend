/** Brevo API key from env (supports legacy Sendinblue name). */
const getBrevoApiKey = () =>
  (process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY || '').trim();

const isEmailConfigured = () => !!getBrevoApiKey();

/** Parse EMAIL_FROM: "Name <email@x.com>" or plain email. */
const parseEmailFrom = () => {
  const raw = (process.env.EMAIL_FROM || 'FarmToFork <farmtofork291@gmail.com>')
    .replace(/^["']|["']$/g, '')
    .trim();

  const match = raw.match(/^(.*?)\s*<([^>]+)>$/);
  if (match) {
    return { name: match[1].trim() || 'FarmToFork', email: match[2].trim().toLowerCase() };
  }

  const emailOnly = raw.includes('@') ? raw.toLowerCase() : 'farmtofork291@gmail.com';
  return { name: 'FarmToFork', email: emailOnly };
};

module.exports = { getBrevoApiKey, isEmailConfigured, parseEmailFrom };
