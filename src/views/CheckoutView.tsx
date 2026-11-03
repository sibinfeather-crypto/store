import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Truck,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Lock,
  Tag,
  QrCode,
  Smartphone,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Wallet,
  HelpCircle,
  Upload,
  Image as ImageIcon,
  X,
  Info,
  Eye,
  Trash2,
  RefreshCw,
  Download,
  Sparkles,
  Lightbulb,
  Clock,
} from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import type { ShippingAddress, Order } from '../types/index.ts';

interface CheckoutViewProps {
  onNavigate: (view: string, param?: string) => void;
  onOrderCompleted: (order: Order) => void;
}

interface UpiModalData {
  orderNumber: string;
  amountToPay: number;
  totalOrderAmount: number;
  balanceOnDelivery: number;
  upiId: string;
  payeeName: string;
  upiUri: string;
  gpayUri: string;
  phonepeUri: string;
  paytmUri: string;
  qrCodeUrl: string;
  paymentType: 'upi' | 'cod';
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  onNavigate,
  onOrderCompleted,
}) => {
  const { items, subtotal, shippingFee, total, couponCode, couponDiscount, clearCart } = useCart();
  const { customer, saveAddress } = useAuth();

  const [form, setForm] = useState<ShippingAddress>({
    fullName: customer?.name || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    addressLine: customer?.savedAddresses[0]?.addressLine || '',
    landmark: customer?.savedAddresses[0]?.landmark || '',
    city: customer?.savedAddresses[0]?.city || '',
    state: customer?.savedAddresses[0]?.state || 'Maharashtra',
    pincode: customer?.savedAddresses[0]?.pincode || '',
  });

  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cod'>('cod');
  const [codAllowed, setCodAllowed] = useState(true);
  const [upiAllowed, setUpiAllowed] = useState(true);
  const [codAdvanceAmount, setCodAdvanceAmount] = useState(99);
  const [storeUpiId, setStoreUpiId] = useState('fankostore@okhdfcbank');
  const [storePayeeName, setStorePayeeName] = useState('FanKO Store');
  const [saveInfo, setSaveInfo] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UPI Payment Modal State
  const [upiModalData, setUpiModalData] = useState<UpiModalData | null>(null);
  const [selectedApp, setSelectedApp] = useState<'gpay' | 'phonepe' | 'paytm' | 'other'>('gpay');
  const [appOpened, setAppOpened] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);

  // Buyer Payment Proof Screenshot State (Required before order confirmation)
  const [paymentProofUrl, setPaymentProofUrl] = useState<string | null>(null);
  const [screenshotFileName, setScreenshotFileName] = useState<string | null>(null);
  const [screenshotFileSize, setScreenshotFileSize] = useState<string | null>(null);
  const [screenshotError, setScreenshotError] = useState<string | null>(null);
  const [isCompressingProof, setIsCompressingProof] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [showScreenshotWarning, setShowScreenshotWarning] = useState<boolean>(false);
  const [previewScreenshotModal, setPreviewScreenshotModal] = useState<boolean>(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    api.getSettings().then((s) => {
      setCodAllowed(s.codEnabled !== false);
      setUpiAllowed(s.upiEnabled !== false);
      if (s.codAdvanceAmount != null) setCodAdvanceAmount(s.codAdvanceAmount);
      if (s.upiId) setStoreUpiId(s.upiId);
      if (s.upiPayeeName) setStorePayeeName(s.upiPayeeName);
    }).catch(() => {});
  }, []);

  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi (NCT)', 'Chandigarh', 'Jammu and Kashmir', 'Puducherry'
  ];

  const validateForm = () => {
    if (!form.fullName.trim()) return 'Please enter your full name.';
    if (!form.phone.trim() || !/^[6-9]\d{9}$/.test(form.phone.replace(/[^0-9]/g, '').slice(-10))) {
      return 'Please enter a valid 10-digit Indian mobile number.';
    }
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) {
      return 'Please enter a valid email address.';
    }
    if (!form.addressLine.trim() || form.addressLine.length < 5) {
      return 'Please enter your complete street / house address.';
    }
    if (!form.city.trim()) return 'Please enter your city.';
    if (!form.state.trim()) return 'Please select your state.';
    if (!form.pincode.trim() || !/^[1-9][0-9]{5}$/.test(form.pincode)) {
      return 'Please enter a valid 6-digit Indian Postal PIN code.';
    }
    return null;
  };

  const handlePincodeAutoFill = async (pin: string) => {
    setForm((prev: ShippingAddress) => ({ ...prev, pincode: pin }));
    if (/^[1-9][0-9]{5}$/.test(pin)) {
      try {
        const res = await api.checkPincode(pin);
        if (res.state && !form.city) {
          // prefill region hint if city is empty
        }
      } catch {}
    }
  };

  // Step 1: Buyer clicks Place Order / Pay -> Opens UPI Intent & QR Modal
  const handleInitiateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (items.length === 0) {
      setError('Your cart is empty. Please add items before checking out.');
      return;
    }

    const valErr = validateForm();
    if (valErr) {
      setError(valErr);
      return;
    }

    if (saveInfo) {
      saveAddress(form);
    }

    setIsProcessing(true);

    try {
      const advanceAmount = Math.min(codAdvanceAmount, total);
      const amountToPay = paymentMethod === 'cod' ? advanceAmount : total;
      const balanceOnDelivery = paymentMethod === 'cod' ? Math.max(0, total - advanceAmount) : 0;
      const tempOrderRef = `FKO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const upiData = await api.getUpiIntent({
        amount: amountToPay,
        orderRef: tempOrderRef,
        type: paymentMethod === 'cod' ? 'cod' : 'full',
      });

      setUpiModalData({
        orderNumber: upiData.orderNumber,
        amountToPay,
        totalOrderAmount: total,
        balanceOnDelivery,
        upiId: upiData.upiId || storeUpiId,
        payeeName: upiData.payeeName || storePayeeName,
        upiUri: upiData.upiUri,
        gpayUri: upiData.gpayUri,
        phonepeUri: upiData.phonepeUri,
        paytmUri: upiData.paytmUri,
        qrCodeUrl: upiData.qrCodeUrl,
        paymentType: paymentMethod,
      });

      setAppOpened(false);
      setVerificationStatus(null);
      setIsProcessing(false);
      // Reset payment screenshot state for new payment session
      setPaymentProofUrl(null);
      setScreenshotFileName(null);
      setScreenshotFileSize(null);
      setScreenshotError(null);
      setShowScreenshotWarning(false);
    } catch (err: any) {
      setIsProcessing(false);
      setError(err.message || 'Failed to initialize payment. Please try again.');
    }
  };

  // Image compressor using offscreen HTML canvas (max dimension 1200px, quality 0.82)
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          resolve(compressedDataUrl);
        };
        img.onerror = () => reject(new Error('Failed to load image for compression'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  // Process selected or dropped screenshot file
  const handleProcessScreenshotFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setScreenshotError('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setScreenshotError('File size is too large (maximum 25MB).');
      return;
    }

    setIsCompressingProof(true);
    setScreenshotError(null);
    setShowScreenshotWarning(false);

    try {
      const compressedDataUrl = await compressImage(file);
      const sizeInKb = Math.round((compressedDataUrl.length * 3) / 4 / 1024);
      setPaymentProofUrl(compressedDataUrl);
      setScreenshotFileName(file.name);
      setScreenshotFileSize(`${sizeInKb} KB`);
      setIsCompressingProof(false);
    } catch {
      setIsCompressingProof(false);
      setScreenshotError('Could not process screenshot image. Please try another file.');
    }
  };

  const handleRemoveScreenshot = () => {
    setPaymentProofUrl(null);
    setScreenshotFileName(null);
    setScreenshotFileSize(null);
    setScreenshotError(null);
    setShowScreenshotWarning(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Listen for clipboard image paste when payment modal is active
  useEffect(() => {
    if (!upiModalData) return;

    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        if (file && file.type.startsWith('image/')) {
          handleProcessScreenshotFile(file);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [upiModalData]);

  // Open the chosen UPI app (GPay / PhonePe / Paytm / Universal UPI) on buyer's phone
  const handleLaunchUpiApp = (app: 'gpay' | 'phonepe' | 'paytm' | 'other') => {
    setSelectedApp(app);
    // Auto-copy UPI ID so buyer has it in clipboard if Google Pay restricts browser deep links
    if (upiModalData?.upiId) {
      navigator.clipboard.writeText(upiModalData.upiId).catch(() => {});
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 3500);
    }
    handleOpenUpiApp(app);
  };

  const handleOpenUpiApp = (appOverride?: 'gpay' | 'phonepe' | 'paytm' | 'other') => {
    if (!upiModalData) return;
    const targetApp = appOverride || selectedApp || 'other';
    setSelectedApp(targetApp);
    setAppOpened(true);

    // Auto-copy UPI ID to clipboard
    if (upiModalData.upiId) {
      navigator.clipboard.writeText(upiModalData.upiId).catch(() => {});
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 3500);
    }

    let targetUri = upiModalData.upiUri;
    if (targetApp === 'gpay') targetUri = upiModalData.gpayUri;
    else if (targetApp === 'phonepe') targetUri = upiModalData.phonepeUri;
    else if (targetApp === 'paytm') targetUri = upiModalData.paytmUri;

    // Trigger redirect to GPay, PhonePe, or phone available apps
    window.location.href = targetUri;

    // Fallback: in case app scheme isn't registered, fallback to generic UPI after brief timeout
    setTimeout(() => {
      if (document.hasFocus()) {
        window.location.href = upiModalData.upiUri;
      }
    }, 1200);
  };

  const handleDownloadQr = () => {
    if (!upiModalData?.qrCodeUrl) return;
    const link = document.createElement('a');
    link.href = upiModalData.qrCodeUrl;
    link.target = '_blank';
    link.download = `UPI-QR-${upiModalData.orderNumber || 'payment'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Order Confirmation: ONLY allowed when buyer has uploaded their payment screenshot!
  const handleConfirmOrderWithScreenshot = async () => {
    if (!upiModalData) return;

    // Buyer payment screenshot is strictly required before order confirmation
    if (!paymentProofUrl) {
      setShowScreenshotWarning(true);
      setScreenshotError('Payment screenshot is required to confirm your order. Please upload your payment proof above.');
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
      return;
    }

    setIsProcessing(true);
    setVerificationStatus('Verifying payment screenshot and placing order...');
    setError(null);

    try {
      const payloadItems = items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      }));

      const targetApp = selectedApp || 'other';

      let result: { success: boolean; order: Order };
      if (upiModalData.paymentType === 'cod') {
        result = await api.createCodOrder({
          customer: form,
          items: payloadItems,
          couponCode: couponCode || undefined,
          upiApp: targetApp,
          paymentProofUrl: paymentProofUrl,
        });
      } else {
        result = await api.createUpiOrder({
          customer: form,
          items: payloadItems,
          couponCode: couponCode || undefined,
          upiApp: targetApp,
          paymentProofUrl: paymentProofUrl,
        });
      }

      clearCart();
      setIsProcessing(false);
      setUpiModalData(null);
      setPaymentProofUrl(null);
      setScreenshotFileName(null);
      setVerificationStatus(null);
      onOrderCompleted(result.order);
      onNavigate('order-confirmation', result.order.orderNumber);
    } catch (err: any) {
      setIsProcessing(false);
      setVerificationStatus(null);
      setError(err.message || 'Payment processing error. Please try again.');
    }
  };

  const handleCopyUpiId = () => {
    if (!upiModalData) return;
    navigator.clipboard.writeText(upiModalData.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const currentAdvance = Math.min(codAdvanceAmount, total);
  const currentBalance = Math.max(0, total - currentAdvance);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header & Back link */}
      <div className="flex items-center justify-between pb-4 border-b border-[#E5E8E3]">
        <button
          onClick={() => onNavigate('shop')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#087A42] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Continue Shopping</span>
        </button>
        <div className="flex items-center gap-1.5 text-xs text-[#5E695E]">
          <Lock className="w-3.5 h-3.5 text-[#087A42]" />
          <span>Secure Direct UPI & COD Checkout</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* Left Column: Delivery Address & Payment Method */}
        <form onSubmit={handleInitiateOrder} className="lg:col-span-7 space-y-6">
          
          {/* Step 1: Delivery Address */}
          <div className="bg-white rounded-3xl border border-[#E5E8E3] p-6 sm:p-8 space-y-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E8E3]">
              <h2 className="text-base font-bold text-[#202720] flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#087A42] text-white text-xs flex items-center justify-center font-bold">
                  1
                </span>
                <span>Delivery Address (India)</span>
              </h2>
              <span className="text-xs text-[#087A42] font-semibold flex items-center gap-1">
                <Truck className="w-3.5 h-3.5" />
                <span>Pan-India Shipping</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-[#202720] block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="e.g. Rahul Sharma"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full text-base sm:text-xs px-3.5 py-3 sm:py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl focus:bg-white focus:border-[#087A42] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#202720] block mb-1">
                  Mobile Number (for Courier updates) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 sm:top-2.5 text-xs text-[#5E695E] font-medium">+91</span>
                  <input
                    type="tel"
                    required
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="98765 43210"
                    maxLength={10}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })}
                    className="w-full text-base sm:text-xs pl-11 pr-3.5 py-3 sm:py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl focus:bg-white focus:border-[#087A42] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#202720] block mb-1">
                  Email Address (for Receipt) *
                </label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="rahul@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full text-base sm:text-xs px-3.5 py-3 sm:py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl focus:bg-white focus:border-[#087A42] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-[#202720] block mb-1">
                  Street Address / House / Flat No. *
                </label>
                <input
                  type="text"
                  required
                  autoComplete="street-address"
                  placeholder="e.g. Flat 402, Sunshine Apartments, Main Road"
                  value={form.addressLine}
                  onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
                  className="w-full text-base sm:text-xs px-3.5 py-3 sm:py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl focus:bg-white focus:border-[#087A42] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#202720] block mb-1">
                  Landmark (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Near City Hospital or Metro Pillar 12"
                  value={form.landmark}
                  onChange={(e) => setForm({ ...form, landmark: e.target.value })}
                  className="w-full text-base sm:text-xs px-3.5 py-3 sm:py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl focus:bg-white focus:border-[#087A42] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#202720] block mb-1">
                  PIN Code *
                </label>
                <input
                  type="text"
                  required
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={6}
                  placeholder="e.g. 400001"
                  value={form.pincode}
                  onChange={(e) => handlePincodeAutoFill(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-base sm:text-xs px-3.5 py-3 sm:py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl focus:bg-white focus:border-[#087A42] focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#202720] block mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mumbai"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full text-base sm:text-xs px-3.5 py-3 sm:py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl focus:bg-white focus:border-[#087A42] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#202720] block mb-1">
                  State *
                </label>
                <select
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="w-full text-base sm:text-xs px-3.5 py-3 sm:py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl focus:bg-white focus:border-[#087A42] focus:outline-none"
                >
                  {indianStates.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 pt-2 text-xs text-[#5E695E] cursor-pointer">
              <input
                type="checkbox"
                checked={saveInfo}
                onChange={(e) => setSaveInfo(e.target.checked)}
                className="rounded text-[#087A42] focus:ring-[#087A42]"
              />
              <span>Save this address for fast checkout next time</span>
            </label>
          </div>

          {/* Step 2: Payment Method */}
          <div className="bg-white rounded-3xl border border-[#E5E8E3] p-6 sm:p-8 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E8E3]">
              <h2 className="text-base font-bold text-[#202720] flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#087A42] text-white text-xs flex items-center justify-center font-bold">
                  2
                </span>
                <span>Select Payment Method</span>
              </h2>
              <span className="text-[11px] text-[#087A42] font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Zero Gateway Fees</span>
              </span>
            </div>

            <div className="space-y-3">
              {/* Option 1: Cash on Delivery with ₹99 Advance */}
              {codAllowed && (
                <label
                  className={`p-4 rounded-2xl border-2 cursor-pointer flex items-start gap-3.5 transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-[#087A42] bg-[#E8F5EE]/40'
                      : 'border-[#E5E8E3] hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="mt-1 text-[#087A42] focus:ring-[#087A42]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-[#FF7900] text-white flex items-center justify-center font-bold text-[10px]">
                          COD
                        </span>
                        <p className="text-xs font-bold text-[#202720]">
                          Cash on Delivery (₹{currentAdvance} Advance Token)
                        </p>
                      </div>
                      <span className="text-[11px] font-bold text-[#FF7900] bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                        Pay ₹{currentAdvance} Now
                      </span>
                    </div>
                    <p className="text-[11px] text-[#5E695E] mt-1.5 leading-relaxed">
                      Pay small advance ₹{currentAdvance} token via UPI or QR Code to verify your order. The remaining balance of <strong className="text-[#202720]">₹{currentBalance}</strong> is collected in cash or UPI at your doorstep upon delivery.
                    </p>
                  </div>
                </label>
              )}

              {/* Option 2: 100% Full UPI Payment */}
              {upiAllowed && (
                <label
                  className={`p-4 rounded-2xl border-2 cursor-pointer flex items-start gap-3.5 transition-all ${
                    paymentMethod === 'upi'
                      ? 'border-[#087A42] bg-[#E8F5EE]/40'
                      : 'border-[#E5E8E3] hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'upi'}
                    onChange={() => setPaymentMethod('upi')}
                    className="mt-1 text-[#087A42] focus:ring-[#087A42]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-[#087A42] text-white flex items-center justify-center font-bold text-[10px]">
                          UPI
                        </span>
                        <p className="text-xs font-bold text-[#202720]">
                          Full UPI Payment (GPay, PhonePe, Paytm, QR)
                        </p>
                      </div>
                      <span className="text-[11px] font-semibold text-[#087A42] bg-emerald-50 px-2 py-0.5 rounded border border-[#087A42]/30">
                        Fastest Dispatch
                      </span>
                    </div>
                    <p className="text-[11px] text-[#5E695E] mt-1.5 leading-relaxed">
                      Pay 100% full amount (₹{total}) instantly via Google Pay, PhonePe, Paytm, or UPI QR code. No cash hassle at delivery.
                    </p>
                  </div>
                </label>
              )}
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-4 bg-[#087A42] hover:bg-[#066336] text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              <Smartphone className="w-4 h-4 text-emerald-200" />
              <span>
                {isProcessing
                  ? 'Preparing Payment...'
                  : paymentMethod === 'cod'
                  ? `Pay Now · ₹${currentAdvance} (Google Pay, PhonePe, UPI)`
                  : `Pay Now · ₹${total} (Google Pay, PhonePe, UPI)`}
              </span>
              <ChevronRight className="w-4 h-4 text-emerald-200" />
            </button>
          </div>

        </form>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E5E8E3] p-6 sm:p-8 space-y-6 shadow-xs lg:sticky lg:top-24">
          <h3 className="text-base font-bold text-[#202720] pb-3 border-b border-[#E5E8E3]">
            Order Summary ({items.length} items)
          </h3>

          <div className="divide-y divide-[#E5E8E3] max-h-72 overflow-y-auto space-y-3">
            {items.map((item) => (
              <div key={item.productId} className="pt-3 first:pt-0 flex items-center gap-3">
                <img
                  src={item.product.images[0] || '/assets/aistudio/fankostore.logo_1f90e1f5.png'}
                  alt={item.product.name}
                  className="w-14 h-14 object-contain rounded-xl bg-[#F7F8F6] p-1 border border-[#E5E8E3] shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#202720] truncate">
                    {item.product.name}
                  </p>
                  <p className="text-[11px] text-[#5E695E]">
                    Qty: {item.quantity} × ₹{item.product.salePrice ?? item.product.price}
                  </p>
                </div>
                <span className="text-xs font-bold text-[#202720] tabular-nums">
                  ₹{(item.product.salePrice ?? item.product.price) * item.quantity}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-[#E5E8E3] space-y-2 text-xs text-[#5E695E]">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-[#202720] tabular-nums">₹{subtotal}</span>
            </div>

            {couponDiscount > 0 && (
              <div className="flex justify-between text-[#087A42]">
                <span className="flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Coupon ({couponCode})</span>
                </span>
                <span className="font-semibold tabular-nums">-₹{couponDiscount}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Pan-India Shipping</span>
              <span className="font-semibold text-[#202720] tabular-nums">
                {shippingFee === 0 ? (
                  <span className="text-[#087A42]">FREE</span>
                ) : (
                  `₹${shippingFee}`
                )}
              </span>
            </div>

            <div className="pt-3 border-t border-[#E5E8E3] flex justify-between text-base font-extrabold text-[#202720]">
              <span>Total Amount</span>
              <span className="text-lg text-[#087A42] tabular-nums">₹{total}</span>
            </div>

            {paymentMethod === 'cod' && (
              <div className="p-3 bg-[#FFF4E5] rounded-xl text-[11px] text-[#202720] space-y-1 mt-2 border border-orange-200/60">
                <div className="flex justify-between font-bold text-[#FF7900]">
                  <span>Advance Payment (Now via UPI):</span>
                  <span>₹{currentAdvance}</span>
                </div>
                <div className="flex justify-between text-[#5E695E]">
                  <span>Payable at Doorstep (Delivery):</span>
                  <span className="font-bold text-[#202720]">₹{currentBalance}</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 bg-[#F7F8F6] rounded-xl text-[11px] text-[#5E695E] space-y-1">
            <p className="font-semibold text-[#202720] flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-[#087A42]" />
              <span>Standard Pan-India Delivery: 3-5 business days</span>
            </p>
            <p>Dispatched with protective packaging from our central warehouse.</p>
          </div>
        </div>

      </div>

      {/* UPI Intent & QR Code Payment Modal - 2-Step Payment & Verification Flow */}
      {upiModalData && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-7 space-y-5 shadow-2xl border border-[#E5E8E3] my-6 animate-in zoom-in-95 duration-200">
            
            {/* Modal Header & Step Indicator */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E8E3]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#087A42] text-white flex items-center justify-center font-black text-xs shadow-xs">
                  UPI
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#202720] flex items-center gap-1.5">
                    <span>
                      {upiModalData.paymentType === 'cod'
                        ? 'Cash on Delivery (₹99 Advance)'
                        : 'Full UPI Instant Payment'}
                    </span>
                    <ShieldCheck className="w-4 h-4 text-[#087A42]" />
                  </h3>
                  <p className="text-[11px] text-[#5E695E]">FanKO Store Direct UPI Checkout</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setUpiModalData(null)}
                disabled={isProcessing}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close payment modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step-by-Step Payment Instructions Banner */}
            <div className="p-3 bg-[#E8F5EE] border border-[#087A42]/20 rounded-2xl flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-[#087A42] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-[#087A42]">
                  Two-Step Verified UPI Payment
                </p>
                <p className="text-[11px] text-[#202720] mt-0.5 leading-relaxed">
                  1. Pay via Google Pay, PhonePe, Paytm, or QR code.<br />
                  2. <strong>Upload your payment screenshot below</strong> to confirm and place your order.
                </p>
              </div>
            </div>

            {/* Payable Amount Highlight Card */}
            <div className="p-4 bg-[#F7F8F6] rounded-2xl border border-[#E5E8E3] text-center space-y-1">
              <span className="text-[11px] text-[#5E695E] font-medium">
                {upiModalData.paymentType === 'cod' ? 'Advance Verification Token' : 'Total Amount to Pay'}
              </span>
              <div className="text-3xl font-extrabold text-[#087A42] tabular-nums">
                ₹{upiModalData.amountToPay}
              </div>
              {upiModalData.paymentType === 'cod' ? (
                <p className="text-[11px] text-[#5E695E] pt-1">
                  Remaining <strong className="text-[#202720]">₹{upiModalData.balanceOnDelivery}</strong> will be collected in cash or UPI at your doorstep upon delivery.
                </p>
              ) : (
                <p className="text-[11px] text-[#087A42] font-semibold pt-1">
                  ₹0 to pay on delivery · 100% cleared
                </p>
              )}
            </div>

            {/* Hidden File Input for Payment Screenshot */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleProcessScreenshotFile(e.target.files[0]);
                }
              }}
            />

            {/* STEP 1: Pay via Centered Big QR Code or UPI ID */}
            <div className="space-y-4 pt-1 border-t border-[#E5E8E3]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#087A42] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#087A42] text-white text-[10px] flex items-center justify-center font-bold">1</span>
                  <span>Step 1: Scan QR or Pay ₹{upiModalData.amountToPay}</span>
                </span>
                <span className="text-[10px] font-bold text-[#087A42] bg-[#E8F5EE] px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Instant Verification
                </span>
              </div>

              {/* BIG CENTERED QR CODE CARD */}
              <div className="p-5 sm:p-6 bg-gradient-to-b from-[#F7F8F6] via-white to-emerald-50/40 border-2 border-emerald-400/60 rounded-3xl space-y-4 shadow-sm text-center">
                
                {/* Header */}
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F5EE] text-[#087A42] text-xs font-bold border border-emerald-200 shadow-2xs">
                    <QrCode className="w-3.5 h-3.5 text-[#087A42]" />
                    <span>Scan with GPay, PhonePe, or Paytm</span>
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-[#202720]">
                    Pay Exactly <span className="text-[#087A42]">₹{upiModalData.amountToPay}</span>
                  </h3>
                  <p className="text-[11px] text-[#5E695E]">
                    Point your UPI camera at this QR code to pay instantly
                  </p>
                </div>

                {/* Big Centered QR Code Box */}
                <div className="flex justify-center my-2">
                  <div className="relative p-3.5 sm:p-4 bg-white rounded-3xl border-2 border-[#087A42] shadow-md hover:shadow-lg transition-shadow inline-block">
                    <div className="w-56 h-56 sm:w-72 sm:h-72 flex items-center justify-center bg-white rounded-2xl overflow-hidden">
                      <img
                        src={upiModalData.qrCodeUrl}
                        alt="UPI QR Code - Scan to Pay"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#087A42] text-white text-[10px] font-bold px-3 py-0.5 rounded-full shadow-xs uppercase tracking-wider whitespace-nowrap">
                      ₹{upiModalData.amountToPay} · Scan &amp; Pay
                    </div>
                  </div>
                </div>

                {/* Centered Actions: Download QR & Copy UPI ID */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleDownloadQr}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-[#087A42] text-xs font-bold rounded-xl border border-emerald-300 shadow-2xs transition-all active:scale-95 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-[#087A42]" />
                    <span>Download QR Code</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyUpiId}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#087A42] hover:bg-[#066336] text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    {copiedUpi ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>UPI ID Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy UPI ID</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Centered UPI ID Bar */}
                <div className="inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-emerald-200 text-xs shadow-2xs max-w-full">
                  <span className="text-[#5E695E] text-[11px] font-semibold">Store UPI ID:</span>
                  <span className="font-mono font-bold text-[#202720] truncate select-all">{upiModalData.upiId}</span>
                </div>

                {/* Clear 4-Step Instructions */}
                <div className="bg-white p-4 rounded-2xl border border-emerald-200/90 text-left space-y-2.5 shadow-2xs mt-3">
                  <p className="text-xs font-bold text-[#202720] flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-[#087A42] text-white text-[10px] flex items-center justify-center font-bold">✓</span>
                    <span>How to Complete Payment:</span>
                  </p>

                  <div className="space-y-2 text-xs text-[#202720]">
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#E8F5EE] text-[#087A42] font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200">
                        1
                      </span>
                      <div className="leading-relaxed">
                        <strong>Scan the big QR code above</strong> with GPay or PhonePe, OR tap <strong>&quot;Copy UPI ID&quot;</strong>.
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#E8F5EE] text-[#087A42] font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200">
                        2
                      </span>
                      <div className="leading-relaxed">
                        Pay exactly <strong>₹{upiModalData.amountToPay}</strong> in your Google Pay, PhonePe, or Paytm app.
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#E8F5EE] text-[#087A42] font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200">
                        3
                      </span>
                      <div className="leading-relaxed">
                        Take a screenshot of the payment receipt clearly showing the <strong>Payment Date &amp; Time</strong> and <strong>Amount (₹{upiModalData.amountToPay})</strong>.
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#E8F5EE] text-[#087A42] font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200">
                        4
                      </span>
                      <div className="leading-relaxed">
                        Upload the screenshot in <strong>Step 2</strong> below. Once our team verifies your payment screenshot by matching the <strong>Payment Date &amp; Time</strong>, your order is placed and confirmed!
                      </div>
                    </div>
                  </div>
                </div>

                {/* Verification Notice */}
                <div className="text-[11px] text-[#087A42] bg-[#E8F5EE] p-3 rounded-xl border border-emerald-200/90 flex items-start gap-2.5 text-left leading-relaxed">
                  <Clock className="w-4 h-4 text-[#087A42] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-[#202720]">
                      Order Verified by Payment Date &amp; Time:
                    </p>
                    <p className="text-[11px] text-[#202720]/80 mt-0.5">
                      Once uploaded, our team verifies the payment receipt by matching the exact <strong>Payment Date &amp; Time</strong> against bank records for immediate order placement and dispatch.
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* STEP 2: Upload Payment Screenshot (Mandatory for confirmation) */}
            <div className="space-y-2.5 pt-2 border-t border-[#E5E8E3]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#087A42] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#087A42] text-white text-[10px] flex items-center justify-center font-bold">2</span>
                  <span>Step 2: Upload Payment Screenshot</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Must Show Date &amp; Time</span>
                </span>
              </div>

              {/* Upload Zone when NO screenshot attached */}
              {!paymentProofUrl ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleProcessScreenshotFile(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-4 sm:p-5 rounded-2xl border-2 border-dashed text-center transition-all cursor-pointer ${
                    showScreenshotWarning || screenshotError
                      ? 'border-rose-400 bg-rose-50/60 ring-2 ring-rose-300'
                      : isDragOver
                      ? 'border-[#087A42] bg-[#E8F5EE]/40'
                      : 'border-[#087A42]/40 bg-[#F7F8F6] hover:bg-[#E8F5EE]/30'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-11 h-11 rounded-2xl bg-[#E8F5EE] text-[#087A42] flex items-center justify-center shadow-xs">
                      {isCompressingProof ? (
                        <div className="w-5 h-5 border-2 border-[#087A42] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Upload className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#202720]">
                        {isCompressingProof
                          ? 'Optimizing Screenshot Image...'
                          : 'Tap to Upload Payment Screenshot'}
                      </p>
                      <p className="text-[11px] text-[#5E695E] mt-0.5">
                        Take a screenshot in GPay or PhonePe showing <strong>Payment Date &amp; Time</strong> and attach it here.
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#087A42] bg-white px-2.5 py-1 rounded-lg border border-[#E5E8E3] shadow-2xs">
                      <ImageIcon className="w-3 h-3" />
                      <span>Supports PNG, JPG, Camera &amp; Clipboard Paste</span>
                    </span>
                  </div>
                </div>
              ) : (
                /* Screenshot Preview Card when attached */
                <div className="p-3 bg-white border-2 border-[#087A42] rounded-2xl flex items-center justify-between gap-3 shadow-xs animate-in fade-in">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      onClick={() => setPreviewScreenshotModal(true)}
                      className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 cursor-pointer hover:opacity-90 transition-opacity relative group"
                      title="Click to view full preview"
                    >
                      <img
                        src={paymentProofUrl}
                        alt="Payment Proof"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                        <Eye className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#087A42] shrink-0" />
                        <span className="text-xs font-bold text-[#087A42]">Screenshot Attached</span>
                      </div>
                      <p className="text-[11px] font-medium text-[#202720] truncate mt-0.5">
                        {screenshotFileName || 'payment_receipt.jpg'}
                      </p>
                      <p className="text-[10px] text-[#5E695E] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#087A42]" />
                        <span>Ready for Date &amp; Time verification</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewScreenshotModal(true)}
                      className="p-1.5 text-slate-500 hover:text-[#087A42] hover:bg-[#E8F5EE] rounded-lg transition-colors cursor-pointer"
                      title="Preview screenshot"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-1.5 text-slate-500 hover:text-[#087A42] hover:bg-[#E8F5EE] rounded-lg transition-colors cursor-pointer"
                      title="Replace with different screenshot"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveScreenshot}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Remove screenshot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Warning or Error Message */}
              {(screenshotError || showScreenshotWarning) && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="text-[11px] font-medium">
                    {screenshotError || 'Payment screenshot is required to confirm your order. Please upload payment proof.'}
                  </span>
                </div>
              )}
            </div>

            {/* General Error Message if any */}
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* STEP 3: Confirm Order Action (Gated strictly on Screenshot) */}
            <div className="pt-2 space-y-2.5 border-t border-[#E5E8E3]">
              {paymentProofUrl ? (
                /* Unlocked: Ready to Confirm Order */
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={handleConfirmOrderWithScreenshot}
                    disabled={isProcessing}
                    className="w-full py-4 bg-[#087A42] hover:bg-[#066336] text-white text-sm sm:text-base font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>{verificationStatus || 'Confirming Order...'}</span>
                      </div>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                        <span>Confirm &amp; Place Order · ₹{upiModalData.amountToPay}</span>
                        <ChevronRight className="w-4 h-4 text-emerald-200" />
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-center text-[#087A42] font-semibold flex items-center justify-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Your order is placed once payment screenshot and date/time are verified.</span>
                  </p>
                </div>
              ) : (
                /* Locked: Prompt to upload screenshot first */
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowScreenshotWarning(true);
                      setScreenshotError('Please upload your payment screenshot above showing payment date & time to confirm your order.');
                      fileInputRef.current?.click();
                    }}
                    className="w-full py-4 bg-[#F7F8F6] hover:bg-[#E8F5EE] border-2 border-dashed border-[#087A42]/50 text-[#087A42] text-xs sm:text-sm font-bold rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.99]"
                  >
                    <Upload className="w-4 h-4 text-[#087A42]" />
                    <span>Upload Screenshot with Date &amp; Time to Place Order</span>
                  </button>
                  <p className="text-[10px] text-center text-[#5E695E]">
                    Order will be placed after verifying your payment screenshot and payment date &amp; time.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setUpiModalData(null);
                  handleRemoveScreenshot();
                }}
                disabled={isProcessing}
                className="w-full py-2 text-xs font-semibold text-[#5E695E] hover:text-[#202720] transition-colors cursor-pointer text-center"
              >
                Cancel / Change Address
              </button>
            </div>

            <p className="text-[10px] text-center text-slate-400 flex items-center justify-center gap-1 pt-1 border-t border-[#E5E8E3]">
              <Lock className="w-3 h-3 text-[#087A42]" />
              <span>Direct Bank to Bank UPI Payment · 100% Safe & Verified</span>
            </p>

          </div>
        </div>
      )}

      {/* Full Screenshot Preview Modal for Buyer */}
      {previewScreenshotModal && paymentProofUrl && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-3 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E8E3]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#087A42]" />
                <h4 className="text-xs font-bold text-[#202720]">Payment Screenshot Preview</h4>
              </div>
              <button
                type="button"
                onClick={() => setPreviewScreenshotModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[65vh] overflow-auto flex items-center justify-center bg-slate-50 rounded-2xl p-2 border border-[#E5E8E3]">
              <img
                src={paymentProofUrl}
                alt="Uploaded Payment Receipt"
                className="max-h-[60vh] max-w-full object-contain rounded-xl"
              />
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-[#5E695E] truncate">
                {screenshotFileName || 'payment_receipt.jpg'} ({screenshotFileSize})
              </span>
              <button
                type="button"
                onClick={() => setPreviewScreenshotModal(false)}
                className="px-4 py-2 bg-[#087A42] hover:bg-[#066336] text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Looks Good
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
