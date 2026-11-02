export type ProductCategory =
  | 'Kitchen Essentials'
  | 'Home Organization'
  | 'Storage Solutions'
  | 'Cleaning Accessories'
  | 'Bathroom Organizers'
  | 'Daily-use Products';

export interface ProductSpecification {
  material?: string;
  dimensions?: string;
  weight?: string;
  capacity?: string;
  color?: string;
  careInstructions?: string;
  countryOfOrigin?: string;
  includedItems?: string;
  [key: string]: string | undefined;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  sku: string;
  category: ProductCategory;
  subCategory?: string;
  description: string;
  shortDescription: string;
  price: number;
  salePrice?: number;
  stock: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  images: string[];
  specifications: ProductSpecification;
  dimensions?: string;
  material?: string;
  shippingInfo: string;
  seoTitle?: string;
  seoDescription?: string;
  isIncomplete?: boolean;
  incompleteNotes?: string;
  featured?: boolean;
  isNewArrival?: boolean;
  rating: number;
  reviewCount: number;
  createdAt: string;
}

export interface CategoryInfo {
  id: string;
  name: ProductCategory;
  slug: string;
  description: string;
  image: string;
  itemCount: number;
}

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  selectedPrice: number;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  email: string;
  addressLine: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
}

export type OrderFulfillmentStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus = 'pending' | 'paid' | 'advance_paid' | 'failed' | 'refunded';
export type PaymentMethod = 'upi' | 'cod' | 'mxpay';

export interface OrderItem {
  productId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  image: string;
  subtotal: number;
}

export interface OrderStatusEvent {
  status: OrderFulfillmentStatus;
  note: string;
  timestamp: string;
}

export interface ShippingDetails {
  courierName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  shippedAt?: string;
  deliveredAt?: string;
}

export interface OrderPaymentDetails {
  mode?: 'upi' | 'cod' | 'live' | 'test';
  upiApp?: 'gpay' | 'phonepe' | 'paytm' | 'other';
  upiTransactionId?: string;
  utrNumber?: string;
  payerUpiId?: string;
  paymentProofUrl?: string;
  paymentVerified?: boolean;
  upiId?: string;
  advancePaid?: number;
  balanceDueOnDelivery?: number;
  paidAt?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  mxpayTransactionId?: string;
  mxpayPaymentId?: string;
  mxpayStatus?: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g., FKO-2026-1042
  customer: ShippingAddress;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  couponCode?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: OrderFulfillmentStatus;
  paymentDetails?: OrderPaymentDetails;
  shippingDetails: ShippingDetails;
  statusHistory: OrderStatusEvent[];
  customerNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed' | 'free_shipping';
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  isActive: boolean;
  usageCount: number;
  expiresAt?: string;
}

export interface Review {
  id: string;
  productId: string;
  productName: string;
  customerName: string;
  rating: number; // 1 to 5
  title: string;
  comment: string;
  city?: string;
  verifiedPurchase: boolean;
  createdAt: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  announcementText: string;
  announcementActive: boolean;
  whatsappNumber: string;
  supportEmail: string;
  supportPhone: string;
  businessAddress: string;
  freeShippingThreshold: number;
  standardShippingFee: number;
  codEnabled: boolean;
  codAdvanceAmount: number;
  upiEnabled: boolean;
  upiId: string;
  upiPayeeName: string;
  customUpiQrUrl?: string;
  upiQrMode?: 'dynamic' | 'custom';
  currency: string;
  mxPayEnabled?: boolean;
  mxPayApiKey?: string;
  mxPayMerchantId?: string;
  mxPaySecretKey?: string;
  mxPayTestMode?: boolean;
}

export interface AdminUser {
  id: string;
  username: string;
  role: 'admin' | 'manager';
  createdAt: string;
}

export interface PincodeInfo {
  pincode: string;
  deliverable: boolean;
  city?: string;
  state?: string;
  estimatedDays?: string;
  codAvailable?: boolean;
  message?: string;
}
