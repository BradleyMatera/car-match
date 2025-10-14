const rateLimit = require('express-rate-limit');
const { logger, securityEvent } = require('../logger');

const DEFAULT_MESSAGE = 'Too many requests. Please try again later.';

const buildLimiter = ({ windowMs, max, message = DEFAULT_MESSAGE, skip, keyGenerator }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message },
    skip,
    keyGenerator,
    handler: (req, res, _next, options) => {
      const limit = options?.limit ?? max;
      const windowSeconds = Math.ceil((options?.windowMs ?? windowMs) / 1000);
      const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
      const meta = {
        requestId: req.requestId,
        ip,
        method: req.method,
        path: req.originalUrl,
        limit,
        windowSeconds,
      };
      logger.warn('Request rate limited', meta);
      securityEvent('Rate limit triggered', meta);
      res.status(options.statusCode).json({ message });
    },
  });

const createRateLimits = () => {
  const skipHealthChecks = (req) => req.path === '/healthz';

  const generalLimiter = buildLimiter({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: 'Too many requests from this IP. Please slow down.',
    skip: skipHealthChecks,
  });

  const authLimiter = buildLimiter({
    windowMs: 5 * 60 * 1000,
    max: 50,
    message: 'Too many authentication attempts. Please try again in a few minutes.',
  });

  const createSensitiveLimiter = (overrides = {}) =>
    buildLimiter({
      windowMs: 30 * 60 * 1000,
      max: 180,
      message: 'You are performing actions very quickly. Please slow down briefly and try again.',
      ...overrides,
    });

  return { generalLimiter, authLimiter, createSensitiveLimiter };
};

module.exports = {
  buildLimiter,
  createRateLimits,
};
