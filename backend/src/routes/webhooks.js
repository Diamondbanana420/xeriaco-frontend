const express = require('express');
const router = express.Router();
const ShopifyService = require('../services/ShopifyService');
const orderProcessor = require('../services/OrderProcessor');
const { Product, Order } = require('../models');
const logger = require('../utils/logger');
const config = require('../../config');

/**
 * Middleware to verify Shopify webhook HMAC
 * Must use raw body — applied in server.js before JSON parsing
 */
const verifyHmac = (req, res, next) => {
  const hmac = req.headers['x-shopify-hmac-sha256'];
  if (!hmac) {
    logger.warn('Webhook missing HMAC header');
    return res.status(401).json({ error: 'Missing HMAC' });
  }

  if (!req.rawBody) {
    logger.warn('Webhook missing raw body for HMAC verification');
    return res.status(400).json({ error: 'Cannot verify HMAC' });
  }

  const isValid = ShopifyService.constructor.prototype.constructor.verifyWebhookHmac
    ? require('../services/ShopifyService').constructor.verifyWebhookHmac(req.rawBody, hmac, config.shopify.webhookSecret)
    : true; // Skip if method not available

  // Actually use the static method
  const crypto = require('crypto');
  const hash = crypto
    .createHmac('sha256', config.shopify.webhookSecret)
    .update(req.rawBody, 'utf8')
    .digest('base64');

  if (hash !== hmac) {
    logger.warn('Webhook HMAC verification failed');
    return res.status(401).json({ error: 'Invalid HMAC' });
  }

  next();
};

// POST /api/webhooks/shopify/orders/create
router.post('/orders/create', verifyHmac, async (req, res) => {
  try {
    const shopifyOrder = req.body;
    logger.info(`Webhook: orders/create — ${shopifyOrder.name}`);
    await orderProcessor.processNewOrder(shopifyOrder);
    res.status(200).json({ received: true });
  } catch (err) {
    logger.error('Webhook orders/create error', { error: err.message });
    res.status(200).json({ received: true, error: err.message }); // Always 200 to prevent Shopify retries
  }
});

// POST /api/webhooks/shopify/orders/updated
router.post('/orders/updated', verifyHmac, async (req, res) => {
  try {
    const shopifyOrder = req.body;
    const order = await Order.findOne({ shopifyOrderId: String(shopifyOrder.id) });
    if (order) {
      // Update financials
      order.shopifyUpdatedAt = shopifyOrder.updated_at;
      if (shopifyOrder.financial_status === 'refunded') {
        order.status = 'refunded';
        order.statusHistory.push({ status: 'refunded', changedAt: new Date(), note: 'Refunded via Shopify' });
      }
      if (shopifyOrder.cancelled_at) {
        order.status = 'cancelled';
        order.statusHistory.push({ status: 'cancelled', changedAt: new Date(), note: 'Cancelled via Shopify' });
      }
      await order.save();
    }
    res.status(200).json({ received: true });
  } catch (err) {
    logger.error('Webhook orders/updated error', { error: err.message });
    res.status(200).json({ received: true });
  }
});

// POST /api/webhooks/shopify/products/update
router.post('/products/update', verifyHmac, async (req, res) => {
  try {
    const shopifyProduct = req.body;
    const product = await Product.findOne({ shopifyProductId: String(shopifyProduct.id) });
    if (product) {
      product.shopifyStatus = shopifyProduct.status;
      product.shopifyHandle = shopifyProduct.handle;
      await product.save();
      logger.info(`Product updated from Shopify: ${product.title}`);
    }
    res.status(200).json({ received: true });
  } catch (err) {
    logger.error('Webhook products/update error', { error: err.message });
    res.status(200).json({ received: true });
  }
});

// POST /api/webhooks/shopify/app/uninstalled
router.post('/app/uninstalled', verifyHmac, async (req, res) => {
  logger.warn('Shopify app uninstalled webhook received!');
  res.status(200).json({ received: true });
});

module.exports = router;
