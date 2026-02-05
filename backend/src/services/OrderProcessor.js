const { Order, Product } = require('../models');
const shopifyService = require('./ShopifyService');
const fraudScorer = require('./FraudScorer');
const clawdbotBridge = require('./ClawdbotBridge');
const pricingEngine = require('./PricingEngine');
const config = require('../../config');
const logger = require('../utils/logger');

class OrderProcessor {
  /**
   * Process incoming Shopify order webhook
   */
  async processNewOrder(shopifyOrder) {
    logger.info(`Processing new order: ${shopifyOrder.name} (${shopifyOrder.id})`);

    // Check for duplicate
    const existing = await Order.findOne({ shopifyOrderId: String(shopifyOrder.id) });
    if (existing) {
      logger.warn(`Duplicate order webhook: ${shopifyOrder.id}`);
      return existing;
    }

    // Run fraud scoring
    const fraudResult = fraudScorer.score(shopifyOrder);

    // Match line items to our products
    const items = await this.matchLineItems(shopifyOrder.line_items || []);

    // Calculate financials
    const financials = this.calculateFinancials(shopifyOrder, items);

    // Create order record
    const order = new Order({
      shopifyOrderId: String(shopifyOrder.id),
      shopifyOrderNumber: String(shopifyOrder.order_number),
      shopifyOrderName: shopifyOrder.name,
      status: fraudResult.score >= 60 ? 'processing' : 'new',
      statusHistory: [{ status: 'new', changedAt: new Date(), note: 'Received from Shopify' }],
      customer: {
        shopifyCustomerId: String(shopifyOrder.customer?.id || ''),
        email: shopifyOrder.email || shopifyOrder.customer?.email || '',
        firstName: shopifyOrder.customer?.first_name || '',
        lastName: shopifyOrder.customer?.last_name || '',
        country: shopifyOrder.shipping_address?.country_code || '',
        state: shopifyOrder.shipping_address?.province_code || '',
      },
      items,
      financials,
      fraud: {
        score: fraudResult.score,
        flags: fraudResult.flags,
        reviewed: fraudResult.score < 30,
      },
      shopifyCreatedAt: shopifyOrder.created_at,
      shopifyUpdatedAt: shopifyOrder.updated_at,
    });

    await order.save();

    // Send alerts
    await clawdbotBridge.alertNewOrder(order);
    if (fraudResult.score >= 60) {
      await clawdbotBridge.alertHighFraudOrder(order);
    }

    // Trigger n8n workflow
    const n8nIntegration = require('./N8nIntegration');
    await n8nIntegration.triggerNewOrder(order);

    // Sync to Airtable
    const airtableSync = require('./AirtableSync');
    await airtableSync.syncOrderToAirtable(order);

    // Trigger supplier order via n8n (if auto-fulfill enabled)
    for (const item of items) {
      if (item.productId) {
        const { Product } = require('../models');
        const prod = await Product.findById(item.productId);
        if (prod?.supplier?.url) {
          await n8nIntegration.triggerSupplierOrder(order, prod);
        }
      }
    }

    // Update product analytics
    await this.updateProductAnalytics(items);

    logger.info(`Order saved: ${order.shopifyOrderName} | Fraud: ${fraudResult.score} | Profit: $${financials.profitAud.toFixed(2)} AUD`);
    return order;
  }

  /**
   * Match Shopify line items to our product records
   */
  async matchLineItems(lineItems) {
    const items = [];

    for (const item of lineItems) {
      const product = await Product.findOne({
        $or: [
          { shopifyProductId: String(item.product_id) },
          { shopifyVariantId: String(item.variant_id) },
        ],
      });

      items.push({
        productId: product?._id || null,
        shopifyProductId: String(item.product_id),
        shopifyVariantId: String(item.variant_id),
        title: item.title,
        variantTitle: item.variant_title || '',
        quantity: item.quantity,
        priceAud: parseFloat(item.price),
        costUsd: product?.costUsd || 0,
        sku: item.sku || '',
      });
    }

    return items;
  }

  /**
   * Calculate order financials
   */
  calculateFinancials(shopifyOrder, items) {
    const subtotalAud = parseFloat(shopifyOrder.subtotal_price || 0);
    const shippingAud = parseFloat(shopifyOrder.total_shipping_price_set?.shop_money?.amount || 0);
    const taxAud = parseFloat(shopifyOrder.total_tax || 0);
    const totalAud = parseFloat(shopifyOrder.total_price || 0);

    // Calculate total cost from our product data
    const totalCostUsd = items.reduce((sum, item) => sum + (item.costUsd * item.quantity), 0);
    const totalCostAud = totalCostUsd * config.pricing.usdToAud;

    return {
      subtotalAud,
      shippingAud,
      taxAud,
      totalAud,
      totalCostUsd: Math.round(totalCostUsd * 100) / 100,
      totalCostAud: Math.round(totalCostAud * 100) / 100,
      profitAud: Math.round((totalAud - totalCostAud) * 100) / 100,
      profitMarginPercent: totalAud > 0 ? Math.round(((totalAud - totalCostAud) / totalAud) * 10000) / 100 : 0,
    };
  }

  /**
   * Update product analytics counters
   */
  async updateProductAnalytics(items) {
    for (const item of items) {
      if (item.productId) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: {
            'analytics.purchases': item.quantity,
            'analytics.revenue': item.priceAud * item.quantity,
          },
        });
      }
    }
  }

  /**
   * Process fulfillment — push tracking to Shopify
   */
  async fulfillOrder(orderId, trackingInfo) {
    const order = await Order.findById(orderId);
    if (!order) throw new Error(`Order not found: ${orderId}`);

    // Update local record
    order.fulfillment = {
      ...order.fulfillment,
      trackingNumber: trackingInfo.trackingNumber,
      trackingUrl: trackingInfo.trackingUrl || '',
      carrier: trackingInfo.carrier || '',
      shippedAt: new Date(),
      supplierOrderId: trackingInfo.supplierOrderId || '',
      supplierPlatform: trackingInfo.supplierPlatform || '',
    };
    order.status = 'shipped';
    order.statusHistory.push({ status: 'shipped', changedAt: new Date(), note: `Tracking: ${trackingInfo.trackingNumber}` });
    await order.save();

    // Push fulfillment to Shopify
    if (order.shopifyOrderId) {
      try {
        const locations = await shopifyService.getLocations();
        const locationId = locations[0]?.id;
        if (locationId) {
          await shopifyService.createFulfillment(order.shopifyOrderId, {
            locationId,
            trackingNumber: trackingInfo.trackingNumber,
            trackingUrl: trackingInfo.trackingUrl,
            carrier: trackingInfo.carrier,
          });
        }
      } catch (err) {
        logger.error(`Failed to create Shopify fulfillment: ${err.message}`, { orderId: order.shopifyOrderId });
      }
    }

    return order;
  }

  /**
   * Get order stats for dashboard
   */
  async getStats() {
    const [total, newOrders, processing, shipped, delivered] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: 'new' }),
      Order.countDocuments({ status: 'processing' }),
      Order.countDocuments({ status: 'shipped' }),
      Order.countDocuments({ status: 'delivered' }),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = await Order.find({ createdAt: { $gte: today } });
    const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.financials?.totalAud || 0), 0);
    const todayProfit = todayOrders.reduce((sum, o) => sum + (o.financials?.profitAud || 0), 0);

    return {
      total,
      byStatus: { new: newOrders, processing, shipped, delivered },
      today: {
        orders: todayOrders.length,
        revenue: Math.round(todayRevenue * 100) / 100,
        profit: Math.round(todayProfit * 100) / 100,
      },
    };
  }
}

module.exports = new OrderProcessor();
