const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;
const requestStore = new Map();

const pruneExpiredEntries = (now) => {
  for (const [key, entry] of requestStore.entries()) {
    if (entry.expiresAt <= now) {
      requestStore.delete(key);
    }
  }
};

const otpRateLimit = (req, res, next) => {
  const now = Date.now();
  pruneExpiredEntries(now);

  const emailKey = String(req.body?.email || '').trim().toLowerCase();
  const ipKey = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const key = `${ipKey}:${emailKey}`;

  const entry = requestStore.get(key);
  if (!entry) {
    requestStore.set(key, { count: 1, expiresAt: now + WINDOW_MS });
    return next();
  }

  if (entry.count >= MAX_REQUESTS) {
    const retryAfterSeconds = Math.max(1, Math.ceil((entry.expiresAt - now) / 1000));
    res.setHeader('Retry-After', retryAfterSeconds);
    return res.status(429).json({
      message: 'Too many OTP requests. Please wait a few minutes before trying again.'
    });
  }

  entry.count += 1;
  requestStore.set(key, entry);
  next();
};

module.exports = otpRateLimit;
