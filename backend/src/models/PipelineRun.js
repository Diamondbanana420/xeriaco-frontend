const mongoose = require('mongoose');

const pipelineRunSchema = new mongoose.Schema({
  runId: { type: String, required: true, unique: true, index: true },
  type: { type: String, enum: ['full', 'trend_scout', 'price_update', 'inventory_check', 'competitor_scan'], required: true },

  status: {
    type: String,
    enum: ['queued', 'running', 'completed', 'failed', 'cancelled'],
    default: 'queued',
  },

  // Results
  results: {
    productsDiscovered: { type: Number, default: 0 },
    productsValidated: { type: Number, default: 0 },
    productsListed: { type: Number, default: 0 },
    productsRejected: { type: Number, default: 0 },
    pricesUpdated: { type: Number, default: 0 },
    errors: [{ stage: String, message: String, timestamp: Date }],
  },

  // Timing
  startedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  durationMs: { type: Number, default: 0 },

  // Trigger
  triggeredBy: { type: String, enum: ['cron', 'manual', 'clawdbot', 'webhook'], default: 'manual' },

  // Config used for this run
  config: { type: mongoose.Schema.Types.Mixed, default: {} },

  logs: [{ level: String, message: String, timestamp: { type: Date, default: Date.now } }],
}, {
  timestamps: true,
});

pipelineRunSchema.index({ createdAt: -1 });
pipelineRunSchema.index({ status: 1 });

module.exports = mongoose.model('PipelineRun', pipelineRunSchema);
