const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // Shopify order data
  shopifyOrderId: { type: String, required: true, unique: true, index: true },
  shopifyOrderNumber: { type: String, index: true },
  shopifyOrderName: { type: String }, // e.g. "#1001"

  // Status pipeline
  status: {
    type: String,
    enum: ['new', 'processing', 'sourced', 'shipped', 'delivered', 'cancelled', 'refunded', 'disputed'],
    default: 'new',
    index: true,
  },
  statusHistory: [{
    status: String,
    changedAt: { type: Date, default: Date.now },
    note: String,
  }],

  // Customer (minimal — full PII stays in Shopify)
  customer: {
    shopifyCustomerId: { type: String },
    email: { type: String },
    firstName: { type: String },
    lastName: { type: String },
    country: { type: String },
    state: { type: String },
  },

  // Line items
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    shopifyProductId: { type: String },
    shopifyVariantId: { type: String },
    title: { type: String },
    variantTitle: { type: String },
    quantity: { type: Number },
    priceAud: { type: Number },
    costUsd: { type: Number },
    sku: { type: String },
  }],

  // Financials
  financials: {
    subtotalAud: { type: Number, default: 0 },
    shippingAud: { type: Number, default: 0 },
    taxAud: { type: Number, default: 0 },
    totalAud: { type: Number, default: 0 },
    totalCostUsd: { type: Number, default: 0 },
    totalCostAud: { type: Number, default: 0 },
    profitAud: { type: Number, default: 0 },
    profitMarginPercent: { type: Number, default: 0 },
  },

  // Fulfillment
  fulfillment: {
    supplierOrderId: { type: String, default: '' },
    supplierPlatform: { type: String, default: '' },
    trackingNumber: { type: String, default: '' },
    trackingUrl: { type: String, default: '' },
    carrier: { type: String, default: '' },
    shippedAt: { type: Date, default: null },
    estimatedDelivery: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    shopifyFulfillmentId: { type: String, default: '' },
  },

  // Fraud scoring
  fraud: {
    score: { type: Number, default: 0, min: 0, max: 100 },
    flags: [{ type: String }],
    reviewed: { type: Boolean, default: false },
    reviewedAt: { type: Date, default: null },
    reviewNote: { type: String, default: '' },
  },

  // Timestamps from Shopify
  shopifyCreatedAt: { type: Date },
  shopifyUpdatedAt: { type: Date },

  // Notes
  notes: { type: String, default: '' },
  tags: [{ type: String }],
}, {
  timestamps: true,
});

// Indexes
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'customer.email': 1 });
orderSchema.index({ 'fraud.score': -1 });
orderSchema.index({ status: 1, createdAt: -1 });

// Pre-save: calculate profit
orderSchema.pre('save', function(next) {
  if (this.financials.totalAud && this.financials.totalCostAud) {
    this.financials.profitAud = this.financials.totalAud - this.financials.totalCostAud;
    this.financials.profitMarginPercent = this.financials.totalAud > 0
      ? ((this.financials.profitAud / this.financials.totalAud) * 100)
      : 0;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
