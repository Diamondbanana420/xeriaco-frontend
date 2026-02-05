const config = require('../../config');
const logger = require('../utils/logger');
const axios = require('axios');

/**
 * WooCommerceService - Direct WooCommerce REST API Integration
 */
class WooCommerceService {
    constructor() {
          this.baseUrl = config.woocommerce?.url || process.env.WOOCOMMERCE_URL;
          this.consumerKey = config.woocommerce?.consumerKey || process.env.WOOCOMMERCE_CONSUMER_KEY;
          this.consumerSecret = config.woocommerce?.consumerSecret || process.env.WOOCOMMERCE_CONSUMER_SECRET;
          this.version = 'wc/v3';
    }

  getAuthParams() {
        return {
                consumer_key: this.consumerKey,
                consumer_secret: this.consumerSecret
        };
  }

  async request(endpoint, method = 'GET', data = null) {
        const url = `${this.baseUrl}/wp-json/${this.version}/${endpoint}`;
        try {
                const response = await axios({
                          method,
                          url,
                          params: method === 'GET' ? { ...this.getAuthParams(), ...data } : this.getAuthParams(),
                          data: method !== 'GET' ? data : undefined,
                          headers: { 'Content-Type': 'application/json' }
                });
                return response.data;
        } catch (error) {
                logger.error(`WooCommerce API Error: ${error.message}`);
                throw error;
        }
  }

  async testConnection() {
        try {
                const result = await this.request('system_status');
                return { connected: true, store: result.environment?.site_url };
        } catch (error) {
                return { connected: false, error: error.message };
        }
  }

  async listProducts(params = {}) {
        return this.request('products', 'GET', { per_page: params.limit || 100, page: params.page || 1, ...params });
  }

  async getProduct(productId) {
        return this.request(`products/${productId}`);
  }

  async createProduct(productData) {
        return this.request('products', 'POST', productData);
  }

  async updateProduct(productId, productData) {
        return this.request(`products/${productId}`, 'PUT', productData);
  }

  async deleteProduct(productId) {
        return this.request(`products/${productId}`, 'DELETE', { force: true });
  }

  async getProductCount() {
        const response = await this.request('reports/products/totals');
        return response.reduce((total, item) => total + item.total, 0);
  }

  async listOrders(params = {}) {
        return this.request('orders', 'GET', { per_page: params.limit || 100, page: params.page || 1, ...params });
  }

  async getOrder(orderId) {
        return this.request(`orders/${orderId}`);
  }

  async createOrder(orderData) {
        return this.request('orders', 'POST', orderData);
  }

  async listCustomers(params = {}) {
        return this.request('customers', 'GET', { per_page: params.limit || 100, ...params });
  }

  async listCategories(params = {}) {
        return this.request('products/categories', 'GET', params);
  }

  async getSalesReport(params = {}) {
        return this.request('reports/sales', 'GET', params);
  }
}

module.exports = new WooCommerceService();
