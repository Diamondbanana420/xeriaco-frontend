const axios = require('axios');
const config = require('../../config');
const logger = require('../utils/logger');

/**
 * ClawdbotBridge v2 — Full Control Hub
 *
 * Two-way bridge between the XeriaCO backend and Clawdbot Discord bot.
 * Clawdbot has direct access to Shopify, so ALL Shopify operations
 * go through Clawdbot instead of calling Shopify API directly.
 *
 * Direction 1: Backend → Clawdbot (webhook POST)
 *   Sends Shopify commands, alerts, and task requests to Clawdbot
 *   Clawdbot executes them via its Shopify access and responds
 *
 * Direction 2: Clawdbot → Backend (REST API)
 *   Clawdbot calls backend /api/admin/* endpoints to control everything:
 *   run pipelines, approve products, check stats, manage orders, etc.
 */

class ClawdbotBridge {
  constructor() {
    this.webhookUrl = config.clawdbot.webhookUrl;
    this.apiKey = config.clawdbot.apiKey;
    this.discordChannelId = config.clawdbot.discordChannelId || '1467990957629640850';
    this.enabled = !!this.webhookUrl;

    // Task queue for tracking pending Shopify commands
    this.pendingTasks = new Map();
    this.taskTimeout = 60000; // 60s timeout for Shopify responses
  }

  // ═══════════════════════════════════════════════════════
  // CORE: Send command to Clawdbot
  // ═══════════════════════════════════════════════════════

  /**
   * Send a command/alert to Clawdbot via webhook
   * @param {string} type - Command type
   * @param {object} data - Payload
   * @param {boolean} awaitResponse - If true, wait for Clawdbot to respond via callback
   * @returns {object|null} Response data or null
   */
  async sendCommand(type, data, awaitResponse = false) {
    if (!this.enabled) {
      logger.debug(`Clawdbot bridge disabled — skipping ${type}`);
      return null;
    }

    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    const payload = {
      taskId,
      type,
      timestamp: new Date().toISOString(),
      source: 'xeriaco-backend',
      channelId: this.discordChannelId,
      data,
      callbackUrl: awaitResponse ? `${config.backendUrl || ''}/api/admin/callback` : null,
    };

    try {
      const response = await axios.post(this.webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        timeout: 15000,
      });
      logger.info(`Clawdbot command sent: ${type} (${taskId})`);

      if (awaitResponse) {
        return this.waitForResponse(taskId);
      }

      return response.data;
    } catch (err) {
      logger.warn(`Clawdbot command failed: ${type} — ${err.message}`);
      return null;
    }
  }

  /**
   * Wait for Clawdbot to call back with a result
   */
  waitForResponse(taskId) {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.pendingTasks.delete(taskId);
        logger.warn(`Clawdbot task timed out: ${taskId}`);
        resolve(null);
      }, this.taskTimeout);

      this.pendingTasks.set(taskId, { resolve, timeout });
    });
  }

  /**
   * Called when Clawdbot sends a callback response
   */
  resolveTask(taskId, result) {
    const pending = this.pendingTasks.get(taskId);
    if (pending) {
      clearTimeout(pending.timeout);
      pending.resolve(result);
      this.pendingTasks.delete(taskId);
      logger.info(`Clawdbot task resolved: ${taskId}`);
    }
  }

  // ═══════════════════════════════════════════════════════
  // SHOPIFY PROXY — all Shopify ops go through Clawdbot
  // ═══════════════════════════════════════════════════════

  async shopifyCreateProduct(productData) {
    return this.sendCommand('shopify_create_product', {
      title: productData.title,
      body_html: productData.descriptionHtml || productData.description || '',
      vendor: productData.vendor || 'XeriaCO',
      product_type: productData.productType || '',
      tags: (productData.tags || []).join(', '),
      status: productData.shopifyStatus || config.pipeline.defaultProductStatus,
      price: String(productData.sellingPriceAud || 0),
      compare_at_price: productData.comparePriceAud ? String(productData.comparePriceAud) : null,
      sku: productData.sku || '',
      inventory_quantity: productData.inventory?.quantity || 0,
      images: (productData.images || []).map(img => ({ src: img.src, alt: img.alt || '' })),
      cost_usd: productData.costUsd || 0,
      supplier_platform: productData.supplier?.platform || 'unknown',
    }, true);
  }

  async shopifyUpdateProduct(shopifyProductId, updates) {
    return this.sendCommand('shopify_update_product', {
      productId: shopifyProductId,
      updates,
    }, true);
  }

  async shopifyGetProduct(shopifyProductId) {
    return this.sendCommand('shopify_get_product', {
      productId: shopifyProductId,
    }, true);
  }

  async shopifyListProducts(params = {}) {
    return this.sendCommand('shopify_list_products', { params }, true);
  }

  async shopifyDeleteProduct(shopifyProductId) {
    return this.sendCommand('shopify_delete_product', {
      productId: shopifyProductId,
    }, true);
  }

  async shopifyUpdatePrice(variantId, price, compareAtPrice = null) {
    return this.sendCommand('shopify_update_price', {
      variantId,
      price: String(price),
      compare_at_price: compareAtPrice ? String(compareAtPrice) : null,
    }, true);
  }

  async shopifyCreateFulfillment(orderId, trackingInfo) {
    return this.sendCommand('shopify_create_fulfillment', {
      orderId,
      trackingNumber: trackingInfo.trackingNumber || '',
      trackingUrl: trackingInfo.trackingUrl || '',
      carrier: trackingInfo.carrier || '',
      notifyCustomer: true,
    }, true);
  }

  async shopifyGetOrders(params = {}) {
    return this.sendCommand('shopify_get_orders', { params }, true);
  }

  async shopifyGetOrder(orderId) {
    return this.sendCommand('shopify_get_order', { orderId }, true);
  }

  async shopifySetInventory(locationId, inventoryItemId, available) {
    return this.sendCommand('shopify_set_inventory', {
      locationId, inventoryItemId, available,
    }, true);
  }

  async shopifyGetShopInfo() {
    return this.sendCommand('shopify_get_shop_info', {}, true);
  }

  async shopifyRegisterWebhook(topic, address) {
    return this.sendCommand('shopify_register_webhook', {
      topic, address,
    }, true);
  }

  async shopifyGetProductCount() {
    return this.sendCommand('shopify_get_product_count', {}, true);
  }

  // ═══════════════════════════════════════════════════════
  // ALERTS — fire-and-forget notifications to Discord
  // ═══════════════════════════════════════════════════════

  async sendAlert(type, data) {
    return this.sendCommand(`alert_${type}`, data, false);
  }

  async alertNewOrder(order) {
    return this.sendAlert('new_order', {
      orderId: order.shopifyOrderName || order.shopifyOrderId,
      total: `$${order.financials?.totalAud?.toFixed(2)} AUD`,
      profit: `$${order.financials?.profitAud?.toFixed(2)} AUD`,
      items: order.items?.length || 0,
      customer: order.customer?.firstName || 'Unknown',
      fraudScore: order.fraud?.score || 0,
    });
  }

  async alertHighFraudOrder(order) {
    return this.sendAlert('high_fraud_order', {
      orderId: order.shopifyOrderName || order.shopifyOrderId,
      fraudScore: order.fraud?.score,
      flags: order.fraud?.flags,
      total: `$${order.financials?.totalAud?.toFixed(2)} AUD`,
      customer: `${order.customer?.firstName} ${order.customer?.lastName}`,
      email: order.customer?.email,
      action: 'MANUAL REVIEW REQUIRED',
    });
  }

  async alertPipelineComplete(run) {
    return this.sendAlert('pipeline_complete', {
      runId: run.runId,
      type: run.type,
      duration: `${Math.round(run.durationMs / 1000)}s`,
      discovered: run.results?.productsDiscovered || 0,
      validated: run.results?.productsValidated || 0,
      listed: run.results?.productsListed || 0,
      rejected: run.results?.productsRejected || 0,
      errors: run.results?.errors?.length || 0,
    });
  }

  async alertPipelineError(run, error) {
    return this.sendAlert('pipeline_error', {
      runId: run.runId,
      type: run.type,
      error: error.message || String(error),
      stage: error.stage || 'unknown',
    });
  }

  async alertLowStock(products) {
    return this.sendAlert('low_stock', {
      count: products.length,
      products: products.slice(0, 10).map(p => ({
        title: p.title,
        remaining: p.inventory?.quantity || 0,
        threshold: p.inventory?.lowStockThreshold || 10,
      })),
    });
  }

  async alertDailyReport(analytics) {
    return this.sendAlert('daily_report', {
      date: analytics.date,
      revenue: `$${analytics.revenue?.totalAud?.toFixed(2)} AUD`,
      profit: `$${analytics.revenue?.profitAud?.toFixed(2)} AUD`,
      margin: `${analytics.revenue?.profitMarginPercent?.toFixed(1)}%`,
      orders: analytics.orders?.total || 0,
      newProducts: analytics.products?.newListed || 0,
      pipelineRuns: analytics.pipeline?.runsCompleted || 0,
    });
  }

  async alertPriceChange(product, oldPrice, newPrice) {
    return this.sendAlert('price_change', {
      title: product.title,
      oldPrice: `$${oldPrice.toFixed(2)} AUD`,
      newPrice: `$${newPrice.toFixed(2)} AUD`,
      reason: 'competitor_adjustment',
    });
  }

  // ═══════════════════════════════════════════════════════
  // CONNECTION TEST
  // ═══════════════════════════════════════════════════════

  async testConnection() {
    if (!this.enabled) return { connected: false, reason: 'Webhook URL not configured' };
    try {
      const res = await axios.post(this.webhookUrl, {
        type: 'ping',
        timestamp: new Date().toISOString(),
        source: 'xeriaco-backend',
      }, {
        headers: { 'Content-Type': 'application/json', 'X-API-Key': this.apiKey },
        timeout: 10000,
      });
      return { connected: true, status: res.status };
    } catch (err) {
      return { connected: false, error: err.message };
    }
  }
}

module.exports = new ClawdbotBridge();
