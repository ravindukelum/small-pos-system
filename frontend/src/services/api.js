import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Partners API
export const partnersAPI = {
  getAll: () => api.get('/partners'),
  getById: (id) => api.get(`/partners/${id}`),
  create: (data) => api.post('/partners', data),
  update: (id, data) => api.put(`/partners/${id}`, data),
  delete: (id) => api.delete(`/partners/${id}`),
};

// Investments API
export const investmentsAPI = {
  getAll: () => api.get('/investments'),
  getById: (id) => api.get(`/investments/${id}`),
  getByPartner: (partnerId) => api.get(`/investments/partner/${partnerId}`),
  create: (data) => api.post('/investments', data),
  update: (id, data) => api.put(`/investments/${id}`, data),
  delete: (id) => api.delete(`/investments/${id}`),
};

// Inventory API
export const inventoryAPI = {
  getAll: () => api.get('/inventory'),
  getById: (id) => api.get(`/inventory/${id}`),
  getBySku: (sku) => api.get(`/inventory/sku/${sku}`),
  search: (query) => api.get(`/inventory/search?q=${encodeURIComponent(query)}`),
  create: (data) => api.post('/inventory', data),
  update: (id, data) => api.put(`/inventory/${id}`, data),
  updateQuantity: (id, data) => api.patch(`/inventory/${id}/quantity`, data),
  delete: (id) => api.delete(`/inventory/${id}`),
};

// Sales API
export const salesAPI = {
  getAll: () => api.get('/sales'),
  getById: (id) => api.get(`/sales/${id}`),
  getByInvoice: (invoice) => api.get(`/sales/invoice/${invoice}`),
  getByStatus: (status) => api.get(`/sales/status/${status}`),
  create: (data) => api.post('/sales', data),
  update: (id, data) => api.put(`/sales/${id}`, data),
  updateStatus: (id, data) => api.patch(`/sales/${id}/status`, data),
  updatePayment: (id, data) => api.patch(`/sales/${id}/payment`, data),
  sendWhatsApp: (id, data) => api.post(`/sales/${id}/send-whatsapp`, data),
  delete: (id) => api.delete(`/sales/${id}`),
};

// Dashboard API
export const dashboardAPI = {
  getOverview: () => api.get('/dashboard/overview'),
  getRecentActivities: (limit = 10) => api.get(`/dashboard/recent-activities?limit=${limit}`),
  getSalesAnalytics: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/dashboard/sales-analytics?${queryString}`);
  },
  getTopSellingItems: (limit = 10) => api.get(`/dashboard/top-selling-items?limit=${limit}`),
  getLowStockAlerts: (threshold = 5) => api.get(`/dashboard/low-stock-alerts?threshold=${threshold}`),
};

// Returns API
export const returnsAPI = {
  getAll: () => api.get('/returns'),
  getById: (id) => api.get(`/returns/${id}`),
  getBySale: (saleId) => api.get(`/returns/sale/${saleId}`),
  create: (data) => api.post('/returns', data),
  update: (id, data) => api.put(`/returns/${id}`, data),
  delete: (id) => api.delete(`/returns/${id}`),
};

// Settings API
export const settingsAPI = {
  getSettings: () => api.get('/settings'),
  updateSettings: (data) => api.put('/settings', data),
};

export default api;