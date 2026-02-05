const logger = require('../utils/logger');

class FraudScorer {
  /**
   * Score an order for fraud risk (0-100, higher = more risky)
   * @param {object} order - Shopify order data
   * @returns {object} { score, flags, recommendation }
   */
  score(order) {
    const flags = [];
    let score = 0;

    // ─── Email checks ───
    const email = (order.email || '').toLowerCase();
    if (email.includes('+')) {
      flags.push('Email contains + alias');
      score += 10;
    }
    if (email.endsWith('.ru') || email.endsWith('.cn')) {
      flags.push('High-risk email domain');
      score += 15;
    }
    const disposableDomains = ['tempmail', 'guerrilla', 'throwaway', 'mailinator', 'yopmail', 'sharklasers'];
    if (disposableDomains.some(d => email.includes(d))) {
      flags.push('Disposable email detected');
      score += 25;
    }

    // ─── Address checks ───
    const billing = order.billing_address || {};
    const shipping = order.shipping_address || {};

    if (billing.country_code && shipping.country_code && billing.country_code !== shipping.country_code) {
      flags.push('Billing/shipping country mismatch');
      score += 20;
    }

    if (billing.city && shipping.city && billing.city.toLowerCase() !== shipping.city.toLowerCase()) {
      flags.push('Billing/shipping city mismatch');
      score += 10;
    }

    // High-risk shipping countries (for AU-based dropshipping)
    const highRiskCountries = ['NG', 'GH', 'PK', 'BD'];
    if (highRiskCountries.includes(shipping.country_code)) {
      flags.push(`High-risk shipping country: ${shipping.country_code}`);
      score += 20;
    }

    // ─── Order value checks ───
    const totalPrice = parseFloat(order.total_price || 0);
    if (totalPrice > 500) {
      flags.push(`High order value: $${totalPrice}`);
      score += 15;
    }
    if (totalPrice > 1000) {
      flags.push(`Very high order value: $${totalPrice}`);
      score += 15; // Additional
    }

    // ─── Quantity checks ───
    const totalItems = (order.line_items || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
    if (totalItems > 10) {
      flags.push(`Bulk order: ${totalItems} items`);
      score += 10;
    }

    // ─── Multiple orders same email ───
    // This would need DB lookup — flag for external check
    if (order._recentOrderCount && order._recentOrderCount > 3) {
      flags.push(`${order._recentOrderCount} orders in last 24h from same email`);
      score += 20;
    }

    // ─── Name checks ───
    const firstName = (billing.first_name || '').trim();
    const lastName = (billing.last_name || '').trim();
    if (firstName.length === 1 || lastName.length === 1) {
      flags.push('Single-character name');
      score += 10;
    }

    // ─── IP / browser checks (if available) ───
    if (order.browser_ip) {
      // Could integrate with IP reputation API
      flags.push(`Browser IP: ${order.browser_ip}`);
    }

    // Cap at 100
    score = Math.min(score, 100);

    // Recommendation
    let recommendation;
    if (score >= 60) {
      recommendation = 'HOLD — Manual review required';
    } else if (score >= 30) {
      recommendation = 'CAUTION — Monitor fulfillment';
    } else {
      recommendation = 'OK — Process normally';
    }

    logger.info(`Fraud score for order ${order.id || 'unknown'}: ${score}`, { flags });

    return { score, flags, recommendation };
  }
}

module.exports = new FraudScorer();
