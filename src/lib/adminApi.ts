// Admin API Client - Connects to XeriaCO Backend on Railway

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const getAdminPassword = () => {
  return localStorage.getItem('adminPassword') || '';
};

const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Password': getAdminPassword(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('adminPassword');
      window.location.href = '/admin/login';
      throw new Error('Unauthorized');
    }
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
};

export const adminApi = {
  // Dashboard
  getDashboard: () => fetchWithAuth('/api/admin/dashboard'),
  getTodayStats: () => fetchWithAuth('/api/analytics/today'),
  getAnalytics: (days: number) => fetchWithAuth(`/api/analytics/history?days=${days}`),

  // Products
  getProducts: (params = {}) => {
    const query = new URLSearchParams(params as any).toString();
    return fetchWithAuth(`/api/products?${query}`);
  },
  getProduct: (id: string) => fetchWithAuth(`/api/products/${id}`),
  createProduct: (data: any) => fetchWithAuth('/api/products', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateProduct: (id: string, data: any) => fetchWithAuth(`/api/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteProduct: (id: string) => fetchWithAuth(`/api/products/${id}`, {
    method: 'DELETE',
  }),
  syncToShopify: (id: string) => fetchWithAuth(`/api/products/${id}/sync-to-shopify`, {
    method: 'POST',
  }),
  bulkSync: (ids: string[]) => fetchWithAuth('/api/products/bulk-sync', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  }),
  approveProduct: (id: string) => fetchWithAuth(`/api/admin/products/${id}/approve`, {
    method: 'POST',
  }),
  rejectProduct: (id: string, reason: string) => fetchWithAuth(`/api/admin/products/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  }),

  // Orders
  getOrders: (params = {}) => {
    const query = new URLSearchParams(params as any).toString();
    return fetchWithAuth(`/api/orders?${query}`);
  },
  getOrder: (id: string) => fetchWithAuth(`/api/orders/${id}`),
  getOrderStats: () => fetchWithAuth('/api/orders/stats'),
  fulfillOrder: (id: string, tracking: any) => fetchWithAuth(`/api/orders/${id}/fulfill`, {
    method: 'POST',
    body: JSON.stringify(tracking),
  }),
  updateOrderStatus: (id: string, status: string, note?: string) => fetchWithAuth(`/api/orders/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, note }),
  }),
  reviewFraud: (id: string, action: 'approve' | 'cancel', note?: string) => fetchWithAuth(`/api/admin/orders/${id}/review-fraud`, {
    method: 'POST',
    body: JSON.stringify({ action, note }),
  }),

  // Pipeline
  getPipelineStatus: () => fetchWithAuth('/api/pipeline/status'),
  getPipelineHistory: (page = 1) => fetchWithAuth(`/api/pipeline/history?page=${page}`),
  runPipeline: (type = 'full') => fetchWithAuth('/api/pipeline/run', {
    method: 'POST',
    body: JSON.stringify({ type }),
  }),
  runTrendScout: () => fetchWithAuth('/api/pipeline/trend-scout', {
    method: 'POST',
  }),
  runSupplierSource: (limit?: number) => fetchWithAuth('/api/pipeline/supplier-source', {
    method: 'POST',
    body: JSON.stringify({ limit }),
  }),
  runAIEnrich: (limit?: number) => fetchWithAuth('/api/pipeline/ai-enrich', {
    method: 'POST',
    body: JSON.stringify({ limit }),
  }),
  runCompetitorScan: (limit?: number) => fetchWithAuth('/api/pipeline/competitor-scan', {
    method: 'POST',
    body: JSON.stringify({ limit }),
  }),
  syncAirtable: () => fetchWithAuth('/api/pipeline/airtable-sync', {
    method: 'POST',
  }),

  // System
  getSystemInfo: () => fetchWithAuth('/api/system-info'),
  updatePricingConfig: (config: any) => fetchWithAuth('/api/admin/config/pricing', {
    method: 'POST',
    body: JSON.stringify(config),
  }),

  // Analytics
  getSummary: () => fetchWithAuth('/api/analytics/summary'),
};
