const express = require('express');
const router = express.Router();
const shopifyService = require('../services/ShopifyService');

// GET /api/shopify/status
router.get('/status', async (req, res) => {
  try {
    const status = await shopifyService.testConnection();
    res.json(status);
  } catch (err) {
    res.json({ connected: false, error: err.message });
  }
});

// GET /api/shopify/products — Proxy to Shopify product list
router.get('/products', async (req, res) => {
  try {
    const products = await shopifyService.listProducts(req.query);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/shopify/product-count
router.get('/product-count', async (req, res) => {
  try {
    const count = await shopifyService.getProductCount();
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/shopify/register-webhooks — Set up all required webhooks
router.post('/register-webhooks', async (req, res) => {
  try {
    const { backendUrl } = req.body;
    if (!backendUrl) return res.status(400).json({ error: 'backendUrl is required' });

    const webhooks = [
      { topic: 'orders/create', address: `${backendUrl}/api/webhooks/shopify/orders/create` },
      { topic: 'orders/updated', address: `${backendUrl}/api/webhooks/shopify/orders/updated` },
      { topic: 'products/update', address: `${backendUrl}/api/webhooks/shopify/products/update` },
      { topic: 'app/uninstalled', address: `${backendUrl}/api/webhooks/shopify/app/uninstalled` },
    ];

    const results = [];
    for (const wh of webhooks) {
      const result = await shopifyService.registerWebhook(wh.topic, wh.address);
      results.push({ topic: wh.topic, success: true, id: result?.id || 'already exists' });
    }

    res.json({ registered: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
