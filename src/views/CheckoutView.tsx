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
  Info
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
  const [modalStep, setModalStep] = useState<'pay' | 'verify'>('pay');
  const [selectedApp, setSelectedApp] = useState<'gpay' | 'phonepe' | 'paytm' | 'other'>('gpay');
  const [utrNumber, setUtrNumber] = useState('');
  const [payerUpiId, setPayerUpiId] = useState('');
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  const [paymentProofName, setPaymentProofName] = useState('');
  const [paymentConfirmedCheck, setPaymentConfirmedCheck] = useState(false);
  const [utrError, setUtrError] = useState<string | null>(null);
  const [showUtrHelp, setShowUtrHelp] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

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

      // Always start at payment completion step
      setModalStep('pay');
      setUtrNumber('');
      setPayerUpiId('');
      setPaymentProofUrl('');
      setPaymentProofName('');
      setPaymentConfirmedCheck(false);
      setUtrError(null);
      setShowUtrHelp(false);

      setIsProcessing(false);
    } catch (err: any) {
      setIsProcessing(false);
      setError(err.message || 'Failed to initialize payment. Please try again.');
    }
  };

  // Automatically open the chosen UPI app (GPay / PhonePe / Paytm / Universal UPI)
  const handleLaunchUpiApp = (app: 'gpay' | 'phonepe' | 'paytm' | 'other') => {
    setSelectedApp(app);
    if (!upiModalData) return;

    let targetUri = upiModalData.upiUri;
    if (app === 'gpay') targetUri = upiModalData.gpayUri;
    else if (app === 'phonepe') targetUri = upiModalData.phonepeUri;
    else if (app === 'paytm') targetUri = upiModalData.paytmUri;

    // Trigger native app intent on mobile or desktop
    window.location.href = targetUri;

    // Fallback: in case app scheme isn't registered, fallback to generic UPI after brief timeout
    setTimeout(() => {
      if (document.hasFocus()) {
        // App didn't take focus immediately, try standard upi://
        window.location.href = upiModalData.upiUri;
      }
    }, 1200);
  };

  const handleCopyUpiId = () => {
    if (!upiModalData) return;
    navigator.clipboard.writeText(upiModalData.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setUtrError('Screenshot file size should be less than 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPaymentProofUrl(reader.result as string);
      setPaymentProofName(file.name);
      setUtrError(null);
    };
    reader.readAsDataURL(file);
  };

  // Step 2: Buyer enters verified UTR payment reference -> Places order in system
  const handleConfirmOrderPlacement = async () => {
    if (!upiModalData) return;
    const cleanUtr = utrNumber.trim();
    if (!cleanUtr || cleanUtr.length < 6) {
      setUtrError('Please enter the 12-digit UPI UTR / Transaction Reference number from your payment app.');
      return;
    }
    if (!paymentConfirmedCheck) {
      setUtrError('Please check the confirmation box confirming your transfer.');
      return;
    }

    setIsProcessing(true);
    setUtrError(null);
    setError(null);

    try {
      const payloadItems = items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      }));

      let result: { success: boolean; order: Order };

      if (upiModalData.paymentType === 'cod') {
        result = await api.createCodOrder({
          customer: form,
          items: payloadItems,
          couponCode: couponCode || undefined,
          upiApp: selectedApp,
          utrNumber: cleanUtr,
          payerUpiId: payerUpiId.trim() || undefined,
          paymentProofUrl: paymentProofUrl || undefined,
        });
      } else {
        result = await api.createUpiOrder({
          customer: form,
          items: payloadItems,
          couponCode: couponCode || undefined,
          upiApp: selectedApp,
          utrNumber: cleanUtr,
          payerUpiId: payerUpiId.trim() || undefined,
          paymentProofUrl: paymentProofUrl || undefined,
        });
      }

      clearCart();
      setIsProcessing(false);
      setUpiModalData(null);
      onOrderCompleted(result.order);
      onNavigate('order-confirmation', result.order.orderNumber);
    } catch (err: any) {
      setIsProcessing(false);
      setUtrError(err.message || 'Could not verify payment or place order. Please verify details and try again.');
    }
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
                  placeholder="e.g. Rahul Sharma"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl focus:bg-white focus:border-[#087A42] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#202720] block mb-1">
                  Mobile Number (for Courier updates) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-[#5E695E] font-medium">+91</span>
                  <input
                    type="tel"
                    required
                    placeholder="98765 43210"
                    maxLength={10}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })}
                    className="w-full text-xs pl-11 pr-3.5 py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl focus:bg-white focus:border-[#087A42] focus:outline-none font-mono"
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
                  placeholder="rahul@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl focus:bg-white focus:border-[#087A42] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-[#202720] block mb-1">
                  Street Address / House / Flat No. *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flat 402, Sunshine Apartments, Main Road"
                  value={form.addressLine}
                  onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl focus:bg-white focus:border-[#087A42] focus:outline-none"
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
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl focus:bg-white focus:border-[#087A42] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#202720] block mb-1">
                  PIN Code *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="e.g. 400001"
                  value={form.pincode}
                  onChange={(e) => handlePincodeAutoFill(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl focus:bg-white focus:border-[#087A42] focus:outline-none font-mono"
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
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl focus:bg-white focus:border-[#087A42] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#202720] block mb-1">
                  State *
                </label>
                <select
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl focus:bg-white focus:border-[#087A42] focus:outline-none"
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
                  ? `Proceed with COD · Pay ₹${currentAdvance} Advance via UPI / QR`
                  : `Pay Full Amount · ₹${total} via UPI / QR`}
              </span>
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

            {/* Stepper Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#F7F8F6] rounded-xl border border-[#E5E8E3] text-xs font-bold">
              <button
                type="button"
                onClick={() => setModalStep('pay')}
                className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  modalStep === 'pay'
                    ? 'bg-white text-[#087A42] shadow-xs border border-[#E5E8E3]'
                    : 'text-[#5E695E] hover:text-[#202720]'
                }`}
              >
                <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-black ${
                  modalStep === 'pay' ? 'bg-[#087A42] text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  1
                </span>
                <span>Pay via UPI / QR</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUtrError(null);
                  setModalStep('verify');
                }}
                className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  modalStep === 'verify'
                    ? 'bg-white text-[#087A42] shadow-xs border border-[#E5E8E3]'
                    : 'text-[#5E695E] hover:text-[#202720]'
                }`}
              >
                <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-black ${
                  modalStep === 'verify' ? 'bg-[#087A42] text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  2
                </span>
                <span>Verify & Place Order</span>
              </button>
            </div>

            {/* STEP 1: MAKE PAYMENT */}
            {modalStep === 'pay' && (
              <div className="space-y-4">
                
                {/* Important Notice */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    <strong>Payment required before order confirmation:</strong> Please complete your transfer of <strong className="text-[#087A42]">₹{upiModalData.amountToPay}</strong> using any UPI app or QR code below. Your order will be placed once you provide the transaction reference.
                  </p>
                </div>

                {/* Payable Amount Highlight Card */}
                <div className="p-4 bg-[#F7F8F6] rounded-2xl border border-[#E5E8E3] text-center space-y-1">
                  <span className="text-[11px] text-[#5E695E] font-medium">
                    {upiModalData.paymentType === 'cod' ? 'Advance Verification Token' : 'Total Amount to Pay Now'}
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

                {/* Direct App Launchers: Automatically open GPay, PhonePe, Paytm */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#202720] block">
                    Tap to Open UPI App on Your Phone:
                  </label>

                  <div className="grid grid-cols-3 gap-2">
                    {/* Google Pay */}
                    <button
                      type="button"
                      onClick={() => handleLaunchUpiApp('gpay')}
                      className="p-2.5 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-[#087A42] rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
                    >
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-black text-xs text-blue-600">
                        G
                      </div>
                      <span className="text-[11px] font-bold text-[#202720]">GPay</span>
                    </button>

                    {/* PhonePe */}
                    <button
                      type="button"
                      onClick={() => handleLaunchUpiApp('phonepe')}
                      className="p-2.5 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-[#5f259f] rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
                    >
                      <div className="w-7 h-7 rounded-full bg-[#5f259f]/10 flex items-center justify-center font-black text-xs text-[#5f259f]">
                        Pe
                      </div>
                      <span className="text-[11px] font-bold text-[#202720]">PhonePe</span>
                    </button>

                    {/* Paytm */}
                    <button
                      type="button"
                      onClick={() => handleLaunchUpiApp('paytm')}
                      className="p-2.5 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-[#00baf2] rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
                    >
                      <div className="w-7 h-7 rounded-full bg-[#00baf2]/10 flex items-center justify-center font-black text-xs text-[#002970]">
                        P
                      </div>
                      <span className="text-[11px] font-bold text-[#202720]">Paytm</span>
                    </button>
                  </div>

                  {/* Any other UPI App */}
                  <button
                    type="button"
                    onClick={() => handleLaunchUpiApp('other')}
                    className="w-full py-2 bg-[#F7F8F6] hover:bg-[#E5E8E3] text-[#202720] text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-[#087A42]" />
                    <span>Open Any Other UPI App (BHIM, CRED, Navi)</span>
                  </button>
                </div>

                {/* QR Code Section (for Desktop or Scanning) */}
                <div className="p-3.5 bg-white border border-[#E5E8E3] rounded-2xl flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-28 h-28 bg-[#F7F8F6] p-1.5 rounded-xl border border-slate-200 flex items-center justify-center shrink-0">
                    <img
                      src={upiModalData.qrCodeUrl}
                      alt="UPI QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="space-y-1.5 text-center sm:text-left flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#202720] flex items-center justify-center sm:justify-start gap-1">
                      <QrCode className="w-3.5 h-3.5 text-[#087A42]" />
                      <span>Or Scan QR with Any App</span>
                    </p>
                    <p className="text-[11px] text-[#5E695E]">
                      Scan via GPay, PhonePe, Paytm, or BHIM camera.
                    </p>

                    {/* Copy UPI ID */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={handleCopyUpiId}
                        className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold bg-[#F7F8F6] hover:bg-[#E5E8E3] text-[#202720] px-2.5 py-1 rounded-lg border border-[#E5E8E3] transition-colors cursor-pointer"
                      >
                        {copiedUpi ? (
                          <>
                            <Check className="w-3 h-3 text-[#087A42]" />
                            <span className="text-[#087A42]">UPI ID Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-[#5E695E]" />
                            <span className="truncate">{upiModalData.upiId}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* CTA to Step 2 */}
                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUtrError(null);
                      setModalStep('verify');
                    }}
                    className="w-full py-4 bg-[#087A42] hover:bg-[#066336] text-white text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] cursor-pointer"
                  >
                    <span>I Have Paid ₹{upiModalData.amountToPay} → Enter UTR to Place Order</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setUpiModalData(null)}
                    disabled={isProcessing}
                    className="w-full py-2 text-xs font-semibold text-[#5E695E] hover:text-[#202720] transition-colors cursor-pointer text-center"
                  >
                    Back to Checkout / Change Method
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: VERIFY PAYMENT & PLACE ORDER */}
            {modalStep === 'verify' && (
              <div className="space-y-4">
                
                {/* Payment Target Summary */}
                <div className="p-3 bg-[#E8F5EE] border border-[#087A42]/20 rounded-2xl flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-[#5E695E] block text-[10px]">Transferred to {upiModalData.payeeName}</span>
                    <span className="font-mono font-bold text-[#087A42]">{upiModalData.upiId}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#5E695E] block">Amount Transferred</span>
                    <span className="text-base font-extrabold text-[#087A42] tabular-nums">₹{upiModalData.amountToPay}</span>
                  </div>
                </div>

                {/* Mandatory UTR Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#202720] flex items-center gap-1">
                      <span>UPI 12-Digit Reference / UTR Number *</span>
                    </label>
                    {utrNumber.trim().length >= 6 ? (
                      <span className="text-[10px] font-bold text-[#087A42] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Format Valid</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-600 font-semibold">
                        Mandatory to place order
                      </span>
                    )}
                  </div>

                  <input
                    type="text"
                    required
                    placeholder="e.g. 439281928412"
                    value={utrNumber}
                    onChange={(e) => {
                      setUtrNumber(e.target.value.replace(/[^a-zA-Z0-9]/g, ''));
                      setUtrError(null);
                    }}
                    className={`w-full text-xs px-3.5 py-3 bg-[#F7F8F6] border rounded-xl font-mono focus:bg-white focus:outline-none transition-colors ${
                      utrNumber.trim().length >= 6
                        ? 'border-[#087A42] focus:border-[#087A42]'
                        : 'border-[#E5E8E3] focus:border-[#087A42]'
                    }`}
                  />

                  {/* Helper Toggle: Where to find UTR */}
                  <div className="pt-0.5">
                    <button
                      type="button"
                      onClick={() => setShowUtrHelp(!showUtrHelp)}
                      className="text-[11px] text-[#087A42] hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                    >
                      <HelpCircle className="w-3 h-3" />
                      <span>{showUtrHelp ? 'Hide guide' : 'Where do I find my 12-digit UTR in GPay / PhonePe / Paytm?'}</span>
                      <ChevronDown className={`w-3 h-3 transition-transform ${showUtrHelp ? 'rotate-180' : ''}`} />
                    </button>

                    {showUtrHelp && (
                      <div className="mt-2 p-3 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl text-[11px] text-[#5E695E] space-y-1.5 animate-in fade-in duration-150">
                        <p className="font-bold text-[#202720]">How to find your 12-digit reference:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li><strong className="text-[#202720]">Google Pay:</strong> Open payment receipt → look for <strong>UPI transaction ID</strong> (12 digits).</li>
                          <li><strong className="text-[#202720]">PhonePe:</strong> Open transaction history → look for <strong>UTR</strong> or <strong>Transaction ID</strong>.</li>
                          <li><strong className="text-[#202720]">Paytm:</strong> View payment details → look for <strong>UPI Ref No.</strong> (12 digits).</li>
                          <li><strong className="text-[#202720]">BHIM / Bank Apps:</strong> Look for <strong>Reference ID</strong> or <strong>RRN</strong> on the successful payment screen.</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Optional Payer UPI ID */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#202720] block">
                    Your UPI ID or Mobile Number (Optional):
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 9876543210@paytm or rahul@okhdfcbank"
                    value={payerUpiId}
                    onChange={(e) => setPayerUpiId(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl font-mono focus:bg-white focus:border-[#087A42] focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400">
                    Allows our team to instantly match your payment.
                  </p>
                </div>

                {/* Optional Payment Screenshot Upload */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#202720] block">
                    Attach Payment Screenshot (Optional):
                  </label>

                  {paymentProofUrl ? (
                    <div className="p-2.5 bg-[#F7F8F6] border border-[#087A42]/30 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={paymentProofUrl}
                          alt="Payment Receipt"
                          className="w-10 h-10 object-cover rounded-lg border border-[#E5E8E3]"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#202720] truncate">
                            {paymentProofName || 'Receipt screenshot'}
                          </p>
                          <span className="text-[10px] text-[#087A42] font-bold">Screenshot Attached</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentProofUrl('');
                          setPaymentProofName('');
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer"
                        title="Remove screenshot"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="p-3 bg-[#F7F8F6] hover:bg-[#E5E8E3]/60 border border-dashed border-[#E5E8E3] hover:border-[#087A42] rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors">
                      <Upload className="w-4 h-4 text-[#087A42]" />
                      <span className="text-xs font-semibold text-[#202720]">Upload UPI Payment Screenshot</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleScreenshotUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Confirmation Checkbox */}
                <label className="flex items-start gap-2.5 p-3 bg-[#F7F8F6] rounded-xl border border-[#E5E8E3] text-xs text-[#202720] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paymentConfirmedCheck}
                    onChange={(e) => {
                      setPaymentConfirmedCheck(e.target.checked);
                      setUtrError(null);
                    }}
                    className="mt-0.5 rounded text-[#087A42] focus:ring-[#087A42] w-4 h-4"
                  />
                  <span className="leading-relaxed">
                    I confirm that I have transferred <strong className="text-[#087A42]">₹{upiModalData.amountToPay}</strong> to <strong>{upiModalData.upiId}</strong> and the transaction reference above is authentic.
                  </span>
                </label>

                {/* Error Banner */}
                {utrError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{utrError}</span>
                  </div>
                )}

                {/* Submit Order Button (Only enabled after payment verification info) */}
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={handleConfirmOrderPlacement}
                    disabled={isProcessing || utrNumber.trim().length < 6 || !paymentConfirmedCheck}
                    className="w-full py-4 bg-[#087A42] hover:bg-[#066336] text-white text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>
                      {isProcessing
                        ? 'Verifying Payment & Placing Order...'
                        : `Verify Payment & Place Order (₹${upiModalData.amountToPay})`}
                    </span>
                  </button>

                  {(utrNumber.trim().length < 6 || !paymentConfirmedCheck) && (
                    <p className="text-[10px] text-center text-slate-400">
                      Enter your 12-digit UTR and tick the confirmation box above to place your order.
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => setModalStep('pay')}
                    disabled={isProcessing}
                    className="w-full py-2 text-xs font-semibold text-[#5E695E] hover:text-[#202720] transition-colors cursor-pointer text-center"
                  >
                    ← Back to QR & Payment Apps
                  </button>
                </div>

              </div>
            )}

            <p className="text-[10px] text-center text-slate-400 flex items-center justify-center gap-1 pt-1 border-t border-[#E5E8E3]">
              <Lock className="w-3 h-3 text-[#087A42]" />
              <span>Direct Bank to Bank UPI Payment · 100% Safe & Instant</span>
            </p>

          </div>
        </div>
      )}

    </div>
  );
};
