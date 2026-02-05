const express = require('express');
const router = express.Router();
const { PipelineRun, Product } = require('../models');
const pricingEngine = require('../services/PricingEngine');
const shopifyService = require('../services/ShopifyService');
const clawdbotBridge = require('../services/ClawdbotBridge');
const trendScout = require('../services/TrendScout');
const supplierSourcer = require('../services/SupplierSourcer');
const aiContent = require('../services/AIContentGenerator');
const competitorScraper = require('../services/CompetitorScraper');
const airtableSync = require('../services/AirtableSync');
const n8nIntegration = require('../services/N8nIntegration');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

// GET /api/pipeline/status — Current pipeline status
router.get('/status', async (req, res) => {
  try {
    const activeRun = await PipelineRun.findOne({ status: { $in: ['queued', 'running'] } }).sort({ createdAt: -1 });
    const lastCompleted = await PipelineRun.findOne({ status: 'completed' }).sort({ completedAt: -1 });

    res.json({
      isRunning: !!activeRun,
      activeRun: activeRun || null,
      lastCompleted: lastCompleted ? {
        runId: lastCompleted.runId,
        type: lastCompleted.type,
        completedAt: lastCompleted.completedAt,
        results: lastCompleted.results,
        duration: `${Math.round(lastCompleted.durationMs / 1000)}s`,
      } : null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/pipeline/history
router.get('/history', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [runs, total] = await Promise.all([
      PipelineRun.find().sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      PipelineRun.countDocuments(),
    ]);
    res.json({ runs, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/pipeline/run — Trigger a manual pipeline run
router.post('/run', async (req, res) => {
  try {
    const { type = 'full' } = req.body;

    // Check for already running
    const active = await PipelineRun.findOne({ status: { $in: ['queued', 'running'] } });
    if (active) {
      return res.status(409).json({ error: 'Pipeline already running', runId: active.runId });
    }

    const run = new PipelineRun({
      runId: uuidv4(),
      type,
      status: 'running',
      startedAt: new Date(),
      triggeredBy: 'manual',
    });
    await run.save();

    // Run in background
    executePipeline(run).catch(err => {
      logger.error(`Pipeline run failed: ${err.message}`, { runId: run.runId });
    });

    res.json({ message: 'Pipeline started', runId: run.runId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/pipeline/price-update — Recalculate all product prices
router.post('/price-update', async (req, res) => {
  try {
    const products = await Product.find({ isActive: true });
    let updated = 0;

    for (const product of products) {
      const pricing = pricingEngine.calculatePrice(product.costUsd, product.shippingCostUsd);
      const oldPrice = product.sellingPriceAud;

      product.sellingPriceAud = pricing.sellingPriceAud;
      product.comparePriceAud = pricing.comparePriceAud;
      product.profitAud = pricing.profitAud;
      product.profitMarginPercent = pricing.profitMarginPercent;
      product.markupPercent = pricing.markupPercent;
      await product.save();

      // Update Shopify if synced and price changed
      if (product.shopifyVariantId && Math.abs(oldPrice - pricing.sellingPriceAud) > 0.01) {
        try {
          await shopifyService.updateVariantPrice(product.shopifyVariantId, pricing.sellingPriceAud, pricing.comparePriceAud);
        } catch (err) {
          logger.warn(`Failed to update Shopify price for ${product.title}: ${err.message}`);
        }
      }
      updated++;
    }

    res.json({ updated, total: products.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Background pipeline execution — FULL AUTONOMOUS PIPELINE
 * Discovery → Supplier Sourcing → AI Content → Pricing → Validation → Shopify Listing → Airtable Sync
 */
async function executePipeline(run) {
  const startTime = Date.now();
  try {
    run.status = 'running';
    run.startedAt = new Date();
    run.logs.push({ level: 'info', message: 'Pipeline started', timestamp: new Date() });
    await run.save();

    // ════════════════════════════════════
    // Stage 1: TREND DISCOVERY
    // ════════════════════════════════════
    run.logs.push({ level: 'info', message: 'Stage 1: TrendScout — discovering products', timestamp: new Date() });
    await run.save();

    let discoveryResults = { discovered: 0, saved: 0, products: [] };
    try {
      discoveryResults = await trendScout.discoverProducts();
    } catch (err) {
      run.results.errors.push({ stage: 'trendscout', message: err.message, timestamp: new Date() });
      logger.warn(`Pipeline Stage 1 error: ${err.message}`);
    }
    run.results.productsDiscovered = discoveryResults.saved;
    run.logs.push({ level: 'info', message: `Stage 1 complete: ${discoveryResults.discovered} found, ${discoveryResults.saved} saved`, timestamp: new Date() });
    await run.save();

    // ════════════════════════════════════
    // Stage 2: SUPPLIER SOURCING
    // ════════════════════════════════════
    run.logs.push({ level: 'info', message: 'Stage 2: Supplier sourcing', timestamp: new Date() });
    await run.save();

    let sourcingResults = { sourced: 0 };
    try {
      sourcingResults = await supplierSourcer.autoSourceProducts(run.config?.maxProducts || 20);
    } catch (err) {
      run.results.errors.push({ stage: 'supplier_sourcing', message: err.message, timestamp: new Date() });
    }
    run.logs.push({ level: 'info', message: `Stage 2 complete: ${sourcingResults.sourced} products sourced`, timestamp: new Date() });
    await run.save();

    // ════════════════════════════════════
    // Stage 3: AI CONTENT GENERATION
    // ════════════════════════════════════
    run.logs.push({ level: 'info', message: 'Stage 3: AI content generation', timestamp: new Date() });
    await run.save();

    let contentResults = { enriched: 0 };
    try {
      contentResults = await aiContent.bulkEnrich(run.config?.maxProducts || 15);
    } catch (err) {
      run.results.errors.push({ stage: 'ai_content', message: err.message, timestamp: new Date() });
    }
    run.logs.push({ level: 'info', message: `Stage 3 complete: ${contentResults.enriched} products enriched with AI content`, timestamp: new Date() });
    await run.save();

    // ════════════════════════════════════
    // Stage 4: VALIDATION & SCORING
    // ════════════════════════════════════
    run.logs.push({ level: 'info', message: 'Stage 4: Validation & auto-approval', timestamp: new Date() });
    await run.save();

    const candidates = await Product.find({
      'pipeline.approved': false,
      'pipeline.rejectionReason': '',
      isActive: true,
      costUsd: { $gt: 0 },
    }).limit(run.config?.maxProducts || 50);

    let validated = 0;
    let rejected = 0;

    for (const product of candidates) {
      // Must have cost data
      if (product.costUsd <= 0) {
        product.pipeline.rejectionReason = 'No cost data';
        await product.save();
        rejected++;
        continue;
      }
      // Must have minimum profit
      if (product.profitMarginPercent < 20) {
        product.pipeline.rejectionReason = `Low margin: ${product.profitMarginPercent.toFixed(1)}%`;
        await product.save();
        rejected++;
        continue;
      }
      // Must have supplier
      if (!product.supplier?.url) {
        product.pipeline.rejectionReason = 'No supplier found';
        await product.save();
        rejected++;
        continue;
      }

      // Auto-approve if score >= threshold
      if (product.pipeline.researchScore >= 50 || product.profitMarginPercent >= 35) {
        product.pipeline.approved = true;
        product.pipeline.approvedAt = new Date();
        product.pipeline.runId = run.runId;
        await product.save();
        validated++;
      } else {
        rejected++;
      }
    }

    run.results.productsValidated = validated;
    run.results.productsRejected = rejected;
    run.logs.push({ level: 'info', message: `Stage 4 complete: ${validated} approved, ${rejected} rejected`, timestamp: new Date() });
    await run.save();

    // ════════════════════════════════════
    // Stage 5: SHOPIFY LISTING
    // ════════════════════════════════════
    run.logs.push({ level: 'info', message: 'Stage 5: Listing to Shopify', timestamp: new Date() });
    await run.save();

    const approved = await Product.find({
      'pipeline.approved': true,
      shopifyProductId: null,
      isActive: true,
      'pipeline.runId': run.runId,
    });

    let listed = 0;
    for (const product of approved) {
      try {
        const shopifyProduct = await shopifyService.createProduct(product);
        product.shopifyProductId = String(shopifyProduct.id);
        product.shopifyVariantId = String(shopifyProduct.variants?.[0]?.id || '');
        product.shopifyHandle = shopifyProduct.handle;
        product.lastSyncedToShopify = new Date();
        await product.save();
        listed++;
      } catch (err) {
        run.results.errors.push({ stage: 'shopify_listing', message: `${product.title}: ${err.message}`, timestamp: new Date() });
      }
    }
    run.results.productsListed = listed;
    run.logs.push({ level: 'info', message: `Stage 5 complete: ${listed} products listed on Shopify`, timestamp: new Date() });
    await run.save();

    // ════════════════════════════════════
    // Stage 6: AIRTABLE SYNC
    // ════════════════════════════════════
    run.logs.push({ level: 'info', message: 'Stage 6: Syncing to Airtable', timestamp: new Date() });
    await run.save();

    try {
      await airtableSync.bulkSyncProducts(50);
    } catch (err) {
      run.results.errors.push({ stage: 'airtable_sync', message: err.message, timestamp: new Date() });
    }

    // ════════════════════════════════════
    // COMPLETE
    // ════════════════════════════════════
    run.status = 'completed';
    run.completedAt = new Date();
    run.durationMs = Date.now() - startTime;
    run.logs.push({ level: 'info', message: `Pipeline completed in ${Math.round(run.durationMs / 1000)}s`, timestamp: new Date() });
    await run.save();

    // Notify everyone
    await clawdbotBridge.alertPipelineComplete(run);
    await n8nIntegration.triggerPipelineComplete(run);

    logger.info(`Pipeline ${run.runId} complete: discovered=${discoveryResults.saved} sourced=${sourcingResults.sourced} content=${contentResults.enriched} validated=${validated} listed=${listed}`);
  } catch (err) {
    run.status = 'failed';
    run.completedAt = new Date();
    run.durationMs = Date.now() - startTime;
    run.results.errors.push({ stage: 'fatal', message: err.message, timestamp: new Date() });
    run.logs.push({ level: 'error', message: err.message, timestamp: new Date() });
    await run.save();

    await clawdbotBridge.alertPipelineError(run, err);
    logger.error(`Pipeline ${run.runId} failed: ${err.message}`);
  }
}

module.exports = router;
module.exports.executePipeline = executePipeline;

// Additional routes for individual services

// POST /api/pipeline/trend-scout — Run trend discovery only
router.post('/trend-scout', async (req, res) => {
  try {
    const results = await trendScout.discoverProducts();
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/pipeline/competitor-scan — Run competitor scan
router.post('/competitor-scan', async (req, res) => {
  try {
    const results = await competitorScraper.runBulkScan({ limit: req.body.limit || 20 });
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/pipeline/ai-enrich — Run AI content enrichment
router.post('/ai-enrich', async (req, res) => {
  try {
    const results = await aiContent.bulkEnrich(req.body.limit || 10);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/pipeline/supplier-source — Auto-source suppliers
router.post('/supplier-source', async (req, res) => {
  try {
    const results = await supplierSourcer.autoSourceProducts(req.body.limit || 10);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/pipeline/airtable-sync — Manual Airtable sync
router.post('/airtable-sync', async (req, res) => {
  try {
    const [products, orders, pull] = await Promise.allSettled([
      airtableSync.bulkSyncProducts(req.body.limit || 50),
      airtableSync.bulkSyncOrders(req.body.limit || 50),
      airtableSync.pullProductUpdatesFromAirtable(),
    ]);
    res.json({
      productsPushed: products.value || products.reason?.message,
      ordersPushed: orders.value || orders.reason?.message,
      productsPulled: pull.value || pull.reason?.message,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/pipeline/airtable-status — Airtable connection status
router.get('/airtable-status', async (req, res) => {
  try {
    const status = await airtableSync.testConnection();
    res.json(status);
  } catch (err) {
    res.json({ connected: false, error: err.message });
  }
});
