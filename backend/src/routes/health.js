const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const shopifyService = require('../services/ShopifyService');
const config = require('../../config');

// GET /api/health
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'xeriaco-backend',
    version: '3.0.0',
    platform: process.env.RAILWAY_PUBLIC_DOMAIN ? 'railway' : 'local',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// GET /api/system-info
router.get('/system-info', async (req, res) => {
  try {
    const shopifyStatus = await shopifyService.testConnection();
    const mongoStatus = mongoose.connection.readyState === 1;

    // Lazy-load optional services
    let airtableStatus = { connected: false, reason: 'not loaded' };
    try {
      const airtableSync = require('../services/AirtableSync');
      airtableStatus = await airtableSync.testConnection();
    } catch (e) { /* optional */ }

    res.json({
      environment: config.env,
      services: {
        mongodb: { connected: mongoStatus },
        shopify: shopifyStatus,
        airtable: airtableStatus,
        clawdbot: { configured: !!config.clawdbot.webhookUrl },
        n8n: { configured: !!config.n8n.webhookBaseUrl },
        anthropicAI: { configured: !!config.anthropic.apiKey },
        trendScout: { enabled: config.trendScout.enabled },
        competitorScraper: { enabled: config.competitors.scrapeEnabled },
      },
      config: {
        defaultMarkup: config.pricing.defaultMarkup + '%',
        minProfit: '$' + config.pricing.minProfitAud + ' AUD',
        exchangeRate: config.pricing.usdToAud,
        maxProductsPerRun: config.pipeline.maxProductsPerRun,
        defaultProductStatus: config.pipeline.defaultProductStatus,
        frontendUrl: process.env.FRONTEND_URL || 'not set',
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
