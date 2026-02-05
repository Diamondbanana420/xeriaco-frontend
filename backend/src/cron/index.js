const cron = require('node-cron');
const { Product, Order, Analytics, PipelineRun } = require('../models');
const pricingEngine = require('../services/PricingEngine');
const clawdbotBridge = require('../services/ClawdbotBridge');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

function initCronJobs() {
  logger.info('Initializing cron jobs (AEST timezone)');

  // ═══════════════════════════════════════════
  // Daily at midnight AEST (14:00 UTC) — Daily analytics snapshot
  // ═══════════════════════════════════════════
  cron.schedule('0 14 * * *', async () => {
    logger.info('Cron: Generating daily analytics snapshot');
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const endOfDay = new Date(yesterday);
      endOfDay.setHours(23, 59, 59, 999);

      const orders = await Order.find({ createdAt: { $gte: yesterday, $lte: endOfDay } });
      const totalRevenue = orders.reduce((s, o) => s + (o.financials?.totalAud || 0), 0);
      const totalCost = orders.reduce((s, o) => s + (o.financials?.totalCostAud || 0), 0);
      const totalProfit = totalRevenue - totalCost;

      const products = await Product.find({ isActive: true });
      const activeProducts = products.filter(p => p.shopifyStatus === 'active').length;
      const draftProducts = products.filter(p => p.shopifyStatus === 'draft').length;
      const lowStock = products.filter(p => p.inventory?.tracked && p.inventory.quantity <= p.inventory.lowStockThreshold).length;

      const pipelineRuns = await PipelineRun.find({ createdAt: { $gte: yesterday, $lte: endOfDay } });

      const snapshot = new Analytics({
        date: yesterday,
        revenue: {
          totalAud: Math.round(totalRevenue * 100) / 100,
          totalCostAud: Math.round(totalCost * 100) / 100,
          profitAud: Math.round(totalProfit * 100) / 100,
          profitMarginPercent: totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 10000) / 100 : 0,
          avgOrderValueAud: orders.length > 0 ? Math.round((totalRevenue / orders.length) * 100) / 100 : 0,
        },
        orders: {
          total: orders.length,
          newOrders: orders.filter(o => o.status === 'new').length,
          fulfilled: orders.filter(o => ['shipped', 'delivered'].includes(o.status)).length,
          cancelled: orders.filter(o => o.status === 'cancelled').length,
          refunded: orders.filter(o => o.status === 'refunded').length,
        },
        products: {
          totalActive: activeProducts,
          totalDraft: draftProducts,
          newListed: await Product.countDocuments({ lastSyncedToShopify: { $gte: yesterday, $lte: endOfDay } }),
          lowStock,
          outOfStock: products.filter(p => p.inventory?.tracked && p.inventory.quantity === 0).length,
        },
        pipeline: {
          runsCompleted: pipelineRuns.filter(r => r.status === 'completed').length,
          runsFailed: pipelineRuns.filter(r => r.status === 'failed').length,
          productsSourced: pipelineRuns.reduce((s, r) => s + (r.results?.productsListed || 0), 0),
        },
      });

      await snapshot.save();
      await clawdbotBridge.alertDailyReport(snapshot);
      logger.info(`Daily analytics saved for ${yesterday.toISOString().split('T')[0]}`);
    } catch (err) {
      logger.error('Cron: Daily analytics failed', { error: err.message });
    }
  });

  // ═══════════════════════════════════════════
  // Every 6 hours — Low stock check
  // ═══════════════════════════════════════════
  cron.schedule('0 */6 * * *', async () => {
    logger.info('Cron: Low stock check');
    try {
      const lowStock = await Product.find({
        isActive: true,
        'inventory.tracked': true,
        $expr: { $lte: ['$inventory.quantity', '$inventory.lowStockThreshold'] },
      });

      if (lowStock.length > 0) {
        await clawdbotBridge.alertLowStock(lowStock);
        logger.info(`Low stock alert: ${lowStock.length} products`);
      }
    } catch (err) {
      logger.error('Cron: Low stock check failed', { error: err.message });
    }
  });

  // ═══════════════════════════════════════════
  // Every 12 hours — Update USD/AUD exchange rate
  // ═══════════════════════════════════════════
  cron.schedule('0 0,12 * * *', async () => {
    logger.info('Cron: Updating exchange rate');
    try {
      const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD', { timeout: 10000 });
      const rate = response.data?.rates?.AUD;
      if (rate && rate > 1 && rate < 3) { // Sanity check
        pricingEngine.updateExchangeRate(rate);
      }
    } catch (err) {
      logger.warn('Cron: Exchange rate update failed (using cached rate)', { error: err.message });
    }
  });

  // ═══════════════════════════════════════════
  // Every day at 8am AEST (22:00 UTC) — Auto pipeline run
  // ═══════════════════════════════════════════
  cron.schedule('0 22 * * *', async () => {
    logger.info('Cron: Scheduled pipeline run');
    try {
      const active = await PipelineRun.findOne({ status: { $in: ['queued', 'running'] } });
      if (active) {
        logger.info('Cron: Pipeline already running, skipping');
        return;
      }

      const run = new PipelineRun({
        runId: uuidv4(),
        type: 'full',
        status: 'queued',
        triggeredBy: 'cron',
      });
      await run.save();

      // Import executePipeline (circular dep safe because this runs after boot)
      const { executePipeline } = require('../routes/pipeline');
      await executePipeline(run);
    } catch (err) {
      logger.error('Cron: Scheduled pipeline failed', { error: err.message });
    }
  });

  // ═══════════════════════════════════════════
  // Stale order check — every 12 hours
  // ═══════════════════════════════════════════
  cron.schedule('0 2,14 * * *', async () => {
    logger.info('Cron: Stale order check');
    try {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const staleOrders = await Order.find({
        status: 'new',
        createdAt: { $lte: twoDaysAgo },
      });

      if (staleOrders.length > 0) {
        for (const order of staleOrders) {
          order.tags.push('stale');
          await order.save();
        }
        await clawdbotBridge.sendAlert('stale_orders', {
          count: staleOrders.length,
          orders: staleOrders.map(o => o.shopifyOrderName),
        });
      }
    } catch (err) {
      logger.error('Cron: Stale order check failed', { error: err.message });
    }
  });

  // ═══════════════════════════════════════════
  // Every 12 hours — Competitor price scanning
  // ═══════════════════════════════════════════
  cron.schedule('0 3,15 * * *', async () => {
    logger.info('Cron: Competitor price scan');
    try {
      const competitorScraper = require('../services/CompetitorScraper');
      const results = await competitorScraper.runBulkScan({ limit: 20 });
      logger.info(`Cron: Competitor scan — ${results.scanned} scanned, ${results.adjusted} adjusted`);
    } catch (err) {
      logger.error('Cron: Competitor scan failed', { error: err.message });
    }
  });

  // ═══════════════════════════════════════════
  // Every 4 hours — Airtable two-way sync
  // ═══════════════════════════════════════════
  cron.schedule('0 */4 * * *', async () => {
    logger.info('Cron: Airtable sync');
    try {
      const airtableSync = require('../services/AirtableSync');
      await airtableSync.bulkSyncProducts(50);
      await airtableSync.bulkSyncOrders(50);
      await airtableSync.pullProductUpdatesFromAirtable();
      logger.info('Cron: Airtable sync complete');
    } catch (err) {
      logger.error('Cron: Airtable sync failed', { error: err.message });
    }
  });

  // ═══════════════════════════════════════════
  // Every 6 hours — AI content enrichment
  // ═══════════════════════════════════════════
  cron.schedule('0 1,7,13,19 * * *', async () => {
    logger.info('Cron: AI content enrichment');
    try {
      const aiContent = require('../services/AIContentGenerator');
      const results = await aiContent.bulkEnrich(10);
      logger.info(`Cron: AI enrichment — ${results.enriched} products enriched`);
    } catch (err) {
      logger.error('Cron: AI enrichment failed', { error: err.message });
    }
  });

  logger.info('All cron jobs initialized');
}

module.exports = { initCronJobs };
