// API service for restaurant dashboard
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
    this.token = null;
    // Automatically load token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('authToken');
    }
  }

  // Binary request helper (Blob)
  async requestBlob(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = this.getHeaders();
    delete headers['Content-Type'];
    const config = {
      headers: {
        ...headers,
        Accept: options.accept || 'application/octet-stream',
      },
      ...options,
    };

    const response = await fetch(url, config);
    if (!response.ok) {
      throw new Error(`Request failed (${response.status})`);
    }
    return await response.blob();
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('authToken', token);
      } else {
        localStorage.removeItem('authToken');
      }
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
    }
  }

  // Get authentication headers
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Handle unauthorized responses
        if (response.status === 401) {
          this.clearToken();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          throw new Error('Authentication required');
        }
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // GET request
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  // POST request
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // PATCH request
  async patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Dashboard APIs
  async getDashboardStats(resID) {
    return this.get(`/subadmin/${resID}/dashboard`);
  }

  // Orders APIs
  // Public: place an order
  async placeOrder(orderPayload) {
    return this.post(`/orders/place`, orderPayload);
  }

  // Public: get order status by orderID
  async getOrderStatus(orderID) {
    return this.get(`/orders/status/${orderID}`);
  }

  // Public: get order details by orderID
  async getOrderDetails(orderID) {
    return this.get(`/orders/details/${orderID}`);
  }

  async getOrders(resID, params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return this.get(`/subadmin/${resID}/orders${queryParams ? `?${queryParams}` : ''}`);
  }

  async updateOrderStatus(resID, orderID, status, note = '') {
    return this.patch(`/subadmin/${resID}/orders/${orderID}/status`, { status, note });
  }

  async getActiveOrders(resID) {
    return this.get(`/orders/restaurant/${resID}/active`);
  }

  // Menu APIs
  // Public: get menu for scanning user by resID and qrID
  async getPublicMenu(resID, qrID) {
    return this.get(`/menu/${resID}/${qrID}`);
  }

  // Public: get menu items for a given category
  async getPublicMenuByCategory(resID, qrID, categoryName) {
    return this.get(`/menu/${resID}/${qrID}/category/${encodeURIComponent(categoryName)}`);
  }

  async getMenuItems(resID, params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return this.get(`/menu/subadmin/${resID}${queryParams ? `?${queryParams}` : ''}`);
  }

  async addMenuItem(resID, menuData) {
    return this.post(`/menu/subadmin/${resID}`, menuData);
  }

  async updateMenuItem(resID, menuID, menuData) {
    return this.put(`/menu/subadmin/${resID}/${menuID}`, menuData);
  }

  async toggleMenuItemAvailability(resID, menuID) {
    return this.patch(`/menu/subadmin/${resID}/${menuID}/toggle-availability`);
  }

  async deleteMenuItem(resID, menuID) {
    return this.delete(`/menu/subadmin/${resID}/${menuID}`);
  }

  async getMenuCategories(resID) {
    return this.get(`/menu/subadmin/${resID}/categories`);
  }

  // Category Management APIs
  async getCategories(resID, includeInactive = false) {
    return this.get(`/categories/subadmin/${resID}${includeInactive ? '?includeInactive=true' : ''}`);
  }

  async createCategory(resID, categoryData) {
    return this.post(`/categories/subadmin/${resID}`, categoryData);
  }

  async updateCategory(resID, categoryID, categoryData) {
    return this.put(`/categories/subadmin/${resID}/${categoryID}`, categoryData);
  }

  async toggleCategoryStatus(resID, categoryID) {
    return this.patch(`/categories/subadmin/${resID}/${categoryID}/toggle-status`);
  }

  async deleteCategory(resID, categoryID) {
    return this.delete(`/categories/subadmin/${resID}/${categoryID}`);
  }

  async reorderCategories(resID, categoryOrders) {
    return this.patch(`/categories/subadmin/${resID}/reorder`, { categoryOrders });
  }

  // Image Upload APIs
  async uploadImage(resID, imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    return this.request(`/upload/image/${resID}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        // Don't set Content-Type for FormData, let browser set it
      },
      body: formData,
    });
  }

  async deleteImage(resID, imageUrl) {
    return this.delete(`/upload/image/${resID}`, { imageUrl });
  }

  // QR Code APIs
  async getQRCodes(resID, params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return this.get(`/qr/${resID}${queryParams ? `?${queryParams}` : ''}`);
  }

  async createQRCode(resID, qrData) {
    return this.post(`/qr/${resID}`, qrData);
  }

  async updateQRCode(resID, qrID, qrData) {
    return this.put(`/qr/${resID}/${qrID}`, qrData);
  }

  async toggleQRCodeStatus(resID, qrID) {
    return this.patch(`/qr/${resID}/${qrID}/toggle-status`);
  }

  async deleteQRCode(resID, qrID) {
    return this.delete(`/qr/${resID}/${qrID}`);
  }

  async getQRCodeDetails(resID, qrID) {
    return this.get(`/qr/${resID}/${qrID}/details`);
  }

  async regenerateQRCode(resID, qrID) {
    return this.post(`/qr/${resID}/${qrID}/regenerate`);
  }

  // Download QR as PDF (blob)
  async downloadQRCodePDF(resID, qrID) {
    return this.requestBlob(`/qr/${resID}/${qrID}/pdf`, {
      method: 'GET',
      accept: 'application/pdf',
    });
  }

  // Admin APIs (for super admin features)
  async getRestaurants(page = 1, limit = 10) {
    return this.request(`/admin/restaurants?page=${page}&limit=${limit}`, 'GET');
  }

  // Public Banner API
  async getBanner(placement = 'all') {
    const qp = placement ? `?placement=${encodeURIComponent(placement)}` : '';
    return this.get(`/banner${qp}`);
  }

  async getRestaurantById(resID) {
    return this.request(`/admin/restaurants/${resID}`, 'GET');
  }

  async createRestaurant(restaurantData) {
    return this.post('/admin/restaurants', restaurantData);
  }

  async getRestaurantDetails(resID) {
    return this.get(`/admin/restaurants/${resID}`);
  }

  async updateRestaurant(resID, restaurantData) {
    return this.put(`/admin/restaurants/${resID}`, restaurantData);
  }

  async toggleRestaurantStatus(resID) {
    return this.patch(`/admin/restaurants/${resID}/toggle-status`);
  }

  async deleteRestaurant(resID) {
    return this.delete(`/admin/restaurants/${resID}`);
  }

  async resetRestaurantCredentials(resID) {
    return this.post(`/admin/restaurants/${resID}/reset-credentials`);
  }

  async getAdminDashboardStats() {
    return this.get('/admin/dashboard/stats');
  }

  // Authentication APIs
  async login(credentials) {
    return this.post('/auth/login', credentials);
  }

  async logout() {
    return this.post('/auth/logout');
  }

  async refreshToken() {
    return this.post('/auth/refresh');
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;
