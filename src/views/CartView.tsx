import React, { useState } from 'react';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Truck,
  Tag,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';

interface CartViewProps {
  onNavigate: (view: string, param?: string) => void;
}

export const CartView: React.FC<CartViewProps> = ({ onNavigate }) => {
  const {
    items,
    updateQuantity,
    removeFromCart,
    subtotal,
    shippingFee,
    total,
    freeShippingThreshold,
    amountNeededForFreeShipping,
    couponCode,
    couponDiscount,
    couponError,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [inputCoupon, setInputCoupon] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const freeShippingProgress = Math.min(
    100,
    Math.round((subtotal / freeShippingThreshold) * 100)
  );

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCoupon.trim()) return;
    setApplyingCoupon(true);
    await applyCoupon(inputCoupon.trim());
    setApplyingCoupon(false);
    setInputCoupon('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="text-xs text-[#5E695E] flex items-center gap-2">
        <button
          onClick={() => onNavigate('home')}
          className="hover:text-[#087A42] transition-colors cursor-pointer"
        >
          Home
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <button
          onClick={() => onNavigate('shop')}
          className="hover:text-[#087A42] transition-colors cursor-pointer"
        >
          Shop
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[#087A42] font-semibold">Shopping Cart</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E5E8E3] gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#202720]">
            Your Shopping Cart
          </h1>
          <p className="text-xs sm:text-sm text-[#5E695E] mt-1">
            {items.length === 0
              ? 'Your cart is currently empty'
              : `Review and adjust your items (${items.length} ${items.length === 1 ? 'item' : 'items'})`}
          </p>
        </div>

        {items.length > 0 && (
          <button
            onClick={() => onNavigate('shop')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#087A42] hover:text-[#066336] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Continue Shopping</span>
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E5E8E3] p-12 text-center max-w-md mx-auto space-y-4 my-8 shadow-xs">
          <div className="w-16 h-16 bg-[#E8F5EE] text-[#087A42] rounded-full flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-[#202720]">Your Cart is Empty</h2>
          <p className="text-xs text-[#5E695E]">
            Looks like you haven't added any kitchen or home organization products yet.
          </p>
          <div className="pt-2">
            <button
              onClick={() => onNavigate('shop')}
              className="w-full py-3 bg-[#087A42] hover:bg-[#066336] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Explore Products Now
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Cart Items List Column */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Free Shipping Progress Card */}
            <div className="bg-white p-4 rounded-xl border border-[#E5E8E3] shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#202720] flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-[#087A42]" />
                  {amountNeededForFreeShipping > 0 ? (
                    <>
                      Add <strong className="text-[#087A42]">₹{amountNeededForFreeShipping}</strong> more for <strong>FREE Pan-India Delivery</strong>
                    </>
                  ) : (
                    <span className="text-[#087A42] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-[#087A42]" />
                      You qualify for FREE Pan-India Shipping!
                    </span>
                  )}
                </span>
                <span className="text-[#5E695E] font-medium">{freeShippingProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#087A42] transition-all duration-300 rounded-full"
                  style={{ width: `${freeShippingProgress}%` }}
                />
              </div>
            </div>

            {/* Items Table/Cards */}
            <div className="bg-white rounded-xl border border-[#E5E8E3] shadow-xs divide-y divide-[#E5E8E3]">
              {items.map((item) => (
                <div key={item.productId} className="p-4 sm:p-5 flex gap-4 sm:gap-6 items-start">
                  
                  {/* Thumbnail */}
                  <div
                    onClick={() => onNavigate('product', item.product.slug || item.productId)}
                    className="w-20 h-20 sm:w-24 sm:h-24 bg-[#F7F8F6] rounded-xl p-2 shrink-0 border border-[#E5E8E3] cursor-pointer"
                  >
                    <img
                      src={item.product.images[0] || '/assets/aistudio/fankostore.logo_1f90e1f5.png'}
                      alt={item.product.name}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <button
                      onClick={() => onNavigate('product', item.product.slug || item.productId)}
                      className="text-sm sm:text-base font-bold text-[#202720] hover:text-[#087A42] transition-colors text-left line-clamp-2 cursor-pointer"
                    >
                      {item.product.name}
                    </button>
                    
                    <p className="text-xs text-[#5E695E]">SKU: {item.product.sku}</p>

                    <div className="pt-1 flex items-baseline gap-2">
                      <span className="text-sm sm:text-base font-bold text-[#202720] tabular-nums">
                        ₹{item.selectedPrice}
                      </span>
                      <span className="text-xs text-[#5E695E]">each</span>
                    </div>

                    {/* Quantity controls & Remove */}
                    <div className="pt-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center border border-[#E5E8E3] rounded-lg bg-[#F7F8F6] overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="p-1.5 hover:bg-slate-200 text-[#202720] transition-colors cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-10 text-center text-xs font-bold text-[#202720] tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="p-1.5 hover:bg-slate-200 text-[#202720] transition-colors cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-sm font-extrabold text-[#087A42] tabular-nums">
                          ₹{item.selectedPrice * item.quantity}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 transition-colors cursor-pointer p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Remove</span>
                        </button>
                      </div>
                    </div>

                  </div>

                </div>
              ))}
            </div>

            {/* Return & Security Assurances */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="bg-white p-3.5 rounded-xl border border-[#E5E8E3] flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#087A42] shrink-0" />
                <span className="text-xs text-[#5E695E]">
                  <strong>100% Genuine</strong> Indian Store Warranty & Support
                </span>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-[#E5E8E3] flex items-center gap-2.5">
                <Truck className="w-5 h-5 text-[#FF7900] shrink-0" />
                <span className="text-xs text-[#5E695E]">
                  <strong>Trackable Delivery</strong> across 19,000+ Indian PIN Codes
                </span>
              </div>
            </div>

          </div>

          {/* Order Summary Column */}
          <div className="lg:col-span-4 space-y-4">
            
            <div className="bg-white rounded-xl border border-[#E5E8E3] p-5 sm:p-6 shadow-xs space-y-5">
              <h2 className="text-base font-bold text-[#202720] pb-3 border-b border-[#E5E8E3]">
                Order Summary
              </h2>

              {/* Promo Code Input */}
              <div>
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 text-[#5E695E] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Coupon (e.g. WELCOME10)"
                      value={inputCoupon}
                      onChange={(e) => setInputCoupon(e.target.value.toUpperCase())}
                      className="w-full pl-8 pr-3 py-2 text-xs bg-[#F7F8F6] border border-[#E5E8E3] rounded-lg uppercase tracking-wider focus:outline-none focus:border-[#087A42] focus:bg-white"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={applyingCoupon || !inputCoupon.trim()}
                    className="px-3.5 py-2 bg-[#202720] hover:bg-[#087A42] disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    {applyingCoupon ? '...' : 'Apply'}
                  </button>
                </form>

                {couponError && (
                  <p className="text-[11px] text-rose-600 mt-1.5">{couponError}</p>
                )}

                {couponCode && (
                  <div className="mt-2.5 flex items-center justify-between bg-[#E8F5EE] border border-[#087A42]/20 px-3 py-1.5 rounded-lg text-xs text-[#087A42]">
                    <span className="font-semibold">Code: {couponCode} Applied</span>
                    <button
                      onClick={removeCoupon}
                      className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2.5 text-xs text-[#5E695E] pt-2 border-t border-[#E5E8E3]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[#202720] tabular-nums">₹{subtotal}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-[#087A42]">
                    <span>Coupon Discount</span>
                    <span className="font-semibold tabular-nums">-₹{couponDiscount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Pan-India Delivery</span>
                  <span className="font-semibold text-[#202720] tabular-nums">
                    {shippingFee === 0 ? (
                      <span className="text-[#087A42]">FREE</span>
                    ) : (
                      `₹${shippingFee}`
                    )}
                  </span>
                </div>
                <div className="pt-3 border-t border-[#E5E8E3] flex justify-between text-base font-extrabold text-[#202720]">
                  <span>Total Payable</span>
                  <span className="text-lg text-[#087A42] tabular-nums">₹{total}</span>
                </div>
                <p className="text-[11px] text-[#5E695E]">Inclusive of all taxes</p>
              </div>

              {/* Checkout CTA */}
              <button
                onClick={() => onNavigate('checkout')}
                className="w-full py-3.5 bg-[#087A42] hover:bg-[#066336] text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center text-[11px] text-[#5E695E] space-y-1">
                <p>🔒 256-Bit SSL Encrypted Checkout</p>
                <p>Razorpay (Cards, UPI, NetBanking) & Cash on Delivery</p>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};
