const axios = require('axios');
const cheerio = require('cheerio');
const config = require('../../config');
const logger = require('../utils/logger');
const { Product } = require('../models');
const pricingEngine = require('./PricingEngine');
const shopifyService = require('./ShopifyService');
const clawdbotBridge = require('./ClawdbotBridge');

class CompetitorScraper {
  constructor() {
    this.enabled = config.competitors.scrapeEnabled;
    this.maxPerProduct = config.competitors.maxCompetitorsPerProduct;
    this.autoPriceAdjust = config.competitors.autoPriceAdjust;
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
          timeout: 12000,
          headers: {
            'User-Agent': this.getRandomUA(),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-AU,en;q=0.9',
          },
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
  // Google Shopping scrape
  // ═══════════════════════════════════════
  async scrapeGoogleShopping(query) {
    const competitors = [];
    try {
      const url = `https://www.google.com.au/search?q=${encodeURIComponent(query)}&tbm=shop&gl=au`;
      const res = await this.fetchSafe(url);
      if (!res) return competitors;

      const $ = cheerio.load(res.data);
      $('[data-docid], .sh-dgr__grid-result, .sh-dlr__list-result').each((i, el) => {
        if (i >= this.maxPerProduct) return;
        const title = $(el).find('.tAxDx, .Xjkr3b, a.translate-content').first().text().trim();
        const priceText = $(el).find('[data-price], .a8Pemb, .HRLxBb').first().text().trim();
        const seller = $(el).find('.aULzUe, .IuHnof').first().text().trim();

        const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
        if (title && price > 0) {
          competitors.push({
            title: title.substring(0, 100),
            price,
            currency: 'AUD',
            seller: seller || 'Unknown',
            source: 'google_shopping',
          });
        }
      });
    } catch (err) {
      logger.warn(`Google Shopping scrape failed for "${query}": ${err.message}`);
    }
    return competitors;
  }

  // ═══════════════════════════════════════
  // eBay AU scrape
  // ═══════════════════════════════════════
  async scrapeEbayAu(query) {
    const competitors = [];
    try {
      const url = `https://www.ebay.com.au/sch/i.html?_nkw=${encodeURIComponent(query)}&_sop=15&LH_BIN=1`;
      const res = await this.fetchSafe(url);
      if (!res) return competitors;

      const $ = cheerio.load(res.data);
      $('.s-item').each((i, el) => {
        if (i >= this.maxPerProduct || i === 0) return; // Skip first (ad)
        const title = $(el).find('.s-item__title span').first().text().trim();
        const priceText = $(el).find('.s-item__price').first().text().trim();
        const seller = $(el).find('.s-item__seller-info-text').first().text().trim();

        const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
        if (title && price > 0 && !title.includes('Shop on eBay')) {
          competitors.push({
            title: title.substring(0, 100),
            price,
            currency: 'AUD',
            seller: seller || 'eBay seller',
            source: 'ebay_au',
          });
        }
      });
    } catch (err) {
      logger.warn(`eBay AU scrape failed for "${query}": ${err.message}`);
    }
    return competitors;
  }

  // ═══════════════════════════════════════
  // Amazon AU scrape
  // ═══════════════════════════════════════
  async scrapeAmazonAu(query) {
    const competitors = [];
    try {
      const url = `https://www.amazon.com.au/s?k=${encodeURIComponent(query)}`;
      const res = await this.fetchSafe(url);
      if (!res) return competitors;

      const $ = cheerio.load(res.data);
      $('[data-component-type="s-search-result"]').each((i, el) => {
        if (i >= this.maxPerProduct) return;
        const title = $(el).find('h2 span, .a-size-medium').first().text().trim();
        const priceWhole = $(el).find('.a-price-whole').first().text().trim();
        const priceFraction = $(el).find('.a-price-fraction').first().text().trim();
        const ratingText = $(el).find('.a-icon-alt').first().text().trim();

        const price = parseFloat(`${priceWhole}${priceFraction}`.replace(/[^0-9.]/g, ''));
        if (title && price > 0) {
          competitors.push({
            title: title.substring(0, 100),
            price,
            currency: 'AUD',
            rating: parseFloat(ratingText) || 0,
            seller: 'Amazon AU',
            source: 'amazon_au',
          });
        }
      });
    } catch (err) {
      logger.warn(`Amazon AU scrape failed for "${query}": ${err.message}`);
    }
    return competitors;
  }

  // ═══════════════════════════════════════
  // Run full competitor scan for a product
  // ═══════════════════════════════════════
  async scanCompetitors(product) {
    const query = product.title.split(' ').slice(0, 5).join(' '); // First 5 words
    logger.info(`CompetitorScraper: Scanning "${query}"`);

    const [google, ebay, amazon] = await Promise.allSettled([
      this.scrapeGoogleShopping(query),
      this.scrapeEbayAu(query),
      this.scrapeAmazonAu(query),
    ]);

    const allCompetitors = [
      ...(google.value || []),
      ...(ebay.value || []),
      ...(amazon.value || []),
    ];

    await this.sleep();
    return allCompetitors;
  }

  // ═══════════════════════════════════════
  // Bulk scan + optional auto-adjust
  // ═══════════════════════════════════════
  async runBulkScan(options = {}) {
    if (!this.enabled) {
      logger.info('CompetitorScraper disabled — skipping');
      return { scanned: 0, adjusted: 0 };
    }

    const limit = options.limit || 20;
    const products = await Product.find({
      isActive: true,
      shopifyStatus: 'active',
    }).sort({ 'analytics.purchases': -1 }).limit(limit);

    logger.info(`CompetitorScraper: Scanning ${products.length} products`);

    let scanned = 0;
    let adjusted = 0;

    for (const product of products) {
      try {
        const competitors = await this.scanCompetitors(product);
        scanned++;

        if (competitors.length === 0) continue;

        // Store competitor data
        const avgPrice = competitors.reduce((s, c) => s + c.price, 0) / competitors.length;
        const minPrice = Math.min(...competitors.map(c => c.price));
        const maxPrice = Math.max(...competitors.map(c => c.price));

        product.pipeline.competitorCount = competitors.length;
        product.pipeline.lastChecked = new Date();

        // Auto-adjust price if enabled
        if (this.autoPriceAdjust && product.sellingPriceAud > 0) {
          const newPrice = pricingEngine.adjustForCompetitors(product.sellingPriceAud, competitors);
          const totalCostAud = product.totalCostUsd * config.pricing.usdToAud;

          // Only adjust if it stays profitable
          if (newPrice > totalCostAud + config.pricing.minProfitAud) {
            const oldPrice = product.sellingPriceAud;
            const priceDiff = Math.abs(newPrice - oldPrice);

            // Only adjust if change is meaningful (> $1)
            if (priceDiff > 1) {
              product.sellingPriceAud = newPrice;
              product.profitAud = newPrice - totalCostAud;
              product.profitMarginPercent = (product.profitAud / newPrice) * 100;
              adjusted++;

              // Update Shopify
              if (product.shopifyVariantId) {
                try {
                  await shopifyService.updateVariantPrice(
                    product.shopifyVariantId,
                    newPrice,
                    pricingEngine.calculateComparePrice(newPrice)
                  );
                } catch (err) {
                  logger.warn(`Shopify price update failed: ${err.message}`);
                }
              }

              await clawdbotBridge.alertPriceChange(product, oldPrice, newPrice);
              logger.info(`Price adjusted: ${product.title} — $${oldPrice.toFixed(2)} → $${newPrice.toFixed(2)} (avg competitor: $${avgPrice.toFixed(2)})`);
            }
          }
        }

        await product.save();
      } catch (err) {
        logger.warn(`CompetitorScraper: Failed for ${product.title}: ${err.message}`);
      }
    }

    logger.info(`CompetitorScraper: Done — ${scanned} scanned, ${adjusted} prices adjusted`);
    return { scanned, adjusted };
  }
}

module.exports = new CompetitorScraper();
