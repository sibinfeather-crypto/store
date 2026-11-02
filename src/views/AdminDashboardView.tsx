import React, { useState, useEffect, useMemo } from 'react';
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
  Database,
  Smartphone,
  QrCode,
  Search,
  Filter,
  Upload,
  Phone,
  MessageCircle,
  Copy,
  Eye,
  CheckCircle2,
  Clock,
  FileText,
  Sparkles,
  ArrowUpDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import type {
  Product,
  Order,
  Coupon,
  StoreSettings,
  ProductCategory,
  OrderFulfillmentStatus,
  PaymentStatus,
} from '../types/index.ts';

interface AdminDashboardViewProps {
  onNavigate: (view: string, param?: string) => void;
}

const CATEGORIES: ProductCategory[] = [
  'Kitchen Essentials',
  'Home Organization',
  'Storage Solutions',
  'Cleaning Accessories',
  'Bathroom Organizers',
  'Daily-use Products',
];

const PRESET_IMAGES = [
  { label: 'Ribbed Vanity Organizer (White)', url: '/assets/aistudio/Ribbed_White_Vanity_Organizer_0347519c.png' },
  { label: '3-Tier Storage Drawer System', url: '/assets/aistudio/White_Plastic_Makeup_Drawer_Organizer_2efdbdc8.png' },
  { label: 'Dual Drawer Curve Vanity Organizer', url: '/assets/aistudio/ChatGPT_Image_Sep_13__2026__07_47_42_PM_670f2782.png' },
  { label: 'Groove & Crevice Cleaning Scrubber', url: '/assets/aistudio/WhatsApp_Image_2026-09-_cf40f01d.jpeg' },
  { label: 'Long-Handle Dish Cleaning Brush', url: '/assets/aistudio/ChatGPT_Image_Sep_13__2026__08_12_34_PM_f4538541.png' },
  { label: '3-in-1 Dual Soap Dispenser Caddy', url: '/assets/aistudio/WhatsApp_Image_2026-09-13_at_7.38._d592a183.jpeg' },
  { label: 'Glass Oil & Vinegar Dispenser Jug', url: '/assets/aistudio/WhatsApp_Image_2026-09-13_at_7.38.0_7cad6069.jpeg' },
  { label: 'Hydro-Lock Fresh Herb Keeper', url: '/assets/aistudio/ChatGPT_Image_Sep_13__2026__08_08_46_PM_7a07ca46.png' },
  { label: 'Ergonomic Arch Cushion Socks', url: '/assets/aistudio/ChatGPT_Image_Sep_13__2026__08_10_58_PM_027bc622.png' },
  { label: 'FanKO Store Official Logo', url: '/assets/aistudio/fankostore.logo_1f90e1f5.png' },
];

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

  // Product filters & inline edit
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('All');
  const [productStockFilter, setProductStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [quickEditingId, setQuickEditingId] = useState<string | null>(null);
  const [quickPrice, setQuickPrice] = useState<string>('');
  const [quickSalePrice, setQuickSalePrice] = useState<string>('');
  const [quickStock, setQuickStock] = useState<string>('');

  // Product Add / Edit modal
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [imageMode, setImageMode] = useState<'preset' | 'custom' | 'upload'>('preset');
  const [prodForm, setProdForm] = useState({
    name: '',
    sku: '',
    category: 'Kitchen Essentials' as ProductCategory,
    subCategory: '',
    price: '',
    salePrice: '',
    stock: '',
    shortDescription: '',
    description: '',
    dimensions: '',
    material: '',
    weight: '',
    color: '',
    careInstructions: '',
    countryOfOrigin: 'India',
    image: '/assets/aistudio/Ribbed_White_Vanity_Organizer_0347519c.png',
    customImageUrl: '',
    isIncomplete: false,
    incompleteNotes: '',
    featured: false,
    isNewArrival: true,
  });

  // Orders Management & Details Modal
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState<string>('all');
  const [detailedOrder, setDetailedOrder] = useState<Order | null>(null);
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(null);
  const [copiedUtr, setCopiedUtr] = useState(false);

  // Order status update form inside details modal
  const [editFulfillmentStatus, setEditFulfillmentStatus] = useState<OrderFulfillmentStatus>('confirmed');
  const [editPaymentStatus, setEditPaymentStatus] = useState<PaymentStatus>('pending');
  const [courierName, setCourierName] = useState<string>('');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [trackingUrl, setTrackingUrl] = useState<string>('');
  const [statusNote, setStatusNote] = useState<string>('');
  const [updatingOrder, setUpdatingOrder] = useState(false);

  // Coupon Add state
  const [couponCode, setCouponCode] = useState('');
  const [couponDesc, setCouponDesc] = useState('');
  const [couponType, setCouponType] = useState<'percentage' | 'fixed' | 'free_shipping'>('percentage');
  const [couponValue, setCouponValue] = useState('');
  const [couponMinOrder, setCouponMinOrder] = useState('');
  const [couponMaxDisc, setCouponMaxDisc] = useState('');

  // Settings form state (including UPI & QR code configuration)
  const [settingsForm, setSettingsForm] = useState<Partial<StoreSettings>>({});
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [qrCodeTab, setQrCodeTab] = useState<'dynamic' | 'custom'>('dynamic');
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Check admin setup on mount
  useEffect(() => {
    api.checkAdminSetup()
      .then((res) => {
        setHasAdmin(res.hasAdmin);
      })
      .catch(() => {});
  }, []);

  // Fetch admin data once logged in
  useEffect(() => {
    if (isAdminLoggedIn && adminToken) {
      loadAdminData();
    }
  }, [isAdminLoggedIn, adminToken]);

  // Real-time cloud sync: updates prices, inventory, and incoming orders automatically when changed from any device
  useEffect(() => {
    if (isAdminLoggedIn) {
      const unsubProducts = api.subscribeProducts((liveProds) => {
        if (liveProds && liveProds.length > 0) {
          setProducts(liveProds);
        }
      });
      const unsubOrders = api.subscribeOrders((liveOrders) => {
        if (liveOrders) {
          setOrders(liveOrders);
        }
      });
      const unsubSettings = api.subscribeSettings((liveSettings) => {
        if (liveSettings) {
          setSettings(liveSettings);
        }
      });
      return () => {
        unsubProducts();
        unsubOrders();
        unsubSettings();
      };
    }
  }, [isAdminLoggedIn]);

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
      setQrCodeTab(setRes.upiQrMode || 'dynamic');
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

  // -------------------------------------------------------------
  // Order Details & Status Updating
  // -------------------------------------------------------------
  const handleOpenOrderDetails = (order: Order) => {
    setDetailedOrder(order);
    setEditFulfillmentStatus(order.fulfillmentStatus);
    setEditPaymentStatus(order.paymentStatus);
    setCourierName(order.shippingDetails?.courierName || '');
    setTrackingNumber(order.shippingDetails?.trackingNumber || '');
    setTrackingUrl(order.shippingDetails?.trackingUrl || '');
    setStatusNote('');
  };

  const handleSaveOrderStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailedOrder || !adminToken) return;
    setUpdatingOrder(true);
    try {
      const updated = await api.updateAdminOrderStatus(adminToken, detailedOrder.id, {
        fulfillmentStatus: editFulfillmentStatus,
        paymentStatus: editPaymentStatus,
        courierName: courierName.trim() || undefined,
        trackingNumber: trackingNumber.trim() || undefined,
        trackingUrl: trackingUrl.trim() || undefined,
        note: statusNote.trim() || undefined,
      });
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setDetailedOrder(updated);
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

  // -------------------------------------------------------------
  // Product Catalog Management
  // -------------------------------------------------------------
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !productSearch ||
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.category.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.description.toLowerCase().includes(productSearch.toLowerCase());

      const matchesCat = productCategoryFilter === 'All' || p.category === productCategoryFilter;

      let matchesStock = true;
      if (productStockFilter === 'in_stock') matchesStock = p.stock > 5;
      else if (productStockFilter === 'low_stock') matchesStock = p.stock > 0 && p.stock <= 5;
      else if (productStockFilter === 'out_of_stock') matchesStock = p.stock === 0;

      return matchesSearch && matchesCat && matchesStock;
    });
  }, [products, productSearch, productCategoryFilter, productStockFilter]);

  const handleOpenProductModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      const isPreset = PRESET_IMAGES.some((img) => img.url === product.images[0]);
      setImageMode(isPreset ? 'preset' : 'custom');
      setProdForm({
        name: product.name,
        sku: product.sku,
        category: product.category,
        subCategory: product.subCategory || '',
        price: String(product.price),
        salePrice: product.salePrice ? String(product.salePrice) : '',
        stock: String(product.stock),
        shortDescription: product.shortDescription,
        description: product.description,
        dimensions: product.dimensions || product.specifications?.dimensions || '',
        material: product.material || product.specifications?.material || '',
        weight: product.specifications?.weight || '',
        color: product.specifications?.color || '',
        careInstructions: product.specifications?.careInstructions || '',
        countryOfOrigin: product.specifications?.countryOfOrigin || 'India',
        image: isPreset ? product.images[0] : PRESET_IMAGES[0].url,
        customImageUrl: !isPreset ? (product.images[0] || '') : '',
        isIncomplete: Boolean(product.isIncomplete),
        incompleteNotes: product.incompleteNotes || '',
        featured: Boolean(product.featured),
        isNewArrival: product.isNewArrival !== undefined ? Boolean(product.isNewArrival) : true,
      });
    } else {
      setEditingProduct(null);
      setImageMode('preset');
      setProdForm({
        name: '',
        sku: `FKO-${Date.now().toString().slice(-4)}`,
        category: 'Kitchen Essentials',
        subCategory: '',
        price: '',
        salePrice: '',
        stock: '25',
        shortDescription: '',
        description: '',
        dimensions: '',
        material: '',
        weight: '',
        color: '',
        careInstructions: 'Wipe with soft damp cloth.',
        countryOfOrigin: 'India',
        image: PRESET_IMAGES[0].url,
        customImageUrl: '',
        isIncomplete: false,
        incompleteNotes: '',
        featured: false,
        isNewArrival: true,
      });
    }
    setProductModalOpen(true);
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProdForm((prev) => ({
          ...prev,
          customImageUrl: reader.result as string,
        }));
        setImageMode('custom');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;

    const finalImage =
      imageMode === 'custom' && prodForm.customImageUrl.trim()
        ? prodForm.customImageUrl.trim()
        : prodForm.image;

    const payload = {
      name: prodForm.name.trim(),
      sku: prodForm.sku.trim(),
      category: prodForm.category,
      subCategory: prodForm.subCategory.trim(),
      price: Number(prodForm.price),
      salePrice: prodForm.salePrice && Number(prodForm.salePrice) > 0 ? Number(prodForm.salePrice) : undefined,
      stock: Number(prodForm.stock),
      shortDescription: prodForm.shortDescription.trim() || prodForm.description.trim().slice(0, 120),
      description: prodForm.description.trim(),
      dimensions: prodForm.dimensions.trim(),
      material: prodForm.material.trim(),
      specifications: {
        dimensions: prodForm.dimensions.trim(),
        material: prodForm.material.trim(),
        weight: prodForm.weight.trim(),
        color: prodForm.color.trim(),
        careInstructions: prodForm.careInstructions.trim(),
        countryOfOrigin: prodForm.countryOfOrigin.trim(),
      },
      images: [finalImage],
      isIncomplete: prodForm.isIncomplete,
      incompleteNotes: prodForm.incompleteNotes.trim(),
      featured: prodForm.featured,
      isNewArrival: prodForm.isNewArrival,
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

  const handleStartQuickEdit = (p: Product) => {
    setQuickEditingId(p.id);
    setQuickPrice(String(p.price));
    setQuickSalePrice(p.salePrice ? String(p.salePrice) : '');
    setQuickStock(String(p.stock));
  };

  const handleSaveQuickEdit = async (id: string) => {
    if (!adminToken) return;
    try {
      const updated = await api.updateProduct(adminToken, id, {
        price: Number(quickPrice),
        salePrice: quickSalePrice && Number(quickSalePrice) > 0 ? Number(quickSalePrice) : undefined,
        stock: Number(quickStock),
      });
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setQuickEditingId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update price and stock');
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

  // -------------------------------------------------------------
  // Settings & UPI QR Code Management
  // -------------------------------------------------------------
  const handleQrImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettingsForm((prev) => ({
          ...prev,
          customUpiQrUrl: reader.result as string,
          upiQrMode: 'custom',
        }));
        setQrCodeTab('custom');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;
    setSavingSettings(true);
    setSettingsSuccess(false);

    try {
      const updatedPayload = {
        ...settingsForm,
        upiQrMode: qrCodeTab,
      };
      const updated = await api.updateSettings(adminToken, updatedPayload);
      setSettings(updated);
      setSettingsForm(updated);
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to save store settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCopyUpi = (upiId: string) => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // -------------------------------------------------------------
  // Filtered Orders
  // -------------------------------------------------------------
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        !orderSearch ||
        o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.customer.fullName.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.customer.phone.includes(orderSearch) ||
        o.customer.city.toLowerCase().includes(orderSearch.toLowerCase());

      const matchesStatus = orderStatusFilter === 'all' || o.fulfillmentStatus === orderStatusFilter;
      const matchesPayment = orderPaymentFilter === 'all' || o.paymentStatus === orderPaymentFilter;

      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [orders, orderSearch, orderStatusFilter, orderPaymentFilter]);

  // If Not Logged In: Show Admin Login / Setup Screen
  if (!isAdminLoggedIn) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 space-y-6">
        <div className="bg-white rounded-3xl border border-[#E5E8E3] p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-[#E8F5EE] text-[#087A42] flex items-center justify-center mx-auto shadow-xs">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-extrabold text-[#202720]">
              {hasAdmin ? 'FanKO Admin Portal' : 'First-Time Admin Setup'}
            </h1>
            <p className="text-xs text-[#5E695E]">
              {hasAdmin
                ? 'Sign in to manage catalog, product pricing, UPI QR codes, and customer orders.'
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
            Encrypted session · Firebase Firestore synced
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-[#E5E8E3] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#FF7900] bg-[#FFF4E5] px-2.5 py-0.5 rounded-full">
              Store Admin
            </span>
            <span className="text-xs text-[#5E695E]">Logged in as <strong>{adminUser?.username}</strong></span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#202720] mt-1">
            FanKO Store Control Panel
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAdminData}
            disabled={loadingData}
            className="p-2.5 text-slate-500 hover:text-[#087A42] border border-[#E5E8E3] rounded-xl hover:bg-[#F7F8F6] transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={logoutAdmin}
            className="px-4 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 border-b border-[#E5E8E3] pb-2 overflow-x-auto text-xs font-semibold">
        {[
          { key: 'overview', label: 'Overview', icon: IndianRupee },
          { key: 'orders', label: `Orders (${orders.length})`, icon: ShoppingBag },
          { key: 'products', label: `Product Catalog (${products.length})`, icon: Package },
          { key: 'settings', label: 'UPI QR Codes & Settings', icon: QrCode },
          { key: 'coupons', label: `Coupons (${coupons.length})`, icon: Tag },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-[#087A42] text-white shadow-xs'
                  : 'text-[#5E695E] hover:bg-white hover:text-[#202720]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* TAB 1: OVERVIEW */}
      {/* ========================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-3xl border border-[#E5E8E3] p-6 shadow-xs space-y-1">
              <p className="text-xs text-[#5E695E] font-medium">Total Paid Sales</p>
              <p className="text-2xl font-extrabold text-[#087A42] tabular-nums">
                ₹{stats?.totalSales || 0}
              </p>
              <p className="text-[11px] text-slate-400">Direct UPI & Advance Verified orders</p>
            </div>

            <div className="bg-white rounded-3xl border border-[#E5E8E3] p-6 shadow-xs space-y-1">
              <p className="text-xs text-[#5E695E] font-medium">Total Customer Orders</p>
              <p className="text-2xl font-extrabold text-[#202720] tabular-nums">
                {stats?.totalOrders || orders.length}
              </p>
              <p className="text-[11px] text-slate-400">{orders.filter((o) => o.paymentStatus === 'paid').length} full paid · {orders.filter((o) => o.paymentStatus === 'advance_paid').length} COD advance</p>
            </div>

            <div className="bg-white rounded-3xl border border-[#E5E8E3] p-6 shadow-xs space-y-1">
              <p className="text-xs text-[#5E695E] font-medium">Pending Fulfillment</p>
              <p className="text-2xl font-extrabold text-[#FF7900] tabular-nums">
                {orders.filter((o) => o.fulfillmentStatus === 'confirmed' || o.fulfillmentStatus === 'processing').length}
              </p>
              <p className="text-[11px] text-slate-400">Awaiting dispatch or tracking assignment</p>
            </div>

            <div className="bg-white rounded-3xl border border-[#E5E8E3] p-6 shadow-xs space-y-1">
              <p className="text-xs text-[#5E695E] font-medium">Catalog Inventory</p>
              <p className="text-2xl font-extrabold text-[#202720] tabular-nums">
                {products.length} Products
              </p>
              <p className="text-[11px] text-[#FF7900]">
                {products.filter((p) => p.stock <= 5 && p.stock > 0).length} low stock · {products.filter((p) => p.stock === 0).length} out of stock
              </p>
            </div>
          </div>

          {/* Quick Actions Shortcuts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              onClick={() => setActiveTab('products')}
              className="bg-white rounded-3xl border border-[#E5E8E3] p-6 shadow-xs hover:border-[#087A42] transition-colors cursor-pointer space-y-3"
            >
              <div className="w-10 h-10 rounded-2xl bg-[#E8F5EE] text-[#087A42] flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#202720]">Add Products & Prices</h3>
              <p className="text-xs text-[#5E695E]">
                Add new items, modify MRP/sale prices, adjust inventory stock, or edit product specifications.
              </p>
              <span className="text-xs font-bold text-[#087A42] flex items-center gap-1">
                Open Catalog →
              </span>
            </div>

            <div
              onClick={() => setActiveTab('orders')}
              className="bg-white rounded-3xl border border-[#E5E8E3] p-6 shadow-xs hover:border-[#087A42] transition-colors cursor-pointer space-y-3"
            >
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#202720]">See Order Details</h3>
              <p className="text-xs text-[#5E695E]">
                View customer shipping addresses, ordered items, payment verification, and assign courier AWB tracking.
              </p>
              <span className="text-xs font-bold text-blue-600 flex items-center gap-1">
                Manage Orders →
              </span>
            </div>

            <div
              onClick={() => setActiveTab('settings')}
              className="bg-white rounded-3xl border border-[#E5E8E3] p-6 shadow-xs hover:border-[#087A42] transition-colors cursor-pointer space-y-3"
            >
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-[#FF7900] flex items-center justify-center">
                <QrCode className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#202720]">Change UPI QR Codes</h3>
              <p className="text-xs text-[#5E695E]">
                Update store UPI VPA ID, switch to custom QR code image (upload or URL), or adjust COD advance token amount.
              </p>
              <span className="text-xs font-bold text-[#FF7900] flex items-center gap-1">
                Configure UPI →
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: ORDERS MANAGEMENT & DETAILS */}
      {/* ========================================================= */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl border border-[#E5E8E3] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E8E3]">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#202720]">Customer Orders & Logistics</h2>
              <p className="text-xs text-[#5E695E]">
                Click on any order to see full customer contact info, ordered items, payment details, or update tracking.
              </p>
            </div>
            <button
              onClick={handleExportCsv}
              className="px-4 py-2 bg-[#F7F8F6] hover:bg-[#E5E8E3] text-[#202720] text-xs font-semibold rounded-xl flex items-center gap-1.5 border border-[#E5E8E3] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Orders (CSV)</span>
            </button>
          </div>

          {/* Orders Search & Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search order #, customer, phone..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl focus:outline-none focus:border-[#087A42]"
              />
            </div>

            <div>
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="w-full text-xs px-3 py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl font-medium"
              >
                <option value="all">All Fulfillment Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <select
                value={orderPaymentFilter}
                onChange={(e) => setOrderPaymentFilter(e.target.value)}
                className="w-full text-xs px-3 py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl font-medium"
              >
                <option value="all">All Payment Statuses</option>
                <option value="paid">100% Paid (Full UPI)</option>
                <option value="advance_paid">Advance Paid (COD)</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#5E695E] space-y-2">
              <ShoppingBag className="w-8 h-8 mx-auto text-slate-300" />
              <p className="font-semibold text-slate-600">No orders match the current filter.</p>
              <p>Place an order through the store checkout to see it live here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-[#E5E8E3]">
                <thead>
                  <tr className="text-[#5E695E] font-semibold">
                    <th className="py-3 px-3">Order Number</th>
                    <th className="py-3 px-3">Date</th>
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
                  {filteredOrders.map((ord) => (
                    <tr
                      key={ord.id}
                      onClick={() => handleOpenOrderDetails(ord)}
                      className="hover:bg-[#F7F8F6]/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-3 font-mono font-bold text-[#202720]">
                        {ord.orderNumber}
                      </td>
                      <td className="py-3 px-3 text-[11px] text-[#5E695E]">
                        {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-semibold text-[#202720]">{ord.customer.fullName}</p>
                        <p className="text-[11px] text-[#5E695E]">{ord.customer.city}, {ord.customer.pincode}</p>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-medium">
                          {ord.items.length} {ord.items.length === 1 ? 'item' : 'items'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-[#202720] tabular-nums">
                        ₹{ord.total}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                            ord.paymentStatus === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ord.paymentStatus === 'advance_paid'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {ord.paymentMethod.toUpperCase()} · {ord.paymentStatus.replace('_', ' ')}
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
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenOrderDetails(ord);
                          }}
                          className="px-3 py-1.5 bg-[#087A42] text-white text-[11px] font-semibold rounded-lg hover:bg-[#066336] transition-colors cursor-pointer"
                        >
                          See Details
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

      {/* ========================================================= */}
      {/* TAB 3: PRODUCT CATALOG (ADD & EDIT PRICES / DETAILS) */}
      {/* ========================================================= */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-3xl border border-[#E5E8E3] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E8E3]">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#202720]">Product Catalog & Pricing</h2>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-[#087A42] border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#087A42] animate-pulse"></span>
                  Cloud Synced
                </span>
              </div>
              <p className="text-xs text-[#5E695E] mt-0.5">
                Add new products, adjust regular and sale prices, and manage inventory. All price changes instantly sync across every device in real-time.
              </p>
            </div>
            <button
              onClick={() => handleOpenProductModal()}
              className="px-4 py-2.5 bg-[#087A42] hover:bg-[#066336] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          </div>

          {/* Search & Category Filter Pills */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search products by title, SKU, category..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl focus:outline-none focus:border-[#087A42]"
                />
              </div>

              <div>
                <select
                  value={productStockFilter}
                  onChange={(e) => setProductStockFilter(e.target.value as any)}
                  className="w-full text-xs px-3 py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl font-medium"
                >
                  <option value="all">All Stock Levels</option>
                  <option value="in_stock">In Stock (&gt; 5)</option>
                  <option value="low_stock">Low Stock (1 - 5)</option>
                  <option value="out_of_stock">Out of Stock (0)</option>
                </select>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
              {['All', ...CATEGORIES].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setProductCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer text-[11px] font-semibold ${
                    productCategoryFilter === cat
                      ? 'bg-[#087A42] text-white'
                      : 'bg-[#F7F8F6] text-[#5E695E] hover:text-[#202720]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Items List with Inline Price & Stock Editing */}
          <div className="divide-y divide-[#E5E8E3]">
            {filteredProducts.map((prod) => {
              const isQuickEditing = quickEditingId === prod.id;
              return (
                <div key={prod.id} className="py-4 space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={prod.images[0]}
                        alt={prod.name}
                        className="w-16 h-16 object-contain rounded-xl bg-[#F7F8F6] p-1.5 border border-[#E5E8E3] shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold text-[#087A42] bg-[#E8F5EE] px-2 py-0.5 rounded uppercase">
                            {prod.category}
                          </span>
                          {prod.featured && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                              Featured
                            </span>
                          )}
                          {prod.isIncomplete && (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                              Review Needed
                            </span>
                          )}
                        </div>
                        <h3 className="text-xs font-bold text-[#202720] truncate mt-0.5">{prod.name}</h3>
                        <p className="text-[11px] text-[#5E695E]">
                          SKU: <span className="font-mono">{prod.sku}</span> · Stock:{' '}
                          <strong className={prod.stock <= 5 ? 'text-[#FF7900]' : 'text-[#202720]'}>
                            {prod.stock} units
                          </strong>
                        </p>
                      </div>
                    </div>

                    {/* Price and Action Buttons */}
                    <div className="flex items-center gap-4 self-end sm:self-auto shrink-0">
                      {!isQuickEditing ? (
                        <div className="text-right">
                          <div className="text-sm font-extrabold text-[#087A42] tabular-nums">
                            ₹{prod.salePrice ?? prod.price}
                          </div>
                          {prod.salePrice && (
                            <div className="text-[10px] text-slate-400 line-through">
                              ₹{prod.price}
                            </div>
                          )}
                        </div>
                      ) : null}

                      <div className="flex items-center gap-1.5">
                        {!isQuickEditing ? (
                          <button
                            onClick={() => handleStartQuickEdit(prod)}
                            className="px-2.5 py-1.5 bg-[#F7F8F6] hover:bg-[#E5E8E3] text-[#202720] text-xs font-semibold rounded-lg flex items-center gap-1 border border-[#E5E8E3] cursor-pointer"
                            title="Quick Edit Price & Stock"
                          >
                            <IndianRupee className="w-3.5 h-3.5 text-[#087A42]" />
                            <span>Quick Price</span>
                          </button>
                        ) : null}

                        <button
                          onClick={() => handleOpenProductModal(prod)}
                          className="p-2 text-slate-600 hover:text-[#087A42] hover:bg-[#E8F5EE] rounded-lg transition-colors cursor-pointer"
                          title="Full Edit Details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Inline Quick Price & Stock Edit Bar */}
                  {isQuickEditing && (
                    <div className="p-3 bg-[#F7F8F6] border border-[#087A42]/30 rounded-2xl flex flex-wrap items-center gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-[#5E695E] block">Regular Price (₹)</label>
                        <input
                          type="number"
                          value={quickPrice}
                          onChange={(e) => setQuickPrice(e.target.value)}
                          className="w-24 text-xs px-2.5 py-1.5 bg-white border border-[#E5E8E3] rounded-lg font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-[#5E695E] block">Sale Price (₹)</label>
                        <input
                          type="number"
                          placeholder="Optional"
                          value={quickSalePrice}
                          onChange={(e) => setQuickSalePrice(e.target.value)}
                          className="w-24 text-xs px-2.5 py-1.5 bg-white border border-[#E5E8E3] rounded-lg font-bold text-[#087A42]"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-[#5E695E] block">Stock Qty</label>
                        <input
                          type="number"
                          value={quickStock}
                          onChange={(e) => setQuickStock(e.target.value)}
                          className="w-20 text-xs px-2.5 py-1.5 bg-white border border-[#E5E8E3] rounded-lg font-bold"
                        />
                      </div>

                      <div className="flex items-center gap-2 self-end pt-3">
                        <button
                          onClick={() => handleSaveQuickEdit(prod.id)}
                          className="px-3 py-1.5 bg-[#087A42] hover:bg-[#066336] text-white text-xs font-bold rounded-lg cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setQuickEditingId(null)}
                          className="px-3 py-1.5 bg-white text-slate-600 text-xs font-semibold rounded-lg border border-[#E5E8E3] cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: UPI QR CODES & STORE SETTINGS */}
      {/* ========================================================= */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-3xl border border-[#E5E8E3] p-6 sm:p-10 shadow-xs max-w-4xl space-y-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#087A42] animate-pulse"></span>
              <span className="text-xs font-bold text-[#087A42] uppercase tracking-wider">Payment Gateway Configuration</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#202720] mt-1">
              UPI QR Codes & Payment Settings
            </h2>
            <p className="text-xs text-[#5E695E]">
              Customize your receiving UPI VPA ID, switch between dynamic QR codes or your own business QR code image, and configure COD advance settings.
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-6">
            {/* UPI Account Details */}
            <div className="p-5 bg-[#F7F8F6] rounded-2xl border border-[#E5E8E3] space-y-4">
              <h3 className="text-xs font-bold text-[#202720] flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#087A42]" />
                <span>Primary Receiving UPI Account</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#202720] block mb-1">
                    Store UPI ID / VPA *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. fankostore@okhdfcbank"
                    value={settingsForm.upiId || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, upiId: e.target.value.trim() })}
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-[#E5E8E3] rounded-xl font-mono focus:border-[#087A42] focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Receives direct GPay, PhonePe, Paytm, and BHIM payments directly into your bank.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#202720] block mb-1">
                    Payee Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FanKO Store"
                    value={settingsForm.upiPayeeName || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, upiPayeeName: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-[#E5E8E3] rounded-xl focus:border-[#087A42] focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Name displayed on customer’s phone when scanning or opening UPI apps.
                  </p>
                </div>
              </div>
            </div>

            {/* UPI QR Code Mode Selection & Custom QR Upload */}
            <div className="p-5 bg-[#F7F8F6] rounded-2xl border border-[#E5E8E3] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold text-[#202720] flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-[#FF7900]" />
                    <span>UPI QR Code Presentation Mode</span>
                  </h3>
                  <p className="text-[11px] text-[#5E695E]">
                    Choose how customers see the QR code on the payment screen.
                  </p>
                </div>

                <div className="flex gap-1.5 p-1 bg-white border border-[#E5E8E3] rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setQrCodeTab('dynamic');
                      setSettingsForm({ ...settingsForm, upiQrMode: 'dynamic' });
                    }}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      qrCodeTab === 'dynamic'
                        ? 'bg-[#087A42] text-white shadow-xs'
                        : 'text-slate-600 hover:text-black'
                    }`}
                  >
                    Dynamic Auto-Generated QR
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQrCodeTab('custom');
                      setSettingsForm({ ...settingsForm, upiQrMode: 'custom' });
                    }}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      qrCodeTab === 'custom'
                        ? 'bg-[#087A42] text-white shadow-xs'
                        : 'text-slate-600 hover:text-black'
                    }`}
                  >
                    Custom Business QR Image
                  </button>
                </div>
              </div>

              {/* Mode 1: Dynamic QR Code Info */}
              {qrCodeTab === 'dynamic' ? (
                <div className="p-4 bg-white border border-emerald-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#087A42]">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Dynamic NPCI UPI QR is Active</span>
                  </div>
                  <p className="text-xs text-[#5E695E]">
                    The QR code automatically encodes the store’s UPI ID (
                    <strong className="text-[#202720] font-mono">{settingsForm.upiId || 'fankostore@okhdfcbank'}</strong>),
                    the payee name, and the exact order amount with a unique transaction note.
                  </p>
                </div>
              ) : (
                /* Mode 2: Custom Business QR Code Image Upload */
                <div className="p-4 bg-white border border-orange-200 rounded-xl space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#FF7900]">
                    <Sparkles className="w-4 h-4" />
                    <span>Upload or Enter Custom Business QR Code Image</span>
                  </div>
                  <p className="text-xs text-[#5E695E]">
                    Upload a picture of your store standee (from PhonePe Business, Google Pay for Business, BharatPe, or Paytm) or paste an image URL.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-[#202720] block mb-1">
                        Upload QR Image File
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleQrImageUpload}
                        className="text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#E8F5EE] file:text-[#087A42] hover:file:bg-[#087A42] hover:file:text-white file:cursor-pointer cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[#202720] block mb-1">
                        Or Enter Direct QR Image URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://example.com/my-shop-qr.png"
                        value={settingsForm.customUpiQrUrl || ''}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, customUpiQrUrl: e.target.value.trim() })
                        }
                        className="w-full text-xs px-3.5 py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl focus:bg-white focus:border-[#087A42] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Live QR Code Preview Box */}
              <div className="p-4 bg-white border border-[#E5E8E3] rounded-2xl flex flex-col sm:flex-row items-center gap-6">
                <div className="w-32 h-32 bg-[#F7F8F6] p-2 rounded-2xl border border-slate-200 flex items-center justify-center shrink-0 shadow-inner">
                  <img
                    src={
                      qrCodeTab === 'custom' && settingsForm.customUpiQrUrl
                        ? settingsForm.customUpiQrUrl
                        : `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=10&data=${encodeURIComponent(
                            `upi://pay?pa=${settingsForm.upiId || 'fankostore@okhdfcbank'}&pn=${encodeURIComponent(
                              settingsForm.upiPayeeName || 'FanKO Store'
                            )}&cu=INR&tn=OrderPreview`
                          )}`
                    }
                    alt="Live UPI QR Preview"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="space-y-1.5 text-center sm:text-left flex-1 min-w-0">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="text-xs font-bold text-[#202720]">Live Customer View Preview</span>
                    <span className="text-[10px] font-bold text-[#087A42] bg-[#E8F5EE] px-2 py-0.5 rounded-full">
                      {qrCodeTab === 'custom' ? 'Custom QR Mode' : 'Dynamic QR Mode'}
                    </span>
                  </div>
                  <p className="text-xs text-[#5E695E]">
                    This is the exact QR code displayed to your buyers on mobile and desktop checkout.
                  </p>
                  <p className="text-xs font-mono font-semibold text-[#202720] truncate">
                    UPI ID: {settingsForm.upiId || 'fankostore@okhdfcbank'}
                  </p>
                </div>
              </div>
            </div>

            {/* Cash on Delivery (COD) with Advance Token */}
            <div className="p-5 bg-[#F7F8F6] rounded-2xl border border-[#E5E8E3] space-y-4">
              <h3 className="text-xs font-bold text-[#202720] flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#FF7900]" />
                <span>Cash on Delivery (COD) Advance Token Settings</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#202720] block mb-1">
                    Advance Token Amount (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={settingsForm.codAdvanceAmount ?? 99}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, codAdvanceAmount: Number(e.target.value) })
                    }
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-[#E5E8E3] rounded-xl font-bold"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Customer pays this token via UPI to confirm order; remaining balance is collected upon delivery.
                  </p>
                </div>

                <div className="flex flex-col justify-center space-y-2 pt-2">
                  <label className="flex items-center gap-2 text-xs text-[#202720] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsForm.codEnabled ?? true}
                      onChange={(e) => setSettingsForm({ ...settingsForm, codEnabled: e.target.checked })}
                      className="rounded text-[#087A42] focus:ring-[#087A42]"
                    />
                    <span className="font-semibold">Enable Cash on Delivery checkout option</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-[#202720] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsForm.upiEnabled ?? true}
                      onChange={(e) => setSettingsForm({ ...settingsForm, upiEnabled: e.target.checked })}
                      className="rounded text-[#087A42] focus:ring-[#087A42]"
                    />
                    <span className="font-semibold">Enable 100% Full UPI Payment option</span>
                  </label>
                </div>
              </div>
            </div>

            {/* General Store Details */}
            <div className="p-5 bg-[#F7F8F6] rounded-2xl border border-[#E5E8E3] space-y-4">
              <h3 className="text-xs font-bold text-[#202720] flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#5E695E]" />
                <span>Store Contact & Free Shipping Thresholds</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#202720] block mb-1">Store Name</label>
                  <input
                    type="text"
                    value={settingsForm.storeName || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, storeName: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-[#E5E8E3] rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#202720] block mb-1">Support WhatsApp Number</label>
                  <input
                    type="text"
                    placeholder="919876543210"
                    value={settingsForm.whatsappNumber || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-[#E5E8E3] rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#202720] block mb-1">Free Shipping Threshold (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={settingsForm.freeShippingThreshold ?? 0}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, freeShippingThreshold: Number(e.target.value) })
                    }
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-[#E5E8E3] rounded-xl"
                  />
                  <p className="text-[10px] text-[#087A42] font-semibold mt-1">₹0 = Free Shipping on all orders</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#202720] block mb-1">Standard Shipping Fee (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={settingsForm.standardShippingFee ?? 0}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, standardShippingFee: Number(e.target.value) })
                    }
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-[#E5E8E3] rounded-xl"
                  />
                  <p className="text-[10px] text-[#087A42] font-semibold mt-1">₹0 = Free Shipping for customers</p>
                </div>
              </div>
            </div>

            {settingsSuccess && (
              <p className="text-xs text-[#087A42] font-bold flex items-center gap-1.5 p-3 bg-[#E8F5EE] rounded-xl border border-emerald-200">
                <Check className="w-4 h-4" />
                <span>UPI configuration & store settings saved and synced successfully!</span>
              </p>
            )}

            <button
              type="submit"
              disabled={savingSettings}
              className="px-6 py-3 bg-[#087A42] hover:bg-[#066336] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              {savingSettings ? 'Saving Settings...' : 'Save Settings & Update UPI QR'}
            </button>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: COUPONS */}
      {/* ========================================================= */}
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
                    onClick={async () => {
                      if (!adminToken || !window.confirm(`Delete coupon "${c.code}"?`)) return;
                      await api.deleteCoupon(adminToken, c.code);
                      setCoupons((prev) => prev.filter((item) => item.code !== c.code));
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
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
            <form
              onSubmit={async (e) => {
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
              }}
              className="space-y-3"
            >
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
                  placeholder="20% off on festive orders"
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

      {/* ========================================================= */}
      {/* MODAL: COMPREHENSIVE ORDER DETAILS & COURIER UPDATE */}
      {/* ========================================================= */}
      {detailedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-[#E5E8E3] my-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E8E3]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-extrabold text-[#202720]">
                    {detailedOrder.orderNumber}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                      detailedOrder.paymentStatus === 'paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : detailedOrder.paymentStatus === 'advance_paid'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {detailedOrder.paymentMethod.toUpperCase()} · {detailedOrder.paymentStatus.replace('_', ' ')}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase bg-blue-100 text-blue-800">
                    {detailedOrder.fulfillmentStatus}
                  </span>
                </div>
                <p className="text-xs text-[#5E695E] mt-0.5">
                  Placed on {new Date(detailedOrder.createdAt).toLocaleString('en-IN')}
                </p>
              </div>

              <button
                onClick={() => setDetailedOrder(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Contact & Address Information */}
            <div className="p-4 bg-[#F7F8F6] rounded-2xl border border-[#E5E8E3] space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#202720] flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-[#087A42]" />
                  <span>Customer Contact & Delivery Address</span>
                </h4>

                <div className="flex items-center gap-2">
                  {/* WhatsApp Direct Action */}
                  <a
                    href={`https://wa.me/${detailedOrder.customer.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      `Hello ${detailedOrder.customer.fullName}, this is regarding your FanKO Store Order ${detailedOrder.orderNumber}.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold rounded-lg flex items-center gap-1"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp Customer</span>
                  </a>

                  {/* Direct Phone Call */}
                  <a
                    href={`tel:${detailedOrder.customer.phone}`}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-semibold rounded-lg flex items-center gap-1 border border-slate-200"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#087A42]" />
                    <span>Call</span>
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-slate-400 text-[11px]">Recipient Name:</p>
                  <p className="font-bold text-[#202720]">{detailedOrder.customer.fullName}</p>
                  <p className="text-slate-400 text-[11px] mt-1">Phone Number:</p>
                  <p className="font-semibold text-[#202720] font-mono">{detailedOrder.customer.phone}</p>
                  <p className="text-slate-400 text-[11px] mt-1">Email:</p>
                  <p className="font-semibold text-[#202720]">{detailedOrder.customer.email}</p>
                </div>

                <div>
                  <p className="text-slate-400 text-[11px]">Shipping Destination:</p>
                  <p className="font-semibold text-[#202720] leading-relaxed">
                    {detailedOrder.customer.addressLine}
                    {detailedOrder.customer.landmark ? `, Near ${detailedOrder.customer.landmark}` : ''}
                    <br />
                    {detailedOrder.customer.city}, {detailedOrder.customer.state} -{' '}
                    <strong className="text-[#087A42] font-mono">{detailedOrder.customer.pincode}</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Ordered Items List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#202720] flex items-center gap-1.5">
                <Package className="w-4 h-4 text-[#087A42]" />
                <span>Ordered Items ({detailedOrder.items.length})</span>
              </h4>

              <div className="divide-y divide-[#E5E8E3] border border-[#E5E8E3] rounded-2xl overflow-hidden">
                {detailedOrder.items.map((item, idx) => (
                  <div key={idx} className="p-3 bg-white flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={item.image || '/assets/aistudio/fankostore.logo_1f90e1f5.png'}
                        alt={item.name}
                        className="w-12 h-12 object-contain rounded-lg bg-[#F7F8F6] p-1 border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-[#202720] truncate">{item.name}</p>
                        <p className="text-[11px] text-[#5E695E]">
                          SKU: <span className="font-mono">{item.sku}</span> · Qty: <strong>{item.quantity}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-bold text-[#202720] tabular-nums">₹{item.subtotal}</p>
                      <p className="text-[10px] text-slate-400">₹{item.price} each</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial & Payment Verification Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-[#F7F8F6] rounded-2xl border border-[#E5E8E3] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-[#202720]">Payment & Verification Details</h5>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-[#087A42] border border-emerald-200">
                    Payment Verified
                  </span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-[#5E695E]">Payment Method:</span>
                    <strong className="text-[#202720] uppercase">{detailedOrder.paymentMethod}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5E695E]">UPI App / Channel:</span>
                    <strong className="text-[#087A42] uppercase">{detailedOrder.paymentDetails?.upiApp || 'UPI'}</strong>
                  </div>
                  {detailedOrder.paymentDetails?.utrNumber && (
                    <div className="flex items-center justify-between p-1.5 bg-white rounded-lg border border-[#E5E8E3]">
                      <span className="text-[#5E695E] font-medium">Verified UTR:</span>
                      <div className="flex items-center gap-1.5">
                        <strong className="font-mono text-xs text-[#087A42] select-all">
                          {detailedOrder.paymentDetails.utrNumber}
                        </strong>
                        <button
                          type="button"
                          onClick={() => {
                            if (detailedOrder.paymentDetails?.utrNumber) {
                              navigator.clipboard.writeText(detailedOrder.paymentDetails.utrNumber);
                              setCopiedUtr(true);
                              setTimeout(() => setCopiedUtr(false), 2000);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-[#087A42] rounded hover:bg-slate-100 cursor-pointer"
                          title="Copy UTR to verify in bank"
                        >
                          {copiedUtr ? <Check className="w-3.5 h-3.5 text-[#087A42]" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  )}
                  {detailedOrder.paymentDetails?.payerUpiId && (
                    <div className="flex justify-between">
                      <span className="text-[#5E695E]">Customer UPI / Phone:</span>
                      <strong className="font-mono text-[#202720]">{detailedOrder.paymentDetails.payerUpiId}</strong>
                    </div>
                  )}
                  {detailedOrder.paymentDetails?.paymentProofUrl && (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[#5E695E]">Proof Screenshot:</span>
                      <button
                        type="button"
                        onClick={() => setPreviewReceiptUrl(detailedOrder.paymentDetails?.paymentProofUrl || null)}
                        className="text-[11px] font-bold text-[#087A42] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Screenshot</span>
                      </button>
                    </div>
                  )}
                  {detailedOrder.paymentDetails?.advancePaid !== undefined && (
                    <div className="flex justify-between text-emerald-700 font-semibold pt-1 border-t border-[#E5E8E3]">
                      <span>Amount Paid via UPI:</span>
                      <strong>₹{detailedOrder.paymentDetails.advancePaid}</strong>
                    </div>
                  )}
                  {detailedOrder.paymentDetails?.balanceDueOnDelivery !== undefined && (
                    <div className="flex justify-between text-orange-700 font-semibold">
                      <span>Balance Due on Delivery:</span>
                      <strong>₹{detailedOrder.paymentDetails.balanceDueOnDelivery}</strong>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-[#F7F8F6] rounded-2xl border border-[#E5E8E3] space-y-2 text-xs">
                <h5 className="font-bold text-[#202720]">Order Calculation</h5>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-[#5E695E]">Items Subtotal:</span>
                    <span className="tabular-nums">₹{detailedOrder.subtotal}</span>
                  </div>
                  {detailedOrder.discount > 0 && (
                    <div className="flex justify-between text-[#087A42]">
                      <span>Coupon Discount ({detailedOrder.couponCode}):</span>
                      <span className="tabular-nums">-₹{detailedOrder.discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-[#5E695E]">Shipping Fee:</span>
                    <span className="tabular-nums">₹{detailedOrder.shippingFee}</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-xs text-[#202720] pt-1 border-t border-[#E5E8E3]">
                    <span>Total Amount:</span>
                    <span className="text-base text-[#087A42] tabular-nums">₹{detailedOrder.total}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Courier Tracking & Fulfillment Update Form */}
            <form onSubmit={handleSaveOrderStatus} className="p-4 bg-white rounded-2xl border border-[#087A42]/30 space-y-3.5">
              <h4 className="text-xs font-bold text-[#202720] flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-[#087A42]" />
                <span>Update Fulfillment, Courier Tracking & Notes</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#202720] block mb-1">Fulfillment Status</label>
                  <select
                    value={editFulfillmentStatus}
                    onChange={(e) => setEditFulfillmentStatus(e.target.value as any)}
                    className="w-full text-xs p-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl font-medium"
                  >
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing (Packaging)</option>
                    <option value="shipped">Shipped (Dispatched)</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#202720] block mb-1">Payment Status</label>
                  <select
                    value={editPaymentStatus}
                    onChange={(e) => setEditPaymentStatus(e.target.value as any)}
                    className="w-full text-xs p-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl font-medium"
                  >
                    <option value="pending">Pending</option>
                    <option value="advance_paid">Advance Paid (COD)</option>
                    <option value="paid">Paid in Full</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#202720] block mb-1">Courier Partner</label>
                  <input
                    type="text"
                    placeholder="Delhivery, Blue Dart, DTDC, India Post"
                    value={courierName}
                    onChange={(e) => setCourierName(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#202720] block mb-1">AWB Tracking Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 1409283746"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#202720] block mb-1">Tracking URL</label>
                <input
                  type="url"
                  placeholder="https://track.delhivery.com/..."
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#202720] block mb-1">Status Timeline Note</label>
                <input
                  type="text"
                  placeholder="e.g. Package handed over to Delhivery courier driver."
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={updatingOrder}
                  className="flex-1 py-3 bg-[#087A42] hover:bg-[#066336] text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {updatingOrder ? 'Saving...' : 'Save Order Updates & Notify Timeline'}
                </button>
              </div>
            </form>

            {/* Status History Timeline */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-[#202720]">Status Event Timeline</h5>
              <div className="space-y-2">
                {detailedOrder.statusHistory?.map((ev, i) => (
                  <div key={i} className="p-2.5 bg-[#F7F8F6] rounded-xl text-xs flex items-start gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#087A42] shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="font-bold text-[#202720] uppercase text-[11px]">{ev.status}</p>
                      <p className="text-[#5E695E]">{ev.note}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(ev.timestamp).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT PRODUCT DETAILS & PRICING */}
      {/* ========================================================= */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-[#E5E8E3] my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E8E3]">
              <div>
                <span className="text-[11px] text-[#087A42] font-bold uppercase">Product Management</span>
                <h3 className="text-base font-extrabold text-[#202720]">
                  {editingProduct ? 'Edit Product Details & Pricing' : 'Add New Product to Catalog'}
                </h3>
              </div>
              <button
                onClick={() => setProductModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#202720] block mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={prodForm.name}
                  onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                  placeholder="e.g. FanKO Precision Pour Glass Oil & Vinegar Dispenser Jug (600ml)"
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl focus:bg-white focus:border-[#087A42] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#202720] block mb-1">Category *</label>
                  <select
                    value={prodForm.category}
                    onChange={(e) => setProdForm({ ...prodForm, category: e.target.value as any })}
                    className="w-full text-xs px-3 py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl font-medium"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#202720] block mb-1">Sub-Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Oil Dispensers"
                    value={prodForm.subCategory}
                    onChange={(e) => setProdForm({ ...prodForm, subCategory: e.target.value })}
                    className="w-full text-xs px-3 py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#202720] block mb-1">SKU *</label>
                  <input
                    type="text"
                    required
                    value={prodForm.sku}
                    onChange={(e) => setProdForm({ ...prodForm, sku: e.target.value.toUpperCase() })}
                    className="w-full text-xs px-3 py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl font-mono uppercase"
                  />
                </div>
              </div>

              {/* Pricing & Stock Card */}
              <div className="p-4 bg-[#F7F8F6] rounded-2xl border border-[#E5E8E3] space-y-3">
                <span className="text-xs font-bold text-[#202720] block">Pricing & Inventory</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#202720] block mb-1">Regular MRP Price (₹) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="699"
                      value={prodForm.price}
                      onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })}
                      className="w-full text-xs px-3 py-2.5 bg-white border border-[#E5E8E3] rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#202720] block mb-1">Sale / Discounted Price (₹)</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="499"
                      value={prodForm.salePrice}
                      onChange={(e) => setProdForm({ ...prodForm, salePrice: e.target.value })}
                      className="w-full text-xs px-3 py-2.5 bg-white border border-[#E5E8E3] rounded-xl font-bold text-[#087A42]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#202720] block mb-1">Stock Quantity *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="25"
                      value={prodForm.stock}
                      onChange={(e) => setProdForm({ ...prodForm, stock: e.target.value })}
                      className="w-full text-xs px-3 py-2.5 bg-white border border-[#E5E8E3] rounded-xl font-bold"
                    />
                  </div>
                </div>

                {prodForm.price && prodForm.salePrice && Number(prodForm.price) > Number(prodForm.salePrice) && (
                  <p className="text-[11px] text-[#087A42] font-semibold">
                    Discount to buyer: ₹{Number(prodForm.price) - Number(prodForm.salePrice)} off (
                    {Math.round(((Number(prodForm.price) - Number(prodForm.salePrice)) / Number(prodForm.price)) * 100)}% discount)
                  </p>
                )}
              </div>

              {/* Product Image Option */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#202720] block">Product Image</label>
                  <div className="flex gap-2 text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setImageMode('preset')}
                      className={`px-2 py-0.5 rounded ${
                        imageMode === 'preset' ? 'bg-[#087A42] text-white' : 'text-slate-500 hover:text-black'
                      }`}
                    >
                      Store Library
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageMode('custom')}
                      className={`px-2 py-0.5 rounded ${
                        imageMode === 'custom' ? 'bg-[#087A42] text-white' : 'text-slate-500 hover:text-black'
                      }`}
                    >
                      URL / Upload
                    </button>
                  </div>
                </div>

                {imageMode === 'preset' ? (
                  <select
                    value={prodForm.image}
                    onChange={(e) => setProdForm({ ...prodForm, image: e.target.value })}
                    className="w-full text-xs px-3 py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl font-medium"
                  >
                    {PRESET_IMAGES.map((img) => (
                      <option key={img.url} value={img.url}>
                        {img.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="url"
                      placeholder="Paste image URL..."
                      value={prodForm.customImageUrl}
                      onChange={(e) => setProdForm({ ...prodForm, customImageUrl: e.target.value })}
                      className="w-full text-xs px-3.5 py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#5E695E]">Or upload local image:</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileUpload}
                        className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:bg-[#E8F5EE] file:text-[#087A42] cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Specifications & Dimensions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#202720] block mb-1">Dimensions</label>
                  <input
                    type="text"
                    placeholder="e.g. 24.5 x 11.5 x 11 cm"
                    value={prodForm.dimensions}
                    onChange={(e) => setProdForm({ ...prodForm, dimensions: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#202720] block mb-1">Material</label>
                  <input
                    type="text"
                    placeholder="e.g. BPA-Free Durable ABS"
                    value={prodForm.material}
                    onChange={(e) => setProdForm({ ...prodForm, material: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#202720] block mb-1">Weight</label>
                  <input
                    type="text"
                    placeholder="e.g. 320 g"
                    value={prodForm.weight}
                    onChange={(e) => setProdForm({ ...prodForm, weight: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#202720] block mb-1">Color</label>
                  <input
                    type="text"
                    placeholder="e.g. Matte White"
                    value={prodForm.color}
                    onChange={(e) => setProdForm({ ...prodForm, color: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl"
                  />
                </div>
              </div>

              {/* Descriptions */}
              <div>
                <label className="text-xs font-bold text-[#202720] block mb-1">Short Description / Catchphrase</label>
                <input
                  type="text"
                  placeholder="Elegant ribbed-texture multi-slot organizer with elevated brush compartment..."
                  value={prodForm.shortDescription}
                  onChange={(e) => setProdForm({ ...prodForm, shortDescription: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#202720] block mb-1">Full Detailed Description</label>
                <textarea
                  rows={3}
                  value={prodForm.description}
                  onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                  placeholder="Detailed product story, features, benefits..."
                  className="w-full text-xs p-3 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl"
                />
              </div>

              {/* Toggles */}
              <div className="pt-2 flex flex-wrap gap-4 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prodForm.featured}
                    onChange={(e) => setProdForm({ ...prodForm, featured: e.target.checked })}
                    className="rounded text-[#087A42] focus:ring-[#087A42]"
                  />
                  <span className="font-semibold text-[#202720]">Feature on Homepage</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prodForm.isNewArrival}
                    onChange={(e) => setProdForm({ ...prodForm, isNewArrival: e.target.checked })}
                    className="rounded text-[#087A42] focus:ring-[#087A42]"
                  />
                  <span className="font-semibold text-[#202720]">Mark as New Arrival</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prodForm.isIncomplete}
                    onChange={(e) => setProdForm({ ...prodForm, isIncomplete: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="font-semibold text-amber-800">
                    Mark as Incomplete Sample (Awaiting Specifications)
                  </span>
                </label>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#087A42] hover:bg-[#066336] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  {editingProduct ? 'Save Product Changes' : 'Add Product to Catalog'}
                </button>
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Receipt Image Preview Modal */}
      {previewReceiptUrl && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 space-y-3 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E8E3]">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#087A42]" />
                <h4 className="text-xs font-bold text-[#202720]">Customer Payment Receipt Screenshot</h4>
              </div>
              <button
                type="button"
                onClick={() => setPreviewReceiptUrl(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-slate-50 rounded-2xl p-2 border border-[#E5E8E3]">
              <img
                src={previewReceiptUrl}
                alt="Payment proof screenshot"
                className="max-h-[65vh] max-w-full object-contain rounded-xl"
              />
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setPreviewReceiptUrl(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-semibold rounded-xl text-[#202720] cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
