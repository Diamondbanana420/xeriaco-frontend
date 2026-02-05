const axios = require('axios');
const cheerio = require('cheerio');
const config = require('../../config');
const logger = require('../utils/logger');
const { Product } = require('../models');
const pricingEngine = require('./PricingEngine');

class TrendScout {
  constructor() {
    this.enabled = config.trendScout.enabled;
    this.maxProducts = config.trendScout.maxProductsPerScan;
    this.minScore = config.trendScout.minTrendScore;
    this.categories = config.trendScout.categories;
    this.userAgents = config.pipeline.userAgents;
    this.delay = config.pipeline.scrapeDelayMs;
  }

  getRandomUA() {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  async sleep(ms) {
    return new Promise(r => setTimeout(r, ms || this.delay));
  }

  async fetchWithRetry(url, options = {}, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await axios.get(url, {
          timeout: 15000,
          headers: { 'User-Agent': this.getRandomUA(), ...options.headers },
          ...options,
        });
        return res;
      } catch (err) {
        if (i === retries - 1) throw err;
        logger.warn(`Fetch retry ${i + 1}/${retries}: ${url}`);
        await this.sleep(2000 * (i + 1));
      }
    }
  }

  // ═══════════════════════════════════════
  // SOURCE 1: Google Trends (via RSS)
  // ═══════════════════════════════════════
  async scrapeGoogleTrends() {
    logger.info('TrendScout: Scanning Google Trends...');
    const trends = [];
    try {
      // Google Trends daily trending searches RSS
      const geos = ['AU', 'US', 'GB'];
      for (const geo of geos) {
        try {
          const url = `https://trends.google.com/trends/trendingsearches/daily/rss?geo=${geo}`;
          const res = await this.fetchWithRetry(url);
          const $ = cheerio.load(res.data, { xmlMode: true });
          $('item').each((i, el) => {
            const title = $(el).find('title').text().trim();
            const traffic = $(el).find('ht\\:approx_traffic, approx_traffic').text().trim();
            if (title) {
              trends.push({
                keyword: title,
                source: 'google_trends',
                geo,
                traffic: parseInt(traffic?.replace(/[^0-9]/g, '')) || 0,
              });
            }
          });
          await this.sleep();
        } catch (err) {
          logger.warn(`Google Trends ${geo} failed: ${err.message}`);
        }
      }
    } catch (err) {
      logger.error('Google Trends scrape failed', { error: err.message });
    }
    logger.info(`TrendScout: Found ${trends.length} Google Trends`);
    return trends;
  }

  // ═══════════════════════════════════════
  // SOURCE 2: Amazon Movers & Shakers
  // ═══════════════════════════════════════
  async scrapeAmazonMovers() {
    logger.info('TrendScout: Scanning Amazon Movers & Shakers...');
    const products = [];
    const categories = [
      { name: 'electronics', url: 'https://www.amazon.com.au/gp/movers-and-shakers/electronics' },
      { name: 'home', url: 'https://www.amazon.com.au/gp/movers-and-shakers/kitchen' },
      { name: 'fitness', url: 'https://www.amazon.com.au/gp/movers-and-shakers/sports' },
      { name: 'lifestyle', url: 'https://www.amazon.com.au/gp/movers-and-shakers/beauty' },
    ];

    for (const cat of categories) {
      try {
        const res = await this.fetchWithRetry(cat.url);
        const $ = cheerio.load(res.data);
        $('.a-carousel-card, .zg-item-immersion, [data-asin]').each((i, el) => {
          if (i >= 10) return; // Top 10 per category
          const title = $(el).find('.p13n-sc-truncate, ._cDEzb_p13n-sc-css-line-clamp-1_1Fn1y, .a-size-base').first().text().trim();
          const priceText = $(el).find('.p13n-sc-price, .a-price .a-offscreen, ._cDEzb_p13n-sc-price_3mJ9Z').first().text().trim();
          const rankChangeText = $(el).find('.zg-percent-change, .zg-badge-text').first().text().trim();

          if (title && title.length > 5) {
            const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
            const rankChange = parseInt(rankChangeText.replace(/[^0-9]/g, '')) || 0;
            products.push({
              title,
              priceAud: price,
              rankChange,
              category: cat.name,
              source: 'amazon_movers',
            });
          }
        });
        await this.sleep();
      } catch (err) {
        logger.warn(`Amazon ${cat.name} failed: ${err.message}`);
      }
    }
    logger.info(`TrendScout: Found ${products.length} Amazon movers`);
    return products;
  }

  // ═══════════════════════════════════════
  // SOURCE 3: AliExpress Trending
  // ═══════════════════════════════════════
  async scrapeAliExpressTrending() {
    logger.info('TrendScout: Scanning AliExpress trending...');
    const products = [];
    try {
      const urls = [
        'https://www.aliexpress.com/popular.html',
        'https://www.aliexpress.com/wholesale?catId=0&SearchText=trending+2025',
      ];

      for (const url of urls) {
        try {
          const res = await this.fetchWithRetry(url);
          const $ = cheerio.load(res.data);
          // AliExpress product cards
          $('[class*="product-card"], [class*="SearchProduct"], .list--gallery--C2f2tvm a').each((i, el) => {
            if (i >= 15) return;
            const title = $(el).find('[class*="title"], h3, h1').first().text().trim();
            const priceText = $(el).find('[class*="price"], .multi--price-sale--U-S0jtj').first().text().trim();
            const ordersText = $(el).find('[class*="trade"], [class*="sold"]').first().text().trim();
            const ratingText = $(el).find('[class*="evaluation"], [class*="star"]').first().text().trim();
            const link = $(el).attr('href') || $(el).find('a').first().attr('href') || '';

            if (title && title.length > 5) {
              products.push({
                title,
                costUsd: parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0,
                orders: parseInt(ordersText.replace(/[^0-9]/g, '')) || 0,
                rating: parseFloat(ratingText) || 0,
                url: link.startsWith('http') ? link : `https://www.aliexpress.com${link}`,
                source: 'aliexpress_trending',
              });
            }
          });
          await this.sleep();
        } catch (err) {
          logger.warn(`AliExpress scrape failed: ${err.message}`);
        }
      }
    } catch (err) {
      logger.error('AliExpress trending failed', { error: err.message });
    }
    logger.info(`TrendScout: Found ${products.length} AliExpress trending`);
    return products;
  }

  // ═══════════════════════════════════════
  // SCORING ENGINE
  // ═══════════════════════════════════════
  scoreProduct(product) {
    let score = 0;

    // Source reliability
    if (product.source === 'amazon_movers') score += 20;
    if (product.source === 'aliexpress_trending') score += 15;
    if (product.source === 'google_trends') score += 10;

    // Sales velocity (AliExpress orders)
    if (product.orders > 10000) score += 25;
    else if (product.orders > 5000) score += 20;
    else if (product.orders > 1000) score += 15;
    else if (product.orders > 100) score += 10;

    // Rating
    if (product.rating >= 4.5) score += 15;
    else if (product.rating >= 4.0) score += 10;
    else if (product.rating >= 3.5) score += 5;

    // Price sweet spot for dropshipping ($5-$60 cost = best margins)
    const cost = product.costUsd || 0;
    if (cost >= 5 && cost <= 15) score += 20;
    else if (cost > 15 && cost <= 30) score += 15;
    else if (cost > 30 && cost <= 60) score += 10;
    else if (cost > 60) score += 5;

    // Amazon rank change (higher = more trending)
    if (product.rankChange > 500) score += 15;
    else if (product.rankChange > 100) score += 10;

    // Google Trends traffic
    if (product.traffic > 500000) score += 15;
    else if (product.traffic > 100000) score += 10;

    // Penalty for very cheap items (low margin)
    if (cost > 0 && cost < 2) score -= 10;

    // AU market bonus (Amazon AU data)
    if (product.geo === 'AU' || product.source === 'amazon_movers') score += 5;

    return Math.max(0, Math.min(100, score));
  }

  // ═══════════════════════════════════════
  // DEDUPLICATION
  // ═══════════════════════════════════════
  deduplicateProducts(products) {
    const seen = new Map();
    for (const p of products) {
      const key = p.title.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 40);
      const existing = seen.get(key);
      if (!existing || (p.score || 0) > (existing.score || 0)) {
        seen.set(key, p);
      }
    }
    return Array.from(seen.values());
  }

  // ═══════════════════════════════════════
  // MAIN DISCOVERY PIPELINE
  // ═══════════════════════════════════════
  async discoverProducts() {
    if (!this.enabled) {
      logger.info('TrendScout disabled — skipping');
      return { discovered: 0, scored: 0, saved: 0, products: [] };
    }

    logger.info('TrendScout: Starting product discovery run...');

    // Run all sources in parallel
    const [googleTrends, amazonMovers, aliexpressProducts] = await Promise.allSettled([
      this.scrapeGoogleTrends(),
      this.scrapeAmazonMovers(),
      this.scrapeAliExpressTrending(),
    ]);

    // Merge all results
    let allProducts = [
      ...(googleTrends.value || []),
      ...(amazonMovers.value || []),
      ...(aliexpressProducts.value || []),
    ];

    logger.info(`TrendScout: Raw results — ${allProducts.length} products from all sources`);

    // Score everything
    allProducts = allProducts.map(p => ({ ...p, score: this.scoreProduct(p) }));

    // Deduplicate
    allProducts = this.deduplicateProducts(allProducts);

    // Filter by minimum score
    const qualified = allProducts
      .filter(p => p.score >= this.minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, this.maxProducts);

    logger.info(`TrendScout: ${qualified.length} products qualified (score >= ${this.minScore})`);

    // Save to database
    let saved = 0;
    const savedProducts = [];
    for (const p of qualified) {
      try {
        // Check if we already have this product
        const exists = await Product.findOne({
          title: { $regex: new RegExp(p.title.substring(0, 30).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
        });
        if (exists) continue;

        // Calculate pricing
        const cost = p.costUsd || (p.priceAud ? p.priceAud / config.pricing.usdToAud * 0.4 : 0); // Estimate cost from retail
        const pricing = cost > 0 ? pricingEngine.calculatePrice(cost, cost * 0.15) : null;

        const product = new Product({
          title: p.title,
          category: p.category || 'uncategorized',
          costUsd: cost,
          shippingCostUsd: cost * 0.15,
          sellingPriceAud: pricing?.sellingPriceAud || 0,
          comparePriceAud: pricing?.comparePriceAud || 0,
          profitAud: pricing?.profitAud || 0,
          profitMarginPercent: pricing?.profitMarginPercent || 0,
          markupPercent: pricing?.markupPercent || 0,
          totalCostUsd: pricing?.totalCostUsd || 0,
          supplier: {
            platform: p.source === 'aliexpress_trending' ? 'aliexpress' : 'other',
            url: p.url || '',
            rating: p.rating || 0,
            totalOrders: p.orders || 0,
          },
          pipeline: {
            source: 'trendscout',
            discoveredAt: new Date(),
            researchScore: p.score,
            trendScore: p.score,
            approved: false,
          },
          tags: [p.source, p.category, 'trendscout'].filter(Boolean),
        });

        await product.save();
        savedProducts.push(product);
        saved++;
      } catch (err) {
        logger.warn(`TrendScout: Failed to save ${p.title}: ${err.message}`);
      }
    }

    const result = {
      discovered: allProducts.length,
      scored: qualified.length,
      saved,
      products: savedProducts,
    };

    logger.info(`TrendScout: Discovery complete — ${result.discovered} found, ${result.scored} qualified, ${result.saved} saved`);
    return result;
  }
}

module.exports = new TrendScout();
