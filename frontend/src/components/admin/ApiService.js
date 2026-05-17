// API Configuration and Axios Instance
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = null;
    this.refreshToken = null;
    this.isRefreshing = false;
    this.failedQueue = [];
    
    this.instance = this.createAxiosInstance();
    this.setupInterceptors();
  }

  createAxiosInstance() {
    const axios = require('axios');
    return axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  }

  setupInterceptors() {
    // Request interceptor
    this.instance.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (originalRequest.url.includes('/auth/')) {
            return Promise.reject(error);
          }

          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then(token => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.instance(originalRequest);
            }).catch(err => {
              return Promise.reject(err);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const newToken = await this.refreshAccessToken();
            this.processQueue(null, newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.instance(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            if (refreshError.response?.status === 401) {
              this.logout();
            }
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  processQueue(error, token = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
    this.failedQueue = [];
  }

  setToken(token, refreshToken = null) {
    this.token = token;
    this.refreshToken = refreshToken;
    if (typeof window !== 'undefined') {
      localStorage.setItem('adminToken', token);
      if (refreshToken) {
        localStorage.setItem('adminRefreshToken', refreshToken);
      }
    }
  }

  getToken() {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      // Prefer the admin token; fall back to legacy key if present
      const token = localStorage.getItem('authToken');
      if (token) {
        this.token = token;
      }
      return token;
    }
    return null;
  }

  getRefreshToken() {
    if (this.refreshToken) return this.refreshToken;
    if (typeof window !== 'undefined') {
      const refreshToken = localStorage.getItem('adminRefreshToken');
      if (refreshToken) {
        this.refreshToken = refreshToken;
      }
      return refreshToken;
    }
    return null;
  }

  async refreshAccessToken() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await this.instance.post('/auth/refresh', { 
        refreshToken 
      });
      
      const { token, refreshToken: newRefreshToken } = response.data;
      this.setToken(token, newRefreshToken || refreshToken);
      return token;
    } catch (error) {
      this.clearTokens();
      throw error;
    }
  }

  clearTokens() {
    this.token = null;
    this.refreshToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminRefreshToken');
    }
  }

  logout() {
    this.clearTokens();
    if (typeof window !== 'undefined') {
      window.location.replace('/login');
    }
  }

  isAuthenticated() {
    return !!this.getToken();
  }

  // API Methods
  async login(adminId, password) {
    try {
      const response = await this.instance.post('/auth/superadmin/login', {
        adminId,
        password
      });
      
      if (response.data.success) {
        const { token, refreshToken } = response.data;
        this.setToken(token, refreshToken);
        return response.data;
      }
      throw new Error(response.data.message || 'Login failed');
    } catch (error) {
      this.clearTokens();
      throw error;
    }
  }

  async getDashboardStats() {
    const response = await this.instance.get('/admin/dashboard/stats');
    return response.data.data;
  }

  async getRestaurants(page = 1, limit = 10, search = '') {
    const params = new URLSearchParams({ 
      page: page.toString(), 
      limit: limit.toString() 
    });
    if (search) params.append('search', search);
    
    const response = await this.instance.get(`/admin/restaurants?${params}`);
    return response.data;
  }

  async createRestaurant(restaurantData) {
    const response = await this.instance.post('/admin/restaurants', restaurantData);
    return response.data;
  }

  async updateRestaurant(restaurantId, updateData) {
    const response = await this.instance.put(`/admin/restaurants/${restaurantId}`, updateData);
    return response.data;
  }

  async deleteRestaurant(restaurantId) {
    const response = await this.instance.delete(`/admin/restaurants/${restaurantId}`);
    return response.data;
  }

  async toggleRestaurantStatus(restaurantId) {
    const response = await this.instance.patch(`/admin/restaurants/${restaurantId}/toggle-status`);
    return response.data;
  }

  async resetRestaurantCredentials(restaurantId) {
    const response = await this.instance.post(`/admin/restaurants/${restaurantId}/reset-credentials`);
    return response.data;
  }

  async exportRestaurantData(restaurantId, format = 'csv') {
    const response = await this.instance.get(`/admin/restaurants/${restaurantId}/export?format=${format}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async createCoupon(couponData) {
    const response = await this.instance.post('/admin/coupons', couponData);
    return response.data;
  }

  async getBugReports() {
    const response = await this.instance.get('/admin/bugs');
    return response.data.data;
  }

  async updateBugStatus(bugId, status) {
    const response = await this.instance.patch(`/admin/bugs/${bugId}`, { status });
    return response.data;
  }

  // Banner API methods
  async getBanner(placement = 'all') {
    const response = await this.instance.get(`/banner`, { params: { placement } });
    return response.data?.data || null;
  }

  async uploadBanner({ file, placement = 'all', isActive = true, title = '' }) {
    const form = new FormData();
    form.append('banner', file);
    form.append('placement', placement);
    form.append('isActive', String(isActive));
    form.append('title', title);
    const response = await this.instance.post('/banner', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  // Location API methods
  async getStates() {
    const response = await this.instance.get('/admin/location/states');
    return response.data;
  }

  async getCities(state) {
    const response = await this.instance.get(`/admin/location/cities/${encodeURIComponent(state)}`);
    return response.data;
  }

  async getAreas(city) {
    const response = await this.instance.get(`/admin/location/areas/${encodeURIComponent(city)}`);
    return response.data;
  }

  async sendRestaurantCredentials(restaurantData) {
    const response = await this.instance.post('/admin/send-credentials', {
      restaurantData
    });
    return response.data;
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;
