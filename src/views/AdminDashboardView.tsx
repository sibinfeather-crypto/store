import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Package,
  ShoppingBag,
  Tag,
  Settings,
  Download,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  LogOut,
  Truck,
  IndianRupee,
  Layers,
  CreditCard,
  Database
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import type { Product, Order, Coupon, StoreSettings, ProductCategory } from '../types/index.ts';

interface AdminDashboardViewProps {
  onNavigate: (view: string, param?: string) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ onNavigate }) => {
  const { isAdminLoggedIn, adminToken, adminUser, loginAdmin, logoutAdmin } = useAuth();

  // Setup / Login state
  const [hasAdmin, setHasAdmin] = useState<boolean>(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'coupons' | 'settings'>('overview');

  // Data states
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  // Order status update modal / form
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newFulfillmentStatus, setNewFulfillmentStatus] = useState<string>('');
  const [newPaymentStatus, setNewPaymentStatus] = useState<string>('');
  const [courierName, setCourierName] = useState<string>('');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [trackingUrl, setTrackingUrl] = useState<string>('');
  const [statusNote, setStatusNote] = useState<string>('');
  const [updatingOrder, setUpdatingOrder] = useState(false);

  // Product Add / Edit modal
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodForm, setProdForm] = useState({
    name: '',
    sku: '',
    category: 'Kitchen Essentials' as ProductCategory,
    price: '',
    salePrice: '',
    stock: '',
    shortDescription: '',
    description: '',
    dimensions: '',
    material: '',
    image: '/assets/aistudio/fankostore.logo_1f90e1f5.png',
    isIncomplete: false,
    incompleteNotes: '',
  });

  // Coupon Add state
  const [couponCode, setCouponCode] = useState('');
  const [couponDesc, setCouponDesc] = useState('');
  const [couponType, setCouponType] = useState<'percentage' | 'fixed' | 'free_shipping'>('percentage');
  const [couponValue, setCouponValue] = useState('');
  const [couponMinOrder, setCouponMinOrder] = useState('');
  const [couponMaxDisc, setCouponMaxDisc] = useState('');

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<Partial<StoreSettings>>({});
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [showMxKey, setShowMxKey] = useState(false);

  // Check setup on mount
  useEffect(() => {
    api.checkAdminSetup().then((res) => {
      setHasAdmin(res.hasAdmin);
    }).catch(() => {});
  }, []);

  // Fetch admin data once logged in
  useEffect(() => {
    if (isAdminLoggedIn && adminToken) {
      loadAdminData();
    }
  }, [isAdminLoggedIn, adminToken]);

  const loadAdminData = async () => {
    if (!adminToken) return;
    setLoadingData(true);
    try {
      const [statsRes, ordersRes, prodsRes, couponsRes, setRes] = await Promise.all([
        api.getAdminStats(adminToken),
        api.getAdminOrders(adminToken),
        api.getProducts(),
        api.getCoupons(adminToken),
        api.getSettings(),
      ]);
      setStats(statsRes);
      setOrders(ordersRes);
      setProducts(prodsRes);
      setCoupons(couponsRes);
      setSettings(setRes);
      setSettingsForm(setRes);
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      if (!hasAdmin) {
        // Initial setup
        const setupRes = await api.setupAdmin(username, password);
        loginAdmin(setupRes.token, setupRes.user);
        setHasAdmin(true);
      } else {
        const loginRes = await api.loginAdmin(username, password);
        loginAdmin(loginRes.token, loginRes.user);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleOpenOrderModal = (order: Order) => {
    setSelectedOrder(order);
    setNewFulfillmentStatus(order.fulfillmentStatus);
    setNewPaymentStatus(order.paymentStatus);
    setCourierName(order.shippingDetails?.courierName || '');
    setTrackingNumber(order.shippingDetails?.trackingNumber || '');
    setTrackingUrl(order.shippingDetails?.trackingUrl || '');
    setStatusNote('');
  };

  const handleUpdateOrderStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !adminToken) return;
    setUpdatingOrder(true);
    try {
      const updated = await api.updateAdminOrderStatus(adminToken, selectedOrder.id, {
        fulfillmentStatus: newFulfillmentStatus,
        paymentStatus: newPaymentStatus,
        courierName: courierName.trim() || undefined,
        trackingNumber: trackingNumber.trim() || undefined,
        trackingUrl: trackingUrl.trim() || undefined,
        note: statusNote.trim() || undefined,
      });
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setSelectedOrder(null);
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    } finally {
      setUpdatingOrder(false);
    }
  };

  const handleExportCsv = () => {
    if (!adminToken) return;
    window.open(`/api/admin/orders/export-csv?token=${encodeURIComponent(adminToken)}`, '_blank');
  };

  const handleOpenProductModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProdForm({
        name: product.name,
        sku: product.sku,
        category: product.category,
        price: String(product.price),
        salePrice: product.salePrice ? String(product.salePrice) : '',
        stock: String(product.stock),
        shortDescription: product.shortDescription,
        description: product.description,
        dimensions: product.dimensions || '',
        material: product.material || '',
        image: product.images[0] || '/assets/aistudio/fankostore.logo_1f90e1f5.png',
        isIncomplete: Boolean(product.isIncomplete),
        incompleteNotes: product.incompleteNotes || '',
      });
    } else {
      setEditingProduct(null);
      setProdForm({
        name: '',
        sku: `FKO-${Date.now().toString().slice(-4)}`,
        category: 'Kitchen Essentials',
        price: '',
        salePrice: '',
        stock: '15',
        shortDescription: '',
        description: '',
        dimensions: '',
        material: '',
        image: '/assets/aistudio/Ribbed_White_Vanity_Organizer_0347519c.png',
        isIncomplete: false,
        incompleteNotes: '',
      });
    }
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;

    const payload = {
      name: prodForm.name,
      sku: prodForm.sku,
      category: prodForm.category,
      price: Number(prodForm.price),
      salePrice: prodForm.salePrice ? Number(prodForm.salePrice) : undefined,
      stock: Number(prodForm.stock),
      shortDescription: prodForm.shortDescription,
      description: prodForm.description,
      dimensions: prodForm.dimensions,
      material: prodForm.material,
      images: [prodForm.image],
      isIncomplete: prodForm.isIncomplete,
      incompleteNotes: prodForm.incompleteNotes,
    };

    try {
      if (editingProduct) {
        const updated = await api.updateProduct(adminToken, editingProduct.id, payload);
        setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      } else {
        const created = await api.createProduct(adminToken, payload);
        setProducts((prev) => [created, ...prev]);
      }
      setProductModalOpen(false);
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to save product');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!adminToken || !window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.deleteProduct(adminToken, id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken || !couponCode.trim() || !couponValue) return;

    try {
      const created = await api.createCoupon(adminToken, {
        code: couponCode.trim().toUpperCase(),
        description: couponDesc.trim(),
        discountType: couponType,
        discountValue: Number(couponValue),
        minOrderValue: Number(couponMinOrder || 0),
        maxDiscount: couponMaxDisc ? Number(couponMaxDisc) : undefined,
        isActive: true,
      });
      setCoupons((prev) => [...prev, created]);
      setCouponCode('');
      setCouponDesc('');
      setCouponValue('');
      setCouponMinOrder('');
      setCouponMaxDisc('');
    } catch (err: any) {
      alert(err.message || 'Failed to create coupon');
    }
  };

  const handleDeleteCoupon = async (code: string) => {
    if (!adminToken || !window.confirm(`Delete coupon "${code}"?`)) return;
    try {
      await api.deleteCoupon(adminToken, code);
      setCoupons((prev) => prev.filter((c) => c.code !== code));
    } catch (err: any) {
      alert(err.message || 'Failed to delete coupon');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;
    setSavingSettings(true);
    setSettingsSuccess(false);
    try {
      const updated = await api.updateSettings(adminToken, settingsForm);
      setSettings(updated);
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  // If Not Logged In: Show Admin Login / Setup Screen
  if (!isAdminLoggedIn) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 space-y-6">
        <div className="bg-white rounded-3xl border border-[#E5E8E3] p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-[#E8F5EE] text-[#087A42] flex items-center justify-center mx-auto">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-extrabold text-[#202720]">
              {hasAdmin ? 'FanKO Admin Portal' : 'First-Time Admin Setup'}
            </h1>
            <p className="text-xs text-[#5E695E]">
              {hasAdmin
                ? 'Sign in to manage catalog, orders, shipping, and store settings.'
                : 'Initialize your master administrator credentials.'}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#202720] block mb-1">
                Admin Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin"
                className="w-full text-xs px-3.5 py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl focus:outline-none focus:border-[#087A42]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#202720] block mb-1">
                Password {hasAdmin ? '' : '(min 6 characters)'}
              </label>
              <input
                type="password"
                required
                minLength={hasAdmin ? 1 : 6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs px-3.5 py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl focus:outline-none focus:border-[#087A42]"
              />
            </div>

            {authError && (
              <p className="text-xs text-rose-600 font-semibold">{authError}</p>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 bg-[#087A42] hover:bg-[#066336] text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {authLoading
                ? 'Authenticating...'
                : hasAdmin
                ? 'Log In to Dashboard'
                : 'Create Master Admin'}
            </button>
          </form>

          <p className="text-[11px] text-center text-[#5E695E]">
            Secure session encrypted with SHA-512 & HMAC tokens.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Admin Top Header */}
      <div className="bg-white rounded-3xl border border-[#E5E8E3] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#FF7900] bg-[#FFF4E5] px-2.5 py-0.5 rounded-full">
              Admin Console
            </span>
            <span className="text-xs text-[#5E695E]">Logged in as <strong>{adminUser?.username}</strong></span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#202720] mt-1">
            FanKO Store Management
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAdminData}
            disabled={loadingData}
            className="p-2 text-slate-500 hover:text-[#087A42] border border-[#E5E8E3] rounded-xl hover:bg-[#F7F8F6] transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={logoutAdmin}
            className="px-4 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-[#E5E8E3] pb-2 overflow-x-auto text-xs font-semibold">
        {[
          { key: 'overview', label: 'Overview', icon: IndianRupee },
          { key: 'orders', label: `Orders (${orders.length})`, icon: ShoppingBag },
          { key: 'products', label: `Catalog (${products.length})`, icon: Package },
          { key: 'coupons', label: `Coupons (${coupons.length})`, icon: Tag },
          { key: 'settings', label: 'Store & Payment Settings', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-[#087A42] text-white'
                  : 'text-[#5E695E] hover:bg-white hover:text-[#202720]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview & Metrics */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-3xl border border-[#E5E8E3] p-6 shadow-xs space-y-1">
              <p className="text-xs text-[#5E695E] font-medium">Total Paid Sales</p>
              <p className="text-2xl font-extrabold text-[#087A42] tabular-nums">
                ₹{stats?.totalSales || 0}
              </p>
              <p className="text-[11px] text-slate-400">Verified Razorpay & COD orders</p>
            </div>

            <div className="bg-white rounded-3xl border border-[#E5E8E3] p-6 shadow-xs space-y-1">
              <p className="text-xs text-[#5E695E] font-medium">Total Orders Placed</p>
              <p className="text-2xl font-extrabold text-[#202720] tabular-nums">
                {stats?.totalOrders || orders.length}
              </p>
              <p className="text-[11px] text-slate-400">{stats?.paidOrders || 0} marked paid</p>
            </div>

            <div className="bg-white rounded-3xl border border-[#E5E8E3] p-6 shadow-xs space-y-1">
              <p className="text-xs text-[#5E695E] font-medium">Fulfillment Pending</p>
              <p className="text-2xl font-extrabold text-[#FF7900] tabular-nums">
                {stats?.pendingOrders || 0}
              </p>
              <p className="text-[11px] text-slate-400">Awaiting courier dispatch</p>
            </div>

            <div className="bg-white rounded-3xl border border-[#E5E8E3] p-6 shadow-xs space-y-1">
              <p className="text-xs text-[#5E695E] font-medium">Catalog Inventory</p>
              <p className="text-2xl font-extrabold text-[#202720] tabular-nums">
                {products.length} Items
              </p>
              <p className="text-[11px] text-[#FF7900]">
                {stats?.lowStockCount || 0} low stock · {stats?.incompleteCount || 0} review needed
              </p>
            </div>
          </div>

          {/* Firebase Database & Cloud Sync Status */}
          <div className="bg-[#E8F5EE] border border-[#087A42]/20 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#087A42] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-[#087A42]">Firebase Firestore Cloud Database</h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#087A42] text-white">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-pulse"></span>
                    Connected & Active
                  </span>
                </div>
                <p className="text-[11px] text-[#202720]/80 mt-0.5">
                  Project ID: <span className="font-mono font-semibold">vast-runner-jbcxw</span> · Real-time persistence for Products, Orders & Store Credentials.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-[#087A42] bg-white px-3 py-1.5 rounded-xl border border-[#087A42]/20">
                Security Rules Deployed
              </span>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-white rounded-3xl border border-[#E5E8E3] p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-[#202720]">Order Data Management</h3>
              <p className="text-xs text-[#5E695E]">Export all customer orders with addresses and tracking numbers as CSV.</p>
            </div>
            <button
              onClick={handleExportCsv}
              className="px-4 py-2.5 bg-[#202720] hover:bg-black text-white text-xs font-semibold rounded-xl flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Orders (CSV)</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Orders Management */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl border border-[#E5E8E3] p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E8E3]">
            <div>
              <h2 className="text-base font-bold text-[#202720]">Customer Orders</h2>
              <p className="text-xs text-[#5E695E]">Manage status, assign courier AWB tracking, and inspect payment details.</p>
            </div>
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 bg-[#F7F8F6] hover:bg-[#E5E8E3] text-[#202720] text-xs font-semibold rounded-xl flex items-center gap-1.5 border border-[#E5E8E3]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#5E695E]">
              No orders placed yet. Place a test order in shop to see it appear here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-[#E5E8E3]">
                <thead>
                  <tr className="text-[#5E695E] font-semibold">
                    <th className="py-3 px-3">Order Number</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Items</th>
                    <th className="py-3 px-3">Total</th>
                    <th className="py-3 px-3">Payment</th>
                    <th className="py-3 px-3">Fulfillment</th>
                    <th className="py-3 px-3">Courier</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E8E3]">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-[#F7F8F6]/60">
                      <td className="py-3 px-3 font-mono font-bold text-[#202720]">
                        {ord.orderNumber}
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-semibold text-[#202720]">{ord.customer.fullName}</p>
                        <p className="text-[11px] text-[#5E695E]">{ord.customer.city}, {ord.customer.pincode}</p>
                      </td>
                      <td className="py-3 px-3">
                        {ord.items.length} ({ord.items.reduce((s, i) => s + i.quantity, 0)} units)
                      </td>
                      <td className="py-3 px-3 font-bold text-[#202720] tabular-nums">
                        ₹{ord.total}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                          ord.paymentStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {ord.paymentMethod.toUpperCase()} · {ord.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="capitalize font-semibold text-[#087A42]">
                          {ord.fulfillmentStatus.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[11px]">
                        {ord.shippingDetails?.courierName ? (
                          <div>
                            <span className="font-semibold text-[#202720]">{ord.shippingDetails.courierName}</span>
                            <p className="font-mono text-slate-400">{ord.shippingDetails.trackingNumber}</p>
                          </div>
                        ) : (
                          <span className="text-slate-400">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleOpenOrderModal(ord)}
                          className="px-2.5 py-1.5 bg-[#087A42] text-white text-[11px] font-semibold rounded-lg hover:bg-[#066336] transition-colors cursor-pointer"
                        >
                          Update
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Catalog & Products */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-3xl border border-[#E5E8E3] p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E8E3]">
            <div>
              <h2 className="text-base font-bold text-[#202720]">Product Catalog</h2>
              <p className="text-xs text-[#5E695E]">Add, edit specs, update stock quantities, or review placeholder products.</p>
            </div>
            <button
              onClick={() => handleOpenProductModal()}
              className="px-4 py-2 bg-[#087A42] hover:bg-[#066336] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          </div>

          <div className="divide-y divide-[#E5E8E3]">
            {products.map((prod) => (
              <div key={prod.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={prod.images[0]}
                    alt={prod.name}
                    className="w-14 h-14 object-contain rounded-xl bg-[#F7F8F6] p-1 border border-[#E5E8E3] shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-[#087A42] uppercase tracking-wider">{prod.category}</span>
                      {prod.isIncomplete && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                          Review Needed
                        </span>
                      )}
                    </div>
                    <h3 className="text-xs font-bold text-[#202720]">{prod.name}</h3>
                    <p className="text-[11px] text-[#5E695E]">
                      SKU: <span className="font-mono">{prod.sku}</span> · Stock: <strong className={prod.stock <= 5 ? 'text-[#FF7900]' : 'text-[#202720]'}>{prod.stock}</strong> · Price: ₹{prod.salePrice ?? prod.price}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => handleOpenProductModal(prod)}
                    className="p-2 text-slate-500 hover:text-[#087A42] hover:bg-[#E8F5EE] rounded-lg transition-colors"
                    title="Edit Product"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(prod.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Product"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Coupons */}
      {activeTab === 'coupons' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E5E8E3] p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[#202720] pb-2 border-b border-[#E5E8E3]">
              Active Discount Coupons
            </h2>
            <div className="divide-y divide-[#E5E8E3]">
              {coupons.map((c) => (
                <div key={c.code} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-[#087A42] bg-[#E8F5EE] px-2 py-0.5 rounded">
                        {c.code}
                      </span>
                      <span className="text-[11px] text-[#5E695E]">
                        {c.discountType === 'percentage'
                          ? `${c.discountValue}% OFF`
                          : c.discountType === 'fixed'
                          ? `₹${c.discountValue} FLAT`
                          : 'FREE SHIPPING'}
                      </span>
                    </div>
                    <p className="text-xs text-[#202720] mt-1">{c.description}</p>
                    <p className="text-[10px] text-slate-400">Min Order: ₹{c.minOrderValue} · Used {c.usageCount} times</p>
                  </div>
                  <button
                    onClick={() => handleDeleteCoupon(c.code)}
                    className="p-1.5 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E5E8E3] p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#202720] pb-2 border-b border-[#E5E8E3]">
              Create New Coupon
            </h3>
            <form onSubmit={handleCreateCoupon} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#202720] block mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FESTIVE20"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="w-full text-xs px-3 py-2 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl uppercase font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#202720] block mb-1">Description</label>
                <input
                  type="text"
                  placeholder="20% off on Diwali orders"
                  value={couponDesc}
                  onChange={(e) => setCouponDesc(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#202720] block mb-1">Discount Type</label>
                  <select
                    value={couponType}
                    onChange={(e) => setCouponType(e.target.value as any)}
                    className="w-full text-xs px-2.5 py-2 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl font-medium"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed INR (₹)</option>
                    <option value="free_shipping">Free Shipping</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#202720] block mb-1">Value *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 15 or 100"
                    value={couponValue}
                    onChange={(e) => setCouponValue(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#202720] block mb-1">Min Order (₹)</label>
                  <input
                    type="number"
                    placeholder="499"
                    value={couponMinOrder}
                    onChange={(e) => setCouponMinOrder(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#202720] block mb-1">Max Cap (₹)</label>
                  <input
                    type="number"
                    placeholder="Optional"
                    value={couponMaxDisc}
                    onChange={(e) => setCouponMaxDisc(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#087A42] hover:bg-[#066336] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Create Coupon
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 5: Store & Payment Settings */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-3xl border border-[#E5E8E3] p-6 sm:p-10 shadow-xs max-w-3xl space-y-6">
          <div>
            <h2 className="text-base font-bold text-[#202720]">Store Settings & Credentials</h2>
            <p className="text-xs text-[#5E695E]">Configure WhatsApp number, announcement banner, shipping thresholds, and Razorpay payment gateway credentials.</p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#202720] block mb-1">Store Name</label>
                <input
                  type="text"
                  value={settingsForm.storeName || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, storeName: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#202720] block mb-1">Support WhatsApp Number</label>
                <input
                  type="text"
                  placeholder="919876543210"
                  value={settingsForm.whatsappNumber || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#202720] block mb-1">Top Announcement Bar Text</label>
              <input
                type="text"
                value={settingsForm.announcementText || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, announcementText: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#202720] block mb-1">Free Shipping Threshold (₹)</label>
                <input
                  type="number"
                  value={settingsForm.freeShippingThreshold || 499}
                  onChange={(e) => setSettingsForm({ ...settingsForm, freeShippingThreshold: Number(e.target.value) })}
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#202720] block mb-1">Standard Shipping Fee (₹)</label>
                <input
                  type="number"
                  value={settingsForm.standardShippingFee || 49}
                  onChange={(e) => setSettingsForm({ ...settingsForm, standardShippingFee: Number(e.target.value) })}
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl"
                />
              </div>
            </div>

            {/* MX Pay Payment Gateway Section */}
            <div className="pt-5 border-t border-[#E5E8E3] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-[#202720] flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-[#FF7900]" />
                    <span>MX Pay Payment Gateway</span>
                  </h3>
                  <p className="text-[11px] text-[#5E695E]">
                    Connect your MX Pay merchant account for UPI, QR code, debit/credit cards, and net banking.
                  </p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  settingsForm.mxPayApiKey
                    ? 'bg-emerald-50 text-[#087A42] border-[#087A42]/30'
                    : 'bg-[#FFF4E5] text-[#FF7900] border-[#FF7900]/20'
                }`}>
                  {settingsForm.mxPayApiKey ? 'Live Gateway Key Set' : 'Awaiting API Key'}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-[#202720] block mb-1">
                    MX Pay API Key *
                  </label>
                  <div className="relative">
                    <input
                      type={showMxKey ? 'text' : 'password'}
                      placeholder="Paste your MX Pay API Key (e.g. mx_live_key_... or mx_test_...)"
                      value={settingsForm.mxPayApiKey || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, mxPayApiKey: e.target.value })}
                      className="w-full text-xs px-3.5 py-2.5 pr-14 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl font-mono focus:bg-white focus:border-[#087A42]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowMxKey(!showMxKey)}
                      className="absolute right-3 top-2 text-[11px] font-semibold text-slate-500 hover:text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200"
                    >
                      {showMxKey ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    This key will be saved to Firebase Firestore and used for authenticating MX Pay orders.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#202720] block mb-1">
                    MX Pay Merchant ID / Store ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MX_MERCHANT_FANKO"
                    value={settingsForm.mxPayMerchantId || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, mxPayMerchantId: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl font-mono"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-6 pt-1">
                  <label className="flex items-center gap-2 text-xs text-[#202720] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsForm.mxPayEnabled ?? true}
                      onChange={(e) => setSettingsForm({ ...settingsForm, mxPayEnabled: e.target.checked })}
                      className="rounded text-[#087A42] focus:ring-[#087A42]"
                    />
                    <span className="font-semibold">Enable MX Pay at Customer Checkout</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-[#5E695E] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsForm.mxPayTestMode ?? true}
                      onChange={(e) => setSettingsForm({ ...settingsForm, mxPayTestMode: e.target.checked })}
                      className="rounded text-[#FF7900] focus:ring-[#FF7900]"
                    />
                    <span>Test Sandbox Mode (Simulate without debiting real bank accounts)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Cash on Delivery (COD) Section */}
            <div className="pt-4 border-t border-[#E5E8E3] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-[#202720] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#087A42]" />
                    <span>Cash on Delivery (COD)</span>
                  </h3>
                  <p className="text-[11px] text-[#5E695E]">
                    Allow customers across India to pay cash at their doorstep upon package delivery.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs text-[#202720] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.codEnabled ?? true}
                    onChange={(e) => setSettingsForm({ ...settingsForm, codEnabled: e.target.checked })}
                    className="rounded text-[#087A42] focus:ring-[#087A42]"
                  />
                  <span>Enable Cash on Delivery (COD)</span>
                </label>
              </div>
            </div>

            {settingsSuccess && (
              <p className="text-xs text-[#087A42] font-semibold flex items-center gap-1">
                <Check className="w-4 h-4" />
                <span>Settings saved successfully!</span>
              </p>
            )}

            <button
              type="submit"
              disabled={savingSettings}
              className="px-6 py-2.5 bg-[#087A42] hover:bg-[#066336] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              {savingSettings ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        </div>
      )}

      {/* Order Status Update Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-[#E5E8E3]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E8E3]">
              <div>
                <span className="text-[11px] text-[#087A42] font-bold uppercase">Update Order</span>
                <h3 className="text-base font-extrabold text-[#202720]">{selectedOrder.orderNumber}</h3>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateOrderStatus} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#202720] block mb-1">Fulfillment Status</label>
                  <select
                    value={newFulfillmentStatus}
                    onChange={(e) => setNewFulfillmentStatus(e.target.value)}
                    className="w-full text-xs p-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl font-medium"
                  >
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#202720] block mb-1">Payment Status</label>
                  <select
                    value={newPaymentStatus}
                    onChange={(e) => setNewPaymentStatus(e.target.value)}
                    className="w-full text-xs p-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl font-medium"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#202720] block mb-1">Courier Name</label>
                <input
                  type="text"
                  placeholder="e.g. Delhivery, Blue Dart, DTDC, India Post"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#202720] block mb-1">Tracking Number (AWB)</label>
                <input
                  type="text"
                  placeholder="e.g. 1409283746"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#202720] block mb-1">Courier Tracking URL</label>
                <input
                  type="url"
                  placeholder="https://track.delhivery.com/..."
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#202720] block mb-1">Status Note</label>
                <input
                  type="text"
                  placeholder="e.g. Handed over to Blue Dart courier partner."
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={updatingOrder}
                  className="flex-1 py-2.5 bg-[#087A42] hover:bg-[#066336] text-white text-xs font-bold rounded-xl"
                >
                  {updatingOrder ? 'Saving...' : 'Save Updates'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Add / Edit Modal */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-[#E5E8E3] my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E8E3]">
              <h3 className="text-base font-extrabold text-[#202720]">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button onClick={() => setProductModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#202720] block mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={prodForm.name}
                  onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                  placeholder="e.g. FanKO Multi-Tier Countertop Organizer"
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#202720] block mb-1">Category *</label>
                  <select
                    value={prodForm.category}
                    onChange={(e) => setProdForm({ ...prodForm, category: e.target.value as any })}
                    className="w-full text-xs px-3 py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl font-medium"
                  >
                    <option value="Kitchen Essentials">Kitchen Essentials</option>
                    <option value="Home Organization">Home Organization</option>
                    <option value="Storage Solutions">Storage Solutions</option>
                    <option value="Cleaning Accessories">Cleaning Accessories</option>
                    <option value="Bathroom Organizers">Bathroom Organizers</option>
                    <option value="Daily-use Products">Daily-use Products</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#202720] block mb-1">SKU *</label>
                  <input
                    type="text"
                    required
                    value={prodForm.sku}
                    onChange={(e) => setProdForm({ ...prodForm, sku: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#202720] block mb-1">Regular Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={prodForm.price}
                    onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#202720] block mb-1">Sale Price (₹)</label>
                  <input
                    type="number"
                    value={prodForm.salePrice}
                    onChange={(e) => setProdForm({ ...prodForm, salePrice: e.target.value })}
                    placeholder="Optional"
                    className="w-full text-xs px-3 py-2 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#202720] block mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    value={prodForm.stock}
                    onChange={(e) => setProdForm({ ...prodForm, stock: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#202720] block mb-1">Image Asset Path / URL</label>
                <select
                  value={prodForm.image}
                  onChange={(e) => setProdForm({ ...prodForm, image: e.target.value })}
                  className="w-full text-xs px-3 py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl font-medium"
                >
                  <option value="/assets/aistudio/Ribbed_White_Vanity_Organizer_0347519c.png">Ribbed Vanity Organizer (White)</option>
                  <option value="/assets/aistudio/White_Plastic_Makeup_Drawer_Organizer_2efdbdc8.png">3-Tier Storage Drawer System</option>
                  <option value="/assets/aistudio/ChatGPT_Image_Sep_13__2026__07_47_42_PM_670f2782.png">Dual Drawer Curve Vanity Organizer</option>
                  <option value="/assets/aistudio/WhatsApp_Image_2026-09-_cf40f01d.jpeg">Groove & Crevice Cleaning Scrubber</option>
                  <option value="/assets/aistudio/ChatGPT_Image_Sep_13__2026__08_12_34_PM_f4538541.png">Long-Handle Dish Cleaning Brush</option>
                  <option value="/assets/aistudio/WhatsApp_Image_2026-09-13_at_7.38._d592a183.jpeg">3-in-1 Dual Soap Dispenser Caddy</option>
                  <option value="/assets/aistudio/WhatsApp_Image_2026-09-13_at_7.38.0_7cad6069.jpeg">Glass Oil & Vinegar Dispenser Jug</option>
                  <option value="/assets/aistudio/ChatGPT_Image_Sep_13__2026__08_08_46_PM_7a07ca46.png">Hydro-Lock Fresh Herb Keeper</option>
                  <option value="/assets/aistudio/ChatGPT_Image_Sep_13__2026__08_10_58_PM_027bc622.png">Ergonomic Arch Cushion Socks</option>
                  <option value="/assets/aistudio/fankostore.logo_1f90e1f5.png">FanKO Store Logo</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#202720] block mb-1">Dimensions</label>
                  <input
                    type="text"
                    placeholder="e.g. 24 x 12 x 10 cm"
                    value={prodForm.dimensions}
                    onChange={(e) => setProdForm({ ...prodForm, dimensions: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#202720] block mb-1">Material</label>
                  <input
                    type="text"
                    placeholder="e.g. BPA-Free ABS Plastic"
                    value={prodForm.material}
                    onChange={(e) => setProdForm({ ...prodForm, material: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#202720] block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={prodForm.description}
                  onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                  placeholder="Full detailed product description..."
                  className="w-full text-xs p-3 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl"
                />
              </div>

              <div className="pt-2 border-t border-[#E5E8E3]">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#202720]">
                  <input
                    type="checkbox"
                    checked={prodForm.isIncomplete}
                    onChange={(e) => setProdForm({ ...prodForm, isIncomplete: e.target.checked })}
                    className="rounded text-[#087A42] focus:ring-[#087A42]"
                  />
                  <span className="font-semibold text-amber-800">
                    Mark as Incomplete / Sample Entry (Awaiting Supplier Specs)
                  </span>
                </label>
                {prodForm.isIncomplete && (
                  <input
                    type="text"
                    placeholder="Internal note: e.g. Awaiting dimensions & weight testing"
                    value={prodForm.incompleteNotes}
                    onChange={(e) => setProdForm({ ...prodForm, incompleteNotes: e.target.value })}
                    className="w-full mt-2 text-xs px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl"
                  />
                )}
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#087A42] hover:bg-[#066336] text-white text-xs font-bold rounded-xl"
                >
                  {editingProduct ? 'Save Product Changes' : 'Create Product'}
                </button>
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
