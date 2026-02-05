const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  platform: { type: String, enum: ['aliexpress', 'cjdropshipping', 'spocket', 'other'], required: true },
  storeUrl: { type: String, default: '' },
  storeId: { type: String, default: '' },

  // Performance metrics
  metrics: {
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalOrders: { type: Number, default: 0 },
    responseTimeHours: { type: Number, default: 0 },
    shippingDays: { avg: Number, min: Number, max: Number },
    disputeRate: { type: Number, default: 0 },
    onTimeRate: { type: Number, default: 0 },
    qualityScore: { type: Number, default: 0, min: 0, max: 100 },
  },

  // Reliability tracking
  reliability: {
    totalOrdersPlaced: { type: Number, default: 0 },
    successfulOrders: { type: Number, default: 0 },
    failedOrders: { type: Number, default: 0 },
    avgFulfillmentDays: { type: Number, default: 0 },
    lastOrderDate: { type: Date, default: null },
  },

  // Products from this supplier
  productCount: { type: Number, default: 0 },

  // Status
  isActive: { type: Boolean, default: true },
  isBlacklisted: { type: Boolean, default: false },
  blacklistReason: { type: String, default: '' },

  notes: { type: String, default: '' },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Supplier', supplierSchema);
