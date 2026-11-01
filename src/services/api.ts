import type {
  Product,
  CategoryInfo,
  Order,
  Coupon,
  Review,
  StoreSettings,
  PincodeInfo,
  ShippingAddress,
} from '../types/index.ts';

const API_BASE = '/api';

export const api = {
  // Settings
  async getSettings(): Promise<StoreSettings> {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to load store settings');
    return res.json();
  },

  async updateSettings(token: string, settings: Partial<StoreSettings>): Promise<StoreSettings> {
    const res = await fetch(`${API_BASE}/admin/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(settings),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update settings');
    }
    const data = await res.json();
    return data.settings;
  },

  // Products
  async getProducts(params?: {
    search?: string;
    category?: string;
    sort?: string;
    in_stock?: boolean;
  }): Promise<Product[]> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.category) searchParams.set('category', params.category);
    if (params?.sort) searchParams.set('sort', params.sort);
    if (params?.in_stock) searchParams.set('in_stock', 'true');

    const res = await fetch(`${API_BASE}/products?${searchParams.toString()}`);
    if (!res.ok) throw new Error('Failed to load products');
    return res.json();
  },

  async getProduct(idOrSlug: string): Promise<Product> {
    const res = await fetch(`${API_BASE}/products/${idOrSlug}`);
    if (!res.ok) throw new Error('Product not found');
    return res.json();
  },

  async createProduct(token: string, product: Partial<Product>): Promise<Product> {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(product),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create product');
    }
    return res.json();
  },

  async updateProduct(token: string, id: string, product: Partial<Product>): Promise<Product> {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(product),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update product');
    }
    return res.json();
  },

  async deleteProduct(token: string, id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to delete product');
    return true;
  },

  // Categories
  async getCategories(): Promise<CategoryInfo[]> {
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) throw new Error('Failed to load categories');
    return res.json();
  },

  // Coupons
  async validateCoupon(code: string, subtotal: number): Promise<{
    valid: boolean;
    code: string;
    description: string;
    discountType: string;
    discountAmount: number;
  }> {
    const res = await fetch(
      `${API_BASE}/coupons/validate?code=${encodeURIComponent(code)}&subtotal=${subtotal}`
    );
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Invalid coupon code');
    }
    return res.json();
  },

  async getCoupons(token: string): Promise<Coupon[]> {
    const res = await fetch(`${API_BASE}/coupons`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to load coupons');
    return res.json();
  },

  async createCoupon(token: string, coupon: Partial<Coupon>): Promise<Coupon> {
    const res = await fetch(`${API_BASE}/coupons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(coupon),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create coupon');
    }
    return res.json();
  },

  async deleteCoupon(token: string, code: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/coupons/${code}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  },

  // Order Calculations
  async calculateOrder(items: { productId: string; quantity: number }[], couponCode?: string) {
    const res = await fetch(`${API_BASE}/orders/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, couponCode }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to calculate order');
    }
    return res.json();
  },

  // Pincode validation
  async checkPincode(pincode: string): Promise<PincodeInfo> {
    const res = await fetch(`${API_BASE}/pincode/check/${encodeURIComponent(pincode)}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Invalid Indian PIN code');
    }
    return res.json();
  },

  // Razorpay Checkout
  async createRazorpayOrder(data: {
    customer: ShippingAddress;
    items: { productId: string; quantity: number }[];
    couponCode?: string;
  }) {
    const res = await fetch(`${API_BASE}/razorpay/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to initialize payment');
    }
    return res.json();
  },

  async verifyRazorpayPayment(data: {
    orderId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature?: string;
    isTestSimulated?: boolean;
  }) {
    const res = await fetch(`${API_BASE}/razorpay/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Payment signature verification failed');
    }
    return res.json();
  },

  // Cash on Delivery
  async createCodOrder(data: {
    customer: ShippingAddress;
    items: { productId: string; quantity: number }[];
    couponCode?: string;
  }): Promise<{ success: boolean; order: Order }> {
    const res = await fetch(`${API_BASE}/orders/cod`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to place COD order');
    }
    return res.json();
  },

  // Order Details & Tracking
  async getOrder(idOrNumber: string): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders/${idOrNumber}`);
    if (!res.ok) throw new Error('Order not found');
    return res.json();
  },

  async trackOrder(orderNumber: string, contact?: string): Promise<Order> {
    const params = new URLSearchParams({ orderNumber });
    if (contact) params.set('contact', contact);
    const res = await fetch(`${API_BASE}/orders/track/lookup?${params.toString()}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Order tracking record not found');
    }
    return res.json();
  },

  // Admin Order Management
  async getAdminOrders(token: string, status?: string, payment?: string): Promise<Order[]> {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (payment) params.set('payment', payment);
    const res = await fetch(`${API_BASE}/admin/orders?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to load orders');
    return res.json();
  },

  async updateAdminOrderStatus(
    token: string,
    orderId: string,
    updates: {
      fulfillmentStatus?: string;
      paymentStatus?: string;
      courierName?: string;
      trackingNumber?: string;
      trackingUrl?: string;
      note?: string;
    }
  ): Promise<Order> {
    const res = await fetch(`${API_BASE}/admin/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update order status');
    return res.json();
  },

  async getAdminStats(token: string) {
    const res = await fetch(`${API_BASE}/admin/dashboard-stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch dashboard metrics');
    return res.json();
  },

  // Admin Auth
  async checkAdminSetup(): Promise<{ hasAdmin: boolean }> {
    const res = await fetch(`${API_BASE}/admin/check-setup`);
    return res.json();
  },

  async setupAdmin(username: string, password: string) {
    const res = await fetch(`${API_BASE}/admin/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to setup admin');
    }
    return res.json();
  },

  async loginAdmin(username: string, password: string) {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Invalid credentials');
    }
    return res.json();
  },

  // Support & Engagement
  async sendContact(data: { name: string; email: string; phone?: string; subject?: string; message: string }) {
    const res = await fetch(`${API_BASE}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to send message');
    }
    return res.json();
  },

  async subscribeNewsletter(email: string, consent: boolean) {
    const res = await fetch(`${API_BASE}/newsletter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, consent }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Subscription failed');
    }
    return res.json();
  },
};
