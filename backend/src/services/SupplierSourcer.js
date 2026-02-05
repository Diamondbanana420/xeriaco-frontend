const axios = require('axios');
const cheerio = require('cheerio');
const config = require('../../config');
const logger = require('../utils/logger');
const { Product, Supplier } = require('../models');

class SupplierSourcer {
  constructor() {
    this.userAgents = config.pipeline.userAgents;
    this.delay = config.pipeline.scrapeDelayMs;
  }

  getRandomUA() {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  async sleep(ms) {
    return new Promise(r => setTimeout(r, ms || this.delay));
  }

  async fetchSafe(url, retries = 2) {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await axios.get(url, {
          timeout: 15000,
          headers: { 'User-Agent': this.getRandomUA() },
        });
        return res;
      } catch (err) {
        if (i === retries - 1) return null;
        await this.sleep(2000);
      }
    }
    return null;
  }

  // ═══════════════════════════════════════
  // Search AliExpress for suppliers
  // ═══════════════════════════════════════
  async searchAliExpress(query) {
    const results = [];
    try {
      const url = `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(query)}&SortType=total_tranpro_desc`;
      const res = await this.fetchSafe(url);
      if (!res) return results;

      const $ = cheerio.load(res.data);

      $('[class*="product-card"], [class*="SearchProduct"], .list--gallery--C2f2tvm a, [data-product-id]').each((i, el) => {
        if (i >= 10) return;
        const title = $(el).find('[class*="title"], h3, h1').first().text().trim();
        const priceText = $(el).find('[class*="price"], .multi--price-sale--U-S0jtj').first().text().trim();
        const ordersText = $(el).find('[class*="trade"], [class*="sold"]').first().text().trim();
        const ratingText = $(el).find('[class*="evaluation"], [class*="star"]').first().text().trim();
        const link = $(el).attr('href') || $(el).find('a').first().attr('href') || '';
        const imageUrl = $(el).find('img').first().attr('src') || '';

        const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
        if (title && price > 0) {
          // Parse orders (e.g., "10K+ sold" → 10000)
          let orders = 0;
          const ordersMatch = ordersText.match(/([\d.]+)\s*K?\+?\s*(sold|orders)?/i);
          if (ordersMatch) {
            orders = parseFloat(ordersMatch[1]);
            if (ordersText.toLowerCase().includes('k')) orders *= 1000;
          }

          results.push({
            title,
            costUsd: price,
            orders: Math.round(orders),
            rating: parseFloat(ratingText) || 0,
            url: link.startsWith('http') ? link : `https://www.aliexpress.com${link}`,
            imageUrl: imageUrl.startsWith('//') ? `https:${imageUrl}` : imageUrl,
            platform: 'aliexpress',
          });
        }
      });

      await this.sleep();
    } catch (err) {
      logger.warn(`AliExpress search failed for "${query}": ${err.message}`);
    }
    return results;
  }

  // ═══════════════════════════════════════
  // Search CJDropshipping
  // ═══════════════════════════════════════
  async searchCJDropshipping(query) {
    const results = [];
    try {
      // CJ has a public search page
      const url = `https://cjdropshipping.com/search.html?keyword=${encodeURIComponent(query)}`;
      const res = await this.fetchSafe(url);
      if (!res) return results;

      const $ = cheerio.load(res.data);
      $('.product-item, .goods-item, [class*="productCard"]').each((i, el) => {
        if (i >= 10) return;
        const title = $(el).find('.goods-name, .product-name, h3').first().text().trim();
        const priceText = $(el).find('.goods-price, .product-price, [class*="price"]').first().text().trim();
        const link = $(el).find('a').first().attr('href') || '';

        const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
        if (title && price > 0) {
          results.push({
            title,
            costUsd: price,
            orders: 0,
            rating: 0,
            url: link.startsWith('http') ? link : `https://cjdropshipping.com${link}`,
            platform: 'cjdropshipping',
          });
        }
      });

      await this.sleep();
    } catch (err) {
      logger.warn(`CJ search failed for "${query}": ${err.message}`);
    }
    return results;
  }

  // ═══════════════════════════════════════
  // Find best supplier for a product
  // ═══════════════════════════════════════
  async findBestSupplier(product) {
    const query = product.title.split(' ').slice(0, 6).join(' ');
    logger.info(`SupplierSourcer: Searching for "${query}"`);

    const [aliResults, cjResults] = await Promise.allSettled([
      this.searchAliExpress(query),
      this.searchCJDropshipping(query),
    ]);

    const allResults = [
      ...(aliResults.value || []),
      ...(cjResults.value || []),
    ];

    if (allResults.length === 0) {
      logger.info(`SupplierSourcer: No suppliers found for "${query}"`);
      return null;
    }

    // Score suppliers
    const scored = allResults.map(s => ({
      ...s,
      score: this.scoreSupplier(s),
    })).sort((a, b) => b.score - a.score);

    const best = scored[0];
    logger.info(`SupplierSourcer: Best supplier for "${query}" — ${best.platform} $${best.costUsd} (score: ${best.score})`);

    return best;
  }

  scoreSupplier(supplier) {
    let score = 0;

    // Price (lower is better for same product)
    if (supplier.costUsd <= 5) score += 15;
    else if (supplier.costUsd <= 15) score += 12;
    else if (supplier.costUsd <= 30) score += 10;
    else score += 5;

    // Orders (higher = more trusted)
    if (supplier.orders > 10000) score += 30;
    else if (supplier.orders > 5000) score += 25;
    else if (supplier.orders > 1000) score += 20;
    else if (supplier.orders > 100) score += 10;

    // Rating
    if (supplier.rating >= 4.8) score += 20;
    else if (supplier.rating >= 4.5) score += 15;
    else if (supplier.rating >= 4.0) score += 10;

    // Platform preference (CJ has faster AU shipping usually)
    if (supplier.platform === 'cjdropshipping') score += 5;

    return score;
  }

  // ═══════════════════════════════════════
  // Auto-source unsourced products
  // ═══════════════════════════════════════
  async autoSourceProducts(limit = 10) {
    const products = await Product.find({
      isActive: true,
      'supplier.url': { $in: [null, ''] },
      costUsd: { $lte: 0 },
    }).limit(limit);

    logger.info(`SupplierSourcer: Auto-sourcing ${products.length} products`);
    let sourced = 0;

    for (const product of products) {
      try {
        const best = await this.findBestSupplier(product);
        if (!best) continue;

        product.costUsd = best.costUsd;
        product.shippingCostUsd = best.costUsd * 0.15; // Estimate 15% shipping
        product.supplier = {
          platform: best.platform,
          url: best.url,
          rating: best.rating,
          totalOrders: best.orders,
          lastChecked: new Date(),
        };

        // Recalculate pricing
        const pricingEngine = require('./PricingEngine');
        const pricing = pricingEngine.calculatePrice(product.costUsd, product.shippingCostUsd);
        product.sellingPriceAud = pricing.sellingPriceAud;
        product.comparePriceAud = pricing.comparePriceAud;
        product.profitAud = pricing.profitAud;
        product.profitMarginPercent = pricing.profitMarginPercent;
        product.markupPercent = pricing.markupPercent;
        product.totalCostUsd = pricing.totalCostUsd;

        // Set featured image if available
        if (best.imageUrl && !product.featuredImage) {
          product.featuredImage = best.imageUrl;
          product.images = [{ src: best.imageUrl, alt: product.title, position: 0 }];
        }

        await product.save();

        // Save/update supplier record
        await this.upsertSupplier(best);

        sourced++;
      } catch (err) {
        logger.warn(`SupplierSourcer: Failed for ${product.title}: ${err.message}`);
      }
    }

    logger.info(`SupplierSourcer: Sourced ${sourced}/${products.length} products`);
    return { sourced, total: products.length };
  }

  async upsertSupplier(supplierData) {
    try {
      const existing = await Supplier.findOne({
        platform: supplierData.platform,
        storeUrl: { $regex: new RegExp(supplierData.url?.split('/').slice(0, 4).join('/'), 'i') },
      });

      if (existing) {
        existing.metrics.rating = supplierData.rating || existing.metrics.rating;
        existing.metrics.totalOrders = supplierData.orders || existing.metrics.totalOrders;
        existing.productCount = (existing.productCount || 0) + 1;
        await existing.save();
      } else {
        await Supplier.create({
          name: supplierData.title?.substring(0, 50) || 'Unknown',
          platform: supplierData.platform,
          storeUrl: supplierData.url || '',
          metrics: {
            rating: supplierData.rating || 0,
            totalOrders: supplierData.orders || 0,
          },
          productCount: 1,
        });
      }
    } catch (err) {
      // Non-critical
      logger.debug(`Supplier upsert skipped: ${err.message}`);
    }
  }
}

module.exports = new SupplierSourcer();
