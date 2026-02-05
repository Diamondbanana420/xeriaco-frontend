const express = require('express');
const router = express.Router();
const { Product } = require('../models');
const shopifyService = require('../services/ShopifyService');
const pricingEngine = require('../services/PricingEngine');
const logger = require('../utils/logger');

// GET /api/products — List products with filtering
router.get('/', async (req, res) => {
  try {
    const {
      page = 1, limit = 20, status, category,
      sortBy = 'createdAt', sortOrder = 'desc',
      search, minProfit, maxCost,
    } = req.query;

    const filter = { isActive: true };
    if (status) filter.shopifyStatus = status;
    if (category) filter.category = category;
    if (minProfit) filter.profitMarginPercent = { $gte: parseFloat(minProfit) };
    if (maxCost) filter.costUsd = { $lte: parseFloat(maxCost) };
    if (search) filter.$text = { $search: search };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(parseInt(limit)).lean(),
      Product.countDocuments(filter),
    ]);

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    logger.error('Error listing products', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/stats
router.get('/stats', async (req, res) => {
  try {
    const [total, active, draft, archived] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ shopifyStatus: 'active', isActive: true }),
      Product.countDocuments({ shopifyStatus: 'draft', isActive: true }),
      Product.countDocuments({ shopifyStatus: 'archived' }),
    ]);

    const avgProfit = await Product.aggregate([
      { $match: { isActive: true, profitMarginPercent: { $gt: 0 } } },
      { $group: { _id: null, avg: { $avg: '$profitMarginPercent' }, avgCost: { $avg: '$costUsd' } } },
    ]);

    const topCategories = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      total, active, draft, archived,
      avgProfitMargin: avgProfit[0]?.avg?.toFixed(1) || 0,
      avgCostUsd: avgProfit[0]?.avgCost?.toFixed(2) || 0,
      topCategories,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products — Create product with auto-pricing
router.post('/', async (req, res) => {
  try {
    const data = req.body;

    // Auto-calculate pricing
    const pricing = pricingEngine.calculatePrice(data.costUsd || 0, data.shippingCostUsd || 0);

    const product = new Product({
      ...data,
      sellingPriceAud: pricing.sellingPriceAud,
      comparePriceAud: pricing.comparePriceAud,
      profitAud: pricing.profitAud,
      profitMarginPercent: pricing.profitMarginPercent,
      markupPercent: pricing.markupPercent,
      totalCostUsd: pricing.totalCostUsd,
    });

    await product.save();
    logger.info(`Product created: ${product.title} | Price: $${pricing.sellingPriceAud} AUD | Margin: ${pricing.profitMarginPercent}%`);
    res.status(201).json(product);
  } catch (err) {
    logger.error('Error creating product', { error: err.message });
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/products/:id
router.put('/:id', async (req, res) => {
  try {
    const updates = req.body;

    // Recalculate pricing if cost changed
    if (updates.costUsd !== undefined || updates.shippingCostUsd !== undefined) {
      const product = await Product.findById(req.params.id);
      const pricing = pricingEngine.calculatePrice(
        updates.costUsd ?? product.costUsd,
        updates.shippingCostUsd ?? product.shippingCostUsd
      );
      Object.assign(updates, {
        sellingPriceAud: pricing.sellingPriceAud,
        comparePriceAud: pricing.comparePriceAud,
        profitAud: pricing.profitAud,
        profitMarginPercent: pricing.profitMarginPercent,
        markupPercent: pricing.markupPercent,
        totalCostUsd: pricing.totalCostUsd,
      });
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/products/:id/sync-to-shopify — Push single product to Shopify
router.post('/:id/sync-to-shopify', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    let shopifyProduct;
    if (product.shopifyProductId) {
      // Update existing
      shopifyProduct = await shopifyService.updateProduct(product.shopifyProductId, {
        title: product.title,
        body_html: product.descriptionHtml || product.description,
        tags: product.tags.join(', '),
        status: product.shopifyStatus,
        variants: [{ id: product.shopifyVariantId, price: String(product.sellingPriceAud), compare_at_price: product.comparePriceAud ? String(product.comparePriceAud) : null }],
      });
    } else {
      // Create new
      shopifyProduct = await shopifyService.createProduct(product);
    }

    // Update local record with Shopify IDs
    product.shopifyProductId = String(shopifyProduct.id);
    product.shopifyVariantId = String(shopifyProduct.variants?.[0]?.id || '');
    product.shopifyHandle = shopifyProduct.handle;
    product.lastSyncedToShopify = new Date();
    await product.save();

    res.json({ success: true, shopifyProduct, localProduct: product });
  } catch (err) {
    logger.error('Shopify sync failed', { productId: req.params.id, error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products/bulk-sync — Sync all unsynced products to Shopify
router.post('/bulk-sync', async (req, res) => {
  try {
    const unsynced = await Product.find({
      shopifyProductId: null,
      isActive: true,
      'pipeline.approved': true,
    }).limit(50);

    const results = { synced: 0, failed: 0, errors: [] };

    for (const product of unsynced) {
      try {
        const shopifyProduct = await shopifyService.createProduct(product);
        product.shopifyProductId = String(shopifyProduct.id);
        product.shopifyVariantId = String(shopifyProduct.variants?.[0]?.id || '');
        product.shopifyHandle = shopifyProduct.handle;
        product.lastSyncedToShopify = new Date();
        await product.save();
        results.synced++;
      } catch (err) {
        results.failed++;
        results.errors.push({ productId: product._id, title: product.title, error: err.message });
      }
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products/:id/reprice — Recalculate price for a product
router.post('/:id/reprice', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const pricing = pricingEngine.calculatePrice(product.costUsd, product.shippingCostUsd, req.body);

    product.sellingPriceAud = pricing.sellingPriceAud;
    product.comparePriceAud = pricing.comparePriceAud;
    product.profitAud = pricing.profitAud;
    product.profitMarginPercent = pricing.profitMarginPercent;
    product.markupPercent = pricing.markupPercent;
    await product.save();

    res.json({ product, pricing });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/products/:id
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // Soft delete
    product.isActive = false;
    product.shopifyStatus = 'archived';
    await product.save();

    // Archive on Shopify too
    if (product.shopifyProductId) {
      try {
        await shopifyService.updateProduct(product.shopifyProductId, { status: 'archived' });
      } catch (err) {
        logger.warn(`Failed to archive on Shopify: ${err.message}`);
      }
    }

    res.json({ success: true, message: 'Product archived' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
