const config = require('../../config');
const logger = require('../utils/logger');

class PricingEngine {
  constructor() {
    this.tiers = config.pricing.markupTiers;
    this.usdToAud = config.pricing.usdToAud;
    this.minProfitAud = config.pricing.minProfitAud;
    this.freeShippingThreshold = config.pricing.freeShippingThreshold;
  }

  /**
   * Calculate the full pricing breakdown for a product
   * @param {number} costUsd - Base product cost in USD
   * @param {number} shippingCostUsd - Shipping cost in USD
   * @param {object} options - Optional overrides
   * @returns {object} Complete pricing object
   */
  calculatePrice(costUsd, shippingCostUsd = 0, options = {}) {
    const totalCostUsd = costUsd + shippingCostUsd;
    const totalCostAud = totalCostUsd * this.usdToAud;

    // Determine markup tier
    const tier = this.tiers.find(t => costUsd <= t.maxCostUsd) || this.tiers[this.tiers.length - 1];
    let markupPercent = options.markupOverride || tier.markupPercent;

    // Calculate base selling price
    let sellingPriceAud = totalCostAud * (1 + markupPercent / 100);

    // Enforce minimum profit
    const minSellingPrice = totalCostAud + this.minProfitAud;
    if (sellingPriceAud < minSellingPrice) {
      sellingPriceAud = minSellingPrice;
      markupPercent = ((sellingPriceAud - totalCostAud) / totalCostAud) * 100;
    }

    // Apply psychological pricing
    sellingPriceAud = this.applyPsychologicalPricing(sellingPriceAud);

    // Calculate compare-at price (fake "was" price — 20-40% higher)
    const comparePriceAud = this.calculateComparePrice(sellingPriceAud);

    // Final calculations
    const profitAud = sellingPriceAud - totalCostAud;
    const profitMarginPercent = (profitAud / sellingPriceAud) * 100;

    return {
      costUsd,
      shippingCostUsd,
      totalCostUsd: Math.round(totalCostUsd * 100) / 100,
      totalCostAud: Math.round(totalCostAud * 100) / 100,
      sellingPriceAud: Math.round(sellingPriceAud * 100) / 100,
      comparePriceAud: Math.round(comparePriceAud * 100) / 100,
      profitAud: Math.round(profitAud * 100) / 100,
      profitMarginPercent: Math.round(profitMarginPercent * 10) / 10,
      markupPercent: Math.round(markupPercent * 10) / 10,
      qualifiesForFreeShipping: sellingPriceAud >= this.freeShippingThreshold,
      tier: `$${tier.maxCostUsd === Infinity ? '60+' : '0-' + tier.maxCostUsd} (${tier.markupPercent}%)`,
    };
  }

  /**
   * Round to psychologically appealing price points
   */
  applyPsychologicalPricing(price) {
    if (price < 10) {
      // Under $10: round to .95
      return Math.floor(price) + 0.95;
    } else if (price < 50) {
      // $10-50: round to .95 or .99
      return Math.floor(price) + 0.95;
    } else if (price < 100) {
      // $50-100: round to nearest $5 then subtract .01
      return Math.round(price / 5) * 5 - 0.01;
    } else {
      // $100+: round to nearest $10 then subtract .01
      return Math.round(price / 10) * 10 - 0.01;
    }
  }

  /**
   * Calculate a "compare at" / strikethrough price
   */
  calculateComparePrice(sellingPrice) {
    // 25-35% higher than selling price
    const multiplier = 1.25 + Math.random() * 0.10;
    let comparePrice = sellingPrice * multiplier;

    // Round compare price to clean number
    if (comparePrice < 50) {
      comparePrice = Math.ceil(comparePrice);
    } else if (comparePrice < 100) {
      comparePrice = Math.ceil(comparePrice / 5) * 5;
    } else {
      comparePrice = Math.ceil(comparePrice / 10) * 10;
    }

    return comparePrice;
  }

  /**
   * Adjust price based on competitor data
   */
  adjustForCompetitors(basePrice, competitors = []) {
    if (!competitors.length) return basePrice;

    const avgCompetitorPrice = competitors.reduce((sum, c) => sum + c.price, 0) / competitors.length;
    const minCompetitorPrice = Math.min(...competitors.map(c => c.price));

    // Strategy: price slightly below average, but never below our minimum profit
    let adjustedPrice = avgCompetitorPrice * 0.95; // 5% below average

    // Don't go below minimum competitor minus 10%
    const floor = minCompetitorPrice * 0.90;
    if (adjustedPrice < floor) adjustedPrice = floor;

    return this.applyPsychologicalPricing(adjustedPrice);
  }

  /**
   * Bulk price calculation for pipeline runs
   */
  calculateBulk(products) {
    return products.map(p => ({
      ...p,
      pricing: this.calculatePrice(p.costUsd, p.shippingCostUsd || 0),
    }));
  }

  /**
   * Update exchange rate (called by cron)
   */
  updateExchangeRate(newRate) {
    const oldRate = this.usdToAud;
    this.usdToAud = newRate;
    logger.info(`Exchange rate updated: ${oldRate} → ${newRate}`);
    return { oldRate, newRate };
  }
}

module.exports = new PricingEngine();
