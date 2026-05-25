const WINDOW_MS = 15 * 60 * 1000;

const createRateLimiter = ({ maxRequests, scope }) => {
  const requestStore = new Map();

  const pruneExpiredEntries = (now) => {
    for (const [key, entry] of requestStore.entries()) {
      if (entry.expiresAt <= now) requestStore.delete(key);
    }
  };

  return (req, res, next) => {
    const now = Date.now();
    pruneExpiredEntries(now);

    const emailKey = String(req.body?.email || '').trim().toLowerCase();
    const ipKey = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const key = `${scope}:${ipKey}:${emailKey}`;

    const entry = requestStore.get(key);
    if (!entry) {
      requestStore.set(key, { count: 1, expiresAt: now + WINDOW_MS });
      return next();
    }

    if (entry.count >= maxRequests) {
      const retryAfter = Math.max(1, Math.ceil((entry.expiresAt - now) / 1000));
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({
        message: `Too many OTP requests. Please wait ${Math.ceil(retryAfter / 60)} minute(s).`,
        retryIn: retryAfter
      });
    }

    entry.count += 1;
    requestStore.set(key, entry);
    next();
  };
};

// Registration: generous cap so signup retries do not block resend later
const registerRateLimit = createRateLimiter({ maxRequests: 20, scope: 'register' });

// Resend only: separate bucket from register
const resendOtpRateLimit = createRateLimiter({ maxRequests: 8, scope: 'resend' });

module.exports = { registerRateLimit, resendOtpRateLimit };
