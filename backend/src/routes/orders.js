const express = require('express');
const router = express.Router();
const { Order } = require('../models');
const orderProcessor = require('../services/OrderProcessor');
const logger = require('../utils/logger');

// GET /api/orders
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [orders, total] = await Promise.all([
      Order.find(filter).sort(sort).skip(skip).limit(parseInt(limit)).lean(),
      Order.countDocuments(filter),
    ]);

    res.json({
      orders,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/stats
router.get('/stats', async (req, res) => {
  try {
    const stats = await orderProcessor.getStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/:id
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.productId');
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/orders/:id/fulfill
router.post('/:id/fulfill', async (req, res) => {
  try {
    const { trackingNumber, trackingUrl, carrier, supplierOrderId, supplierPlatform } = req.body;
    if (!trackingNumber) return res.status(400).json({ error: 'trackingNumber is required' });

    const order = await orderProcessor.fulfillOrder(req.params.id, {
      trackingNumber,
      trackingUrl,
      carrier,
      supplierOrderId,
      supplierPlatform,
    });

    res.json({ success: true, order });
  } catch (err) {
    logger.error('Fulfillment error', { orderId: req.params.id, error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/orders/:id/status
router.put('/:id/status', async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    order.status = status;
    order.statusHistory.push({ status, changedAt: new Date(), note: note || '' });
    await order.save();

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/fraud/flagged — Get high fraud orders
router.get('/fraud/flagged', async (req, res) => {
  try {
    const flagged = await Order.find({ 'fraud.score': { $gte: 30 }, 'fraud.reviewed': false })
      .sort({ 'fraud.score': -1 })
      .limit(50)
      .lean();
    res.json(flagged);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
