import React from 'react';
import { Home, Grid, Package, Heart, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';
import { useWishlist } from '../context/WishlistContext.tsx';

interface MobileBottomNavProps {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ currentView, onNavigate }) => {
  const { itemCount, setIsCartOpen } = useCart();
  const { itemCount: wishlistCount } = useWishlist();

  // Hide on checkout and admin screens to maintain focus
  if (currentView === 'checkout' || currentView === 'admin') {
    return null;
  }

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      isActive: currentView === 'home',
      onClick: () => onNavigate('home'),
    },
    {
      id: 'shop',
      label: 'Shop',
      icon: Grid,
      isActive: currentView === 'shop',
      onClick: () => onNavigate('shop'),
    },
    {
      id: 'track-order',
      label: 'Track',
      icon: Package,
      isActive: currentView === 'track-order',
      onClick: () => onNavigate('track-order'),
    },
    {
      id: 'wishlist',
      label: 'Wishlist',
      icon: Heart,
      badge: wishlistCount,
      isActive: currentView === 'wishlist',
      onClick: () => onNavigate('wishlist'),
    },
    {
      id: 'cart',
      label: 'Cart',
      icon: ShoppingBag,
      badge: itemCount,
      isActive: currentView === 'cart',
      onClick: () => setIsCartOpen(true),
    },
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5E8E3] lg:hidden shadow-[0_-4px_16px_rgba(0,0,0,0.04)] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="grid grid-cols-5 h-14 items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;

          return (
            <button
              key={item.id}
              onClick={item.onClick}
              className={`flex flex-col items-center justify-center h-full w-full relative transition-colors cursor-pointer select-none active:scale-95 ${
                active ? 'text-[#087A42]' : 'text-[#5E695E] hover:text-[#202720]'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${active ? 'scale-110 stroke-[2.3]' : 'stroke-[1.8]'}`}
                />
                {Boolean(item.badge && item.badge > 0) && (
                  <span
                    className={`absolute -top-1 -right-2 min-w-4 h-4 px-1 rounded-full text-[10px] font-black text-white flex items-center justify-center ${
                      item.id === 'wishlist' ? 'bg-[#FF7900]' : 'bg-[#087A42]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] tracking-tight mt-0.5 leading-none ${
                  active ? 'font-bold text-[#087A42]' : 'font-medium text-[#5E695E]'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
