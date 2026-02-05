const config = require('../../config');
const logger = require('../utils/logger');

/**
 * ShopifyService — Clawdbot Proxy
 *
 * This maintains the EXACT same interface as the old direct Shopify API service,
 * but routes ALL operations through the ClawdbotBridge instead.
 *
 * Clawdbot has direct Shopify access via its Discord integration.
 * The backend sends structured commands → Clawdbot executes them on Shopify → returns results.
 *
 * All existing code that calls shopifyService.createProduct(), .getOrder(), etc.
 * continues to work identically — the transport layer changed, not the API.
 */

class ShopifyService {
  constructor() {
    // Lazy-load to avoid circular dependency
    this._bridge = null;
  }

  get bridge() {
    if (!this._bridge) {
      this._bridge = require('./ClawdbotBridge');
    }
    return this._bridge;
  }

  // ═══════════════════════════════════════
  // PRODUCTS — proxied through Clawdbot
  // ═══════════════════════════════════════

  async createProduct(productData) {
    logger.info(`ShopifyProxy: Creating product "${productData.title}" via Clawdbot`);
    const result = await this.bridge.shopifyCreateProduct(productData);
    if (result?.product) {
      logger.info(`ShopifyProxy: Created product ${result.product.id}`);
      return result.product;
    }
    // If Clawdbot returned flat data (not wrapped in .product)
    if (result?.id) return result;

    // If no response (timeout), return a placeholder so pipeline doesn't crash
    logger.warn(`ShopifyProxy: No response from Clawdbot for createProduct — product may still have been created`);
    return {
      id: `pending_${Date.now()}`,
      title: productData.title,
      handle: productData.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      variants: [{ id: `pending_variant_${Date.now()}` }],
      _pendingSync: true,
    };
  }

  async updateProduct(shopifyProductId, updates) {
    logger.info(`ShopifyProxy: Updating product ${shopifyProductId} via Clawdbot`);
    const result = await this.bridge.shopifyUpdateProduct(shopifyProductId, updates);
    return result?.product || result || null;
  }

  async getProduct(shopifyProductId) {
    const result = await this.bridge.shopifyGetProduct(shopifyProductId);
    return result?.product || result || null;
  }

  async listProducts(params = {}) {
    const result = await this.bridge.shopifyListProducts(params);
    return result?.products || result || [];
  }

  async getProductCount() {
    const result = await this.bridge.shopifyGetProductCount();
    return result?.count ?? result ?? 0;
  }

  async deleteProduct(shopifyProductId) {
    logger.info(`ShopifyProxy: Deleting product ${shopifyProductId} via Clawdbot`);
    return this.bridge.shopifyDeleteProduct(shopifyProductId);
  }

  async updateVariantPrice(variantId, price, compareAtPrice = null) {
    logger.info(`ShopifyProxy: Updating variant ${variantId} price to $${price} via Clawdbot`);
    const result = await this.bridge.shopifyUpdatePrice(variantId, price, compareAtPrice);
    return result?.variant || result || null;
  }

  // ═══════════════════════════════════════
  // ORDERS — proxied through Clawdbot
  // ═══════════════════════════════════════

  async listOrders(params = {}) {
    const result = await this.bridge.shopifyGetOrders(params);
    return result?.orders || result || [];
  }

  async getOrder(orderId) {
    const result = await this.bridge.shopifyGetOrder(orderId);
    return result?.order || result || null;
  }

  async getOrderCount(status = 'any') {
    const result = await this.bridge.shopifyGetOrders({ status, limit: 1 });
    // If Clawdbot returns count, use it; otherwise estimate from results
    return result?.count ?? (result?.orders?.length || 0);
  }

  async createFulfillment(orderId, trackingInfo) {
    logger.info(`ShopifyProxy: Creating fulfillment for order ${orderId} via Clawdbot`);
    const result = await this.bridge.shopifyCreateFulfillment(orderId, trackingInfo);
    return result?.fulfillment || result || null;
  }

  // ═══════════════════════════════════════
  // INVENTORY — proxied through Clawdbot
  // ═══════════════════════════════════════

  async getInventoryLevels(locationId, inventoryItemIds) {
    // Batch request — send all IDs to Clawdbot
    const result = await this.bridge.sendCommand('shopify_get_inventory', {
      locationId,
      inventoryItemIds,
    }, true);
    return result?.inventory_levels || result || [];
  }

  async setInventoryLevel(locationId, inventoryItemId, available) {
    return this.bridge.shopifySetInventory(locationId, inventoryItemId, available);
  }

  // ═══════════════════════════════════════
  // STORE INFO — proxied through Clawdbot
  // ═══════════════════════════════════════

  async getShopInfo() {
    const result = await this.bridge.shopifyGetShopInfo();
    return result?.shop || result || null;
  }

  async getLocations() {
    const result = await this.bridge.sendCommand('shopify_get_locations', {}, true);
    return result?.locations || result || [];
  }

  // ═══════════════════════════════════════
  // WEBHOOKS — proxied through Clawdbot
  // ═══════════════════════════════════════

  async registerWebhook(topic, address) {
    return this.bridge.shopifyRegisterWebhook(topic, address);
  }

  async listWebhooks() {
    const result = await this.bridge.sendCommand('shopify_list_webhooks', {}, true);
    return result?.webhooks || result || [];
  }

  /**
   * Verify Shopify webhook HMAC signature
   * This still runs locally — doesn't need Clawdbot
   */
  static verifyWebhookHmac(rawBody, hmacHeader, secret) {
    const crypto = require('crypto');
    const hash = crypto
      .createHmac('sha256', secret || config.shopify.webhookSecret)
      .update(rawBody, 'utf8')
      .digest('base64');
    return hash === hmacHeader;
  }

  // ═══════════════════════════════════════
  // CONNECTION TEST
  // ═══════════════════════════════════════

  async testConnection() {
    try {
      const bridgeStatus = await this.bridge.testConnection();
      if (!bridgeStatus.connected) {
        return { connected: false, via: 'clawdbot', error: bridgeStatus.error || 'Clawdbot not reachable' };
      }
      // Try to get shop info through Clawdbot
      const shop = await this.getShopInfo();
      if (shop?.name) {
        return {
          connected: true,
          via: 'clawdbot',
          storeName: shop.name,
          domain: shop.domain,
          plan: shop.plan_name,
          currency: shop.currency,
        };
      }
      return { connected: true, via: 'clawdbot', note: 'Bridge connected, Shopify pending confirmation' };
    } catch (err) {
      return { connected: false, via: 'clawdbot', error: err.message };
    }
  }
}

module.exports = new ShopifyService();
