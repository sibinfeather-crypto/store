import React from 'react';
import { Mail, Phone, MessageSquare, Shield, Truck, RefreshCw, Lock } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string, param?: string) => void;
  whatsappNumber?: string;
  supportEmail?: string;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  whatsappNumber = '919876543210',
  supportEmail = 'support@fankostore.in',
}) => {
  return (
    <footer className="bg-white border-t border-[#E5E8E3] pt-12 pb-8 mt-16 text-sm text-[#5E695E]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Trust Badges Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-12 border-b border-[#E5E8E3]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#E8F5EE] flex items-center justify-center text-[#087A42] shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-xs text-[#202720]">Pan-India Delivery</p>
              <p className="text-[11px] text-[#5E695E]">Free on orders above ₹499</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FFF4E5] flex items-center justify-center text-[#FF7900] shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-xs text-[#202720]">Secure Payment</p>
              <p className="text-[11px] text-[#5E695E]">Razorpay & UPI Protected</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#E8F5EE] flex items-center justify-center text-[#087A42] shrink-0">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-xs text-[#202720]">7-Day Replacements</p>
              <p className="text-[11px] text-[#5E695E]">For damaged or defective items</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FFF4E5] flex items-center justify-center text-[#FF7900] shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-xs text-[#202720]">Cash on Delivery</p>
              <p className="text-[11px] text-[#5E695E]">Pay at your doorstep</p>
            </div>
          </div>
        </div>

        {/* Main Footer Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 py-12 border-b border-[#E5E8E3]">
          
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-4">
            <img
              src="/assets/aistudio/fankostore.logo_1f90e1f5.png"
              alt="FanKO Store Logo"
              className="h-12 w-auto object-contain"
            />
            <p className="text-xs text-[#5E695E] leading-relaxed max-w-sm">
              <strong className="text-[#202720]">FanKO Store</strong> offers thoughtfully designed kitchen essentials, home organizers, storage solutions, and everyday lifestyle accessories tailored for modern Indian homes.
            </p>
            <div className="space-y-1.5 text-xs">
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#087A42]" />
                <a href={`mailto:${supportEmail}`} className="hover:text-[#087A42] transition-colors">
                  {supportEmail}
                </a>
              </p>
              <p className="flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-[#087A42]" />
                <a
                  href={`https://wa.me/${whatsappNumber}?text=Hi%20FanKO%20Store%2C%20I%20have%20an%20inquiry`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#087A42] transition-colors"
                >
                  WhatsApp Support (+{whatsappNumber})
                </a>
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-[#202720] uppercase tracking-wider mb-3">
              Shop & Explore
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('shop')}
                  className="hover:text-[#087A42] transition-colors cursor-pointer"
                >
                  Shop All Products
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('kitchen')}
                  className="hover:text-[#087A42] transition-colors cursor-pointer"
                >
                  Kitchen Essentials
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('organization')}
                  className="hover:text-[#087A42] transition-colors cursor-pointer"
                >
                  Home Organization
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('storage')}
                  className="hover:text-[#087A42] transition-colors cursor-pointer"
                >
                  Storage Solutions
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('cleaning')}
                  className="hover:text-[#087A42] transition-colors cursor-pointer"
                >
                  Cleaning Accessories
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('cart')}
                  className="hover:text-[#087A42] transition-colors cursor-pointer font-medium text-[#087A42]"
                >
                  Shopping Cart
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('wishlist')}
                  className="hover:text-[#087A42] transition-colors cursor-pointer"
                >
                  My Wishlist
                </button>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="text-xs font-bold text-[#202720] uppercase tracking-wider mb-3">
              Customer Care
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('track-order')}
                  className="hover:text-[#087A42] transition-colors cursor-pointer font-medium text-[#087A42]"
                >
                  Track Your Order
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('account')}
                  className="hover:text-[#087A42] transition-colors cursor-pointer"
                >
                  My Orders & Profile
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('faqs')}
                  className="hover:text-[#087A42] transition-colors cursor-pointer"
                >
                  Frequently Asked Questions
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('contact')}
                  className="hover:text-[#087A42] transition-colors cursor-pointer"
                >
                  Contact Support
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('about')}
                  className="hover:text-[#087A42] transition-colors cursor-pointer"
                >
                  About FanKO Store
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('admin')}
                  className="hover:text-[#FF7900] transition-colors cursor-pointer text-slate-400"
                >
                  Admin Portal
                </button>
              </li>
            </ul>
          </div>

          {/* Store Policies */}
          <div>
            <h4 className="text-xs font-bold text-[#202720] uppercase tracking-wider mb-3">
              Policies
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('shipping-policy')}
                  className="hover:text-[#087A42] transition-colors cursor-pointer"
                >
                  Shipping Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('return-refund-policy')}
                  className="hover:text-[#087A42] transition-colors cursor-pointer"
                >
                  Return & Refund Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('privacy-policy')}
                  className="hover:text-[#087A42] transition-colors cursor-pointer"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('terms-and-conditions')}
                  className="hover:text-[#087A42] transition-colors cursor-pointer"
                >
                  Terms & Conditions
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Payment Methods */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#5E695E]">
          <p>© {new Date().getFullYear()} FanKO Store. All rights reserved. Smart Products. Better Living.</p>
          
          <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
            <span>Accepted Payments:</span>
            <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-semibold">Razorpay</span>
            <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-semibold">UPI</span>
            <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-semibold">Cards</span>
            <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-semibold">NetBanking</span>
            <span className="px-2 py-0.5 bg-slate-100 rounded text-[#087A42] font-semibold">COD</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
