import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  ShoppingBag,
  Heart,
  Menu,
  X,
  Package,
  ShieldCheck,
  ChevronRight,
  Home,
  Grid,
  Phone,
  Info
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

  // Prevent background body scroll when mobile menu is active
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

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

  const navigateAndClose = (view: string, param?: string) => {
    setMobileMenuOpen(false);
    onNavigate(view, param);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E8E3] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 gap-3 lg:gap-6">
            
            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2.5 rounded-lg text-[#202720] hover:text-[#087A42] hover:bg-[#F7F8F6] active:bg-[#E8F5EE] transition-colors cursor-pointer"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
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
                  currentView === 'shop' && !currentParam ? 'text-[#087A42] font-bold border-b-2 border-[#087A42]' : ''
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
                  className="p-2 text-[#202720] hover:text-[#087A42] rounded-full hover:bg-[#F7F8F6] transition-colors cursor-pointer"
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
                          className="absolute right-2.5 text-xs text-[#5E695E] hover:text-[#202720] cursor-pointer"
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
                className="relative p-2 text-[#202720] hover:text-[#087A42] rounded-full hover:bg-[#F7F8F6] transition-colors cursor-pointer"
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
                className="relative p-2.5 text-[#202720] hover:text-[#087A42] rounded-full hover:bg-[#F7F8F6] transition-colors cursor-pointer"
                aria-label="Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute top-0 right-0 bg-[#087A42] text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer rendered via createPortal directly into document.body to avoid sticky/backdrop-filter containment */}
      {mobileMenuOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] lg:hidden flex" role="dialog" aria-modal="true">
          {/* Backdrop Overlay */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity cursor-pointer animate-in fade-in duration-200"
          />

          {/* Drawer Slide-in Panel */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-4/5 max-w-sm bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-left duration-200"
          >
            <div>
              {/* Drawer Top Header with Brand Logo & Close Button */}
              <div className="flex items-center justify-between p-4 border-b border-[#E5E8E3] bg-[#F7F8F6]/80 sticky top-0 z-10 backdrop-blur-sm">
                <button
                  onClick={() => navigateAndClose('home')}
                  className="flex items-center gap-2 cursor-pointer text-left"
                >
                  <img
                    src="/assets/aistudio/fankostore.logo_1f90e1f5.png"
                    alt="FanKO Store"
                    className="h-9 w-auto object-contain"
                  />
                </button>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-[#5E695E] hover:text-[#202720] hover:bg-white rounded-lg transition-colors cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Items */}
              <div className="p-4 space-y-4">
                
                {/* Main Views */}
                <div className="space-y-1">
                  <button
                    onClick={() => navigateAndClose('home')}
                    className={`w-full flex items-center justify-between py-2.5 px-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                      currentView === 'home'
                        ? 'bg-[#E8F5EE] text-[#087A42] font-bold'
                        : 'text-[#202720] hover:bg-[#F7F8F6]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Home className="w-4 h-4 text-[#087A42]" />
                      <span>Home</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => navigateAndClose('shop')}
                    className={`w-full flex items-center justify-between py-2.5 px-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                      currentView === 'shop' && !currentParam
                        ? 'bg-[#E8F5EE] text-[#087A42] font-bold'
                        : 'text-[#202720] hover:bg-[#F7F8F6]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Grid className="w-4 h-4 text-[#087A42]" />
                      <span>Shop All Products</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => navigateAndClose('track-order')}
                    className={`w-full flex items-center justify-between py-2.5 px-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                      currentView === 'track-order'
                        ? 'bg-[#E8F5EE] text-[#087A42] font-bold'
                        : 'text-[#202720] hover:bg-[#F7F8F6]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Package className="w-4 h-4 text-[#087A42]" />
                      <span>Track Order</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                </div>



                {/* Account & Activity Section */}
                <div className="pt-2 border-t border-[#E5E8E3] space-y-1">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setIsCartOpen(true);
                    }}
                    className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl text-sm font-semibold hover:bg-[#F7F8F6] text-[#202720] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <ShoppingBag className="w-4 h-4 text-[#087A42]" />
                      <span>Shopping Cart</span>
                    </div>
                    {itemCount > 0 ? (
                      <span className="bg-[#087A42] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {itemCount}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Empty</span>
                    )}
                  </button>

                  <button
                    onClick={() => navigateAndClose('wishlist')}
                    className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl text-sm font-semibold hover:bg-[#F7F8F6] text-[#202720] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Heart className="w-4 h-4 text-[#FF7900]" />
                      <span>Saved Wishlist</span>
                    </div>
                    {wishlistCount > 0 ? (
                      <span className="bg-[#FF7900] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {wishlistCount}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">0</span>
                    )}
                  </button>

                  <button
                    onClick={() => navigateAndClose('about')}
                    className="w-full flex items-center justify-between py-2 px-3 rounded-xl text-sm text-[#202720] hover:bg-[#F7F8F6] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Info className="w-4 h-4 text-[#5E695E]" />
                      <span>About Us</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => navigateAndClose('contact')}
                    className="w-full flex items-center justify-between py-2 px-3 rounded-xl text-sm text-[#202720] hover:bg-[#F7F8F6] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Phone className="w-4 h-4 text-[#5E695E]" />
                      <span>Contact & Support</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                </div>

                {/* Admin Dashboard shortcut */}
                <div className="pt-2 border-t border-[#E5E8E3]">
                  <button
                    onClick={() => navigateAndClose('admin')}
                    className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl text-xs font-bold bg-[#FFF4E5] hover:bg-[#FFE8CC] text-[#FF7900] border border-[#FF7900]/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#FF7900]" />
                      <span>Admin Management Portal</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#FF7900]" />
                  </button>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-[#E5E8E3] bg-[#F7F8F6] text-xs text-[#5E695E] space-y-1">
              <p className="font-bold text-[#202720]">FanKO Store India</p>
              <p className="text-[11px] leading-relaxed">Smart Products. Better Living. Fast dispatch across India.</p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
