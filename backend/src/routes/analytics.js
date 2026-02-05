const express = require('express');
const router = express.Router();
const { Analytics, Order, Product, PipelineRun } = require('../models');
const config = require('../../config');
const logger = require('../utils/logger');

// GET /api/analytics/today
router.get('/today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orders = await Order.find({ createdAt: { $gte: today } });
    const revenue = orders.reduce((sum, o) => sum + (o.financials?.totalAud || 0), 0);
    const profit = orders.reduce((sum, o) => sum + (o.financials?.profitAud || 0), 0);
    const productsListed = await Product.countDocuments({ 'lastSyncedToShopify': { $gte: today } });

    res.json({
      date: today.toISOString().split('T')[0],
      orders: orders.length,
      revenue: Math.round(revenue * 100) / 100,
      profit: Math.round(profit * 100) / 100,
      margin: revenue > 0 ? Math.round((profit / revenue) * 10000) / 100 : 0,
      avgOrderValue: orders.length > 0 ? Math.round((revenue / orders.length) * 100) / 100 : 0,
      productsListed,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/history — Daily snapshots
router.get('/history', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const snapshots = await Analytics.find({ date: { $gte: since } }).sort({ date: -1 }).lean();
    res.json(snapshots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/summary — Overall business summary
router.get('/summary', async (req, res) => {
  try {
    const [totalOrders, totalProducts, totalRevenue, totalProfit] = await Promise.all([
      Order.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Order.aggregate([{ $group: { _id: null, total: { $sum: '$financials.totalAud' } } }]),
      Order.aggregate([{ $group: { _id: null, total: { $sum: '$financials.profitAud' } } }]),
    ]);

    const pipelineStats = await PipelineRun.aggregate([
      { $match: { status: 'completed' } },
      { $group: {
        _id: null,
        totalRuns: { $sum: 1 },
        totalListed: { $sum: '$results.productsListed' },
        avgDuration: { $avg: '$durationMs' },
      }},
    ]);

    res.json({
      totalOrders,
      totalProducts,
      totalRevenue: totalRevenue[0]?.total || 0,
      totalProfit: totalProfit[0]?.total || 0,
      pipeline: pipelineStats[0] || { totalRuns: 0, totalListed: 0, avgDuration: 0 },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
