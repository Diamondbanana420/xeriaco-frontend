const express = require('express');
const router = express.Router();
const { Product, Order, PipelineRun, Analytics, Supplier } = require('../models');
const pricingEngine = require('../services/PricingEngine');
const clawdbotBridge = require('../services/ClawdbotBridge');
const trendScout = require('../services/TrendScout');
const supplierSourcer = require('../services/SupplierSourcer');
const aiContent = require('../services/AIContentGenerator');
const competitorScraper = require('../services/CompetitorScraper');
const airtableSync = require('../services/AirtableSync');
const n8nIntegration = require('../services/N8nIntegration');
const fraudScorer = require('../services/FraudScorer');
const orderProcessor = require('../services/OrderProcessor');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * ADMIN CONTROL API — Full backend control for Clawdbot
 *
 * Clawdbot authenticates with X-Admin-Password or X-API-Key header.
 * Every endpoint here gives Clawdbot complete control over the backend.
 */

// Auth middleware — accepts admin password OR Clawdbot API key
function clawdbotAuth(req, res, next) {
  const adminPass = req.headers['x-admin-password'] || req.query.password;
  const apiKey = req.headers['x-api-key'];
  const config = require('../../config');

  if (adminPass === config.admin.password || apiKey === config.clawdbot.apiKey) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized — provide X-Admin-Password or X-API-Key' });
}

router.use(clawdbotAuth);

// ═══════════════════════════════════════════════════════
// CALLBACK — Clawdbot sends Shopify results back here
// ═══════════════════════════════════════════════════════

router.post('/callback', (req, res) => {
  const { taskId, result, error } = req.body;
  if (taskId) {
    clawdbotBridge.resolveTask(taskId, error ? { error } : result);
    logger.info(`Admin callback received for task ${taskId}`);
  }
  res.json({ received: true });
});

// ═══════════════════════════════════════════════════════
// DASHBOARD — Quick overview of everything
// ═══════════════════════════════════════════════════════

router.get('/dashboard', async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalProducts,
      activeProducts,
      draftProducts,
      totalOrders,
      todaysOrders,
      pendingApproval,
      activePipeline,
      lastPipeline,
      totalSuppliers,
    ] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: true, shopifyStatus: 'active' }),
      Product.countDocuments({ isActive: true, shopifyStatus: 'draft' }),
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: todayStart } }),
      Product.countDocuments({ isActive: true, 'pipeline.approved': false, 'pipeline.rejectionReason': '' }),
      PipelineRun.findOne({ status: { $in: ['queued', 'running'] } }),
      PipelineRun.findOne({ status: 'completed' }).sort({ completedAt: -1 }),
      Supplier.countDocuments({ isActive: true }),
    ]);

    // Today's revenue
    const todaysOrderDocs = await Order.find({ createdAt: { $gte: todayStart } });
    const todaysRevenue = todaysOrderDocs.reduce((s, o) => s + (o.financials?.totalAud || 0), 0);
    const todaysProfit = todaysOrderDocs.reduce((s, o) => s + (o.financials?.profitAud || 0), 0);

    res.json({
      products: { total: totalProducts, active: activeProducts, draft: draftProducts, pendingApproval },
      orders: { total: totalOrders, today: todaysOrders, todaysRevenue: `$${todaysRevenue.toFixed(2)}`, todaysProfit: `$${todaysProfit.toFixed(2)}` },
      pipeline: {
        active: activePipeline ? { runId: activePipeline.runId, status: activePipeline.status, startedAt: activePipeline.startedAt } : null,
        last: lastPipeline ? { runId: lastPipeline.runId, completedAt: lastPipeline.completedAt, listed: lastPipeline.results?.productsListed } : null,
      },
      suppliers: totalSuppliers,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════
// PIPELINE CONTROL — run full or individual stages
// ═══════════════════════════════════════════════════════

router.post('/pipeline/run', async (req, res) => {
  try {
    const active = await PipelineRun.findOne({ status: { $in: ['queued', 'running'] } });
    if (active) return res.status(409).json({ error: 'Pipeline already running', runId: active.runId });

    const run = new PipelineRun({
      runId: uuidv4(),
      type: req.body.type || 'full',
      status: 'queued',
      triggeredBy: 'clawdbot',
      config: { maxProducts: req.body.maxProducts || 50 },
    });
    await run.save();

    // Execute in background
    const { executePipeline } = require('../routes/pipeline');
    executePipeline(run);

    res.json({ started: true, runId: run.runId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/pipeline/trend-scout', async (req, res) => {
  try {
    const results = await trendScout.discoverProducts();
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/pipeline/supplier-source', async (req, res) => {
  try {
    const results = await supplierSourcer.autoSourceProducts(req.body.limit || 10);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/pipeline/ai-enrich', async (req, res) => {
  try {
    const results = await aiContent.bulkEnrich(req.body.limit || 10);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/pipeline/competitor-scan', async (req, res) => {
  try {
    const results = await competitorScraper.runBulkScan({ limit: req.body.limit || 20 });
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/pipeline/airtable-sync', async (req, res) => {
  try {
    const [p, o, pull] = await Promise.allSettled([
      airtableSync.bulkSyncProducts(50),
      airtableSync.bulkSyncOrders(50),
      airtableSync.pullProductUpdatesFromAirtable(),
    ]);
    res.json({
      productsPushed: p.value || p.reason?.message,
      ordersPushed: o.value || o.reason?.message,
      productsPulled: pull.value || pull.reason?.message,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/pipeline/status', async (req, res) => {
  try {
    const active = await PipelineRun.findOne({ status: { $in: ['queued', 'running'] } }).sort({ createdAt: -1 });
    const last5 = await PipelineRun.find().sort({ createdAt: -1 }).limit(5);
    res.json({ active, recent: last5 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════
// PRODUCT CONTROL
// ═══════════════════════════════════════════════════════

router.get('/products', async (req, res) => {
  try {
    const { status, approved, limit = 50, sort = '-createdAt', search } = req.query;
    const filter = { isActive: true };
    if (status) filter.shopifyStatus = status;
    if (approved === 'true') filter['pipeline.approved'] = true;
    if (approved === 'false') filter['pipeline.approved'] = false;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const products = await Product.find(filter).sort(sort).limit(parseInt(limit));
    res.json({ count: products.length, products });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/products/:id/approve', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Not found' });

    product.pipeline.approved = true;
    product.pipeline.approvedAt = new Date();
    await product.save();

    res.json({ approved: true, title: product.title });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/products/:id/reject', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Not found' });

    product.pipeline.rejectionReason = req.body.reason || 'Rejected by Clawdbot';
    product.isActive = false;
    await product.save();

    res.json({ rejected: true, title: product.title, reason: product.pipeline.rejectionReason });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/products/bulk-approve', async (req, res) => {
  try {
    const { ids, minScore, minMargin } = req.body;
    let filter = { isActive: true, 'pipeline.approved': false };
    if (ids) filter._id = { $in: ids };
    if (minScore) filter['pipeline.researchScore'] = { $gte: minScore };
    if (minMargin) filter.profitMarginPercent = { $gte: minMargin };

    const result = await Product.updateMany(filter, {
      $set: { 'pipeline.approved': true, 'pipeline.approvedAt': new Date() },
    });

    res.json({ approved: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/products/:id/reprice', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Not found' });

    const newCost = req.body.costUsd || product.costUsd;
    const newShipping = req.body.shippingCostUsd || product.shippingCostUsd;
    const pricing = pricingEngine.calculatePrice(newCost, newShipping);

    const oldPrice = product.sellingPriceAud;
    Object.assign(product, pricing);
    if (req.body.costUsd) product.costUsd = newCost;
    if (req.body.shippingCostUsd) product.shippingCostUsd = newShipping;
    await product.save();

    res.json({ repriced: true, oldPrice, newPrice: pricing.sellingPriceAud, profit: pricing.profitAud });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/products/:id/sync-to-shopify', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Not found' });

    const shopifyService = require('../services/ShopifyService');
    const shopifyProduct = await shopifyService.createProduct(product);

    product.shopifyProductId = String(shopifyProduct.id);
    product.shopifyVariantId = String(shopifyProduct.variants?.[0]?.id || '');
    product.shopifyHandle = shopifyProduct.handle;
    product.lastSyncedToShopify = new Date();
    await product.save();

    res.json({ synced: true, shopifyProductId: product.shopifyProductId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════
// ORDER CONTROL
// ═══════════════════════════════════════════════════════

router.get('/orders', async (req, res) => {
  try {
    const { status, limit = 50, sort = '-createdAt' } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const orders = await Order.find(filter).sort(sort).limit(parseInt(limit)).populate('items.productId');
    res.json({ count: orders.length, orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/orders/stats', async (req, res) => {
  try {
    const stats = await orderProcessor.getStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/orders/fraud-queue', async (req, res) => {
  try {
    const flagged = await Order.find({
      'fraud.score': { $gte: 30 },
      'fraud.reviewed': false,
    }).sort({ 'fraud.score': -1 }).limit(50);
    res.json({ count: flagged.length, orders: flagged });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/orders/:id/fulfill', async (req, res) => {
  try {
    const order = await orderProcessor.fulfillOrder(req.params.id, {
      trackingNumber: req.body.trackingNumber,
      trackingUrl: req.body.trackingUrl,
      carrier: req.body.carrier,
    });
    res.json({ fulfilled: true, order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/orders/:id/review-fraud', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Not found' });

    order.fraud.reviewed = true;
    order.fraud.reviewedAt = new Date();
    order.fraud.reviewNote = req.body.note || 'Reviewed by Clawdbot';

    if (req.body.action === 'approve') {
      order.status = 'processing';
    } else if (req.body.action === 'cancel') {
      order.status = 'cancelled';
    }

    await order.save();
    res.json({ reviewed: true, action: req.body.action, orderId: order.shopifyOrderName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/orders/:id/status', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Not found' });

    const oldStatus = order.status;
    order.status = req.body.status;
    order.statusHistory.push({ status: req.body.status, changedAt: new Date(), note: req.body.note || 'Changed by Clawdbot' });
    await order.save();

    res.json({ updated: true, from: oldStatus, to: order.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════════════════

router.get('/analytics/today', async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const orders = await Order.find({ createdAt: { $gte: todayStart } });
    const revenue = orders.reduce((s, o) => s + (o.financials?.totalAud || 0), 0);
    const profit = orders.reduce((s, o) => s + (o.financials?.profitAud || 0), 0);
    const productsListed = await Product.countDocuments({ createdAt: { $gte: todayStart }, shopifyProductId: { $ne: null } });

    res.json({
      orders: orders.length,
      revenue: `$${revenue.toFixed(2)}`,
      profit: `$${profit.toFixed(2)}`,
      margin: revenue > 0 ? `${((profit / revenue) * 100).toFixed(1)}%` : '0%',
      productsListed,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/analytics/history', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const history = await Analytics.find().sort({ date: -1 }).limit(days);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════
// SYSTEM CONTROL
// ═══════════════════════════════════════════════════════

router.get('/system', async (req, res) => {
  try {
    const config = require('../../config');
    const mongoose = require('mongoose');
    const bridgeStatus = await clawdbotBridge.testConnection();

    res.json({
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      mongodb: mongoose.connection.readyState === 1,
      clawdbot: bridgeStatus,
      services: {
        trendScout: { enabled: config.trendScout.enabled },
        competitorScraper: { enabled: config.competitors.scrapeEnabled },
        airtable: { enabled: config.airtable.syncEnabled },
        anthropicAI: { configured: !!config.anthropic.apiKey },
        n8n: { configured: !!config.n8n.webhookBaseUrl },
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/config/pricing', async (req, res) => {
  try {
    const config = require('../../config');
    // Allow Clawdbot to adjust pricing config at runtime
    if (req.body.minProfitAud !== undefined) config.pricing.minProfitAud = parseFloat(req.body.minProfitAud);
    if (req.body.usdToAud !== undefined) config.pricing.usdToAud = parseFloat(req.body.usdToAud);
    if (req.body.freeShippingThreshold !== undefined) config.pricing.freeShippingThreshold = parseFloat(req.body.freeShippingThreshold);

    res.json({ updated: true, pricing: config.pricing });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════
// BULK OPERATIONS
// ═══════════════════════════════════════════════════════

router.post('/bulk/sync-all-to-shopify', async (req, res) => {
  try {
    const shopifyService = require('../services/ShopifyService');
    const products = await Product.find({
      'pipeline.approved': true,
      shopifyProductId: null,
      isActive: true,
    }).limit(req.body.limit || 50);

    let synced = 0;
    const errors = [];
    for (const product of products) {
      try {
        const sp = await shopifyService.createProduct(product);
        product.shopifyProductId = String(sp.id);
        product.shopifyVariantId = String(sp.variants?.[0]?.id || '');
        product.shopifyHandle = sp.handle;
        product.lastSyncedToShopify = new Date();
        await product.save();
        synced++;
      } catch (err) {
        errors.push({ title: product.title, error: err.message });
      }
    }

    res.json({ synced, errors: errors.length, errorDetails: errors });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/bulk/reprice-all', async (req, res) => {
  try {
    const products = await Product.find({ isActive: true, costUsd: { $gt: 0 } });
    let updated = 0;

    for (const product of products) {
      const pricing = pricingEngine.calculatePrice(product.costUsd, product.shippingCostUsd);
      if (Math.abs(pricing.sellingPriceAud - product.sellingPriceAud) > 0.01) {
        Object.assign(product, pricing);
        await product.save();
        updated++;
      }
    }

    res.json({ total: products.length, updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
