const axios = require('axios');
const config = require('../../config');
const logger = require('../utils/logger');

class N8nIntegration {
  constructor() {
    this.baseUrl = config.n8n.webhookBaseUrl;
    this.apiKey = config.n8n.apiKey;
    this.workflows = config.n8n.workflows;
    this.enabled = !!this.baseUrl;
  }

  async triggerWebhook(webhookPath, data) {
    if (!this.enabled) {
      logger.debug('n8n: Integration disabled — skipping webhook');
      return null;
    }

    const url = webhookPath.startsWith('http') ? webhookPath : `${this.baseUrl}/${webhookPath}`;

    try {
      const res = await axios.post(url, {
        ...data,
        source: 'xeriaco-backend',
        timestamp: new Date().toISOString(),
      }, {
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { 'X-API-Key': this.apiKey } : {}),
        },
        timeout: 10000,
      });
      logger.info(`n8n: Webhook triggered — ${webhookPath}`);
      return res.data;
    } catch (err) {
      logger.warn(`n8n: Webhook failed — ${webhookPath}: ${err.message}`);
      return null;
    }
  }

  // Pre-built triggers
  async triggerNewOrder(order) {
    if (!this.workflows.newOrder) return null;
    return this.triggerWebhook(this.workflows.newOrder, {
      event: 'new_order',
      orderId: order.shopifyOrderName,
      total: order.financials?.totalAud,
      profit: order.financials?.profitAud,
      customer: order.customer?.email,
      items: order.items?.length,
      fraudScore: order.fraud?.score,
    });
  }

  async triggerPipelineComplete(run) {
    if (!this.workflows.pipelineComplete) return null;
    return this.triggerWebhook(this.workflows.pipelineComplete, {
      event: 'pipeline_complete',
      runId: run.runId,
      type: run.type,
      discovered: run.results?.productsDiscovered,
      listed: run.results?.productsListed,
      duration: run.durationMs,
    });
  }

  async triggerLowStock(products) {
    if (!this.workflows.lowStock) return null;
    return this.triggerWebhook(this.workflows.lowStock, {
      event: 'low_stock',
      count: products.length,
      products: products.slice(0, 10).map(p => ({
        title: p.title,
        remaining: p.inventory?.quantity,
      })),
    });
  }

  async triggerSupplierOrder(order, product) {
    if (!this.workflows.supplierOrder) return null;
    return this.triggerWebhook(this.workflows.supplierOrder, {
      event: 'supplier_order_needed',
      orderId: order.shopifyOrderName,
      product: {
        title: product.title,
        supplierUrl: product.supplier?.url,
        supplierPlatform: product.supplier?.platform,
        costUsd: product.costUsd,
      },
      shippingAddress: {
        name: `${order.customer?.firstName} ${order.customer?.lastName}`,
        country: order.customer?.country,
      },
    });
  }
}

module.exports = new N8nIntegration();
