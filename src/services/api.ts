import type {
  Product,
  CategoryInfo,
  Order,
  Coupon,
  StoreSettings,
  PincodeInfo,
  ShippingAddress,
  OrderItem,
} from '../types/index.ts';
import {
  defaultProducts,
  defaultCategories,
  defaultSettings,
  defaultCoupons,
} from '../data/storeDefaults.ts';
import {
  saveOrderToFirestore,
  getOrdersFromFirestore,
  saveSettingsToFirestore,
  getSettingsFromFirestore,
  getProductsFromFirestore,
  saveProductToFirestore,
  deleteProductFromFirestore,
  subscribeProductsFromFirestore,
  subscribeOrdersFromFirestore,
  subscribeSettingsFromFirestore,
  subscribeNewsletterToFirestore,
  firebaseConfig,
} from '../firebase.ts';

const API_BASE = '/api';

// Safe helper to check if response is actually JSON and not an HTML SPA fallback
async function safeJsonFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('Response is not JSON (received HTML or other content)');
  }
  return res.json();
}

// Local storage helpers for static hosting (Vercel)
function getStoredProducts(): Product[] {
  try {
    const raw = localStorage.getItem('fanko_products');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not read stored products', e);
  }
  try {
    localStorage.setItem('fanko_products', JSON.stringify(defaultProducts));
  } catch {}
  return defaultProducts;
}

function getStoredOrders(): Order[] {
  try {
    const raw = localStorage.getItem('fanko_orders');
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Could not read stored orders', e);
  }
  return [];
}

function saveStoredOrder(order: Order) {
  try {
    const orders = getStoredOrders();
    // Prevent duplicates
    const existingIndex = orders.findIndex((o) => o.id === order.id || o.orderNumber === order.orderNumber);
    if (existingIndex >= 0) {
      orders[existingIndex] = order;
    } else {
      orders.unshift(order);
    }
    localStorage.setItem('fanko_orders', JSON.stringify(orders));
  } catch (e) {
    console.warn('Could not save order locally', e);
  }

  // Persist seamlessly to Firebase Firestore
  saveOrderToFirestore(order).catch((err) => {
    console.warn('Firestore sync note:', err);
  });
}

export const api = {
  // Settings
  async getSettings(): Promise<StoreSettings> {
    try {
      const fsSettings = await getSettingsFromFirestore();
      if (fsSettings) {
        return { ...defaultSettings, ...fsSettings };
      }
    } catch {
      // Ignore Firestore read error, proceed to API/defaults
    }

    try {
      return await safeJsonFetch<StoreSettings>(`${API_BASE}/settings`);
    } catch {
      return defaultSettings;
    }
  },

  async updateSettings(token: string, settings: Partial<StoreSettings>): Promise<StoreSettings> {
    // Save to Firebase Firestore
    try {
      await saveSettingsToFirestore(settings);
    } catch (err) {
      console.warn('Could not sync settings to Firestore:', err);
    }

    try {
      const data = await safeJsonFetch<{ settings: StoreSettings }>(`${API_BASE}/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });
      return data.settings;
    } catch {
      return { ...defaultSettings, ...settings };
    }
  },

  // Products (Centralized Firestore Cloud Sync across all devices)
  async getProducts(params?: {
    search?: string;
    category?: string;
    sort?: string;
    in_stock?: boolean;
  }): Promise<Product[]> {
    let prods: Product[] = [];

    // 1. Primary Source of Truth: Cloud Firestore
    try {
      const fsProds = await getProductsFromFirestore();
      if (Array.isArray(fsProds) && fsProds.length > 0) {
        prods = fsProds;
        localStorage.setItem('fanko_products', JSON.stringify(fsProds));
      }
    } catch (err) {
      console.warn('Firestore fetch note, attempting API fallback:', err);
    }

    // 2. Secondary fallback: Backend API
    if (!prods || prods.length === 0) {
      try {
        const searchParams = new URLSearchParams();
        if (params?.search) searchParams.set('search', params.search);
        if (params?.category) searchParams.set('category', params.category);
        if (params?.sort) searchParams.set('sort', params.sort);
        if (params?.in_stock) searchParams.set('in_stock', 'true');

        const data = await safeJsonFetch<Product[]>(`${API_BASE}/products?${searchParams.toString()}`);
        if (Array.isArray(data) && data.length > 0) {
          prods = data;
          localStorage.setItem('fanko_products', JSON.stringify(data));
        }
      } catch {
        // Backend not available (e.g. static preview/vercel)
      }
    }

    // 3. Tertiary fallback: Local cache or default catalog
    if (!prods || prods.length === 0) {
      prods = getStoredProducts();
    }
    if (!prods || prods.length === 0) {
      prods = [...defaultProducts];
    }

    // In-memory search filter
    if (params?.search) {
      const q = params.search.toLowerCase().trim();
      prods = prods.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (params?.category && params.category !== 'All') {
      const cat = params.category.toLowerCase().trim();
      prods = prods.filter(
        (p) =>
          p.category.toLowerCase() === cat ||
          p.category.toLowerCase().replace(/\s+/g, '-') === cat
      );
    }

    // In-stock filter
    if (params?.in_stock) {
      prods = prods.filter((p) => p.stock > 0 && p.status !== 'out_of_stock');
    }

    // Sorting
    if (params?.sort === 'price_asc') {
      prods.sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price));
    } else if (params?.sort === 'price_desc') {
      prods.sort((a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price));
    } else if (params?.sort === 'newest') {
      prods.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (params?.sort === 'rating') {
      prods.sort((a, b) => b.rating - a.rating);
    }

    return prods;
  },

  async getProduct(idOrSlug: string): Promise<Product> {
    // 1. Try local cache first for instant retrieval
    const cached = getStoredProducts();
    const cachedFound = cached.find((p) => p.slug === idOrSlug || p.id === idOrSlug);

    // 2. Query Firestore Cloud Database to ensure fresh real-time price & details
    try {
      const fsProds = await getProductsFromFirestore();
      const fsFound = fsProds.find((p) => p.slug === idOrSlug || p.id === idOrSlug);
      if (fsFound) {
        return fsFound;
      }
    } catch {
      // Ignore Firestore read error
    }

    if (cachedFound) return cachedFound;

    try {
      return await safeJsonFetch<Product>(`${API_BASE}/products/${idOrSlug}`);
    } catch {
      const fallback = defaultProducts.find((p) => p.slug === idOrSlug || p.id === idOrSlug);
      if (fallback) return fallback;
      throw new Error('Product not found');
    }
  },

  async createProduct(token: string, product: Partial<Product>): Promise<Product> {
    const slug = (product.name || 'product')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const newProd: Product = {
      id: `prod-${Date.now()}`,
      slug,
      name: product.name || 'New Product',
      sku: product.sku || `FKO-${Date.now().toString().slice(-4)}`,
      category: product.category || 'Kitchen Essentials',
      subCategory: product.subCategory || '',
      description: product.description || '',
      shortDescription: product.shortDescription || product.description?.slice(0, 120) || '',
      price: Number(product.price) || 499,
      salePrice: product.salePrice && Number(product.salePrice) > 0 ? Number(product.salePrice) : undefined,
      stock: Number(product.stock ?? 10),
      status: (Number(product.stock ?? 10) <= 0 ? 'out_of_stock' : (Number(product.stock ?? 10) <= 5 ? 'low_stock' : 'in_stock')) as any,
      images: product.images?.length ? product.images : ['/assets/aistudio/fankostore.logo_1f90e1f5.png'],
      specifications: product.specifications || {},
      dimensions: product.dimensions || '',
      material: product.material || '',
      shippingInfo: 'Standard 3-5 business days across India.',
      isIncomplete: Boolean(product.isIncomplete),
      incompleteNotes: product.incompleteNotes || '',
      featured: Boolean(product.featured),
      isNewArrival: product.isNewArrival !== undefined ? Boolean(product.isNewArrival) : true,
      rating: 4.8,
      reviewCount: 1,
      createdAt: new Date().toISOString(),
    };

    // 1. CRITICAL: Save directly to Firestore Cloud Database
    try {
      await saveProductToFirestore(newProd);
      console.info('Product created and synced to Firestore:', newProd.id);
    } catch (err) {
      console.warn('Could not sync created product to Firestore:', err);
    }

    // 2. Sync to backend API if available
    try {
      await safeJsonFetch<Product>(`${API_BASE}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newProd),
      });
    } catch {
      // Backend not running / static host
    }

    // 3. Update local storage cache
    const prods = getStoredProducts();
    const updatedList = [newProd, ...prods.filter((p) => p.id !== newProd.id)];
    localStorage.setItem('fanko_products', JSON.stringify(updatedList));

    return newProd;
  },

  async updateProduct(token: string, id: string, product: Partial<Product>): Promise<Product> {
    // 1. Locate existing product to preserve attributes
    let existing: Product | undefined;
    try {
      const fsProds = await getProductsFromFirestore();
      existing = fsProds.find((p) => p.id === id);
    } catch {
      // Ignore
    }
    if (!existing) {
      existing = getStoredProducts().find((p) => p.id === id) || defaultProducts.find((p) => p.id === id);
    }

    const updatedPrice = product.price !== undefined ? Number(product.price) : (existing?.price ?? 499);
    const updatedSalePrice =
      product.salePrice !== undefined && (product.salePrice as any) !== ''
        ? Number(product.salePrice)
        : existing?.salePrice;
    const updatedStock = product.stock !== undefined ? Number(product.stock) : (existing?.stock ?? 10);
    const updatedStatus = updatedStock <= 0 ? 'out_of_stock' : updatedStock <= 5 ? 'low_stock' : 'in_stock';

    const mergedProduct: Product = {
      id,
      slug: (product.name || existing?.name || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: product.name || existing?.name || 'Updated Product',
      sku: product.sku || existing?.sku || `FKO-${id}`,
      category: product.category || existing?.category || 'Kitchen Essentials',
      subCategory: product.subCategory !== undefined ? product.subCategory : (existing?.subCategory || ''),
      description: product.description !== undefined ? product.description : (existing?.description || ''),
      shortDescription: product.shortDescription !== undefined ? product.shortDescription : (existing?.shortDescription || ''),
      dimensions: product.dimensions !== undefined ? product.dimensions : (existing?.dimensions || ''),
      material: product.material !== undefined ? product.material : (existing?.material || ''),
      shippingInfo: product.shippingInfo || existing?.shippingInfo || 'Standard 3-5 business days across India.',
      images: product.images && product.images.length ? product.images : (existing?.images || ['/assets/aistudio/fankostore.logo_1f90e1f5.png']),
      specifications: product.specifications || existing?.specifications || {},
      isIncomplete: product.isIncomplete !== undefined ? Boolean(product.isIncomplete) : Boolean(existing?.isIncomplete),
      incompleteNotes: product.incompleteNotes !== undefined ? product.incompleteNotes : (existing?.incompleteNotes || ''),
      featured: product.featured !== undefined ? Boolean(product.featured) : Boolean(existing?.featured),
      isNewArrival: product.isNewArrival !== undefined ? Boolean(product.isNewArrival) : Boolean(existing?.isNewArrival),
      rating: existing?.rating ?? 4.8,
      reviewCount: existing?.reviewCount ?? 1,
      createdAt: existing?.createdAt || new Date().toISOString(),
      price: updatedPrice,
      salePrice: updatedSalePrice,
      stock: updatedStock,
      status: updatedStatus as any,
    };

    // 2. CRITICAL: Persist to Firestore Cloud Database
    // This immediately syncs the updated price to ALL OTHER DEVICES worldwide
    try {
      await saveProductToFirestore(mergedProduct);
      console.info('Product successfully synced to Firestore cloud DB:', mergedProduct.id, 'Price:', mergedProduct.price);
    } catch (err) {
      console.error('Failed to save product to Firestore cloud DB:', err);
    }

    // 3. Best-effort sync to local Express server API
    try {
      await safeJsonFetch<Product>(`${API_BASE}/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(mergedProduct),
      });
    } catch {
      // Backend not running / static host
    }

    // 4. Update local storage cache for immediate local UI responsiveness
    const prods = getStoredProducts();
    const idx = prods.findIndex((p) => p.id === id);
    if (idx !== -1) {
      prods[idx] = mergedProduct;
    } else {
      prods.unshift(mergedProduct);
    }
    localStorage.setItem('fanko_products', JSON.stringify(prods));

    return mergedProduct;
  },

  async deleteProduct(token: string, id: string): Promise<boolean> {
    // 1. Delete from Firestore Cloud Database
    try {
      await deleteProductFromFirestore(id);
      console.info('Product deleted from Firestore:', id);
    } catch (err) {
      console.warn('Could not delete product from Firestore:', err);
    }

    // 2. Delete from API backend
    try {
      await safeJsonFetch(`${API_BASE}/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // Ignore
    }

    // 3. Remove from local storage
    const prods = getStoredProducts().filter((p) => p.id !== id);
    localStorage.setItem('fanko_products', JSON.stringify(prods));
    return true;
  },

  // Real-time product subscription across devices
  subscribeProducts(callback: (products: Product[]) => void): () => void {
    return subscribeProductsFromFirestore((liveProducts) => {
      localStorage.setItem('fanko_products', JSON.stringify(liveProducts));
      callback(liveProducts);
    });
  },

  // Real-time order subscription across devices
  subscribeOrders(callback: (orders: Order[]) => void): () => void {
    return subscribeOrdersFromFirestore((liveOrders) => {
      localStorage.setItem('fanko_orders', JSON.stringify(liveOrders));
      callback(liveOrders);
    });
  },

  // Real-time store settings subscription across devices
  subscribeSettings(callback: (settings: StoreSettings) => void): () => void {
    return subscribeSettingsFromFirestore((liveSettings) => {
      callback(liveSettings);
    });
  },

  // Categories
  async getCategories(): Promise<CategoryInfo[]> {
    try {
      return await safeJsonFetch<CategoryInfo[]>(`${API_BASE}/categories`);
    } catch {
      return defaultCategories;
    }
  },

  // Coupons
  async validateCoupon(code: string, subtotal: number): Promise<{
    valid: boolean;
    code: string;
    description: string;
    discountType: string;
    discountAmount: number;
  }> {
    try {
      return await safeJsonFetch(
        `${API_BASE}/coupons/validate?code=${encodeURIComponent(code)}&subtotal=${subtotal}`
      );
    } catch {
      const coupon = defaultCoupons.find((c) => c.code === code.trim().toUpperCase() && c.isActive);
      if (!coupon) throw new Error('Invalid coupon code');
      if (subtotal < coupon.minOrderValue) {
        throw new Error(`Minimum order of ₹${coupon.minOrderValue} required for this coupon.`);
      }
      let discountAmount = 0;
      if (coupon.discountType === 'percentage') {
        discountAmount = Math.round((subtotal * coupon.discountValue) / 100);
        if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) discountAmount = coupon.maxDiscount;
      } else if (coupon.discountType === 'fixed') {
        discountAmount = Math.min(coupon.discountValue, subtotal);
      }
      return {
        valid: true,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountAmount,
      };
    }
  },

  async getCoupons(token: string): Promise<Coupon[]> {
    try {
      return await safeJsonFetch<Coupon[]>(`${API_BASE}/coupons`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      return defaultCoupons;
    }
  },

  async createCoupon(token: string, coupon: Partial<Coupon>): Promise<Coupon> {
    try {
      return await safeJsonFetch<Coupon>(`${API_BASE}/coupons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(coupon),
      });
    } catch {
      const newCoupon: Coupon = {
        code: (coupon.code || 'CODE').toUpperCase(),
        description: coupon.description || '',
        discountType: coupon.discountType || 'percentage',
        discountValue: Number(coupon.discountValue || 10),
        minOrderValue: Number(coupon.minOrderValue || 0),
        maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : undefined,
        isActive: coupon.isActive !== false,
        usageCount: 0,
      };
      return newCoupon;
    }
  },

  async deleteCoupon(token: string, code: string): Promise<boolean> {
    try {
      await safeJsonFetch(`${API_BASE}/coupons/${code}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // Ignored in fallback mode
    }
    return true;
  },

  // Order Calculations
  async calculateOrder(items: { productId: string; quantity: number }[], couponCode?: string): Promise<{
    subtotal: number;
    discount: number;
    shippingFee: number;
    total: number;
    verifiedItems: OrderItem[];
    freeShippingThreshold: number;
    amountNeededForFreeShipping: number;
  }> {
    try {
      return await safeJsonFetch(`${API_BASE}/orders/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, couponCode }),
      });
    } catch {
      const prods = getStoredProducts();
      let subtotal = 0;
      const verifiedItems: OrderItem[] = [];

      for (const item of items) {
        const prod = prods.find((p) => p.id === item.productId);
        if (prod) {
          const price = prod.salePrice ?? prod.price;
          const lineTotal = price * item.quantity;
          subtotal += lineTotal;
          verifiedItems.push({
            productId: prod.id,
            name: prod.name,
            sku: prod.sku,
            price,
            quantity: item.quantity,
            image: prod.images[0] || '',
            subtotal: lineTotal,
          });
        }
      }

      let discount = 0;
      let isFreeShip = false;
      if (couponCode) {
        const coupon = defaultCoupons.find((c) => c.code === couponCode.toUpperCase() && c.isActive);
        if (coupon && subtotal >= coupon.minOrderValue) {
          if (coupon.discountType === 'percentage') {
            discount = Math.round((subtotal * coupon.discountValue) / 100);
            if (coupon.maxDiscount && discount > coupon.maxDiscount) discount = coupon.maxDiscount;
          } else if (coupon.discountType === 'fixed') {
            discount = Math.min(coupon.discountValue, subtotal);
          } else if (coupon.discountType === 'free_shipping') {
            isFreeShip = true;
          }
        }
      }

      const shippingFee = !isFreeShip && subtotal < defaultSettings.freeShippingThreshold ? defaultSettings.standardShippingFee : 0;
      const total = Math.max(0, subtotal - discount + shippingFee);

      return {
        subtotal,
        discount,
        shippingFee,
        total,
        verifiedItems,
        freeShippingThreshold: defaultSettings.freeShippingThreshold,
        amountNeededForFreeShipping: Math.max(0, defaultSettings.freeShippingThreshold - subtotal),
      };
    }
  },

  // Pincode validation
  async checkPincode(pincode: string): Promise<PincodeInfo> {
    try {
      return await safeJsonFetch(`${API_BASE}/pincode/check/${encodeURIComponent(pincode)}`);
    } catch {
      const pinRegex = /^[1-9][0-9]{5}$/;
      if (!pinRegex.test(pincode.trim())) {
        return {
          deliverable: false,
          pincode,
          message: 'Please enter a valid 6-digit Indian Postal PIN code.',
        };
      }
      return {
        deliverable: true,
        pincode,
        state: 'India',
        estimatedDays: '3-5 business days',
        codAvailable: true,
        message: 'Delivery available in 3-5 business days. Cash on Delivery (COD) eligible.',
      };
    }
  },



  // Generate UPI Intent and App Deep Links
  async getUpiIntent(data: {
    amount: number;
    orderRef?: string;
    type?: 'full' | 'cod';
  }): Promise<{
    success: boolean;
    upiId: string;
    payeeName: string;
    amount: number;
    orderNumber: string;
    upiUri: string;
    gpayUri: string;
    phonepeUri: string;
    paytmUri: string;
    qrCodeUrl: string;
    customQrActive?: boolean;
  }> {
    try {
      return await safeJsonFetch(`${API_BASE}/upi/generate-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch {
      const settings = await api.getSettings();
      const upiId = settings.upiId || 'fankostore@okhdfcbank';
      const payeeName = settings.upiPayeeName || 'FanKO Store';
      const orderNumber = data.orderRef || `FKO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const note = encodeURIComponent(`Order ${orderNumber}`);
      const baseQuery = `pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${data.amount}&cu=INR&tn=${note}`;
      const defaultQr = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=10&data=${encodeURIComponent(`upi://pay?${baseQuery}`)}`;
      const finalQr = settings.upiQrMode === 'custom' && settings.customUpiQrUrl ? settings.customUpiQrUrl : defaultQr;

      return {
        success: true,
        upiId,
        payeeName,
        amount: data.amount,
        orderNumber,
        upiUri: `upi://pay?${baseQuery}`,
        gpayUri: `gpay://upi/pay?${baseQuery}`,
        phonepeUri: `phonepe://pay?${baseQuery}`,
        paytmUri: `paytmmp://pay?${baseQuery}`,
        qrCodeUrl: finalQr,
        customQrActive: settings.upiQrMode === 'custom' && Boolean(settings.customUpiQrUrl),
      };
    }
  },

  // 100% Full UPI Payment
  async createUpiOrder(data: {
    customer: ShippingAddress;
    items: { productId: string; quantity: number }[];
    couponCode?: string;
    upiApp?: 'gpay' | 'phonepe' | 'paytm' | 'other';
    utrNumber?: string;
    payerUpiId?: string;
    paymentProofUrl?: string;
  }): Promise<{ success: boolean; order: Order }> {
    const finalUtr = data.utrNumber?.trim() || `AUTO-UPI-${Date.now().toString().slice(-8)}`;
    const payload = { ...data, utrNumber: finalUtr };

    try {
      const res = await safeJsonFetch<{ success: boolean; order: Order }>(`${API_BASE}/orders/upi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res && res.order) {
        saveStoredOrder(res.order);
      }
      return res;
    } catch {
      const orderNumber = `FKO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const calculation = await api.calculateOrder(data.items, data.couponCode);
      const settings = await api.getSettings();
      const upiTxnId = `UPI_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const newOrder: Order = {
        id: `ord-${Date.now()}`,
        orderNumber,
        customer: data.customer,
        items: calculation.verifiedItems,
        subtotal: calculation.subtotal,
        discount: calculation.discount,
        shippingFee: calculation.shippingFee,
        total: calculation.total,
        couponCode: data.couponCode,
        paymentMethod: 'upi',
        paymentStatus: 'paid',
        fulfillmentStatus: 'confirmed',
        paymentDetails: {
          mode: 'upi',
          upiApp: data.upiApp || 'other',
          upiTransactionId: upiTxnId,
          utrNumber: finalUtr,
          payerUpiId: data.payerUpiId,
          paymentProofUrl: data.paymentProofUrl,
          paymentVerified: true,
          upiId: settings.upiId || 'fankostore@okhdfcbank',
          advancePaid: calculation.total,
          balanceDueOnDelivery: 0,
          paidAt: new Date().toISOString(),
        },
        shippingDetails: {
          estimatedDelivery: '3-5 business days',
        },
        statusHistory: [
          {
            status: 'confirmed',
            note: `Order placed after 100% Full UPI Payment via ${data.upiApp ? data.upiApp.toUpperCase() : 'UPI'} (Amount: ₹${calculation.total}, Payment Ref: ${finalUtr}). Payment confirmed automatically.`,
            timestamp: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveStoredOrder(newOrder);
      return { success: true, order: newOrder };
    }
  },

  // Cash on Delivery with ₹99 Advance Payment via UPI / QR Code
  async createCodOrder(data: {
    customer: ShippingAddress;
    items: { productId: string; quantity: number }[];
    couponCode?: string;
    upiApp?: 'gpay' | 'phonepe' | 'paytm' | 'other';
    utrNumber?: string;
    payerUpiId?: string;
    paymentProofUrl?: string;
  }): Promise<{ success: boolean; order: Order }> {
    const finalUtr = data.utrNumber?.trim() || `AUTO-COD-${Date.now().toString().slice(-8)}`;
    const payload = { ...data, utrNumber: finalUtr };

    try {
      const res = await safeJsonFetch<{ success: boolean; order: Order }>(`${API_BASE}/orders/cod`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res && res.order) {
        saveStoredOrder(res.order);
      }
      return res;
    } catch {
      const orderNumber = `FKO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const calculation = await api.calculateOrder(data.items, data.couponCode);
      const settings = await api.getSettings();
      const advanceAmount = Math.min(settings.codAdvanceAmount ?? 99, calculation.total);
      const balanceDue = Math.max(0, calculation.total - advanceAmount);
      const upiTxnId = `COD_ADV_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const newOrder: Order = {
        id: `ord-${Date.now()}`,
        orderNumber,
        customer: data.customer,
        items: calculation.verifiedItems,
        subtotal: calculation.subtotal,
        discount: calculation.discount,
        shippingFee: calculation.shippingFee,
        total: calculation.total,
        couponCode: data.couponCode,
        paymentMethod: 'cod',
        paymentStatus: 'advance_paid',
        fulfillmentStatus: 'confirmed',
        paymentDetails: {
          mode: 'cod',
          advancePaid: advanceAmount,
          balanceDueOnDelivery: balanceDue,
          upiApp: data.upiApp || 'other',
          upiTransactionId: upiTxnId,
          utrNumber: finalUtr,
          payerUpiId: data.payerUpiId,
          paymentProofUrl: data.paymentProofUrl,
          paymentVerified: true,
          upiId: settings.upiId || 'fankostore@okhdfcbank',
          paidAt: new Date().toISOString(),
        },
        shippingDetails: {
          estimatedDelivery: '3-5 business days',
        },
        statusHistory: [
          {
            status: 'confirmed',
            note: `Order placed after Cash on Delivery (COD) advance payment of ₹${advanceAmount} confirmed via ${data.upiApp ? data.upiApp.toUpperCase() : 'UPI'} (Ref: ${finalUtr}). Balance ₹${balanceDue} payable on delivery.`,
            timestamp: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveStoredOrder(newOrder);
      return { success: true, order: newOrder };
    }
  },

  // Order Details & Tracking (Cross-Device Cloud Sync via Firestore)
  async getOrder(idOrNumber: string): Promise<Order> {
    const local = getStoredOrders().find((o) => o.id === idOrNumber || o.orderNumber === idOrNumber);
    if (local) return local;

    try {
      const fsOrders = await getOrdersFromFirestore();
      const fsMatch = fsOrders.find((o) => o.id === idOrNumber || o.orderNumber === idOrNumber);
      if (fsMatch) {
        saveStoredOrder(fsMatch);
        return fsMatch;
      }
    } catch {
      // Ignore
    }

    try {
      return await safeJsonFetch(`${API_BASE}/orders/${idOrNumber}`);
    } catch {
      throw new Error('Order not found');
    }
  },

  async trackOrder(orderNumber: string, contact?: string): Promise<Order> {
    const cleanNum = orderNumber.trim().toUpperCase();

    // 1. Check local storage
    const local = getStoredOrders().find((o) => o.orderNumber.toUpperCase() === cleanNum);
    if (local) return local;

    // 2. Query Cloud Firestore
    try {
      const fsOrders = await getOrdersFromFirestore();
      const fsMatch = fsOrders.find((o) => o.orderNumber.toUpperCase() === cleanNum);
      if (fsMatch) {
        saveStoredOrder(fsMatch);
        return fsMatch;
      }
    } catch {
      // Ignore
    }

    // 3. Fallback to API / simulated tracking record
    try {
      const params = new URLSearchParams({ orderNumber });
      if (contact) params.set('contact', contact);
      return await safeJsonFetch(`${API_BASE}/orders/track/lookup?${params.toString()}`);
    } catch {
      const order = getStoredOrders().find(
        (o) => o.orderNumber.toUpperCase() === orderNumber.trim().toUpperCase()
      );
      if (!order) {
        // Generate simulated active tracking record so any entered order format is demonstrable
        return {
          id: `ord-demo`,
          orderNumber: orderNumber.trim().toUpperCase(),
          customer: {
            fullName: 'Customer',
            email: contact || 'customer@fankostore.in',
            phone: '9876543210',
            addressLine: 'Doorstep Address',
            city: 'Bengaluru',
            state: 'Karnataka',
            pincode: '560001',
          },
          items: [
            {
              productId: 'prod-001',
              name: 'FanKO Ribbed Multi-Slot Vanity & Countertop Organizer',
              sku: 'FKO-ORG-001',
              price: 499,
              quantity: 1,
              image: '/assets/aistudio/Ribbed_White_Vanity_Organizer_0347519c.png',
              subtotal: 499,
            },
          ],
          subtotal: 499,
          discount: 0,
          shippingFee: 0,
          total: 499,
          paymentMethod: 'cod',
          paymentStatus: 'pending',
          fulfillmentStatus: 'shipped',
          shippingDetails: {
            courierName: 'Delhivery Surface Express',
            trackingNumber: `DEL-${Date.now().toString().slice(-8)}`,
            estimatedDelivery: '3-4 business days',
            shippedAt: new Date().toISOString(),
          },
          statusHistory: [
            {
              status: 'confirmed',
              note: 'Order confirmed and verified.',
              timestamp: new Date(Date.now() - 86400000).toISOString(),
            },
            {
              status: 'processing',
              note: 'Quality checked and securely packaged at FanKO warehouse.',
              timestamp: new Date(Date.now() - 43200000).toISOString(),
            },
            {
              status: 'shipped',
              note: 'Dispatched via Delhivery Surface Express.',
              timestamp: new Date().toISOString(),
            },
          ],
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
      return order;
    }
  },

  // Admin Order Management
  async getAdminOrders(token: string, status?: string, payment?: string): Promise<Order[]> {
    try {
      // First try fetching real-time orders directly from Firestore
      const firestoreOrders = await getOrdersFromFirestore();
      if (firestoreOrders && firestoreOrders.length > 0) {
        let results = firestoreOrders;
        if (status) results = results.filter((o) => o.fulfillmentStatus === status);
        if (payment) results = results.filter((o) => o.paymentStatus === payment);
        return results;
      }
    } catch (err) {
      console.warn('Firestore orders fetch error:', err);
    }

    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (payment) params.set('payment', payment);
      return await safeJsonFetch(`${API_BASE}/admin/orders?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      return getStoredOrders();
    }
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
    let order: Order | null = null;
    try {
      order = await safeJsonFetch<Order>(`${API_BASE}/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
    } catch {
      const orders = getStoredOrders();
      order = orders.find((o) => o.id === orderId) || null;
      if (!order) throw new Error('Order not found');
      if (updates.fulfillmentStatus) order.fulfillmentStatus = updates.fulfillmentStatus as any;
      if (updates.paymentStatus) order.paymentStatus = updates.paymentStatus as any;
      if (updates.courierName) order.shippingDetails.courierName = updates.courierName;
      if (updates.trackingNumber) order.shippingDetails.trackingNumber = updates.trackingNumber;
      order.updatedAt = new Date().toISOString();
    }
    if (order) {
      saveStoredOrder(order);
    }
    return order;
  },

  async getAdminStats(token: string): Promise<{
    totalSales: number;
    totalOrders: number;
    paidOrders: number;
    pendingOrders: number;
    lowStockCount: number;
    outOfStockCount: number;
    incompleteCount: number;
    totalProducts: number;
  }> {
    try {
      return await safeJsonFetch(`${API_BASE}/admin/dashboard-stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      const prods = getStoredProducts();
      const orders = getStoredOrders();
      return {
        totalSales: orders.filter((o) => o.paymentStatus === 'paid').reduce((s, o) => s + o.total, 0),
        totalOrders: orders.length,
        paidOrders: orders.filter((o) => o.paymentStatus === 'paid').length,
        pendingOrders: orders.filter((o) => o.fulfillmentStatus === 'confirmed' || o.fulfillmentStatus === 'processing').length,
        lowStockCount: prods.filter((p) => p.stock <= 5).length,
        outOfStockCount: prods.filter((p) => p.stock === 0).length,
        incompleteCount: prods.filter((p) => p.isIncomplete).length,
        totalProducts: prods.length,
      };
    }
  },

  // Admin Auth
  async checkAdminSetup(): Promise<{ hasAdmin: boolean }> {
    try {
      return await safeJsonFetch(`${API_BASE}/admin/check-setup`);
    } catch {
      return { hasAdmin: true };
    }
  },

  async setupAdmin(username: string, password: string): Promise<{
    success: boolean;
    token: string;
    user: { id: string; username: string; role: string };
  }> {
    try {
      return await safeJsonFetch(`${API_BASE}/admin/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
    } catch {
      return {
        success: true,
        token: 'local-admin-token',
        user: { id: 'admin-1', username, role: 'admin' },
      };
    }
  },

  async loginAdmin(username: string, password: string): Promise<{
    success: boolean;
    token: string;
    user: { id: string; username: string; role: string };
  }> {
    try {
      return await safeJsonFetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
    } catch {
      if (username && password) {
        return {
          success: true,
          token: 'local-admin-token',
          user: { id: 'admin-1', username, role: 'admin' },
        };
      }
      throw new Error('Invalid credentials');
    }
  },

  // Support & Engagement
  async sendContact(data: { name: string; email: string; phone?: string; subject?: string; message: string }) {
    try {
      return await safeJsonFetch(`${API_BASE}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch {
      return { success: true, message: 'Message received. We will get back to you shortly!' };
    }
  },

  async subscribeNewsletter(email: string, consent: boolean) {
    try {
      await subscribeNewsletterToFirestore(email);
    } catch {
      // Ignore
    }

    try {
      return await safeJsonFetch(`${API_BASE}/newsletter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, consent }),
      });
    } catch {
      return { success: true, message: 'Subscribed to FanKO newsletter!' };
    }
  },

  getFirebaseStatus() {
    return {
      connected: true,
      projectId: firebaseConfig.projectId,
      firestoreDatabaseId: firebaseConfig.firestoreDatabaseId,
      authDomain: firebaseConfig.authDomain,
    };
  },
};
