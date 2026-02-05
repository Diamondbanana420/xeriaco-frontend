const express = require('express');
const router = express.Router();
const woocommerceService = require('../services/WooCommerceService');

// GET /api/woocommerce/status
router.get('/status', async (req, res) => {
    try {
          const status = await woocommerceService.testConnection();
          res.json(status);
    } catch (err) {
          res.json({ connected: false, error: err.message });
    }
});

// GET /api/woocommerce/products - List all products
router.get('/products', async (req, res) => {
    try {
          const products = await woocommerceService.listProducts(req.query);
          res.json(products);
    } catch (err) {
          res.status(500).json({ error: err.message });
    }
});

// GET /api/woocommerce/products/:id - Get single product
router.get('/products/:id', async (req, res) => {
    try {
          const product = await woocommerceService.getProduct(req.params.id);
          res.json(product);
    } catch (err) {
          res.status(500).json({ error: err.message });
    }
});

// POST /api/woocommerce/products - Create product
router.post('/products', async (req, res) => {
    try {
          const product = await woocommerceService.createProduct(req.body);
          res.json(product);
    } catch (err) {
          res.status(500).json({ error: err.message });
    }
});

// PUT /api/woocommerce/products/:id - Update product
router.put('/products/:id', async (req, res) => {
    try {
          const product = await woocommerceService.updateProduct(req.params.id, req.body);
          res.json(product);
    } catch (err) {
          res.status(500).json({ error: err.message });
    }
});

// DELETE /api/woocommerce/products/:id - Delete product
router.delete('/products/:id', async (req, res) => {
    try {
          await woocommerceService.deleteProduct(req.params.id);
          res.json({ success: true });
    } catch (err) {
          res.status(500).json({ error: err.message });
    }
});

// GET /api/woocommerce/product-count
router.get('/product-count', async (req, res) => {
    try {
          const count = await woocommerceService.getProductCount();
          res.json({ count });
    } catch (err) {
          res.status(500).json({ error: err.message });
    }
});

// GET /api/woocommerce/orders - List orders
router.get('/orders', async (req, res) => {
    try {
          const orders = await woocommerceService.listOrders(req.query);
          res.json(orders);
    } catch (err) {
          res.status(500).json({ error: err.message });
    }
});

// POST /api/woocommerce/orders - Create order
router.post('/orders', async (req, res) => {
    try {
          const order = await woocommerceService.createOrder(req.body);
          res.json(order);
    } catch (err) {
          res.status(500).json({ error: err.message });
    }
});

// GET /api/woocommerce/categories
router.get('/categories', async (req, res) => {
    try {
          const categories = await woocommerceService.listCategories(req.query);
          res.json(categories);
    } catch (err) {
          res.status(500).json({ error: err.message });
    }
});

// GET /api/woocommerce/customers
router.get('/customers', async (req, res) => {
    try {
          const customers = await woocommerceService.listCustomers(req.query);
          res.json(customers);
    } catch (err) {
          res.status(500).json({ error: err.message });
    }
});

// GET /api/woocommerce/reports/sales
router.get('/reports/sales', async (req, res) => {
    try {
          const report = await woocommerceService.getSalesReport(req.query);
          res.json(report);
    } catch (err) {
          res.status(500).json({ error: err.message });
    }
});

module.exports = router;
