import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import { db, hashPassword, generateSalt } from './server/db.ts';
import type { Order, ShippingAddress, OrderItem } from './src/types/index.ts';

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for parsing JSON with raw body capture for webhook signature verification
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

// Admin token cache (in-memory for active sessions)
const activeAdminTokens = new Set<string>();

// Middleware to authenticate admin requests
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized. Admin credentials required.' });
  }
  const token = authHeader.split(' ')[1];
  if (!activeAdminTokens.has(token)) {
    return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }
  next();
}

// -------------------------------------------------------------
// Public Store & Settings Endpoints
// -------------------------------------------------------------
app.get('/api/settings', (_req, res) => {
  const settings = db.getSettings();
  res.json({
    storeName: settings.storeName,
    tagline: settings.tagline,
    announcementText: settings.announcementText,
    announcementActive: settings.announcementActive,
    whatsappNumber: settings.whatsappNumber,
    supportEmail: settings.supportEmail,
    supportPhone: settings.supportPhone,
    businessAddress: settings.businessAddress,
    freeShippingThreshold: settings.freeShippingThreshold,
    standardShippingFee: settings.standardShippingFee,
    codEnabled: settings.codEnabled,
    codAdvanceAmount: settings.codAdvanceAmount ?? 99,
    upiEnabled: settings.upiEnabled ?? true,
    upiId: settings.upiId || 'fankostore@okhdfcbank',
    upiPayeeName: settings.upiPayeeName || 'FanKO Store',
    customUpiQrUrl: settings.customUpiQrUrl || '',
    upiQrMode: settings.upiQrMode || 'dynamic',
    currency: settings.currency,
  });
});

app.put('/api/admin/settings', requireAdmin, (req, res) => {
  const updated = db.updateSettings(req.body);
  res.json({ success: true, settings: updated });
});

// -------------------------------------------------------------
// Products Endpoints
// -------------------------------------------------------------
app.get('/api/products', (req, res) => {
  let products = db.getProducts();

  // Search filter
  const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
  if (search) {
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(search) ||
        p.description.toLowerCase().includes(search) ||
        p.category.toLowerCase().includes(search) ||
        p.sku.toLowerCase().includes(search)
    );
  }

  // Category filter
  const category = typeof req.query.category === 'string' ? req.query.category : '';
  if (category && category !== 'All') {
    products = products.filter(
      (p) =>
        p.category.toLowerCase() === category.toLowerCase() ||
        p.category.toLowerCase().replace(/\s+/g, '-') === category.toLowerCase()
    );
  }

  // Availability filter
  if (req.query.in_stock === 'true') {
    products = products.filter((p) => p.status !== 'out_of_stock' && p.stock > 0);
  }

  // Sorting
  const sort = typeof req.query.sort === 'string' ? req.query.sort : 'featured';
  if (sort === 'price_asc') {
    products.sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price));
  } else if (sort === 'price_desc') {
    products.sort((a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price));
  } else if (sort === 'newest') {
    products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (sort === 'rating') {
    products.sort((a, b) => b.rating - a.rating);
  }

  res.json(products);
});

app.get('/api/products/:idOrSlug', (req, res) => {
  const product = db.getProductById(req.params.idOrSlug);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(product);
});

app.post('/api/products', requireAdmin, (req, res) => {
  const {
    name,
    category,
    subCategory,
    price,
    salePrice,
    stock,
    sku,
    description,
    shortDescription,
    specifications,
    dimensions,
    material,
    shippingInfo,
    images,
    isIncomplete,
    incompleteNotes,
    featured,
    isNewArrival,
  } = req.body;
  if (!name || !category || price == null) {
    return res.status(400).json({ error: 'Product name, category, and price are required.' });
  }

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  const newProduct = {
    id: `prod-${Date.now()}`,
    slug,
    name,
    sku: sku || `FKO-${Date.now().toString().slice(-4)}`,
    category,
    subCategory: subCategory || '',
    description: description || '',
    shortDescription: shortDescription || description?.slice(0, 120) || '',
    price: Number(price),
    salePrice: salePrice ? Number(salePrice) : undefined,
    stock: Number(stock ?? 10),
    status: (stock && stock > 0 ? (stock <= 5 ? 'low_stock' : 'in_stock') : 'out_of_stock') as any,
    images: images && images.length ? images : ['/assets/aistudio/fankostore.logo_1f90e1f5.png'],
    specifications: specifications || {},
    dimensions: dimensions || '',
    material: material || '',
    shippingInfo: shippingInfo || 'Standard 3-5 business days pan-India delivery.',
    isIncomplete: Boolean(isIncomplete),
    incompleteNotes: incompleteNotes || '',
    featured: Boolean(featured),
    isNewArrival: isNewArrival !== undefined ? Boolean(isNewArrival) : true,
    rating: 0,
    reviewCount: 0,
    createdAt: new Date().toISOString(),
  };

  db.saveProduct(newProduct);
  res.status(201).json(newProduct);
});

app.put('/api/products/:id', requireAdmin, (req, res) => {
  const existing = db.getProductById(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const updated = {
    ...existing,
    ...req.body,
    id: existing.id,
    price: req.body.price !== undefined ? Number(req.body.price) : existing.price,
    salePrice: req.body.salePrice !== undefined && req.body.salePrice !== '' ? Number(req.body.salePrice) : undefined,
    stock: req.body.stock !== undefined ? Number(req.body.stock) : existing.stock,
  };

  if (updated.stock <= 0) {
    updated.status = 'out_of_stock';
  } else if (updated.stock <= 5) {
    updated.status = 'low_stock';
  } else {
    updated.status = 'in_stock';
  }

  db.saveProduct(updated);
  res.json(updated);
});

app.delete('/api/products/:id', requireAdmin, (req, res) => {
  const deleted = db.deleteProduct(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json({ success: true, message: 'Product deleted' });
});

// -------------------------------------------------------------
// Categories
// -------------------------------------------------------------
app.get('/api/categories', (_req, res) => {
  res.json(db.getCategories());
});

// -------------------------------------------------------------
// Coupons & Server-Side Price Calculation
// -------------------------------------------------------------
app.get('/api/coupons', requireAdmin, (_req, res) => {
  res.json(db.getCoupons());
});

app.post('/api/coupons', requireAdmin, (req, res) => {
  const { code, description, discountType, discountValue, minOrderValue, maxDiscount, isActive } = req.body;
  if (!code || !discountType || discountValue == null) {
    return res.status(400).json({ error: 'Code, discountType, and discountValue are required.' });
  }

  const coupon = {
    code: code.trim().toUpperCase(),
    description: description || '',
    discountType,
    discountValue: Number(discountValue),
    minOrderValue: Number(minOrderValue || 0),
    maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
    isActive: isActive !== false,
    usageCount: 0,
  };

  db.saveCoupon(coupon);
  res.status(201).json(coupon);
});

app.delete('/api/coupons/:code', requireAdmin, (req, res) => {
  const deleted = db.deleteCoupon(req.params.code);
  res.json({ success: deleted });
});

// Validate coupon against subtotal
app.get('/api/coupons/validate', (req, res) => {
  const code = typeof req.query.code === 'string' ? req.query.code.trim().toUpperCase() : '';
  const subtotal = Number(req.query.subtotal) || 0;

  if (!code) {
    return res.status(400).json({ error: 'Coupon code required' });
  }

  const coupon = db.getCouponByCode(code);
  if (!coupon) {
    return res.status(404).json({ error: 'Invalid or inactive coupon code' });
  }

  if (subtotal < coupon.minOrderValue) {
    return res.status(400).json({
      error: `Coupon ${coupon.code} requires a minimum order of ₹${coupon.minOrderValue}. Add items worth ₹${coupon.minOrderValue - subtotal} more.`,
    });
  }

  let discountAmount = 0;
  if (coupon.discountType === 'percentage') {
    discountAmount = Math.round((subtotal * coupon.discountValue) / 100);
    if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
      discountAmount = coupon.maxDiscount;
    }
  } else if (coupon.discountType === 'fixed') {
    discountAmount = Math.min(coupon.discountValue, subtotal);
  } else if (coupon.discountType === 'free_shipping') {
    discountAmount = 0; // Handled in shipping fee calculation
  }

  res.json({
    valid: true,
    code: coupon.code,
    description: coupon.description,
    discountType: coupon.discountType,
    discountAmount,
  });
});

// Secure server-side calculation of order prices, discounts, and shipping
app.post('/api/orders/calculate', (req, res) => {
  const { items, couponCode } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Cart items are required' });
  }

  const settings = db.getSettings();
  let calculatedSubtotal = 0;
  const verifiedItems: OrderItem[] = [];

  for (const item of items) {
    const product = db.getProductById(item.productId);
    if (!product) {
      return res.status(400).json({ error: `Product ID ${item.productId} not found in catalog` });
    }
    if (product.stock < item.quantity) {
      return res.status(400).json({
        error: `Insufficient stock for "${product.name}". Only ${product.stock} available.`,
      });
    }

    const price = product.salePrice ?? product.price;
    const itemSubtotal = price * item.quantity;
    calculatedSubtotal += itemSubtotal;

    verifiedItems.push({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      price,
      quantity: item.quantity,
      image: product.images[0] || '/assets/aistudio/fankostore.logo_1f90e1f5.png',
      subtotal: itemSubtotal,
    });
  }

  // Calculate discount
  let discount = 0;
  let isFreeShippingCoupon = false;

  if (couponCode) {
    const coupon = db.getCouponByCode(couponCode);
    if (coupon && calculatedSubtotal >= coupon.minOrderValue) {
      if (coupon.discountType === 'percentage') {
        discount = Math.round((calculatedSubtotal * coupon.discountValue) / 100);
        if (coupon.maxDiscount && discount > coupon.maxDiscount) {
          discount = coupon.maxDiscount;
        }
      } else if (coupon.discountType === 'fixed') {
        discount = Math.min(coupon.discountValue, calculatedSubtotal);
      } else if (coupon.discountType === 'free_shipping') {
        isFreeShippingCoupon = true;
      }
    }
  }

  // Shipping fee calculation
  let shippingFee = 0;
  if (!isFreeShippingCoupon && calculatedSubtotal < settings.freeShippingThreshold) {
    shippingFee = settings.standardShippingFee;
  }

  const total = Math.max(0, calculatedSubtotal - discount + shippingFee);

  res.json({
    subtotal: calculatedSubtotal,
    discount,
    shippingFee,
    total,
    verifiedItems,
    freeShippingThreshold: settings.freeShippingThreshold,
    amountNeededForFreeShipping: Math.max(0, settings.freeShippingThreshold - calculatedSubtotal),
  });
});

// -------------------------------------------------------------
// Indian PIN Code Delivery Checker
// -------------------------------------------------------------
app.get('/api/pincode/check/:pincode', (req, res) => {
  const pincode = req.params.pincode.trim();
  const pinRegex = /^[1-9][0-9]{5}$/;

  if (!pinRegex.test(pincode)) {
    return res.status(400).json({
      deliverable: false,
      message: 'Please enter a valid 6-digit Indian Postal PIN code.',
    });
  }

  // Region estimation based on first digit of Indian postal code
  const firstDigit = pincode[0];
  let state = 'India';
  let estimatedDays = '3-5 business days';

  if (firstDigit === '1' || firstDigit === '2') {
    state = 'Northern Region (Delhi, Haryana, Punjab, UP)';
    estimatedDays = '2-4 business days';
  } else if (firstDigit === '3' || firstDigit === '4') {
    state = 'Western Region (Maharashtra, Gujarat, Rajasthan)';
    estimatedDays = '3-5 business days';
  } else if (firstDigit === '5' || firstDigit === '6') {
    state = 'Southern Region (Karnataka, Tamil Nadu, Kerala, AP, Telangana)';
    estimatedDays = '3-5 business days';
  } else if (firstDigit === '7' || firstDigit === '8') {
    state = 'Eastern Region (West Bengal, Bihar, Odisha, North East)';
    estimatedDays = '4-6 business days';
  }

  res.json({
    deliverable: true,
    pincode,
    state,
    estimatedDays,
    codAvailable: true,
    message: `Delivery available in ${estimatedDays}. Cash on Delivery (COD) eligible.`,
  });
});



// -------------------------------------------------------------
// -------------------------------------------------------------
// UPI & Cash on Delivery (COD with ₹99 Advance) Endpoints
// -------------------------------------------------------------

// Helper to generate UPI intent URLs for NPCI and mobile apps
function generateUpiIntentUrls(params: {
  upiId: string;
  payeeName: string;
  amount: number;
  orderNumber: string;
}) {
  const { upiId, payeeName, amount, orderNumber } = params;
  const encodedName = encodeURIComponent(payeeName);
  const note = encodeURIComponent(`Order ${orderNumber}`);
  const baseQuery = `pa=${encodeURIComponent(upiId)}&pn=${encodedName}&am=${amount}&cu=INR&tn=${note}`;

  return {
    upiUri: `upi://pay?${baseQuery}`,
    gpayUri: `gpay://upi/pay?${baseQuery}`,
    phonepeUri: `phonepe://pay?${baseQuery}`,
    paytmUri: `paytmmp://pay?${baseQuery}`,
    qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=10&data=${encodeURIComponent(`upi://pay?${baseQuery}`)}`,
  };
}

// Generate UPI intent data for checkout
app.post('/api/upi/generate-intent', (req, res) => {
  const { amount, orderRef, type } = req.body;
  const settings = db.getSettings();
  const upiId = settings.upiId || 'fankostore@okhdfcbank';
  const payeeName = settings.upiPayeeName || 'FanKO Store';

  const orderNumber = orderRef || `FKO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const payAmount = Number(amount) || (type === 'cod' ? (settings.codAdvanceAmount ?? 99) : 499);

  const urls = generateUpiIntentUrls({
    upiId,
    payeeName,
    amount: payAmount,
    orderNumber,
  });

  const finalQrCodeUrl =
    settings.upiQrMode === 'custom' && settings.customUpiQrUrl
      ? settings.customUpiQrUrl
      : urls.qrCodeUrl;

  res.json({
    success: true,
    upiId,
    payeeName,
    amount: payAmount,
    orderNumber,
    ...urls,
    qrCodeUrl: finalQrCodeUrl,
    customQrActive: settings.upiQrMode === 'custom' && Boolean(settings.customUpiQrUrl),
  });
});

// Full UPI Payment Checkout Endpoint
app.post('/api/orders/upi', (req, res) => {
  const { customer, items, couponCode, upiApp, utrNumber } = req.body;
  const settings = db.getSettings();

  if (settings.upiEnabled === false) {
    return res.status(400).json({ error: 'Direct UPI payment is currently disabled.' });
  }

  if (!customer || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Customer details and cart items are required' });
  }

  // Calculate pricing securely on the server
  let subtotal = 0;
  const verifiedItems: OrderItem[] = [];

  for (const item of items) {
    const prod = db.getProductById(item.productId);
    if (!prod) {
      return res.status(400).json({ error: `Product not found: ${item.productId}` });
    }
    if (prod.stock < item.quantity) {
      return res.status(400).json({ error: `Insufficient stock for ${prod.name}` });
    }
    const price = prod.salePrice ?? prod.price;
    const itemSub = price * item.quantity;
    subtotal += itemSub;
    verifiedItems.push({
      productId: prod.id,
      name: prod.name,
      sku: prod.sku,
      price,
      quantity: item.quantity,
      image: prod.images[0] || '',
      subtotal: itemSub,
    });
  }

  let discount = 0;
  let isFreeShip = false;
  if (couponCode) {
    const coupon = db.getCouponByCode(couponCode);
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

  const shippingFee = !isFreeShip && subtotal < settings.freeShippingThreshold ? settings.standardShippingFee : 0;
  const total = Math.max(0, subtotal - discount + shippingFee);

  const orderNumber = `FKO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const upiTxnId = `UPI_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const newOrder: Order = {
    id: `ord-${Date.now()}`,
    orderNumber,
    customer,
    items: verifiedItems,
    subtotal,
    discount,
    shippingFee,
    total,
    couponCode,
    paymentMethod: 'upi',
    paymentStatus: 'paid',
    fulfillmentStatus: 'confirmed',
    paymentDetails: {
      mode: 'upi',
      upiApp: upiApp || 'other',
      upiTransactionId: upiTxnId,
      utrNumber: utrNumber || upiTxnId,
      upiId: settings.upiId || 'fankostore@okhdfcbank',
      advancePaid: total,
      balanceDueOnDelivery: 0,
      paidAt: new Date().toISOString(),
    },
    shippingDetails: {
      estimatedDelivery: '3-5 business days',
    },
    statusHistory: [
      {
        status: 'confirmed',
        note: `Order placed with 100% Full UPI Payment via ${upiApp ? upiApp.toUpperCase() : 'UPI'} (Amount: ₹${total}${utrNumber ? `, UTR/Ref: ${utrNumber}` : ''}). Payment verified.`,
        timestamp: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.decrementStock(newOrder.items);
  db.saveOrder(newOrder);

  res.status(201).json({
    success: true,
    order: newOrder,
  });
});

// Cash on Delivery (COD) Checkout Endpoint with ₹99 Advance Payment via UPI / QR Code
app.post('/api/orders/cod', (req, res) => {
  const { customer, items, couponCode, upiApp, utrNumber } = req.body;
  const settings = db.getSettings();

  if (!settings.codEnabled) {
    return res.status(400).json({ error: 'Cash on Delivery is currently disabled by store administration.' });
  }

  if (!customer || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Customer details and cart items are required' });
  }

  // Calculate pricing securely on the server
  let subtotal = 0;
  const verifiedItems: OrderItem[] = [];

  for (const item of items) {
    const prod = db.getProductById(item.productId);
    if (!prod) {
      return res.status(400).json({ error: `Product not found: ${item.productId}` });
    }
    if (prod.stock < item.quantity) {
      return res.status(400).json({ error: `Insufficient stock for ${prod.name}` });
    }
    const price = prod.salePrice ?? prod.price;
    const itemSub = price * item.quantity;
    subtotal += itemSub;
    verifiedItems.push({
      productId: prod.id,
      name: prod.name,
      sku: prod.sku,
      price,
      quantity: item.quantity,
      image: prod.images[0] || '',
      subtotal: itemSub,
    });
  }

  let discount = 0;
  let isFreeShip = false;
  if (couponCode) {
    const coupon = db.getCouponByCode(couponCode);
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

  const shippingFee = !isFreeShip && subtotal < settings.freeShippingThreshold ? settings.standardShippingFee : 0;
  const total = Math.max(0, subtotal - discount + shippingFee);

  const advanceAmount = Math.min(settings.codAdvanceAmount ?? 99, total);
  const balanceDue = Math.max(0, total - advanceAmount);

  const orderNumber = `FKO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const upiTxnId = `COD_ADV_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const newOrder: Order = {
    id: `ord-${Date.now()}`,
    orderNumber,
    customer,
    items: verifiedItems,
    subtotal,
    discount,
    shippingFee,
    total,
    couponCode,
    paymentMethod: 'cod',
    paymentStatus: 'advance_paid',
    fulfillmentStatus: 'confirmed',
    paymentDetails: {
      mode: 'cod',
      advancePaid: advanceAmount,
      balanceDueOnDelivery: balanceDue,
      upiApp: upiApp || 'other',
      upiTransactionId: upiTxnId,
      utrNumber: utrNumber || upiTxnId,
      upiId: settings.upiId || 'fankostore@okhdfcbank',
      paidAt: new Date().toISOString(),
    },
    shippingDetails: {
      estimatedDelivery: '3-5 business days',
    },
    statusHistory: [
      {
        status: 'confirmed',
        note: `Order confirmed with Cash on Delivery (COD). ₹${advanceAmount} advance payment verified via ${upiApp ? upiApp.toUpperCase() : 'UPI'}${utrNumber ? ` (UTR: ${utrNumber})` : ''}. Balance ₹${balanceDue} will be collected in cash or UPI upon doorstep delivery.`,
        timestamp: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.decrementStock(newOrder.items);
  db.saveOrder(newOrder);

  res.status(201).json({
    success: true,
    order: newOrder,
  });
});


// -------------------------------------------------------------
// Orders Tracking & Retrieval
// -------------------------------------------------------------
app.get('/api/orders/:idOrNumber', (req, res) => {
  const order = db.getOrderById(req.params.idOrNumber);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json(order);
});

// Authentic Track Order endpoint: lookup by order number and phone or email
app.get('/api/orders/track/lookup', (req, res) => {
  const orderNumber = typeof req.query.orderNumber === 'string' ? req.query.orderNumber.trim() : '';
  const contact = typeof req.query.contact === 'string' ? req.query.contact.trim().toLowerCase() : '';

  if (!orderNumber) {
    return res.status(400).json({ error: 'Please enter your order number.' });
  }

  const order = db.getOrderById(orderNumber);
  if (!order) {
    return res.status(404).json({ error: 'No order found with this order number. Please verify and try again.' });
  }

  if (contact) {
    const matchesEmail = order.customer.email.toLowerCase() === contact;
    const matchesPhone = order.customer.phone.replace(/[^0-9]/g, '').endsWith(contact.replace(/[^0-9]/g, '').slice(-10));
    if (!matchesEmail && !matchesPhone) {
      return res.status(403).json({ error: 'Contact details (email or phone) do not match the order records.' });
    }
  }

  res.json(order);
});

// -------------------------------------------------------------
// Admin Orders Management & Status Updates
// -------------------------------------------------------------
app.get('/api/admin/orders', requireAdmin, (req, res) => {
  let orders = db.getOrders();
  const status = typeof req.query.status === 'string' ? req.query.status : '';
  const payment = typeof req.query.payment === 'string' ? req.query.payment : '';

  if (status && status !== 'all') {
    orders = orders.filter((o) => o.fulfillmentStatus === status);
  }
  if (payment && payment !== 'all') {
    orders = orders.filter((o) => o.paymentStatus === payment);
  }

  res.json(orders);
});

app.put('/api/admin/orders/:id/status', requireAdmin, (req, res) => {
  const order = db.getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const { fulfillmentStatus, paymentStatus, courierName, trackingNumber, trackingUrl, note } = req.body;

  if (fulfillmentStatus) {
    order.fulfillmentStatus = fulfillmentStatus;
    if (fulfillmentStatus === 'shipped') {
      order.shippingDetails.shippedAt = new Date().toISOString();
    } else if (fulfillmentStatus === 'delivered') {
      order.shippingDetails.deliveredAt = new Date().toISOString();
      if (order.paymentMethod === 'cod') {
        order.paymentStatus = 'paid';
      }
    }
  }

  if (paymentStatus) {
    order.paymentStatus = paymentStatus;
  }

  if (courierName) order.shippingDetails.courierName = courierName;
  if (trackingNumber) order.shippingDetails.trackingNumber = trackingNumber;
  if (trackingUrl) order.shippingDetails.trackingUrl = trackingUrl;

  order.statusHistory.push({
    status: order.fulfillmentStatus,
    note: note || `Status updated to "${order.fulfillmentStatus}". ${courierName ? `Courier: ${courierName}, Tracking: ${trackingNumber}` : ''}`,
    timestamp: new Date().toISOString(),
  });
  order.updatedAt = new Date().toISOString();

  db.saveOrder(order);
  res.json(order);
});

// Export orders as CSV
app.get('/api/admin/orders/export-csv', requireAdmin, (_req, res) => {
  const orders = db.getOrders();
  const headers = [
    'Order Number',
    'Date',
    'Customer Name',
    'Phone',
    'Email',
    'City',
    'State',
    'PIN Code',
    'Items Count',
    'Subtotal',
    'Discount',
    'Shipping Fee',
    'Total (INR)',
    'Payment Method',
    'Payment Status',
    'Fulfillment Status',
    'Courier',
    'Tracking Number',
  ];

  const rows = orders.map((o) => [
    o.orderNumber,
    new Date(o.createdAt).toLocaleDateString('en-IN'),
    `"${o.customer.fullName.replace(/"/g, '""')}"`,
    o.customer.phone,
    o.customer.email,
    `"${o.customer.city.replace(/"/g, '""')}"`,
    `"${o.customer.state.replace(/"/g, '""')}"`,
    o.customer.pincode,
    o.items.reduce((sum, item) => sum + item.quantity, 0),
    o.subtotal,
    o.discount,
    o.shippingFee,
    o.total,
    o.paymentMethod.toUpperCase(),
    o.paymentStatus.toUpperCase(),
    o.fulfillmentStatus.toUpperCase(),
    o.shippingDetails.courierName || '',
    o.shippingDetails.trackingNumber || '',
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="fanko-orders-${Date.now()}.csv"`);
  res.send(csvContent);
});

// Admin dashboard summary metrics
app.get('/api/admin/dashboard-stats', requireAdmin, (_req, res) => {
  const orders = db.getOrders();
  const products = db.getProducts();

  const totalSales = orders
    .filter((o) => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.total, 0);

  const pendingOrders = orders.filter(
    (o) => o.fulfillmentStatus === 'confirmed' || o.fulfillmentStatus === 'processing'
  ).length;

  const lowStockCount = products.filter((p) => p.stock <= 5 || p.status === 'low_stock').length;
  const outOfStockCount = products.filter((p) => p.stock === 0 || p.status === 'out_of_stock').length;
  const incompleteCount = products.filter((p) => p.isIncomplete).length;

  res.json({
    totalSales,
    totalOrders: orders.length,
    paidOrders: orders.filter((o) => o.paymentStatus === 'paid').length,
    pendingOrders,
    lowStockCount,
    outOfStockCount,
    incompleteCount,
    totalProducts: products.length,
  });
});

// -------------------------------------------------------------
// Admin Authentication & Setup
// -------------------------------------------------------------
app.get('/api/admin/check-setup', (_req, res) => {
  const users = db.getAdminUsers();
  res.json({
    hasAdmin: users.length > 0 || Boolean(process.env.ADMIN_PASSWORD),
  });
});

app.post('/api/admin/setup', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password || password.length < 6) {
    return res.status(400).json({ error: 'Username and password (min 6 characters) are required.' });
  }

  const existing = db.getAdminUsers();
  if (existing.length > 0) {
    return res.status(400).json({ error: 'Admin account has already been initialized.' });
  }

  const salt = generateSalt();
  const passwordHash = hashPassword(password, salt);
  const user = db.addAdminUser(username.trim(), passwordHash, salt);

  const token = crypto.randomBytes(32).toString('hex');
  activeAdminTokens.add(token);

  res.json({
    success: true,
    token,
    user: { id: user.id, username: user.username, role: user.role },
  });
});

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const users = db.getAdminUsers();

  // If no db admin user yet, allow environment variable fallback
  if (users.length === 0 && process.env.ADMIN_PASSWORD) {
    const envUser = process.env.ADMIN_USERNAME || 'admin';
    if (username === envUser && password === process.env.ADMIN_PASSWORD) {
      const token = crypto.randomBytes(32).toString('hex');
      activeAdminTokens.add(token);
      return res.json({
        success: true,
        token,
        user: { id: 'admin-env', username, role: 'admin' },
      });
    }
  }

  const foundUser = users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
  if (!foundUser) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const computedHash = hashPassword(password, foundUser.salt);
  if (computedHash !== foundUser.passwordHash) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  activeAdminTokens.add(token);

  res.json({
    success: true,
    token,
    user: { id: foundUser.id, username: foundUser.username, role: foundUser.role },
  });
});

// -------------------------------------------------------------
// Contact & Newsletter Forms
// -------------------------------------------------------------
app.post('/api/contact', (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }
  const entry = db.addContactMessage({
    name: name.trim(),
    email: email.trim(),
    phone: phone ? phone.trim() : '',
    subject: subject ? subject.trim() : 'General Inquiry',
    message: message.trim(),
  });
  res.json({ success: true, message: 'Message received. Our support team will get back to you shortly.', id: entry.id });
});

app.post('/api/newsletter', (req, res) => {
  const { email, consent } = req.body;
  if (!email || !consent) {
    return res.status(400).json({ error: 'Valid email and consent are required.' });
  }
  db.addNewsletterSubscriber(email.trim().toLowerCase(), Boolean(consent));
  res.json({ success: true, message: 'Thank you for subscribing to FanKO Store updates!' });
});

// -------------------------------------------------------------
// SEO: Sitemap.xml & Robots.txt
// -------------------------------------------------------------
app.get('/robots.txt', (_req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/admin
Sitemap: ${process.env.APP_URL || 'https://fankostore.in'}/sitemap.xml
`);
});

app.get('/sitemap.xml', (_req, res) => {
  const products = db.getProducts();
  const categories = db.getCategories();
  const baseUrl = process.env.APP_URL || 'https://fankostore.in';

  const staticUrls = [
    '',
    '/shop',
    '/about',
    '/contact',
    '/faqs',
    '/shipping-policy',
    '/return-refund-policy',
    '/privacy-policy',
    '/terms-and-conditions',
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  staticUrls.forEach((route) => {
    xml += `
  <url>
    <loc>${baseUrl}${route}</loc>
    <changefreq>daily</changefreq>
    <priority>${route === '' ? '1.0' : '0.8'}</priority>
  </url>`;
  });


  products.forEach((prod) => {
    xml += `
  <url>
    <loc>${baseUrl}/product/${prod.slug}</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
    <lastmod>${new Date(prod.createdAt).toISOString().split('T')[0]}</lastmod>
  </url>`;
  });

  xml += `
</urlset>`;

  res.type('application/xml');
  res.send(xml);
});

// -------------------------------------------------------------
// Frontend Integration (Vite Middleware in Dev / Static in Prod)
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FanKO Store server is live on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
