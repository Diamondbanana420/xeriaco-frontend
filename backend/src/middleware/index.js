const rateLimit = require('express-rate-limit');
const config = require('../../config');
const logger = require('../utils/logger');

// Simple admin auth middleware
const adminAuth = (req, res, next) => {
  const password = req.headers['x-admin-password'] || req.query.password;
  if (password === config.admin.password) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
};

// API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// Webhook rate limiter (more lenient)
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'Too many webhook requests.' },
});

// Raw body capture middleware for Shopify HMAC verification
const captureRawBody = (req, res, buf) => {
  if (buf && buf.length) {
    req.rawBody = buf.toString('utf8');
  }
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path !== '/api/health') { // Don't log health checks
      logger.debug(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    }
  });
  next();
};

module.exports = { adminAuth, apiLimiter, webhookLimiter, captureRawBody, requestLogger };
