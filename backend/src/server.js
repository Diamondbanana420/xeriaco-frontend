const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const config = require('../config');
const logger = require('./utils/logger');
const { apiLimiter, webhookLimiter, captureRawBody, requestLogger } = require('./middleware');
const { initCronJobs } = require('./cron');

// Route imports
const healthRoutes = require('./routes/health');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const webhookRoutes = require('./routes/webhooks');
const pipelineRoutes = require('./routes/pipeline');
const analyticsRoutes = require('./routes/analytics');
const shopifyRoutes = require('./routes/shopify')
const woocommerceRoutes = require('./routes/woocommerce');
const adminRoutes = require('./routes/admin');

const app = express();

// ═══════════════════════════════════════
// GLOBAL MIDDLEWARE
// ═══════════════════════════════════════

// Security
app.use(helmet({ contentSecurityPolicy: false }));

// CORS — allow Netlify frontend + localhost dev
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,https://xeriacofinal.vercel.app').split(',').map(s => s.trim());
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (server-to-server, curl, etc)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(null, true); // Permissive in prod — tighten if needed
  },
  credentials: true,
}));

// Raw body capture for webhook HMAC verification (must be before json parser)
app.use('/api/webhooks', express.json({ verify: captureRawBody, limit: '5mb' }));

// JSON body parser for everything else
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// ═══════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════

// Public routes (no rate limit on health)
app.use('/api', healthRoutes);

// Webhook routes (separate rate limiter, HMAC verification)
app.use('/api/webhooks/shopify', webhookLimiter, webhookRoutes);

// API routes (rate limited)
app.use('/api/products', apiLimiter, productRoutes);
app.use('/api/orders', apiLimiter, orderRoutes);
app.use('/api/pipeline', apiLimiter, pipelineRoutes);
app.use('/api/analytics', apiLimiter, analyticsRoutes);
app.use('/api/shopify', apiLimiter, shopifyRoutes);
app.use('/api/woocommerce', apiLimiter, woocommerceRoutes);
app.use('/api/admin', adminRoutes); // Clawdbot full control — no rate limit

// Store products endpoint for storefront
app.get('/api/store/products', apiLimiter, async (req, res) => {
  try {
    const { Product } = require('./models');
    const products = await Product.find({
      isActive: true,
      shopifyStatus: 'active',
    })
      .sort({ 'analytics.purchases': -1, createdAt: -1 })
      .limit(parseInt(req.query.limit) || 50)
      .select('title slug description featuredImage images sellingPriceAud comparePriceAud category tags shopifyHandle')
      .lean();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════
// STOREFRONT (Next.js static export)
// ═══════════════════════════════════════
const storefrontPath = path.join(__dirname, '..', 'storefront', 'out');
const fs = require('fs');

if (fs.existsSync(storefrontPath)) {
  logger.info(`Serving storefront from ${storefrontPath}`);

  // Serve static assets (JS, CSS, images)
  app.use(express.static(storefrontPath, {
    maxAge: '1d',
    setHeaders: (res, filePath) => {
      // Cache busting for HTML — don't cache
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    },
  }));

  // SPA fallback — serve index.html for all non-API routes
  app.get('*', (req, res) => {
    // Don't serve storefront for /api/* paths
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'Not found', path: req.path });
    }
    res.sendFile(path.join(storefrontPath, 'index.html'));
  });
} else {
  logger.info('No storefront build found — API-only mode');

  // 404 handler (API-only mode)
  app.use((req, res) => {
    res.status(404).json({ error: 'Not found', path: req.path });
  });
}

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack, path: req.path });
  res.status(500).json({ error: 'Internal server error' });
});

// ═══════════════════════════════════════
// DATABASE & SERVER START
// ═══════════════════════════════════════

async function start() {
  try {
    // Connect to MongoDB
    logger.info(`Connecting to MongoDB: ${config.mongo.uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
    await mongoose.connect(config.mongo.uri, config.mongo.options);
    logger.info('MongoDB connected');

    // Ensure indexes
    const { Product, Order } = require('./models');
    await Product.createIndexes();
    await Order.createIndexes();
    logger.info('Database indexes ensured');

    // Initialize cron jobs
    initCronJobs();

    // Start server — Railway assigns PORT dynamically
    const port = process.env.PORT || config.port;
    app.listen(port, '0.0.0.0', () => {
      const railwayUrl = process.env.RAILWAY_PUBLIC_DOMAIN
        ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
        : `http://localhost:${port}`;
      logger.info(`🚀 XeriaCO Backend running on port ${port}`);
      logger.info(`   Environment: ${config.env}`);
      logger.info(`   URL: ${railwayUrl}`);
      logger.info(`   Health: ${railwayUrl}/api/health`);
      logger.info(`   Admin: ${railwayUrl}/api/admin/dashboard`);
      logger.info(`   Storefront: ${fs.existsSync(storefrontPath) ? railwayUrl + ' (serving)' : 'not built'}`);
    });
  } catch (err) {
    logger.error('Failed to start server', { error: err.message });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down...');
  await mongoose.connection.close();
  process.exit(0);
});

start();

module.exports = app; // For testing
