import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CreditCard,
  Truck,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Lock,
  Tag,
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

  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [codAllowed, setCodAllowed] = useState(true);
  const [saveInfo, setSaveInfo] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sandbox simulation modal state when merchant keys are in test mode
  const [testModalData, setTestModalData] = useState<{
    orderId: string;
    orderNumber: string;
    razorpayOrderId: string;
    amount: number;
  } | null>(null);

  useEffect(() => {
    api.getSettings().then((s) => {
      setCodAllowed(s.codEnabled);
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
    setForm((prev) => ({ ...prev, pincode: pin }));
    if (/^[1-9][0-9]{5}$/.test(pin)) {
      try {
        const res = await api.checkPincode(pin);
        if (res.state && !form.city) {
          // prefill region hint if city is empty
        }
      } catch {}
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
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
      const payloadItems = items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      }));

      // A. Cash on Delivery Flow
      if (paymentMethod === 'cod') {
        const result = await api.createCodOrder({
          customer: form,
          items: payloadItems,
          couponCode: couponCode || undefined,
        });
        clearCart();
        setIsProcessing(false);
        onOrderCompleted(result.order);
        onNavigate('order-confirmation', result.order.orderNumber);
        return;
      }

      // B. Razorpay Online Payment Flow
      const rzpInit = await api.createRazorpayOrder({
        customer: form,
        items: payloadItems,
        couponCode: couponCode || undefined,
      });

      // Check if real Razorpay is openable via checkout.js
      if ((window as any).Razorpay && !rzpInit.testMode && rzpInit.keyId !== 'rzp_test_placeholder') {
        const options = {
          key: rzpInit.keyId,
          amount: rzpInit.amount,
          currency: rzpInit.currency,
          name: 'FanKO Store',
          description: `Order ${rzpInit.orderNumber}`,
          image: '/assets/aistudio/fankostore.logo_1f90e1f5.png',
          order_id: rzpInit.razorpayOrderId,
          prefill: {
            name: form.fullName,
            email: form.email,
            contact: form.phone,
          },
          notes: {
            orderNumber: rzpInit.orderNumber,
          },
          theme: {
            color: '#087A42',
          },
          handler: async function (response: any) {
            try {
              const verifyRes = await api.verifyRazorpayPayment({
                orderId: rzpInit.orderId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
              clearCart();
              setIsProcessing(false);
              onOrderCompleted(verifyRes.order);
              onNavigate('order-confirmation', verifyRes.order.orderNumber);
            } catch (err: any) {
              setIsProcessing(false);
              setError(err.message || 'Payment signature verification failed.');
            }
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
              setError('Payment window closed. Your order was not charged. You can retry anytime.');
            },
          },
        };

        const razorpayInstance = new (window as any).Razorpay(options);
        razorpayInstance.on('payment.failed', function (resp: any) {
          setIsProcessing(false);
          setError(`Payment failed: ${resp.error.description || 'Transaction declined'}`);
        });
        razorpayInstance.open();
      } else {
        // Test / Sandbox mode dialog (Transparently explains test mode)
        setIsProcessing(false);
        setTestModalData({
          orderId: rzpInit.orderId,
          orderNumber: rzpInit.orderNumber,
          razorpayOrderId: rzpInit.razorpayOrderId,
          amount: rzpInit.amount,
        });
      }
    } catch (err: any) {
      setIsProcessing(false);
      setError(err.message || 'Failed to place order. Please check inputs and try again.');
    }
  };

  // Handler for Sandbox Test Payment simulation
  const handleSimulateTestPayment = async (success: boolean) => {
    if (!testModalData) return;
    setIsProcessing(true);

    if (!success) {
      setIsProcessing(false);
      setTestModalData(null);
      setError('Simulated payment was cancelled / declined. No amount charged.');
      return;
    }

    try {
      const mockPaymentId = `pay_test_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const verifyRes = await api.verifyRazorpayPayment({
        orderId: testModalData.orderId,
        razorpayOrderId: testModalData.razorpayOrderId,
        razorpayPaymentId: mockPaymentId,
        isTestSimulated: true,
      });

      clearCart();
      setIsProcessing(false);
      setTestModalData(null);
      onOrderCompleted(verifyRes.order);
      onNavigate('order-confirmation', verifyRes.order.orderNumber);
    } catch (err: any) {
      setIsProcessing(false);
      setError(err.message || 'Payment verification failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header & Back link */}
      <div className="flex items-center justify-between pb-4 border-b border-[#E5E8E3]">
        <button
          onClick={() => onNavigate('shop')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#087A42] hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Continue Shopping</span>
        </button>
        <div className="flex items-center gap-1.5 text-xs text-[#5E695E]">
          <Lock className="w-3.5 h-3.5 text-[#087A42]" />
          <span>256-bit SSL Encrypted Pan-India Checkout</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* Left Column: Delivery Address & Payment Method */}
        <form onSubmit={handlePlaceOrder} className="lg:col-span-7 space-y-6">
          
          {/* Step 1: Delivery Address */}
          <div className="bg-white rounded-3xl border border-[#E5E8E3] p-6 sm:p-8 space-y-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E8E3]">
              <h2 className="text-base font-bold text-[#202720] flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#087A42] text-white text-xs flex items-center justify-center font-bold">
                  1
                </span>
                <span>Delivery Address (India)</span>
              </h2>
              <span className="text-[11px] text-[#5E695E]">Guest checkout welcome</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#202720] block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  required
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl focus:outline-none focus:border-[#087A42] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#202720] block mb-1">
                  Mobile Number (for delivery SMS & updates) *
                </label>
                <div className="relative flex">
                  <span className="inline-flex items-center px-3 text-xs font-semibold text-[#5E695E] bg-[#E5E8E3]/50 border border-r-0 border-[#E5E8E3] rounded-l-xl">
                    +91
                  </span>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    maxLength={10}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/[^0-9]/g, '') })}
                    required
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-r-xl focus:outline-none focus:border-[#087A42] focus:bg-white"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-[#202720] block mb-1">
                  Email Address (for order invoice & tracking) *
                </label>
                <input
                  type="email"
                  placeholder="rahul@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl focus:outline-none focus:border-[#087A42] focus:bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-[#202720] block mb-1">
                  Flat, House no., Building, Street Address *
                </label>
                <input
                  type="text"
                  placeholder="Flat 402, Green Valley Apartments, 5th Cross Road"
                  value={form.addressLine}
                  onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
                  required
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl focus:outline-none focus:border-[#087A42] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#202720] block mb-1">
                  Landmark (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Near Metro Station or Supermarket"
                  value={form.landmark}
                  onChange={(e) => setForm({ ...form, landmark: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl focus:outline-none focus:border-[#087A42] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#202720] block mb-1">
                  Indian Postal PIN Code *
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 560001"
                  value={form.pincode}
                  onChange={(e) => handlePincodeAutoFill(e.target.value.replace(/[^0-9]/g, ''))}
                  required
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl focus:outline-none focus:border-[#087A42] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#202720] block mb-1">
                  City *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bengaluru, Mumbai, Pune"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  required
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl focus:outline-none focus:border-[#087A42] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#202720] block mb-1">
                  State *
                </label>
                <select
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  required
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl focus:outline-none focus:border-[#087A42] focus:bg-white font-medium"
                >
                  {indianStates.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 pt-2 cursor-pointer text-xs text-[#5E695E]">
              <input
                type="checkbox"
                checked={saveInfo}
                onChange={(e) => setSaveInfo(e.target.checked)}
                className="rounded text-[#087A42] focus:ring-[#087A42]"
              />
              <span>Save this address for fast checkout in future</span>
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
                <span>Encrypted & Verified</span>
              </span>
            </div>

            <div className="space-y-3">
              {/* Option A: Razorpay Online Payment */}
              <label
                className={`p-4 rounded-2xl border-2 cursor-pointer flex items-start gap-3.5 transition-all ${
                  paymentMethod === 'razorpay'
                    ? 'border-[#087A42] bg-[#E8F5EE]/40'
                    : 'border-[#E5E8E3] hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'razorpay'}
                  onChange={() => setPaymentMethod('razorpay')}
                  className="mt-1 text-[#087A42] focus:ring-[#087A42]"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-[#202720]">
                      Razorpay Online Payment (UPI, Cards, NetBanking, Wallets)
                    </p>
                    <span className="text-[11px] font-semibold text-[#087A42] bg-white px-2 py-0.5 rounded border border-[#E5E8E3]">
                      Recommended
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5E695E] mt-1 leading-relaxed">
                    Pay securely using Google Pay, PhonePe, Paytm, RuPay, Visa, Mastercard, or Indian NetBanking.
                  </p>
                </div>
              </label>

              {/* Option B: Cash on Delivery (COD) */}
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
                    <p className="text-xs font-bold text-[#202720]">
                      Cash on Delivery (COD)
                    </p>
                    <p className="text-[11px] text-[#5E695E] mt-1 leading-relaxed">
                      Pay cash or UPI directly to the courier agent when your package arrives at your doorstep.
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
              <Lock className="w-4 h-4 text-[#FF7900]" />
              <span>
                {isProcessing
                  ? 'Processing Order...'
                  : paymentMethod === 'cod'
                  ? `Confirm Order with Cash on Delivery (₹${total})`
                  : `Pay ₹${total} via Razorpay`}
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

      {/* Test / Sandbox Gateway Simulation Modal */}
      {testModalData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-[#E5E8E3] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E8E3]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#087A42] text-white flex items-center justify-center font-bold text-xs">
                  ₹
                </div>
                <h3 className="text-sm font-bold text-[#202720]">
                  Razorpay Standard Checkout (Sandbox)
                </h3>
              </div>
              <span className="text-[10px] bg-[#FFF4E5] text-[#FF7900] font-bold px-2 py-0.5 rounded-full border border-[#FF7900]/20">
                Test Mode
              </span>
            </div>

            <div className="p-3 bg-[#F7F8F6] rounded-xl space-y-1 text-xs">
              <div className="flex justify-between text-[#5E695E]">
                <span>Order Number:</span>
                <span className="font-mono font-semibold text-[#202720]">{testModalData.orderNumber}</span>
              </div>
              <div className="flex justify-between text-[#5E695E]">
                <span>Razorpay Order ID:</span>
                <span className="font-mono text-[11px] text-[#202720]">{testModalData.razorpayOrderId}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-[#202720] pt-1 border-t border-[#E5E8E3]">
                <span>Amount:</span>
                <span className="text-[#087A42] tabular-nums">₹{testModalData.amount / 100}</span>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                <span>Test Gateway Demonstration</span>
              </div>
              <p className="text-[11px] text-blue-700 leading-relaxed">
                Live keys are configured via Admin Settings or <code className="font-mono bg-blue-100 px-1 rounded">.env</code>. This sandbox allows you to test both verified success and cancellation states end-to-end.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => handleSimulateTestPayment(true)}
                disabled={isProcessing}
                className="w-full py-3 bg-[#087A42] hover:bg-[#066336] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isProcessing ? 'Verifying on Backend...' : 'Simulate Successful Payment (Verify Signature)'}</span>
              </button>

              <button
                onClick={() => handleSimulateTestPayment(false)}
                disabled={isProcessing}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Simulate Payment Cancel / Decline
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
