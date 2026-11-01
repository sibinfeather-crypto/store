import React, { useState } from 'react';
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Truck,
  Tag,
  Check
} from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';

interface CartDrawerProps {
  onNavigate: (view: string, param?: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onNavigate }) => {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
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

  if (!isCartOpen) return null;

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

  const handleCheckoutClick = () => {
    setIsCartOpen(false);
    onNavigate('checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <aside aria-label="Shopping Cart Drawer" className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[#E5E8E3] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#087A42]" />
              <h2 className="text-base font-bold text-[#202720]">Shopping Cart</h2>
              <span className="text-xs text-[#5E695E]">({items.length} {items.length === 1 ? 'item' : 'items'})</span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 text-[#5E695E] hover:text-[#202720] rounded-lg hover:bg-[#F7F8F6] transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="bg-[#F7F8F6] px-4 py-3 border-b border-[#E5E8E3]">
            {amountNeededForFreeShipping > 0 ? (
              <div>
                <p className="text-xs text-[#202720] font-medium flex items-center gap-1.5 mb-1.5">
                  <Truck className="w-4 h-4 text-[#087A42]" />
                  <span>
                    Add <strong className="text-[#087A42]">₹{amountNeededForFreeShipping}</strong> more for <strong>FREE Pan-India Delivery</strong>
                  </span>
                </p>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#087A42] transition-all duration-300 rounded-full"
                    style={{ width: `${freeShippingProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#087A42] font-semibold flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#087A42]" />
                <span>You unlocked FREE Pan-India Delivery!</span>
              </p>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 divide-y divide-[#E5E8E3]">
            {items.length === 0 ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#F7F8F6] flex items-center justify-center mx-auto text-slate-300">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#202720]">Your cart is empty</h3>
                  <p className="text-xs text-[#5E695E] mt-1">Discover smart kitchen and home organizers</p>
                </div>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    onNavigate('shop');
                  }}
                  className="px-5 py-2.5 bg-[#087A42] text-white text-xs font-semibold rounded-lg hover:bg-[#066336] transition-colors"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.productId} className="pt-4 first:pt-0 flex gap-3.5">
                  <img
                    src={item.product.images[0] || '/assets/aistudio/fankostore.logo_1f90e1f5.png'}
                    alt={item.product.name}
                    className="w-18 h-18 object-contain rounded-xl bg-[#F7F8F6] p-1 border border-[#E5E8E3] shrink-0"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-semibold text-[#202720] line-clamp-2 leading-snug">
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                          aria-label={`Remove ${item.product.name} from cart`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[11px] text-[#5E695E] mt-0.5">
                        SKU: {item.product.sku}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-[#E5E8E3] rounded-md bg-white">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="p-1 text-slate-500 hover:text-[#202720] transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-semibold text-[#202720] tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock}
                          className="p-1 text-slate-500 hover:text-[#202720] disabled:opacity-30 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-bold text-[#202720] tabular-nums">
                          ₹{(item.product.salePrice ?? item.product.price) * item.quantity}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Summary & Checkout */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-[#E5E8E3] bg-[#F7F8F6]/50 space-y-3.5">
              
              {/* Coupon Field */}
              {couponCode ? (
                <div className="flex items-center justify-between bg-[#E8F5EE] border border-[#087A42]/20 px-3 py-2 rounded-lg text-xs">
                  <div className="flex items-center gap-1.5 text-[#087A42] font-semibold">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Coupon "{couponCode}" applied</span>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-xs text-rose-600 hover:underline font-medium"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter coupon (e.g. WELCOME10)"
                    value={inputCoupon}
                    onChange={(e) => setInputCoupon(e.target.value.toUpperCase())}
                    className="flex-1 text-xs px-3 py-2 bg-white border border-[#E5E8E3] rounded-lg uppercase focus:outline-none focus:border-[#087A42]"
                  />
                  <button
                    type="submit"
                    disabled={applyingCoupon || !inputCoupon.trim()}
                    className="px-3.5 py-2 text-xs font-semibold bg-[#202720] text-white rounded-lg hover:bg-black transition-colors disabled:opacity-50"
                  >
                    {applyingCoupon ? '...' : 'Apply'}
                  </button>
                </form>
              )}

              {couponError && (
                <p className="text-[11px] text-rose-600 font-medium">{couponError}</p>
              )}

              {/* Order breakdown */}
              <div className="space-y-1.5 text-xs text-[#5E695E]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[#202720] tabular-nums">₹{subtotal}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-[#087A42]">
                    <span>Discount</span>
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
                <div className="pt-2 border-t border-[#E5E8E3] flex justify-between text-sm font-bold text-[#202720]">
                  <span>Total Payable</span>
                  <span className="text-base text-[#087A42] tabular-nums">₹{total}</span>
                </div>
              </div>

              {/* Checkout CTA */}
              <button
                onClick={handleCheckoutClick}
                className="w-full py-3.5 bg-[#087A42] hover:bg-[#066336] text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] cursor-pointer"
              >
                <span>Proceed to Secure Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setIsCartOpen(false);
                  onNavigate('cart');
                }}
                className="w-full py-2 text-center text-xs font-semibold text-[#087A42] hover:text-[#066336] transition-colors cursor-pointer"
              >
                View Full Cart Page
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-[#5E695E]">
                <span>🔒 Safe & Secure Pan-India Checkout</span>
                <span>·</span>
                <span>Razorpay / COD</span>
              </div>
            </div>
          )}

        </aside>
      </div>
    </div>
  );
};
