import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api'),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token to requests if it exists in localStorage
API.interceptors.request.use(
  (config) => {
    // 1. Check if a role is explicitly requested via custom header
    const requestedRole = config.headers['X-Auth-Role'];
    
    let tokenKey = 'electrostore_customer_token';
    if (requestedRole === 'admin') {
      tokenKey = 'electrostore_admin_token';
    } else if (requestedRole === 'customer') {
      tokenKey = 'electrostore_customer_token';
    } else {
      // 2. Fall back to current page path
      const isAdminPath = window.location.pathname.startsWith('/admin');
      tokenKey = isAdminPath ? 'electrostore_admin_token' : 'electrostore_customer_token';
    }

    // Remove the custom header so it doesn't trigger CORS preflight issues or server complaints
    delete config.headers['X-Auth-Role'];

    const token = localStorage.getItem(tokenKey);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  adminLogin: (data) => API.post('/auth/admin/login', data),
  getMe: (role) => API.get('/auth/me', { headers: role ? { 'X-Auth-Role': role } : {} }),
  updateMe: (data) => API.put('/auth/me', data),
};

// Product endpoints
export const productAPI = {
  list: (params) => API.get('/products', { params }),
  categories: () => API.get('/products/categories'),
  detail: (id) => API.get(`/products/${id}`),
  create: (data) => API.post('/products', data),
  update: (id, data) => API.put(`/products/${id}`, data),
  delete: (id) => API.delete(`/products/${id}`),
  listOffers: () => API.get('/products/offers'),
  listAdvertisements: () => API.get('/products/advertisements'),
  listReviews: (id) => API.get(`/products/${id}/reviews`),
  addReview: (id, data) => API.post(`/products/${id}/reviews`, data),
};

// Cart endpoints
export const cartAPI = {
  get: () => API.get('/cart'),
  add: (product_id, quantity = 1) => API.post('/cart', { product_id, quantity }),
  update: (item_id, quantity) => API.put(`/cart/${item_id}`, { quantity }),
  remove: (item_id) => API.delete(`/cart/${item_id}`),
};

// Order endpoints
export const orderAPI = {
  create: (data) => API.post('/orders', data),
  list: () => API.get('/orders'),
  detail: (id) => API.get(`/orders/${id}`),
  cancel: (id) => API.post(`/orders/${id}/cancel`),
};

// Admin endpoints
export const adminAPI = {
  getStats: () => API.get('/admin/stats'),
  listOrders: (status) => API.get('/admin/orders', { params: { status } }),
  updateOrderStatus: (id, status) => API.put(`/admin/orders/${id}/status`, { status }),
  listCustomers: () => API.get('/admin/customers'),
  listOffers: () => API.get('/admin/offers'),
  createOffer: (data) => API.post('/admin/offers', data),
  updateOffer: (id, data) => API.put(`/admin/offers/${id}`, data),
  deleteOffer: (id) => API.delete(`/admin/offers/${id}`),
  listAdvertisements: () => API.get('/admin/advertisements'),
  createAdvertisement: (data) => API.post('/admin/advertisements', data),
  updateAdvertisement: (id, data) => API.put(`/admin/advertisements/${id}`, data),
  deleteAdvertisement: (id) => API.delete(`/admin/advertisements/${id}`),
};

export default API;
