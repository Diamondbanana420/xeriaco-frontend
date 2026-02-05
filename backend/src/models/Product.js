const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  // Core identification
  title: { type: String, required: true, index: true },
  slug: { type: String, unique: true, index: true },
  description: { type: String, default: '' },
  descriptionHtml: { type: String, default: '' },

  // Shopify sync
  shopifyProductId: { type: String, default: null, index: true },
  shopifyVariantId: { type: String, default: null },
  shopifyHandle: { type: String, default: null },
  shopifyStatus: { type: String, enum: ['draft', 'active', 'archived'], default: 'draft' },
  lastSyncedToShopify: { type: Date, default: null },

  // Categorization
  category: { type: String, index: true },
  tags: [{ type: String }],
  productType: { type: String, default: '' },
  vendor: { type: String, default: 'XeriaCO' },

  // Pricing (all stored in USD internally)
  costUsd: { type: Number, required: true },
  shippingCostUsd: { type: Number, default: 0 },
  totalCostUsd: { type: Number, default: 0 },
  sellingPriceAud: { type: Number, default: 0 },
  comparePriceAud: { type: Number, default: null }, // strikethrough price
  profitAud: { type: Number, default: 0 },
  profitMarginPercent: { type: Number, default: 0 },
  markupPercent: { type: Number, default: 0 },

  // Supplier info
  supplier: {
    name: { type: String, default: '' },
    platform: { type: String, enum: ['aliexpress', 'cjdropshipping', 'spocket', 'other'], default: 'aliexpress' },
    url: { type: String, default: '' },
    productId: { type: String, default: '' },
    rating: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    shippingDays: { min: Number, max: Number },
    lastChecked: { type: Date, default: null },
  },

  // Inventory
  inventory: {
    tracked: { type: Boolean, default: false },
    quantity: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 10 },
  },

  // Images
  images: [{
    src: { type: String },
    alt: { type: String, default: '' },
    position: { type: Number, default: 0 },
  }],
  featuredImage: { type: String, default: '' },

  // SEO
  seo: {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
  },

  // Variants (weight, size, color etc)
  variants: [{
    title: { type: String },
    option1: { type: String },
    option2: { type: String },
    option3: { type: String },
    sku: { type: String },
    costUsd: { type: Number },
    sellingPriceAud: { type: Number },
    weight: { type: Number },
    weightUnit: { type: String, default: 'g' },
    shopifyVariantId: { type: String },
  }],

  // Pipeline tracking
  pipeline: {
    source: { type: String, default: '' }, // 'trendscout', 'manual', 'import'
    discoveredAt: { type: Date, default: Date.now },
    researchScore: { type: Number, default: 0, min: 0, max: 100 },
    trendScore: { type: Number, default: 0, min: 0, max: 100 },
    competitorCount: { type: Number, default: 0 },
    approved: { type: Boolean, default: false },
    approvedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: '' },
    runId: { type: String, default: '' },
  },

  // Fraud / quality flags
  flags: [{
    type: { type: String },
    message: { type: String },
    severity: { type: String, enum: ['low', 'medium', 'high'] },
    createdAt: { type: Date, default: Date.now },
  }],

  // Analytics
  analytics: {
    views: { type: Number, default: 0 },
    addToCart: { type: Number, default: 0 },
    purchases: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
  },

  // Metadata
  isActive: { type: Boolean, default: true },
  notes: { type: String, default: '' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for common queries
productSchema.index({ 'pipeline.researchScore': -1 });
productSchema.index({ 'profitMarginPercent': -1 });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ 'supplier.platform': 1 });

// Pre-save: compute derived pricing fields
productSchema.pre('save', function(next) {
  // Total cost
  this.totalCostUsd = this.costUsd + this.shippingCostUsd;

  // Generate slug if missing
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      + '-' + Date.now().toString(36);
  }

  next();
});

module.exports = mongoose.model('Product', productSchema);
