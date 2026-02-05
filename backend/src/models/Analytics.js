const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  date: { type: Date, required: true, unique: true, index: true },

  // Revenue
  revenue: {
    totalAud: { type: Number, default: 0 },
    totalCostAud: { type: Number, default: 0 },
    profitAud: { type: Number, default: 0 },
    profitMarginPercent: { type: Number, default: 0 },
    avgOrderValueAud: { type: Number, default: 0 },
  },

  // Orders
  orders: {
    total: { type: Number, default: 0 },
    newOrders: { type: Number, default: 0 },
    fulfilled: { type: Number, default: 0 },
    cancelled: { type: Number, default: 0 },
    refunded: { type: Number, default: 0 },
  },

  // Products
  products: {
    totalActive: { type: Number, default: 0 },
    totalDraft: { type: Number, default: 0 },
    newDiscovered: { type: Number, default: 0 },
    newListed: { type: Number, default: 0 },
    lowStock: { type: Number, default: 0 },
    outOfStock: { type: Number, default: 0 },
  },

  // Pipeline
  pipeline: {
    runsCompleted: { type: Number, default: 0 },
    runsFailed: { type: Number, default: 0 },
    productsSourced: { type: Number, default: 0 },
  },

  // Traffic (from Shopify)
  traffic: {
    sessions: { type: Number, default: 0 },
    pageViews: { type: Number, default: 0 },
    uniqueVisitors: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Analytics', analyticsSchema);
