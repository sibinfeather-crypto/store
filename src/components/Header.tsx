import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ShoppingBag,
  Heart,
  Menu,
  X,
  Package,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';
import { useWishlist } from '../context/WishlistContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import type { Product } from '../types/index.ts';

interface HeaderProps {
  currentView: string;
  currentParam?: string;
  onNavigate: (view: string, param?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, currentParam = '', onNavigate }) => {
  const { itemCount, setIsCartOpen } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const { isAdminLoggedIn } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Live search debounced
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await api.getProducts({ search: searchQuery });
        setSearchResults(results.slice(0, 5));
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate('shop', `search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };

  const handleProductSelect = (slug: string) => {
    onNavigate('product', slug);
    setSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E8E3] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-3 lg:gap-6">
          
          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-[#202720] hover:text-[#087A42] transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Zone 1: Brand Wordmark / Logo */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 cursor-pointer shrink-0"
            aria-label="FanKO Store Home"
          >
            <img
              src="/assets/aistudio/fankostore.logo_1f90e1f5.png"
              alt="FanKO Store"
              className="h-10 sm:h-12 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </button>

          {/* Zone 2: Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#202720]">
            <button
              onClick={() => onNavigate('home')}
              className={`hover:text-[#087A42] transition-colors whitespace-nowrap cursor-pointer py-1 ${
                currentView === 'home' ? 'text-[#087A42] font-bold border-b-2 border-[#087A42]' : ''
              }`}
            >
              Home
            </button>
            <button
              onClick={() => onNavigate('shop')}
              className={`hover:text-[#087A42] transition-colors whitespace-nowrap cursor-pointer py-1 ${
                currentView === 'shop' ? 'text-[#087A42] font-bold border-b-2 border-[#087A42]' : ''
              }`}
            >
              Shop All
            </button>
            <button
              onClick={() => onNavigate('track-order')}
              className={`hover:text-[#087A42] transition-colors whitespace-nowrap cursor-pointer py-1 flex items-center gap-1.5 ${
                currentView === 'track-order' ? 'text-[#087A42] font-bold border-b-2 border-[#087A42]' : 'text-[#5E695E]'
              }`}
            >
              <Package className="w-4 h-4 text-[#087A42]" />
              <span>Track Order</span>
            </button>
            <button
              onClick={() => onNavigate('about')}
              className={`hover:text-[#087A42] transition-colors whitespace-nowrap cursor-pointer py-1 ${
                currentView === 'about' ? 'text-[#087A42] font-bold border-b-2 border-[#087A42]' : 'text-[#5E695E]'
              }`}
            >
              About Us
            </button>
            <button
              onClick={() => onNavigate('contact')}
              className={`hover:text-[#087A42] transition-colors whitespace-nowrap cursor-pointer py-1 ${
                currentView === 'contact' ? 'text-[#087A42] font-bold border-b-2 border-[#087A42]' : 'text-[#5E695E]'
              }`}
            >
              Contact
            </button>
          </nav>

          {/* Zone 3: Actions & Search */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Search Trigger / Input */}
            <div className="relative">
              <button
                onClick={() => {
                  setSearchOpen(!searchOpen);
                  setTimeout(() => searchInputRef.current?.focus(), 100);
                }}
                className="p-2 text-[#202720] hover:text-[#087A42] rounded-full hover:bg-[#F7F8F6] transition-colors"
                aria-label="Search catalog"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Search Dropdown Modal */}
              {searchOpen && (
                <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white border border-[#E5E8E3] rounded-xl shadow-xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                    <Search className="w-4 h-4 text-[#5E695E] absolute left-3" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search kitchen, organizers, cleaning..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 text-sm bg-[#F7F8F6] border border-[#E5E8E3] rounded-lg focus:outline-none focus:border-[#087A42] focus:bg-white"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 text-xs text-[#5E695E] hover:text-[#202720]"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </form>

                  {/* Search Results Preview */}
                  {searchQuery.length >= 2 && (
                    <div className="mt-3 divide-y divide-[#E5E8E3] max-h-72 overflow-y-auto">
                      {isSearching ? (
                        <div className="py-4 text-center text-xs text-[#5E695E]">Searching catalog...</div>
                      ) : searchResults.length > 0 ? (
                        <>
                          <p className="text-[11px] font-semibold text-[#5E695E] uppercase tracking-wider py-1 px-1">
                            Matching Products
                          </p>
                          {searchResults.map((p) => (
                            <button
                              key={p.id}
                              onClick={() => handleProductSelect(p.slug)}
                              className="w-full flex items-center gap-3 p-2 text-left hover:bg-[#F7F8F6] rounded-lg transition-colors group cursor-pointer"
                            >
                              <img
                                src={p.images[0]}
                                alt={p.name}
                                className="w-10 h-10 object-contain rounded bg-[#F7F8F6] p-0.5 border border-[#E5E8E3]"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-[#202720] group-hover:text-[#087A42] truncate">
                                  {p.name}
                                </p>
                                <p className="text-xs text-[#5E695E]">
                                  ₹{p.salePrice ?? p.price}
                                  {p.salePrice && (
                                    <span className="line-through ml-1.5 text-slate-400">₹{p.price}</span>
                                  )}
                                </p>
                              </div>
                            </button>
                          ))}
                          <button
                            onClick={handleSearchSubmit}
                            className="w-full mt-2 py-2 text-center text-xs font-semibold text-[#087A42] hover:bg-[#E8F5EE] rounded-lg transition-colors cursor-pointer"
                          >
                            View all results for "{searchQuery}"
                          </button>
                        </>
                      ) : (
                        <div className="py-4 text-center text-xs text-[#5E695E]">
                          No products found for "{searchQuery}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Wishlist */}
            <button
              onClick={() => onNavigate('wishlist')}
              className="relative p-2 text-[#202720] hover:text-[#087A42] rounded-full hover:bg-[#F7F8F6] transition-colors"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#FF7900] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-[#202720] hover:text-[#087A42] rounded-full hover:bg-[#F7F8F6] transition-colors"
              aria-label="Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#087A42] text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>

            {/* Direct Admin Portal Button */}
            <button
              onClick={() => onNavigate('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentView === 'admin'
                  ? 'bg-[#087A42] text-white shadow-xs'
                  : 'bg-[#FFF4E5] hover:bg-[#FFE8CC] text-[#FF7900] border border-[#FF7900]/30 shadow-xs'
              }`}
              title="Open Admin Portal"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex">
          <div className="w-4/5 max-w-sm bg-white h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#E5E8E3]">
                <img
                  src="/assets/aistudio/fankostore.logo_1f90e1f5.png"
                  alt="FanKO Store"
                  className="h-9 w-auto"
                />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 text-[#5E695E] hover:text-[#202720]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-4 space-y-1">
                <button
                  onClick={() => {
                    onNavigate('home');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2 px-3 rounded-lg text-sm font-semibold hover:bg-[#F7F8F6] text-[#202720]"
                >
                  Home
                </button>
                <button
                  onClick={() => {
                    onNavigate('shop');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2 px-3 rounded-lg text-sm font-semibold hover:bg-[#F7F8F6] text-[#202720]"
                >
                  Shop All Products
                </button>

                <button
                  onClick={() => {
                    onNavigate('track-order');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 py-2.5 px-3 rounded-lg text-sm font-semibold hover:bg-[#F7F8F6] text-[#202720]"
                >
                  <Package className="w-4 h-4 text-[#087A42]" />
                  <span>Track Your Order</span>
                </button>

                <div className="pt-2 border-t border-[#E5E8E3] mt-2">
                  <button
                    onClick={() => {
                      onNavigate('cart');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 py-2 px-3 rounded-lg text-sm text-[#202720] hover:bg-[#F7F8F6]"
                  >
                    <ShoppingBag className="w-4 h-4 text-[#087A42]" />
                    <span>Shopping Cart ({itemCount})</span>
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('wishlist');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 py-2 px-3 rounded-lg text-sm text-[#202720] hover:bg-[#F7F8F6]"
                  >
                    <Heart className="w-4 h-4 text-[#FF7900]" />
                    <span>Wishlist ({wishlistCount})</span>
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('about');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left py-2 px-3 rounded-lg text-sm font-medium hover:bg-[#F7F8F6] text-[#202720]"
                  >
                    About Us
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('contact');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left py-2 px-3 rounded-lg text-sm font-medium hover:bg-[#F7F8F6] text-[#202720]"
                  >
                    Contact Support
                  </button>
                </div>

                <div className="pt-3 border-t border-[#E5E8E3] mt-3">
                  <button
                    onClick={() => {
                      onNavigate('track-order');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 py-2.5 px-3 rounded-lg text-sm text-[#202720] hover:bg-[#F7F8F6]"
                  >
                    <Package className="w-4 h-4 text-[#087A42]" />
                    <span>Track Your Order</span>
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('admin');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 py-2.5 px-3 rounded-lg text-sm text-[#202720] hover:bg-[#F7F8F6]"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#FF7900]" />
                    <span>Admin Dashboard</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E5E8E3] text-xs text-[#5E695E]">
              <p className="font-semibold text-[#202720]">FanKO Store India</p>
              <p>Smart Products. Better Living.</p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
