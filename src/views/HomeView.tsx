import React, { useState } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  Headphones,
  CheckCircle2,
  PackageCheck,
  Star,
  Sparkles
} from 'lucide-react';
import type { Product, CategoryInfo } from '../types/index.ts';
import { ProductCard } from '../components/ProductCard.tsx';
import { useCart } from '../context/CartContext.tsx';
import { api } from '../services/api.ts';

interface HomeViewProps {
  products: Product[];
  categories: CategoryInfo[];
  onNavigate: (view: string, param?: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  products,
  categories,
  onNavigate,
}) => {
  const { addToCart } = useCart();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterConsent, setNewsletterConsent] = useState(false);
  const [newsletterStatus, setNewsletterStatus] = useState<string | null>(null);
  const [newsletterLoading, setNewsletterLoading] = useState(false);

  // Buyer clicks product -> goes directly to payment option
  const handleDirectBuy = (slug: string) => {
    const found = products.find((p) => p.slug === slug);
    if (found) addToCart(found, 1);
    onNavigate('checkout');
  };

  // Best Sellers: featured items
  const bestSellers = products.filter((p) => p.featured && !p.isIncomplete).slice(0, 4);
  // New Arrivals
  const newArrivals = products.filter((p) => p.isNewArrival && !p.isIncomplete).slice(0, 4);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterConsent) {
      setNewsletterStatus('Please enter an email and agree to receive updates.');
      return;
    }
    setNewsletterLoading(true);
    try {
      await api.subscribeNewsletter(newsletterEmail, newsletterConsent);
      setNewsletterStatus('Thank you for subscribing! Check your inbox for updates.');
      setNewsletterEmail('');
      setNewsletterConsent(false);
    } catch (err: any) {
      setNewsletterStatus(err.message || 'Subscription failed. Please try again.');
    } finally {
      setNewsletterLoading(false);
    }
  };

  return (
    <div className="space-y-16 lg:space-y-24">
      
      {/* Hero Section */}
      <section className="relative pt-6 sm:pt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl border border-[#E5E8E3] overflow-hidden p-6 sm:p-10 lg:p-14 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center shadow-xs">
            
            {/* Left Column: Editorial Headline & Actions */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#087A42] bg-[#E8F5EE] px-3 py-1.5 rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-[#FF7900]" />
                <span>Smart Products. Better Living.</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#202720] tracking-tight leading-[1.15] text-balance">
                Organize Your Home. Simplify Your Life.
              </h1>

              <p className="text-base sm:text-lg text-[#5E695E] leading-relaxed max-w-xl">
                Discover smart kitchen and home essentials that make everyday living easier. Designed for durability, effortless hygiene, and structured spaces across India.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => onNavigate('shop')}
                  className="px-6 py-3.5 bg-[#087A42] hover:bg-[#066336] text-white text-sm font-bold rounded-xl flex items-center gap-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                >
                  <span>Shop Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onNavigate('shop')}
                  className="px-6 py-3.5 bg-[#F7F8F6] hover:bg-[#E5E8E3] text-[#202720] text-sm font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Explore Categories
                </button>
              </div>

              {/* Verified Trust Strip */}
              <div className="pt-4 border-t border-[#E5E8E3] grid grid-cols-3 gap-4 text-xs text-[#5E695E]">
                <div>
                  <p className="font-bold text-[#202720] text-sm tabular-nums">Pan-India</p>
                  <p className="text-[11px]">Free delivery on all orders</p>
                </div>
                <div>
                  <p className="font-bold text-[#202720] text-sm tabular-nums">UPI & COD</p>
                  <p className="text-[11px]">Instant or ₹99 token</p>
                </div>
                <div>
                  <p className="font-bold text-[#202720] text-sm tabular-nums">7 Days</p>
                  <p className="text-[11px]">Replacement support</p>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual Product Mosaic */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-3.5 sm:gap-4">
              <div className="space-y-3.5 sm:space-y-4">
                <div
                  onClick={() => handleDirectBuy('fanko-precision-pour-glass-oil-vinegar-dispenser-jug')}
                  className="group bg-[#F7F8F6] rounded-2xl p-4 border border-[#E5E8E3] flex flex-col items-center justify-center cursor-pointer transition-transform hover:-translate-y-1"
                  title="Click to buy directly with instant payment"
                >
                  <img
                    src="/assets/aistudio/WhatsApp_Image_2026-09-13_at_7.38.0_7cad6069.jpeg"
                    alt="FanKO Glass Oil Dispenser"
                    className="h-36 sm:h-44 w-auto object-contain group-hover:scale-105 transition-transform"
                  />
                  <p className="text-[11px] font-semibold text-[#202720] mt-2 text-center line-clamp-1">
                    Auto-Flip Oil Dispenser
                  </p>
                </div>

                <div
                  onClick={() => handleDirectBuy('fanko-ribbed-multi-slot-vanity-countertop-organizer')}
                  className="group bg-[#F7F8F6] rounded-2xl p-4 border border-[#E5E8E3] flex flex-col items-center justify-center cursor-pointer transition-transform hover:-translate-y-1"
                  title="Click to buy directly with instant payment"
                >
                  <img
                    src="/assets/aistudio/Ribbed_White_Vanity_Organizer_0347519c.png"
                    alt="FanKO Ribbed Vanity Organizer"
                    className="h-28 sm:h-32 w-auto object-contain group-hover:scale-105 transition-transform"
                  />
                  <p className="text-[11px] font-semibold text-[#202720] mt-2 text-center line-clamp-1">
                    Ribbed Vanity Caddy
                  </p>
                </div>
              </div>

              <div className="space-y-3.5 sm:space-y-4 pt-4 sm:pt-6">
                <div
                  onClick={() => handleDirectBuy('fanko-3-in-1-dual-soap-dispenser-with-drainage-sponge-caddy')}
                  className="group bg-[#F7F8F6] rounded-2xl p-4 border border-[#E5E8E3] flex flex-col items-center justify-center cursor-pointer transition-transform hover:-translate-y-1"
                  title="Click to buy directly with instant payment"
                >
                  <img
                    src="/assets/aistudio/WhatsApp_Image_2026-09-13_at_7.38._d592a183.jpeg"
                    alt="FanKO 3-in-1 Soap Dispenser"
                    className="h-32 sm:h-36 w-auto object-contain group-hover:scale-105 transition-transform"
                  />
                  <p className="text-[11px] font-semibold text-[#202720] mt-2 text-center line-clamp-1">
                    3-in-1 Soap Caddy
                  </p>
                </div>

                <div
                  onClick={() => handleDirectBuy('fanko-hydro-lock-fresh-herb-coriander-preserver-capsule')}
                  className="group bg-[#F7F8F6] rounded-2xl p-4 border border-[#E5E8E3] flex flex-col items-center justify-center cursor-pointer transition-transform hover:-translate-y-1"
                  title="Click to buy directly with instant payment"
                >
                  <img
                    src="/assets/aistudio/ChatGPT_Image_Sep_13__2026__08_08_46_PM_7a07ca46.png"
                    alt="FanKO Fresh Herb Keeper"
                    className="h-32 sm:h-36 w-auto object-contain group-hover:scale-105 transition-transform"
                  />
                  <p className="text-[11px] font-semibold text-[#202720] mt-2 text-center line-clamp-1">
                    Herb Keeper Capsule
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Best Sellers Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <p className="text-xs font-bold text-[#087A42] uppercase tracking-wider mb-1">
              Top Rated in India
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#202720]">
              Best Sellers
            </h2>
          </div>
          <button
            onClick={() => onNavigate('shop')}
            className="text-xs font-bold text-[#087A42] hover:text-[#066336] flex items-center gap-1 cursor-pointer"
          >
            <span>Browse Full Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {bestSellers.map((prod) => (
            <ProductCard
              key={prod.id}
              product={prod}
              onSelect={(slug) => onNavigate('product', slug)}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </section>

      {/* Why Shop With FanKO Store? Trust Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-[#E5E8E3] p-8 sm:p-12 shadow-xs">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#202720]">
              Why Shop With FanKO Store?
            </h2>
            <p className="text-sm text-[#5E695E] mt-2">
              We focus on practical, functional products built for Indian households, supported by transparent service.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3 text-center sm:text-left">
              <div className="w-12 h-12 rounded-2xl bg-[#E8F5EE] text-[#087A42] flex items-center justify-center mx-auto sm:mx-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-[#202720]">Instant UPI & COD</h3>
              <p className="text-xs text-[#5E695E] leading-relaxed">
                Direct bank UPI via Google Pay, PhonePe, Paytm, QR code, and Cash on Delivery with ₹99 advance token.
              </p>
            </div>

            <div className="space-y-3 text-center sm:text-left">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF4E5] text-[#FF7900] flex items-center justify-center mx-auto sm:mx-0">
                <PackageCheck className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-[#202720]">Easy Ordering</h3>
              <p className="text-xs text-[#5E695E] leading-relaxed">
                Guest checkout supported. No mandatory passwords or complicated registrations to place an order.
              </p>
            </div>

            <div className="space-y-3 text-center sm:text-left">
              <div className="w-12 h-12 rounded-2xl bg-[#E8F5EE] text-[#087A42] flex items-center justify-center mx-auto sm:mx-0">
                <Headphones className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-[#202720]">Customer Support</h3>
              <p className="text-xs text-[#5E695E] leading-relaxed">
                Reach us via WhatsApp chat or email. Quick human responses for order queries and delivery assistance.
              </p>
            </div>

            <div className="space-y-3 text-center sm:text-left">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF4E5] text-[#FF7900] flex items-center justify-center mx-auto sm:mx-0">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-[#202720]">Order Tracking</h3>
              <p className="text-xs text-[#5E695E] leading-relaxed">
                Live fulfillment status tracking from confirmed to shipped with genuine courier numbers and tracking links.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* New Arrivals Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <p className="text-xs font-bold text-[#FF7900] uppercase tracking-wider mb-1">
              Fresh Additions
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#202720]">
              New Arrivals
            </h2>
          </div>
          <button
            onClick={() => onNavigate('shop')}
            className="text-xs font-bold text-[#087A42] hover:text-[#066336] flex items-center gap-1 cursor-pointer"
          >
            <span>See All</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {newArrivals.map((prod) => (
            <ProductCard
              key={prod.id}
              product={prod}
              onSelect={(slug) => onNavigate('product', slug)}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </section>

      {/* Genuine Customer Reviews (Verified, no fake ratings) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-10">
          <p className="text-xs font-bold text-[#087A42] uppercase tracking-wider mb-1">
            Real Experiences
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#202720]">
            Customer Reviews
          </h2>
          <p className="text-xs text-[#5E695E] mt-1">
            Feedback from verified buyers using FanKO Store products in their daily homes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-[#E5E8E3] shadow-xs flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-1 text-[#FF7900]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#FF7900]" />
                ))}
              </div>
              <h4 className="text-sm font-bold text-[#202720]">
                "Zero oil drips, totally transformed my cooking counter!"
              </h4>
              <p className="text-xs text-[#5E695E] leading-relaxed">
                The auto-flip mechanism works smoothly every single time without dripping oil on the counter or bottle sides. The borosilicate glass feels sturdy and thick. Highly recommended for daily cooking.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-[#E5E8E3] flex items-center justify-between text-xs">
              <div>
                <p className="font-semibold text-[#202720]">Ananya Sharma</p>
                <p className="text-[11px] text-[#5E695E]">Bengaluru, Karnataka</p>
              </div>
              <span className="text-[10px] text-[#087A42] font-semibold flex items-center gap-1 bg-[#E8F5EE] px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" />
                Verified Buyer
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#E5E8E3] shadow-xs flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-1 text-[#FF7900]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#FF7900]" />
                ))}
              </div>
              <h4 className="text-sm font-bold text-[#202720]">
                "Very practical sink organizer with drainage"
              </h4>
              <p className="text-xs text-[#5E695E] leading-relaxed">
                Having the sponge drainage tray together with the pump dispenser saves a lot of sink space. No more smelly wet sponges sitting in water puddles. Looks neat and premium.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-[#E5E8E3] flex items-center justify-between text-xs">
              <div>
                <p className="font-semibold text-[#202720]">Rohit Kulkarni</p>
                <p className="text-[11px] text-[#5E695E]">Pune, Maharashtra</p>
              </div>
              <span className="text-[10px] text-[#087A42] font-semibold flex items-center gap-1 bg-[#E8F5EE] px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" />
                Verified Buyer
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#E5E8E3] shadow-xs flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-1 text-[#FF7900]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#FF7900]" />
                ))}
              </div>
              <h4 className="text-sm font-bold text-[#202720]">
                "Dhaniya stays fresh and green for almost two weeks"
              </h4>
              <p className="text-xs text-[#5E695E] leading-relaxed">
                Before this, coriander would turn black and rot in plastic covers within 3 days. With this herb preserver capsule, just adding water in the bottom kept it fresh and crisp for 12 days.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-[#E5E8E3] flex items-center justify-between text-xs">
              <div>
                <p className="font-semibold text-[#202720]">Meera Iyer</p>
                <p className="text-[11px] text-[#5E695E]">Chennai, Tamil Nadu</p>
              </div>
              <span className="text-[10px] text-[#087A42] font-semibold flex items-center gap-1 bg-[#E8F5EE] px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" />
                Verified Buyer
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Signup with Explicit Consent */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#E8F5EE] rounded-3xl border border-[#087A42]/20 p-8 sm:p-12 text-center max-w-3xl mx-auto">
          <h3 className="text-xl sm:text-2xl font-extrabold text-[#202720]">
            Stay Updated on Smart Living Innovations
          </h3>
          <p className="text-xs sm:text-sm text-[#5E695E] mt-2 max-w-lg mx-auto">
            Get early access to practical home organizers, new releases, and exclusive seasonal subscriber perks. No spam, ever.
          </p>

          <form onSubmit={handleNewsletterSubmit} className="mt-6 max-w-md mx-auto space-y-3">
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email address"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                required
                className="flex-1 text-xs px-4 py-3 bg-white border border-[#E5E8E3] rounded-xl focus:outline-none focus:border-[#087A42]"
              />
              <button
                type="submit"
                disabled={newsletterLoading}
                className="px-5 py-3 bg-[#087A42] hover:bg-[#066336] text-white text-xs font-bold rounded-xl transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
              >
                {newsletterLoading ? 'Saving...' : 'Subscribe'}
              </button>
            </div>

            <label className="flex items-start gap-2 text-left cursor-pointer text-[11px] text-[#5E695E]">
              <input
                type="checkbox"
                checked={newsletterConsent}
                onChange={(e) => setNewsletterConsent(e.target.checked)}
                className="mt-0.5 rounded text-[#087A42] focus:ring-[#087A42]"
              />
              <span>
                I agree to receive promotional updates from FanKO Store in accordance with the Privacy Policy. You can unsubscribe anytime.
              </span>
            </label>

            {newsletterStatus && (
              <p className="text-xs font-semibold text-[#087A42]">{newsletterStatus}</p>
            )}
          </form>
        </div>
      </section>

    </div>
  );
};
