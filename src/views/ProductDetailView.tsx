import React, { useState } from 'react';
import {
  Heart,
  ShoppingBag,
  Zap,
  Truck,
  ShieldCheck,
  RefreshCw,
  Star,
  CheckCircle2,
  MapPin,
  AlertCircle
} from 'lucide-react';
import type { Product, Review, PincodeInfo } from '../types/index.ts';
import { useCart } from '../context/CartContext.tsx';
import { useWishlist } from '../context/WishlistContext.tsx';
import { api } from '../services/api.ts';

interface ProductDetailViewProps {
  product: Product;
  onNavigate: (view: string, param?: string) => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  product,
  onNavigate,
}) => {
  const { addToCart, setIsCartOpen } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [pincode, setPincode] = useState('');
  const [pincodeResult, setPincodeResult] = useState<PincodeInfo | null>(null);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState<string | null>(null);

  const isFavorited = isInWishlist(product.id);
  const isOutOfStock = product.stock <= 0 || product.status === 'out_of_stock';
  const effectivePrice = product.salePrice ?? product.price;
  const discountPercent = product.salePrice
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0;

  const handlePincodeCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode.trim() || !/^[1-9][0-9]{5}$/.test(pincode.trim())) {
      setPincodeError('Please enter a valid 6-digit Indian PIN code.');
      setPincodeResult(null);
      return;
    }
    setPincodeLoading(true);
    setPincodeError(null);
    try {
      const res = await api.checkPincode(pincode.trim());
      setPincodeResult(res);
    } catch (err: any) {
      setPincodeError(err.message || 'Unable to verify pincode');
    } finally {
      setPincodeLoading(false);
    }
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    setIsCartOpen(false);
    onNavigate('checkout');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#5E695E]">
        <button onClick={() => onNavigate('home')} className="hover:text-[#087A42]">Home</button>
        <span>/</span>
        <button onClick={() => onNavigate('shop')} className="hover:text-[#087A42]">Shop</button>
        <span>/</span>
        <button
          onClick={() => onNavigate('shop', `category=${product.category}`)}
          className="hover:text-[#087A42]"
        >
          {product.category}
        </button>
        <span>/</span>
        <span className="text-[#202720] font-semibold truncate max-w-xs">{product.name}</span>
      </div>

      {/* Main PDP Grid: Gallery (Left) & Contiguous Purchase Module (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* Sticky Gallery (Left) */}
        <div className="lg:col-span-7 space-y-4 lg:sticky lg:top-24">
          <div className="aspect-4/3 bg-white rounded-3xl border border-[#E5E8E3] p-6 flex items-center justify-center overflow-hidden relative shadow-xs">
            <img
              src={product.images[selectedImage] || product.images[0] || '/assets/aistudio/fankostore.logo_1f90e1f5.png'}
              alt={product.name}
              className="max-h-full max-w-full object-contain"
              referrerPolicy="no-referrer"
            />
            {discountPercent > 0 && (
              <span className="absolute top-4 left-4 text-xs font-bold text-[#087A42] bg-[#E8F5EE] px-3 py-1 rounded-full border border-[#087A42]/20">
                {discountPercent}% OFF
              </span>
            )}
            <button
              onClick={() => toggleWishlist(product)}
              className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-colors ${
                isFavorited ? 'bg-[#FF7900] text-white' : 'bg-white/80 text-[#202720] hover:bg-white'
              } shadow-sm border border-[#E5E8E3]`}
              aria-label={isFavorited ? 'Remove from wishlist' : 'Save to wishlist'}
            >
              <Heart className={`w-5 h-5 ${isFavorited ? 'fill-white' : ''}`} />
            </button>
          </div>

          {/* Thumbnail Strip */}
          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-20 h-20 bg-white rounded-xl p-1.5 border transition-all shrink-0 cursor-pointer ${
                    selectedImage === idx
                      ? 'border-[#087A42] ring-2 ring-[#087A42]/20'
                      : 'border-[#E5E8E3] hover:border-slate-300'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Contiguous Purchase Module (Right) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E5E8E3] p-6 sm:p-8 space-y-6 shadow-xs">
          
          {/* Category & Rating */}
          <div className="flex items-center justify-between text-xs text-[#5E695E]">
            <span className="font-semibold text-[#087A42] uppercase tracking-wider">
              {product.category}
            </span>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-[#FF7900] text-[#FF7900]" />
              <span className="font-bold text-[#202720] tabular-nums">{product.rating || 4.8}</span>
              <span>({product.reviewCount || 12} reviews)</span>
            </div>
          </div>

          {/* Title & SKU */}
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#202720] leading-snug">
              {product.name}
            </h1>
            <p className="text-xs text-[#5E695E] mt-1">
              SKU: <span className="font-mono">{product.sku}</span>
            </p>
          </div>

          {/* Pricing */}
          <div className="p-4 bg-[#F7F8F6] rounded-2xl border border-[#E5E8E3] flex items-baseline justify-between">
            <div className="flex items-baseline gap-2.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#202720] tabular-nums">
                ₹{effectivePrice}
              </span>
              {product.salePrice && (
                <span className="text-sm text-slate-400 line-through tabular-nums">
                  ₹{product.price}
                </span>
              )}
            </div>
            <span className="text-xs font-semibold text-[#087A42]">
              Inclusive of all taxes
            </span>
          </div>

          {/* Incomplete / Sample Warning if marked */}
          {product.isIncomplete && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Sample Catalog Entry (Pending Specs)</p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  {product.incompleteNotes || 'Specifications awaiting manufacturer verification in Admin.'}
                </p>
              </div>
            </div>
          )}

          {/* Stock Availability */}
          <div className="text-xs">
            {isOutOfStock ? (
              <span className="text-rose-600 font-bold">Currently Out of Stock</span>
            ) : product.stock <= 5 ? (
              <span className="text-[#FF7900] font-bold">
                Hurry! Only {product.stock} units left in stock
              </span>
            ) : (
              <span className="text-[#087A42] font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                In Stock & Ready to Dispatch within 24 Hours
              </span>
            )}
          </div>

          {/* Quantity Selector & Action CTAs */}
          {!isOutOfStock && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-[#202720]">Quantity:</span>
                <div className="flex items-center border border-[#E5E8E3] rounded-lg bg-white">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-1.5 text-slate-500 hover:text-[#202720]"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="px-3 text-xs font-bold text-[#202720] tabular-nums">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                    className="px-3 py-1.5 text-slate-500 hover:text-[#202720] disabled:opacity-30"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleBuyNow}
                  className="w-full py-4 px-6 bg-[#087A42] hover:bg-[#066336] text-white text-sm sm:text-base font-bold rounded-xl flex items-center justify-center gap-2.5 shadow-md transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Zap className="w-5 h-5 text-[#FF7900]" />
                  <span>Buy Now — Proceed to Payment</span>
                </button>
              </div>
            </div>
          )}

          {/* Indian PIN Code Delivery Checker */}
          <div className="pt-4 border-t border-[#E5E8E3] space-y-2.5">
            <label className="text-xs font-bold text-[#202720] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#087A42]" />
              <span>Check Delivery & COD Availability</span>
            </label>
            <form onSubmit={handlePincodeCheck} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter 6-digit Indian PIN code"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/[^0-9]/g, ''))}
                className="flex-1 text-xs px-3 py-2 bg-[#F7F8F6] border border-[#E5E8E3] rounded-lg focus:outline-none focus:border-[#087A42] focus:bg-white"
              />
              <button
                type="submit"
                disabled={pincodeLoading || pincode.length !== 6}
                className="px-4 py-2 bg-[#202720] hover:bg-black text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors"
              >
                {pincodeLoading ? 'Checking...' : 'Check'}
              </button>
            </form>

            {pincodeResult && (
              <div className="p-3 bg-[#E8F5EE] border border-[#087A42]/20 rounded-xl text-xs text-[#087A42] space-y-1">
                <p className="font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Estimated Delivery: {pincodeResult.estimatedDays}</span>
                </p>
                <p className="text-[11px] text-[#5E695E]">
                  Serving {pincodeResult.state}. Cash on Delivery eligible.
                </p>
              </div>
            )}

            {pincodeError && (
              <p className="text-xs text-rose-600 font-medium">{pincodeError}</p>
            )}
          </div>

          {/* Genuine Guarantee Points */}
          <div className="pt-4 border-t border-[#E5E8E3] grid grid-cols-2 gap-3 text-xs text-[#5E695E]">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#087A42]" />
              <span>Free Delivery on All Products</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-[#087A42]" />
              <span>7-Day Replacement</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#FF7900]" />
              <span>100% Genuine Quality</span>
            </div>
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#FF7900]" />
              <span>Cash on Delivery</span>
            </div>
          </div>

        </div>

      </div>

      {/* Product Description & Specifications Tabs/Sections */}
      <div className="bg-white rounded-3xl border border-[#E5E8E3] p-6 sm:p-10 shadow-xs space-y-8">
        <div>
          <h2 className="text-lg font-bold text-[#202720] mb-3">Product Description</h2>
          <p className="text-sm text-[#5E695E] leading-relaxed max-w-3xl">
            {product.description}
          </p>
        </div>

        {/* Specifications Table */}
        <div className="pt-6 border-t border-[#E5E8E3]">
          <h3 className="text-base font-bold text-[#202720] mb-4">Specifications & Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
            {product.dimensions && (
              <div className="p-3 bg-[#F7F8F6] rounded-xl flex justify-between text-xs">
                <span className="text-[#5E695E] font-medium">Dimensions</span>
                <span className="text-[#202720] font-semibold">{product.dimensions}</span>
              </div>
            )}
            {product.material && (
              <div className="p-3 bg-[#F7F8F6] rounded-xl flex justify-between text-xs">
                <span className="text-[#5E695E] font-medium">Material</span>
                <span className="text-[#202720] font-semibold">{product.material}</span>
              </div>
            )}
            {Object.entries(product.specifications || {}).map(([key, val]) => (
              <div key={key} className="p-3 bg-[#F7F8F6] rounded-xl flex justify-between text-xs">
                <span className="text-[#5E695E] font-medium capitalize">
                  {key.replace(/([A-Z])/g, ' $1')}
                </span>
                <span className="text-[#202720] font-semibold">{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping & Delivery Terms */}
        <div className="pt-6 border-t border-[#E5E8E3]">
          <h3 className="text-base font-bold text-[#202720] mb-2">Shipping Information</h3>
          <p className="text-xs text-[#5E695E] leading-relaxed max-w-2xl">
            {product.shippingInfo || 'All orders are dispatched from our fulfillment center within 24-48 hours. Express delivery arrives within 3-5 business days across Indian postal codes.'}
          </p>
        </div>
      </div>

      {/* Mobile Sticky Buy Now Bottom Bar */}
      {!isOutOfStock && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#E5E8E3] p-3 lg:hidden shadow-[0_-4px_16px_rgba(0,0,0,0.08)] flex items-center justify-between gap-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="min-w-0">
            <span className="text-[11px] text-[#5E695E] block leading-none">Price ({quantity} {quantity === 1 ? 'item' : 'items'})</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-black text-[#202720] tabular-nums">
                ₹{effectivePrice * quantity}
              </span>
              {product.salePrice && (
                <span className="text-xs text-slate-400 line-through tabular-nums">
                  ₹{product.price * quantity}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                addToCart(product, quantity);
                setIsCartOpen(true);
              }}
              className="p-3 bg-[#F7F8F6] text-[#202720] hover:bg-[#E8F5EE] hover:text-[#087A42] rounded-xl border border-[#E5E8E3] transition-colors cursor-pointer"
              aria-label="Add to cart"
            >
              <ShoppingBag className="w-5 h-5" />
            </button>
            <button
              onClick={handleBuyNow}
              className="px-5 py-3 bg-[#087A42] hover:bg-[#066336] text-white text-xs sm:text-sm font-bold rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 transition-transform cursor-pointer"
            >
              <Zap className="w-4 h-4 text-[#FF7900]" />
              <span>Buy Now</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
