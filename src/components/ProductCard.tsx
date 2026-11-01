import React from 'react';
import { Heart, ShoppingBag, Eye, Star } from 'lucide-react';
import type { Product } from '../types/index.ts';
import { useCart } from '../context/CartContext.tsx';
import { useWishlist } from '../context/WishlistContext.tsx';

interface ProductCardProps {
  product: Product;
  onSelect: (slug: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const isFavorited = isInWishlist(product.id);
  const isOutOfStock = product.stock <= 0 || product.status === 'out_of_stock';
  const effectivePrice = product.salePrice ?? product.price;
  const discountPercent = product.salePrice
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0;

  return (
    <div className="group bg-white rounded-2xl border border-[#E5E8E3] overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
      
      {/* Product Image Container */}
      <div className="relative aspect-4/3 bg-[#F7F8F6] p-4 flex items-center justify-center overflow-hidden">
        <button
          onClick={() => onSelect(product.slug)}
          className="w-full h-full flex items-center justify-center cursor-pointer"
          aria-label={`View ${product.name}`}
        >
          <img
            src={product.images[0] || '/assets/aistudio/fankostore.logo_1f90e1f5.png'}
            alt={product.name}
            className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        </button>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-colors ${
            isFavorited
              ? 'bg-[#FF7900] text-white'
              : 'bg-white/80 text-[#202720] hover:bg-white hover:text-[#FF7900]'
          } shadow-xs`}
          aria-label={isFavorited ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart className={`w-4 h-4 ${isFavorited ? 'fill-white' : ''}`} />
        </button>

        {/* Quiet text discount / stock indicator */}
        {discountPercent > 0 && !isOutOfStock && (
          <span className="absolute top-3 left-3 text-[11px] font-bold text-[#087A42] bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-md border border-[#E5E8E3]">
            {discountPercent}% OFF
          </span>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center">
            <span className="text-xs font-semibold text-rose-600 bg-white px-2.5 py-1 rounded-md shadow-xs border border-rose-200">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Rating */}
          <div className="flex items-center justify-between text-xs text-[#5E695E] mb-1.5">
            <span>{product.category}</span>
            {product.rating > 0 && (
              <span className="flex items-center gap-1 font-medium text-[#202720]">
                <Star className="w-3.5 h-3.5 fill-[#FF7900] text-[#FF7900]" />
                <span className="tabular-nums">{product.rating}</span>
                <span className="text-[11px] text-[#5E695E]">({product.reviewCount})</span>
              </span>
            )}
          </div>

          {/* Title */}
          <button
            onClick={() => onSelect(product.slug)}
            className="text-left font-semibold text-sm text-[#202720] hover:text-[#087A42] transition-colors line-clamp-2 cursor-pointer mb-2"
          >
            {product.name}
          </button>
        </div>

        {/* Pricing & Add to Cart Action */}
        <div className="pt-2 border-t border-[#E5E8E3]/60 flex items-center justify-between gap-2 mt-auto">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-[#202720] tabular-nums">
                ₹{effectivePrice}
              </span>
              {product.salePrice && (
                <span className="text-xs text-slate-400 line-through tabular-nums">
                  ₹{product.price}
                </span>
              )}
            </div>
            {product.stock > 0 && product.stock <= 5 && (
              <p className="text-[10px] text-[#FF7900] font-medium">Only {product.stock} left!</p>
            )}
          </div>

          <button
            onClick={() => addToCart(product, 1)}
            disabled={isOutOfStock}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
              isOutOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-[#087A42] text-white hover:bg-[#066336] active:scale-95 shadow-xs'
            }`}
            aria-label={`Order ${product.name}`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Order Now</span>
          </button>
        </div>

      </div>
    </div>
  );
};
