import React from 'react';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext.tsx';
import { useCart } from '../context/CartContext.tsx';

interface WishlistViewProps {
  onNavigate: (view: string, param?: string) => void;
}

export const WishlistView: React.FC<WishlistViewProps> = ({ onNavigate }) => {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleMoveToCart = (product: any) => {
    addToCart(product, 1);
    removeFromWishlist(product.id);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <div className="text-xs text-[#5E695E] mb-2 flex items-center gap-1.5">
          <button onClick={() => onNavigate('home')} className="hover:text-[#087A42]">Home</button>
          <span>/</span>
          <span className="text-[#202720] font-semibold">Wishlist</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#202720]">
          My Wishlist ({wishlist.length})
        </h1>
        <p className="text-xs sm:text-sm text-[#5E695E] mt-1">
          Saved smart essentials you have an eye on.
        </p>
      </div>

      {wishlist.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E5E8E3] p-12 text-center space-y-4 max-w-lg mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-full bg-[#FFF4E5] text-[#FF7900] flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8" />
          </div>
          <h2 className="text-base font-bold text-[#202720]">Your Wishlist is Empty</h2>
          <p className="text-xs text-[#5E695E]">
            Save products you like while browsing and easily add them to your cart later.
          </p>
          <button
            onClick={() => onNavigate('shop')}
            className="px-5 py-2.5 bg-[#087A42] hover:bg-[#066336] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            Explore Catalog
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {wishlist.map((prod) => (
            <div
              key={prod.id}
              className="bg-white rounded-2xl border border-[#E5E8E3] p-4 flex flex-col justify-between shadow-xs transition-all hover:shadow-md"
            >
              <div>
                <div
                  onClick={() => onNavigate('product', prod.slug)}
                  className="aspect-4/3 bg-[#F7F8F6] rounded-xl p-3 flex items-center justify-center mb-3 cursor-pointer"
                >
                  <img
                    src={prod.images[0] || '/assets/aistudio/fankostore.logo_1f90e1f5.png'}
                    alt={prod.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                <div className="text-xs text-[#5E695E] mb-1">{prod.category}</div>
                <h3
                  onClick={() => onNavigate('product', prod.slug)}
                  className="text-xs font-bold text-[#202720] hover:text-[#087A42] cursor-pointer line-clamp-2 mb-2"
                >
                  {prod.name}
                </h3>

                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-sm font-bold text-[#202720] tabular-nums">
                    ₹{prod.salePrice ?? prod.price}
                  </span>
                  {prod.salePrice && (
                    <span className="text-xs text-slate-400 line-through tabular-nums">
                      ₹{prod.price}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-[#E5E8E3] flex items-center gap-2">
                <button
                  onClick={() => handleMoveToCart(prod)}
                  className="flex-1 py-2 px-3 bg-[#087A42] hover:bg-[#066336] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Move to Cart</span>
                </button>
                <button
                  onClick={() => removeFromWishlist(prod.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 transition-colors rounded-lg border border-[#E5E8E3]"
                  aria-label="Remove from wishlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
