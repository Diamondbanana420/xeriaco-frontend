require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT) || 3001,
  env: process.env.NODE_ENV || 'production',
  apiPrefix: process.env.API_PREFIX || '/api',

  // Railway injects MONGODB_URL for its provisioned MongoDB
  // Falls back to MONGODB_URI for manual config
  mongo: {
uri: process.env.MONGO_URL || process.env.MONGODB_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/xeriaco',    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    }
  },

  shopify: {
    storeName: process.env.SHOPIFY_STORE_NAME || '',
    apiKey: process.env.SHOPIFY_API_KEY || '',
    apiSecret: process.env.SHOPIFY_API_SECRET || '',
    accessToken: process.env.SHOPIFY_ACCESS_TOKEN || '',
    webhookSecret: process.env.SHOPIFY_WEBHOOK_SECRET || '',
    apiVersion: '2024-01',
    rateLimitDelay: 500, // ms between API calls
  },

  pricing: {
    defaultMarkup: parseFloat(process.env.DEFAULT_MARKUP_PERCENT) || 45,
    minProfitAud: parseFloat(process.env.MIN_PROFIT_MARGIN_AUD) || 8.0,
    usdToAud: parseFloat(process.env.USD_TO_AUD_RATE) || 1.55,
    freeShippingThreshold: parseFloat(process.env.FREE_SHIPPING_THRESHOLD_AUD) || 80.0,
    // Tiered markup: lower cost items get higher markup
    markupTiers: [
      { maxCostUsd: 5, markupPercent: 120 },
      { maxCostUsd: 15, markupPercent: 80 },
      { maxCostUsd: 30, markupPercent: 60 },
      { maxCostUsd: 60, markupPercent: 45 },
      { maxCostUsd: Infinity, markupPercent: 35 },
    ],
    // Psychological pricing: round to .95 or .99
    psychologicalEndings: [0.95, 0.99],
  },

  clawdbot: {
    webhookUrl: process.env.CLAWDBOT_WEBHOOK_URL || '',
    apiKey: process.env.CLAWDBOT_API_KEY || '',
    discordChannelId: process.env.DISCORD_ALERT_CHANNEL_ID || '1467990957629640850',
  },

  // Auto-detect Railway public domain for callbacks
  backendUrl: process.env.BACKEND_URL
    || (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : ''),

  pipeline: {
    maxProductsPerRun: parseInt(process.env.MAX_PRODUCTS_PER_RUN) || 50,
    scrapeDelayMs: parseInt(process.env.SCRAPE_DELAY_MS) || 2500,
    defaultProductStatus: process.env.PRODUCT_DEFAULT_STATUS || 'draft',
    userAgents: [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/121.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/121.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/121.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/17.2',
    ],
  },

  admin: {
    password: process.env.ADMIN_PASSWORD || 'xeriaco2026',
  },

  airtable: {
    apiKey: process.env.AIRTABLE_API_KEY || '',
    baseId: process.env.AIRTABLE_BASE_ID || '',
    syncEnabled: process.env.AIRTABLE_SYNC_ENABLED === 'true',
    tables: {
      products: process.env.AIRTABLE_PRODUCTS_TABLE || 'Products',
      orders: process.env.AIRTABLE_ORDERS_TABLE || 'Orders',
      suppliers: process.env.AIRTABLE_SUPPLIERS_TABLE || 'Suppliers',
      analytics: process.env.AIRTABLE_ANALYTICS_TABLE || 'Analytics',
    },
  },

  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929',
    maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS) || 1024,
  },

  n8n: {
    webhookBaseUrl: process.env.N8N_WEBHOOK_BASE_URL || '',
    apiKey: process.env.N8N_API_KEY || '',
    workflows: {
      newOrder: process.env.N8N_WORKFLOW_NEW_ORDER || '',
      pipelineComplete: process.env.N8N_WORKFLOW_PIPELINE_COMPLETE || '',
      lowStock: process.env.N8N_WORKFLOW_LOW_STOCK || '',
      supplierOrder: process.env.N8N_WORKFLOW_SUPPLIER_ORDER || '',
    },
  },

  competitors: {
    scrapeEnabled: process.env.COMPETITOR_SCRAPE_ENABLED === 'true',
    scrapeIntervalHours: parseInt(process.env.COMPETITOR_SCRAPE_INTERVAL_HOURS) || 12,
    maxCompetitorsPerProduct: parseInt(process.env.MAX_COMPETITORS_PER_PRODUCT) || 5,
    autoPriceAdjust: process.env.COMPETITOR_AUTO_PRICE_ADJUST === 'true',
  },

  trendScout: {
    enabled: process.env.TRENDSCOUT_ENABLED === 'true',
    maxProductsPerScan: parseInt(process.env.TRENDSCOUT_MAX_PRODUCTS) || 20,
    minTrendScore: parseInt(process.env.TRENDSCOUT_MIN_SCORE) || 50,
    categories: (process.env.TRENDSCOUT_CATEGORIES || 'tech,home,lifestyle,fashion,fitness').split(','),
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

module.exports = config;
