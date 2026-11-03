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
import type { ShippingAddress, Order, VerifiedPaymentScreenshot } from '../types/index.ts';

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
  const [paymentTab, setPaymentTab] = useState<'qr' | 'upi_id'>('qr');
  const [appOpened, setAppOpened] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);

  // Buyer Payment Proof Screenshot State (Required before order confirmation)
  const [paymentProofUrl, setPaymentProofUrl] = useState<string | null>(null);
  const [screenshotFileName, setScreenshotFileName] = useState<string | null>(null);
  const [screenshotFileSize, setScreenshotFileSize] = useState<string | null>(null);
  const [screenshotError, setScreenshotError] = useState<string | null>(null);
  const [isCompressingProof, setIsCompressingProof] = useState<boolean>(false);
  const [isVerifyingScreenshot, setIsVerifyingScreenshot] = useState<boolean>(false);
  const [verifiedPaymentInfo, setVerifiedPaymentInfo] = useState<VerifiedPaymentScreenshot | null>(null);
  const [verificationProgressText, setVerificationProgressText] = useState<string>('');
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
      // Reset payment screenshot and AI verification state for new payment session
      setPaymentProofUrl(null);
      setScreenshotFileName(null);
      setScreenshotFileSize(null);
      setScreenshotError(null);
      setShowScreenshotWarning(false);
      setVerifiedPaymentInfo(null);
      setIsVerifyingScreenshot(false);
      setVerificationProgressText('');
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

  // Process selected or dropped screenshot file with Live AI Vision Verification
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
    setPaymentProofUrl(null);
    setVerifiedPaymentInfo(null);

    try {
      // Step 1: Compress image client-side to ensure fast vision AI response
      const compressedDataUrl = await compressImage(file);
      const sizeInKb = Math.round((compressedDataUrl.length * 3) / 4 / 1024);
      setIsCompressingProof(false);

      // Step 2: Trigger Live Gemini Vision AI Verification
      setIsVerifyingScreenshot(true);
      setVerificationProgressText('Inspecting screenshot: validating UPI payment status, exact amount & date/time...');

      const amountToVerify = upiModalData?.amountToPay ?? (paymentMethod === 'cod' ? codAdvanceAmount : total);
      const upiToVerify = upiModalData?.upiId || storeUpiId;
      const orderTypeToVerify = upiModalData?.paymentType || paymentMethod;

      const verification = await api.verifyPaymentScreenshot({
        screenshot: compressedDataUrl,
        expectedAmount: amountToVerify,
        expectedUpiId: upiToVerify,
        orderType: orderTypeToVerify,
      });

      setIsVerifyingScreenshot(false);
      setVerificationProgressText('');

      // Step 3: Strictly Reject Fake or Non-Payment Images!
      if (!verification.isValid) {
        setPaymentProofUrl(null);
        setVerifiedPaymentInfo(null);
        setScreenshotFileName(null);
        setScreenshotFileSize(null);
        const reason = verification.rejectionReason || 'Invalid payment receipt. Please upload an authentic screenshot showing the successful payment, amount, and date & time.';
        setScreenshotError(reason);
        setShowScreenshotWarning(true);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      // Step 4: Verification Passed - Store genuine screenshot & verified metadata
      setPaymentProofUrl(compressedDataUrl);
      setVerifiedPaymentInfo(verification);
      setScreenshotFileName(file.name);
      setScreenshotFileSize(`${sizeInKb} KB`);
      setScreenshotError(null);
      setShowScreenshotWarning(false);
    } catch (err: any) {
      setIsCompressingProof(false);
      setIsVerifyingScreenshot(false);
      setVerificationProgressText('');
      setPaymentProofUrl(null);
      setVerifiedPaymentInfo(null);
      setScreenshotError(err.message || 'Verification could not be completed. Please ensure image is clear and try again.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveScreenshot = () => {
    setPaymentProofUrl(null);
    setVerifiedPaymentInfo(null);
    setIsVerifyingScreenshot(false);
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

  // Order Confirmation: ONLY allowed when buyer has uploaded an authentic, verified payment screenshot!
  const handleConfirmOrderWithScreenshot = async () => {
    if (!upiModalData) return;

    // Buyer payment screenshot is strictly required before order confirmation AND MUST BE VERIFIED
    if (!paymentProofUrl || !verifiedPaymentInfo || !verifiedPaymentInfo.isValid) {
      setShowScreenshotWarning(true);
      setScreenshotError(
        'Authentic payment screenshot is required. Please upload your payment screenshot showing date & time for live AI verification before confirming.'
      );
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
      return;
    }

    setIsProcessing(true);
    setVerificationStatus('Finalizing order with verified payment receipt...');
    setError(null);

    try {
      const payloadItems = items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      }));

      const targetApp = selectedApp || 'other';
      const extractedUtr = verifiedPaymentInfo.detectedUtr && verifiedPaymentInfo.detectedUtr !== 'N/A'
        ? verifiedPaymentInfo.detectedUtr
        : undefined;

      const customerPayload: ShippingAddress = {
        ...form,
        email: form.email?.trim() || `${form.phone || 'customer'}@fankostore.in`,
      };

      let result: { success: boolean; order: Order };
      if (upiModalData.paymentType === 'cod') {
        result = await api.createCodOrder({
          customer: customerPayload,
          items: payloadItems,
          couponCode: couponCode || undefined,
          upiApp: targetApp,
          utrNumber: extractedUtr,
          paymentProofUrl: paymentProofUrl,
        });
      } else {
        result = await api.createUpiOrder({
          customer: customerPayload,
          items: payloadItems,
          couponCode: couponCode || undefined,
          upiApp: targetApp,
          utrNumber: extractedUtr,
          paymentProofUrl: paymentProofUrl,
        });
      }

      clearCart();
      setIsProcessing(false);
      setUpiModalData(null);
      setPaymentProofUrl(null);
      setVerifiedPaymentInfo(null);
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
        <form onSubmit={handleInitiateOrder} className="lg:col-span-7 space-y-4 sm:space-y-6">
          
          {/* Step 1: Delivery Address (Mobile-Friendly & Compact) */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E5E8E3] p-3.5 sm:p-6 space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#E5E8E3]">
              <h2 className="text-xs sm:text-sm font-bold text-[#202720] flex items-center gap-1.5 sm:gap-2">
                <span className="w-5 h-5 rounded-full bg-[#087A42] text-white text-[10px] sm:text-xs flex items-center justify-center font-bold">
                  1
                </span>
                <span>Delivery Address (India)</span>
              </h2>
              <span className="text-[11px] text-[#087A42] font-semibold flex items-center gap-1">
                <Truck className="w-3.5 h-3.5" />
                <span>Pan-India Delivery</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {/* Full Name */}
              <div className="col-span-2 sm:col-span-1">
                <label className="text-[11px] sm:text-xs font-semibold text-[#202720] block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="e.g. Rahul Sharma"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full text-xs px-3 py-2 sm:py-2.5 bg-[#F7F8F6] border border-[#DCE1DB] rounded-lg sm:rounded-xl focus:bg-white focus:border-[#087A42] focus:ring-1 focus:ring-[#087A42]/20 focus:outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Mobile Number */}
              <div className="col-span-2 sm:col-span-1">
                <label className="text-[11px] sm:text-xs font-semibold text-[#202720] block mb-1">
                  Mobile Number (for Courier updates) *
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-2.5 text-xs text-[#5E695E] font-bold select-none pointer-events-none">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="98765 43210"
                    maxLength={10}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })}
                    className="w-full text-xs pl-10 pr-3 py-2 sm:py-2.5 bg-[#F7F8F6] border border-[#DCE1DB] rounded-lg sm:rounded-xl focus:bg-white focus:border-[#087A42] focus:ring-1 focus:ring-[#087A42]/20 focus:outline-none font-mono tracking-wide transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Street Address */}
              <div className="col-span-2">
                <label className="text-[11px] sm:text-xs font-semibold text-[#202720] block mb-1">
                  Street Address / House / Flat No. *
                </label>
                <input
                  type="text"
                  required
                  autoComplete="street-address"
                  placeholder="e.g. Flat 402, Sunshine Apartments, Main Road"
                  value={form.addressLine}
                  onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
                  className="w-full text-xs px-3 py-2 sm:py-2.5 bg-[#F7F8F6] border border-[#DCE1DB] rounded-lg sm:rounded-xl focus:bg-white focus:border-[#087A42] focus:ring-1 focus:ring-[#087A42]/20 focus:outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              {/* PIN Code (Side by side on mobile) */}
              <div className="col-span-1">
                <label className="text-[11px] sm:text-xs font-semibold text-[#202720] block mb-1">
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
                  className="w-full text-xs px-3 py-2 sm:py-2.5 bg-[#F7F8F6] border border-[#DCE1DB] rounded-lg sm:rounded-xl focus:bg-white focus:border-[#087A42] focus:ring-1 focus:ring-[#087A42]/20 focus:outline-none font-mono tracking-wide transition-all placeholder:text-slate-400"
                />
              </div>

              {/* City (Side by side on mobile) */}
              <div className="col-span-1">
                <label className="text-[11px] sm:text-xs font-semibold text-[#202720] block mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mumbai"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full text-xs px-3 py-2 sm:py-2.5 bg-[#F7F8F6] border border-[#DCE1DB] rounded-lg sm:rounded-xl focus:bg-white focus:border-[#087A42] focus:ring-1 focus:ring-[#087A42]/20 focus:outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              {/* State */}
              <div className="col-span-2">
                <label className="text-[11px] sm:text-xs font-semibold text-[#202720] block mb-1">
                  State *
                </label>
                <select
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="w-full text-xs px-3 py-2 sm:py-2.5 bg-[#F7F8F6] border border-[#DCE1DB] rounded-lg sm:rounded-xl focus:bg-white focus:border-[#087A42] focus:ring-1 focus:ring-[#087A42]/20 focus:outline-none transition-all cursor-pointer"
                >
                  {indianStates.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 pt-1 text-[11px] text-[#5E695E] cursor-pointer">
              <input
                type="checkbox"
                checked={saveInfo}
                onChange={(e) => setSaveInfo(e.target.checked)}
                className="rounded text-[#087A42] focus:ring-[#087A42]"
              />
              <span>Save this address for fast checkout next time</span>
            </label>
          </div>

          {/* Step 2: Payment Method (Sleek & Mobile-Optimized) */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E5E8E3] p-3.5 sm:p-6 space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#E5E8E3]">
              <h2 className="text-xs sm:text-sm font-bold text-[#202720] flex items-center gap-1.5 sm:gap-2">
                <span className="w-5 h-5 rounded-full bg-[#087A42] text-white text-[10px] sm:text-xs flex items-center justify-center font-bold">
                  2
                </span>
                <span>Select Payment Method</span>
              </h2>
              <span className="text-[10px] sm:text-[11px] text-[#087A42] font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Zero Gateway Fees</span>
              </span>
            </div>

            <div className="space-y-2">
              {/* Option 1: Cash on Delivery with ₹99 Advance */}
              {codAllowed && (
                <label
                  className={`p-2.5 sm:p-3 rounded-xl border-1.5 cursor-pointer flex items-center justify-between gap-2 transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-[#087A42] bg-[#E8F5EE]/60 ring-1 ring-[#087A42]/30 shadow-2xs'
                      : 'border-[#E5E8E3] hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="w-3.5 h-3.5 text-[#087A42] focus:ring-[#087A42] cursor-pointer shrink-0"
                    />
                    <span className="w-5 h-5 rounded bg-[#FF7900] text-white flex items-center justify-center font-black text-[8.5px] shrink-0">
                      COD
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#202720] leading-tight">
                        Cash on Delivery
                      </p>
                      <p className="text-[10px] text-[#5E695E] leading-tight mt-0.5 truncate">
                        Pay ₹{currentAdvance} advance · ₹{currentBalance} on delivery
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold text-[#FF7900] bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200 shrink-0">
                    ₹{currentAdvance} Now
                  </span>
                </label>
              )}

              {/* Option 2: 100% Full UPI Payment */}
              {upiAllowed && (
                <label
                  className={`p-2.5 sm:p-3 rounded-xl border-1.5 cursor-pointer flex items-center justify-between gap-2 transition-all ${
                    paymentMethod === 'upi'
                      ? 'border-[#087A42] bg-[#E8F5EE]/60 ring-1 ring-[#087A42]/30 shadow-2xs'
                      : 'border-[#E5E8E3] hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'upi'}
                      onChange={() => setPaymentMethod('upi')}
                      className="w-3.5 h-3.5 text-[#087A42] focus:ring-[#087A42] cursor-pointer shrink-0"
                    />
                    <span className="w-5 h-5 rounded bg-[#087A42] text-white flex items-center justify-center font-black text-[8.5px] shrink-0">
                      UPI
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#202720] leading-tight">
                        Full UPI Payment
                      </p>
                      <p className="text-[10px] text-[#5E695E] leading-tight mt-0.5 truncate">
                        GPay, PhonePe, Paytm, QR · Instant
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold text-[#087A42] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
                    Pay ₹{total}
                  </span>
                </label>
              )}
            </div>

            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3 sm:py-3.5 bg-[#087A42] hover:bg-[#066336] text-white text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
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
        <div className="lg:col-span-5 bg-white rounded-2xl sm:rounded-3xl border border-[#E5E8E3] p-4 sm:p-6 space-y-4 shadow-xs lg:sticky lg:top-24">
          <h3 className="text-sm sm:text-base font-bold text-[#202720] pb-2.5 border-b border-[#E5E8E3]">
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-4 sm:p-6 space-y-3.5 shadow-2xl border border-[#E5E8E3] my-auto max-h-[94vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            
            {/* Modal Header with Amount Badge */}
            <div className="flex items-center justify-between pb-2.5 border-b border-[#E5E8E3]">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#087A42] text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0">
                  UPI
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-[#202720] flex items-center gap-1 truncate">
                    <span>
                      {upiModalData.paymentType === 'cod'
                        ? 'COD (₹99 Advance Token)'
                        : 'Full UPI Instant Payment'}
                    </span>
                    <ShieldCheck className="w-3.5 h-3.5 text-[#087A42] shrink-0" />
                  </h3>
                  <p className="text-[10px] text-[#5E695E]">FanKO Store Direct Verification</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <div className="text-right">
                  <span className="text-[9px] text-[#5E695E] uppercase font-bold tracking-wider block leading-none">Pay Amount</span>
                  <span className="text-base sm:text-lg font-black text-[#087A42] tabular-nums leading-tight">
                    ₹{upiModalData.amountToPay}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setUpiModalData(null)}
                  disabled={isProcessing}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Close payment modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
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

            {/* STEP 1: Mobile-Friendly Payment Switcher */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#087A42] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#087A42] text-white text-[10px] flex items-center justify-center font-bold">1</span>
                  <span>Step 1: Choose How to Pay</span>
                </span>
                <span className="text-[10px] font-bold text-[#087A42] bg-[#E8F5EE] px-2 py-0.5 rounded-full border border-emerald-200">
                  ₹{upiModalData.amountToPay}
                </span>
              </div>

              {/* Segmented Switcher for Mobile: Scan QR vs Copy UPI ID */}
              <div className="grid grid-cols-2 p-1 bg-[#F1F3F0] rounded-xl text-xs font-bold gap-1">
                <button
                  type="button"
                  onClick={() => setPaymentTab('qr')}
                  className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    paymentTab === 'qr'
                      ? 'bg-white text-[#087A42] shadow-xs font-black'
                      : 'text-[#5E695E] hover:text-[#202720]'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Scan QR Code</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentTab('upi_id')}
                  className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    paymentTab === 'upi_id'
                      ? 'bg-white text-[#087A42] shadow-xs font-black'
                      : 'text-[#5E695E] hover:text-[#202720]'
                  }`}
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy UPI ID</span>
                </button>
              </div>

              {/* OPTION A: Scan QR Code View (Mobile Centered & Fully Contained) */}
              {paymentTab === 'qr' && (
                <div className="p-3 bg-gradient-to-b from-[#F7F8F6] via-white to-emerald-50/30 border border-emerald-300 rounded-2xl text-center space-y-2.5 animate-in fade-in duration-150">
                  {/* Big Responsive Centered QR Code Box (Never cuts off) */}
                  <div className="flex justify-center">
                    <div className="p-2 bg-white rounded-2xl border-2 border-[#087A42] shadow-xs inline-block">
                      <div className="w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center bg-white rounded-xl overflow-hidden">
                        <img
                          src={upiModalData.qrCodeUrl}
                          alt="UPI QR Code"
                          className="max-w-full max-h-full object-contain mx-auto"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Centered Actions Grid */}
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={handleDownloadQr}
                      className="py-2 px-2 bg-white hover:bg-slate-50 text-[#087A42] text-[11px] font-bold rounded-xl border border-emerald-300 shadow-2xs flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-[#087A42]" />
                      <span>Download QR</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyUpiId}
                      className="py-2 px-2 bg-[#087A42] hover:bg-[#066336] text-white text-[11px] font-bold rounded-xl shadow-xs flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                    >
                      {copiedUpi ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy UPI ID</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Store UPI ID Bar */}
                  <div className="px-2.5 py-1.5 bg-white rounded-xl border border-slate-200 text-[11px] flex items-center justify-between gap-1 shadow-2xs">
                    <span className="text-[#5E695E] font-medium text-[10px]">UPI:</span>
                    <span className="font-mono font-bold text-[#202720] truncate select-all">{upiModalData.upiId}</span>
                    <button
                      type="button"
                      onClick={handleCopyUpiId}
                      className="text-[10px] text-[#087A42] font-bold hover:underline shrink-0"
                    >
                      {copiedUpi ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>

                  <p className="text-[10px] text-[#5E695E] leading-tight">
                    Scan with GPay, PhonePe, or Paytm camera. Or tap <strong>Download QR</strong> and select from gallery in GPay.
                  </p>
                </div>
              )}

              {/* OPTION B: Copy UPI ID View (Easiest for paying on the same phone) */}
              {paymentTab === 'upi_id' && (
                <div className="p-3 bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/40 border border-emerald-300 rounded-2xl space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#087A42] flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Direct In-App UPI Payment</span>
                    </span>
                    <span className="text-[10px] font-bold text-[#087A42] bg-[#E8F5EE] px-2 py-0.5 rounded-md border border-emerald-200">
                      ₹{upiModalData.amountToPay}
                    </span>
                  </div>

                  {/* 1-Tap Copy UPI ID Card */}
                  <div className="bg-white p-3 rounded-xl border-2 border-emerald-200 flex items-center justify-between gap-2 shadow-xs">
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] text-[#5E695E] font-bold uppercase tracking-wider">Store UPI ID</p>
                      <p className="font-mono font-black text-sm text-[#202720] truncate select-all">{upiModalData.upiId}</p>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyUpiId}
                      className="px-3.5 py-2 bg-[#087A42] hover:bg-[#066336] text-white text-xs font-bold rounded-xl shrink-0 flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                    >
                      {copiedUpi ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy ID</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Compact 3-Step Instructions */}
                  <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100 text-[11px] text-[#202720] space-y-1.5 leading-snug">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-[#087A42] text-white text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
                      <span>Copy UPI ID: <strong className="font-mono text-[#087A42]">{upiModalData.upiId}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-[#087A42] text-white text-[10px] font-bold flex items-center justify-center shrink-0">2</span>
                      <span>Open <strong>GPay</strong> or <strong>PhonePe</strong> → Select <strong>&quot;Pay UPI ID&quot;</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-[#087A42] text-white text-[10px] font-bold flex items-center justify-center shrink-0">3</span>
                      <span>Paste &amp; pay exactly <strong className="text-[#087A42]">₹{upiModalData.amountToPay}</strong></span>
                    </div>
                  </div>
                </div>
              )}

              {/* Compact Verification Notice */}
              <div className="text-[11px] text-[#087A42] bg-[#E8F5EE] p-2.5 rounded-xl border border-emerald-200/90 flex items-start gap-2 leading-tight">
                <Clock className="w-3.5 h-3.5 text-[#087A42] shrink-0 mt-0.5" />
                <p>
                  <strong>Verified by Date &amp; Time:</strong> Take a screenshot of the receipt showing payment date &amp; time and upload it below to confirm your order!
                </p>
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

              {/* AI Vision Verification In-Progress Card */}
              {(isCompressingProof || isVerifyingScreenshot) ? (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-teal-50 border-2 border-[#087A42]/40 shadow-xs text-center space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#087A42] text-white flex items-center justify-center shadow-xs animate-pulse">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-[#087A42]">
                        {isCompressingProof ? 'Preparing Image...' : 'AI Vision Verifying Screenshot Live...'}
                      </p>
                      <p className="text-[10px] text-[#5E695E]">
                        Checking payment app, amount (₹{upiModalData.amountToPay}), success status &amp; date/time
                      </p>
                    </div>
                  </div>

                  <div className="w-full bg-emerald-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-[#087A42] h-full rounded-full animate-indeterminate" style={{ width: '70%' }} />
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[10px] text-left text-[#5E695E] pt-1">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#087A42] animate-ping" />
                      <span>Authentic UPI Receipt</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#087A42]" />
                      <span>Amount Match (₹{upiModalData.amountToPay})</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#087A42]" />
                      <span>Payment Date &amp; Time</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#087A42]" />
                      <span>Transaction UTR Ref</span>
                    </span>
                  </div>
                </div>
              ) : paymentProofUrl && verifiedPaymentInfo && verifiedPaymentInfo.isValid ? (
                /* Screenshot Verified Card: Genuine payment proof confirmed live! */
                <div className="p-3.5 bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/40 border-2 border-[#087A42] rounded-2xl space-y-2.5 shadow-xs animate-in zoom-in-95">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#087A42] text-white flex items-center justify-center shadow-xs">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-[#087A42]">Payment Screenshot Verified Live</span>
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-[#087A42] text-white">
                            PASSED
                          </span>
                        </div>
                        <p className="text-[10px] text-[#5E695E]">
                          {verifiedPaymentInfo.appName || 'UPI App'} · {screenshotFileName || 'receipt.jpg'} ({screenshotFileSize})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPreviewScreenshotModal(true)}
                        className="p-1.5 text-slate-600 hover:text-[#087A42] hover:bg-white rounded-lg transition-colors cursor-pointer border border-slate-200 shadow-2xs"
                        title="View screenshot preview"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-1.5 text-slate-600 hover:text-[#087A42] hover:bg-white rounded-lg transition-colors cursor-pointer border border-slate-200 shadow-2xs"
                        title="Replace screenshot"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveScreenshot}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Extracted & Verified Payment Details Grid */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 bg-white rounded-xl border border-emerald-200 text-[11px]">
                    <div>
                      <span className="text-[9px] text-[#5E695E] uppercase font-bold block">Verified Amount</span>
                      <span className="font-black text-[#087A42] text-xs">
                        ₹{verifiedPaymentInfo.detectedAmount || upiModalData.amountToPay} ✓
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] text-[#5E695E] uppercase font-bold block">App / Gateway</span>
                      <span className="font-bold text-[#202720] text-xs truncate block">
                        {verifiedPaymentInfo.appName || 'UPI'}
                      </span>
                    </div>

                    <div className="col-span-2 pt-1 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] text-[#5E695E] uppercase font-bold block">Payment Date &amp; Time</span>
                        <span className="font-semibold text-[#202720] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#087A42]" />
                          <span>{verifiedPaymentInfo.detectedDateTime || 'Live Timestamp Verified'}</span>
                        </span>
                      </div>

                      {verifiedPaymentInfo.detectedUtr && verifiedPaymentInfo.detectedUtr !== 'N/A' && (
                        <div className="text-right">
                          <span className="text-[9px] text-[#5E695E] uppercase font-bold block">Ref / UTR</span>
                          <span className="font-mono font-bold text-[#202720] text-[10px]">
                            {verifiedPaymentInfo.detectedUtr}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Upload Zone when NO verified screenshot */
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
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#202720]">
                        Tap to Upload Payment Screenshot
                      </p>
                      <p className="text-[11px] text-[#5E695E] mt-0.5">
                        Upload receipt screenshot showing <strong>Payment Date &amp; Time</strong> and amount (₹{upiModalData.amountToPay}).
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#087A42] bg-white px-2.5 py-1 rounded-lg border border-[#E5E8E3] shadow-2xs">
                      <ImageIcon className="w-3 h-3" />
                      <span>Supports PNG, JPG, Camera &amp; Clipboard Paste</span>
                    </span>
                  </div>
                </div>
              )}

              {/* Strict Rejection Notice if Uploaded File is Fake or Non-Payment */}
              {(screenshotError || showScreenshotWarning) && (
                <div className="p-3 bg-rose-50 border-2 border-rose-300 rounded-2xl text-xs text-rose-800 space-y-1.5 animate-in shake">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span className="font-bold text-rose-900">Payment Screenshot Rejected</span>
                  </div>
                  <p className="text-[11px] text-rose-700 leading-snug">
                    {screenshotError || 'Payment screenshot is required to confirm your order. Only authentic successful payment receipts showing date & time are accepted.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-1 text-[11px] font-bold text-rose-800 underline hover:text-rose-900 cursor-pointer block"
                  >
                    Tap to upload authentic payment screenshot →
                  </button>
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

            {/* STEP 3: Confirm Order Action (Strictly Gated on Live Verified Screenshot) */}
            <div className="pt-2 space-y-2.5 border-t border-[#E5E8E3]">
              {paymentProofUrl && verifiedPaymentInfo && verifiedPaymentInfo.isValid ? (
                /* Unlocked: Ready to Confirm Order because receipt is verified */
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
                        <span>{verificationStatus || 'Placing Order...'}</span>
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
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Payment screenshot &amp; date/time verified live! Tap above to confirm order.</span>
                  </p>
                </div>
              ) : (
                /* Locked: Prompt to upload and verify screenshot first */
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowScreenshotWarning(true);
                      setScreenshotError('Please upload an authentic payment receipt screenshot showing date & time to confirm your order.');
                      fileInputRef.current?.click();
                    }}
                    className="w-full py-4 bg-[#F7F8F6] hover:bg-[#E8F5EE] border-2 border-dashed border-[#087A42]/50 text-[#087A42] text-xs sm:text-sm font-bold rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.99]"
                  >
                    <Upload className="w-4 h-4 text-[#087A42]" />
                    <span>Upload &amp; Verify Screenshot to Place Order</span>
                  </button>
                  <p className="text-[10px] text-center text-[#5E695E]">
                    Order confirmation is strictly locked until a genuine payment screenshot with live date &amp; time is verified. Fake images will not be accepted.
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
