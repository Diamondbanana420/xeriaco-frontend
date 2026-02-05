const Airtable = require('airtable');
const config = require('../../config');
const logger = require('../utils/logger');
const { Product, Order, Supplier, Analytics } = require('../models');

class AirtableSync {
  constructor() {
    this.enabled = config.airtable.syncEnabled && !!config.airtable.apiKey;
    this.base = null;
    this.tables = config.airtable.tables;
  }

  getBase() {
    if (!this.base && this.enabled) {
      Airtable.configure({ apiKey: config.airtable.apiKey });
      this.base = Airtable.base(config.airtable.baseId);
    }
    return this.base;
  }

  // ═══════════════════════════════════════
  // PRODUCTS → Airtable
  // ═══════════════════════════════════════
  async syncProductToAirtable(product) {
    if (!this.enabled) return null;
    const base = this.getBase();

    const fields = {
      'Product Title': product.title,
      'Category': product.category || '',
      'Cost USD': product.costUsd || 0,
      'Shipping Cost USD': product.shippingCostUsd || 0,
      'Total Cost USD': product.totalCostUsd || 0,
      'Selling Price AUD': product.sellingPriceAud || 0,
      'Compare Price AUD': product.comparePriceAud || 0,
      'Profit AUD': product.profitAud || 0,
      'Profit Margin %': product.profitMarginPercent || 0,
      'Shopify Status': product.shopifyStatus || 'draft',
      'Shopify Product ID': product.shopifyProductId || '',
      'Supplier Platform': product.supplier?.platform || '',
      'Supplier URL': product.supplier?.url || '',
      'Supplier Rating': product.supplier?.rating || 0,
      'Supplier Orders': product.supplier?.totalOrders || 0,
      'Research Score': product.pipeline?.researchScore || 0,
      'Trend Score': product.pipeline?.trendScore || 0,
      'Pipeline Source': product.pipeline?.source || '',
      'Approved': product.pipeline?.approved || false,
      'Tags': (product.tags || []).join(', '),
      'Featured Image': product.featuredImage || '',
      'MongoDB ID': product._id.toString(),
      'Listing Status': product.pipeline?.approved ? 'Listed' : 'Pending',
    };

    try {
      // Check if record exists (by MongoDB ID)
      const existing = await this.findRecordByField(this.tables.products, 'MongoDB ID', product._id.toString());

      if (existing) {
        await base(this.tables.products).update(existing.id, fields);
        logger.debug(`Airtable: Updated product ${product.title}`);
      } else {
        await base(this.tables.products).create(fields);
        logger.debug(`Airtable: Created product ${product.title}`);
      }
      return true;
    } catch (err) {
      logger.warn(`Airtable product sync failed: ${err.message}`, { productId: product._id });
      return false;
    }
  }

  // ═══════════════════════════════════════
  // ORDERS → Airtable
  // ═══════════════════════════════════════
  async syncOrderToAirtable(order) {
    if (!this.enabled) return null;
    const base = this.getBase();

    const fields = {
      'Order ID': order.shopifyOrderName || '',
      'Shopify Order ID': order.shopifyOrderId || '',
      'Customer Name': `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim(),
      'Customer Email': order.customer?.email || '',
      'Order Total AUD': order.financials?.totalAud || 0,
      'Total Cost AUD': order.financials?.totalCostAud || 0,
      'Profit AUD': order.financials?.profitAud || 0,
      'Profit Margin %': order.financials?.profitMarginPercent || 0,
      'Order Status': order.status || 'new',
      'Fraud Score': order.fraud?.score || 0,
      'Tracking Number': order.fulfillment?.trackingNumber || '',
      'Tracking URL': order.fulfillment?.trackingUrl || '',
      'Carrier': order.fulfillment?.carrier || '',
      'Items Count': order.items?.length || 0,
      'Order Date': order.shopifyCreatedAt || order.createdAt,
      'MongoDB ID': order._id.toString(),
    };

    try {
      const existing = await this.findRecordByField(this.tables.orders, 'MongoDB ID', order._id.toString());
      if (existing) {
        await base(this.tables.orders).update(existing.id, fields);
      } else {
        await base(this.tables.orders).create(fields);
      }
      return true;
    } catch (err) {
      logger.warn(`Airtable order sync failed: ${err.message}`);
      return false;
    }
  }

  // ═══════════════════════════════════════
  // ANALYTICS → Airtable
  // ═══════════════════════════════════════
  async syncAnalyticsToAirtable(analytics) {
    if (!this.enabled) return null;
    const base = this.getBase();

    const fields = {
      'Date': analytics.date,
      'Total Orders': analytics.orders?.total || 0,
      'Total Revenue AUD': analytics.revenue?.totalAud || 0,
      'Total Cost AUD': analytics.revenue?.totalCostAud || 0,
      'Total Profit AUD': analytics.revenue?.profitAud || 0,
      'Profit Margin %': analytics.revenue?.profitMarginPercent || 0,
      'Avg Order Value AUD': analytics.revenue?.avgOrderValueAud || 0,
      'Products Active': analytics.products?.totalActive || 0,
      'Products Draft': analytics.products?.totalDraft || 0,
      'New Products Listed': analytics.products?.newListed || 0,
      'Pipeline Runs': analytics.pipeline?.runsCompleted || 0,
    };

    try {
      await base(this.tables.analytics).create(fields);
      return true;
    } catch (err) {
      logger.warn(`Airtable analytics sync failed: ${err.message}`);
      return false;
    }
  }

  // ═══════════════════════════════════════
  // Airtable → MongoDB (pull updates FROM Airtable)
  // ═══════════════════════════════════════
  async pullProductUpdatesFromAirtable() {
    if (!this.enabled) return { updated: 0 };
    const base = this.getBase();

    let updated = 0;
    try {
      const records = await base(this.tables.products).select({
        filterByFormula: `AND({MongoDB ID} != '', {Listing Status} != '')`,
        maxRecords: 100,
      }).all();

      for (const record of records) {
        const mongoId = record.get('MongoDB ID');
        if (!mongoId) continue;

        const product = await Product.findById(mongoId);
        if (!product) continue;

        // Pull editable fields back from Airtable
        const airtableStatus = record.get('Listing Status');
        const airtableApproved = record.get('Approved');
        const airtableNotes = record.get('Notes');

        let changed = false;

        // If approved in Airtable but not in MongoDB
        if (airtableApproved && !product.pipeline.approved) {
          product.pipeline.approved = true;
          product.pipeline.approvedAt = new Date();
          changed = true;
        }

        // If status changed in Airtable
        if (airtableStatus === 'Rejected' && !product.pipeline.rejectionReason) {
          product.pipeline.rejectionReason = airtableNotes || 'Rejected in Airtable';
          product.isActive = false;
          changed = true;
        }

        if (changed) {
          await product.save();
          updated++;
        }
      }
    } catch (err) {
      logger.error('Airtable pull failed', { error: err.message });
    }

    logger.info(`Airtable: Pulled ${updated} product updates`);
    return { updated };
  }

  // ═══════════════════════════════════════
  // Bulk sync all products
  // ═══════════════════════════════════════
  async bulkSyncProducts(limit = 50) {
    if (!this.enabled) return { synced: 0 };

    const products = await Product.find({ isActive: true })
      .sort({ updatedAt: -1 })
      .limit(limit);

    let synced = 0;
    for (const product of products) {
      const success = await this.syncProductToAirtable(product);
      if (success) synced++;
      // Airtable rate limit: 5 requests/sec
      await new Promise(r => setTimeout(r, 250));
    }

    logger.info(`Airtable: Bulk synced ${synced}/${products.length} products`);
    return { synced, total: products.length };
  }

  // ═══════════════════════════════════════
  // Bulk sync all orders
  // ═══════════════════════════════════════
  async bulkSyncOrders(limit = 50) {
    if (!this.enabled) return { synced: 0 };

    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(limit);

    let synced = 0;
    for (const order of orders) {
      const success = await this.syncOrderToAirtable(order);
      if (success) synced++;
      await new Promise(r => setTimeout(r, 250));
    }

    logger.info(`Airtable: Bulk synced ${synced}/${orders.length} orders`);
    return { synced, total: orders.length };
  }

  // ═══════════════════════════════════════
  // Helper: find Airtable record by field value
  // ═══════════════════════════════════════
  async findRecordByField(tableName, fieldName, value) {
    const base = this.getBase();
    try {
      const records = await base(tableName).select({
        filterByFormula: `{${fieldName}} = '${value}'`,
        maxRecords: 1,
      }).firstPage();
      return records.length > 0 ? records[0] : null;
    } catch (err) {
      return null;
    }
  }

  // ═══════════════════════════════════════
  // Connection test
  // ═══════════════════════════════════════
  async testConnection() {
    if (!this.enabled) return { connected: false, reason: 'Airtable sync disabled' };
    try {
      const base = this.getBase();
      const records = await base(this.tables.products).select({ maxRecords: 1 }).firstPage();
      return { connected: true, table: this.tables.products, recordCount: records.length };
    } catch (err) {
      return { connected: false, error: err.message };
    }
  }
}

module.exports = new AirtableSync();
