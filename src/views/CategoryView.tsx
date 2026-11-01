import React, { useState, useMemo } from 'react';
import {
  ChevronRight,
  SlidersHorizontal,
  Sparkles,
  ShieldCheck,
  Truck,
  RotateCcw,
  Check
} from 'lucide-react';
import type { Product, ProductCategory } from '../types/index.ts';
import { ProductCard } from '../components/ProductCard.tsx';

interface CategoryViewProps {
  categorySlug: string;
  products: Product[];
  onNavigate: (view: string, param?: string) => void;
}

interface CategoryMeta {
  title: ProductCategory;
  slug: string;
  tagline: string;
  description: string;
  highlightIcon: string;
  badge: string;
  benefits: string[];
}

const CATEGORY_MAP: Record<string, CategoryMeta> = {
  'kitchen': {
    title: 'Kitchen Essentials',
    slug: 'kitchen-essentials',
    tagline: 'Precision Tools & Functional Countertop Organization',
    description: 'Transform your culinary space with smart oil dispensers, multi-use food containers, spice racks, and sink organizers built for Indian homes.',
    highlightIcon: '🍳',
    badge: 'Chef-Grade Quality',
    benefits: ['BPA-Free Food Safe Materials', 'Drip-Free Precision Pouring', 'Heat & Stain Resistant'],
  },
  'kitchen-essentials': {
    title: 'Kitchen Essentials',
    slug: 'kitchen-essentials',
    tagline: 'Precision Tools & Functional Countertop Organization',
    description: 'Transform your culinary space with smart oil dispensers, multi-use food containers, spice racks, and sink organizers built for Indian homes.',
    highlightIcon: '🍳',
    badge: 'Chef-Grade Quality',
    benefits: ['BPA-Free Food Safe Materials', 'Drip-Free Precision Pouring', 'Heat & Stain Resistant'],
  },
  'organization': {
    title: 'Home Organization',
    slug: 'home-organization',
    tagline: 'Declutter Living Spaces with Functional Aesthetic Storage',
    description: 'Modern, modular organizers designed for dressing tables, wardrobes, desks, and shelves. Clean lines, grooved textures, and timeless appeal.',
    highlightIcon: '✨',
    badge: 'Aesthetic Living',
    benefits: ['Modular Expandable Compartments', 'Sleek Fluted Texture', 'Easy Wipe-Down Plastic'],
  },
  'home-organization': {
    title: 'Home Organization',
    slug: 'home-organization',
    tagline: 'Declutter Living Spaces with Functional Aesthetic Storage',
    description: 'Modern, modular organizers designed for dressing tables, wardrobes, desks, and shelves. Clean lines, grooved textures, and timeless appeal.',
    highlightIcon: '✨',
    badge: 'Aesthetic Living',
    benefits: ['Modular Expandable Compartments', 'Sleek Fluted Texture', 'Easy Wipe-Down Plastic'],
  },
  'storage': {
    title: 'Storage Solutions',
    slug: 'storage-solutions',
    tagline: 'Airtight, Space-Saving Food & Utility Preservation',
    description: 'Keep your pulses, grains, herb bundles, and pantry goods crisp, dry, and fresh with premium airtight sealing mechanisms.',
    highlightIcon: '📦',
    badge: 'Pantry Ready',
    benefits: ['Silicon Airtight Sealing', 'Pest & Moisture Locking', 'Modular Stackable Design'],
  },
  'storage-solutions': {
    title: 'Storage Solutions',
    slug: 'storage-solutions',
    tagline: 'Airtight, Space-Saving Food & Utility Preservation',
    description: 'Keep your pulses, grains, herb bundles, and pantry goods crisp, dry, and fresh with premium airtight sealing mechanisms.',
    highlightIcon: '📦',
    badge: 'Pantry Ready',
    benefits: ['Silicon Airtight Sealing', 'Pest & Moisture Locking', 'Modular Stackable Design'],
  },
  'cleaning': {
    title: 'Cleaning Accessories',
    slug: 'cleaning-accessories',
    tagline: 'Effortless Hygiene & Smart Sink Station Accessories',
    description: 'Innovative soap pump caddies, ergonomic scrubbers, and drip trays that eliminate messy countertops and make washing seamless.',
    highlightIcon: '🧼',
    badge: 'Hygiene Assured',
    benefits: ['One-Hand Dispensing Action', 'Quick-Drain Perforated Trays', 'Durable Rust-Free Build'],
  },
  'cleaning-accessories': {
    title: 'Cleaning Accessories',
    slug: 'cleaning-accessories',
    tagline: 'Effortless Hygiene & Smart Sink Station Accessories',
    description: 'Innovative soap pump caddies, ergonomic scrubbers, and drip trays that eliminate messy countertops and make washing seamless.',
    highlightIcon: '🧼',
    badge: 'Hygiene Assured',
    benefits: ['One-Hand Dispensing Action', 'Quick-Drain Perforated Trays', 'Durable Rust-Free Build'],
  },
  'bathroom': {
    title: 'Bathroom Organizers',
    slug: 'bathroom-organizers',
    tagline: 'Waterproof Vanity Racks & Toothbrush Holders',
    description: 'Organize toiletries, skincare bottles, and brushes with moisture-resistant caddies with elevated feet and self-draining bases.',
    highlightIcon: '🚿',
    badge: 'Waterproof',
    benefits: ['Anti-Slip Raised Feet', 'Ventilated Air-Dry Slots', 'Sleek Cream Finish'],
  },
  'bathroom-organizers': {
    title: 'Bathroom Organizers',
    slug: 'bathroom-organizers',
    tagline: 'Waterproof Vanity Racks & Toothbrush Holders',
    description: 'Organize toiletries, skincare bottles, and brushes with moisture-resistant caddies with elevated feet and self-draining bases.',
    highlightIcon: '🚿',
    badge: 'Waterproof',
    benefits: ['Anti-Slip Raised Feet', 'Ventilated Air-Dry Slots', 'Sleek Cream Finish'],
  },
  'daily-use': {
    title: 'Daily-use Products',
    slug: 'daily-use-products',
    tagline: 'Everyday Problem Solvers for Modern Households',
    description: 'Practical daily accessories that save time, reduce chores, and introduce simple conveniences into Indian homes.',
    highlightIcon: '⭐',
    badge: 'Everyday Essential',
    benefits: ['Engineered for Daily Utility', 'Compact Footprint', 'Affordable Long-Lasting'],
  },
  'daily-use-products': {
    title: 'Daily-use Products',
    slug: 'daily-use-products',
    tagline: 'Everyday Problem Solvers for Modern Households',
    description: 'Practical daily accessories that save time, reduce chores, and introduce simple conveniences into Indian homes.',
    highlightIcon: '⭐',
    badge: 'Everyday Essential',
    benefits: ['Engineered for Daily Utility', 'Compact Footprint', 'Affordable Long-Lasting'],
  },
};

export const CategoryView: React.FC<CategoryViewProps> = ({
  categorySlug,
  products,
  onNavigate,
}) => {
  const [sortBy, setSortBy] = useState<string>('featured');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);

  // Match category meta
  const normalizedKey = categorySlug.toLowerCase().trim();
  const meta: CategoryMeta = CATEGORY_MAP[normalizedKey] || {
    title: (categorySlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) as ProductCategory),
    slug: categorySlug,
    tagline: 'Curated Collection for Your Home',
    description: 'Browse our tested selection of functional daily living essentials.',
    highlightIcon: '✨',
    badge: 'FanKO Quality',
    benefits: ['100% Genuine Materials', 'Cash on Delivery Available', '7-Day Easy Returns'],
  };

  // Filter products matching this category
  const categoryProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matches =
          p.category.toLowerCase() === meta.title.toLowerCase() ||
          p.category.toLowerCase().replace(/\s+/g, '-') === meta.slug;
        if (!matches) return false;
        if (inStockOnly && (p.stock <= 0 || p.status === 'out_of_stock')) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return (a.salePrice ?? a.price) - (b.salePrice ?? b.price);
        if (sortBy === 'price_desc') return (b.salePrice ?? b.price) - (a.salePrice ?? a.price);
        if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === 'rating') return b.rating - a.rating;
        return 0;
      });
  }, [products, meta, inStockOnly, sortBy]);

  return (
    <div className="space-y-8 pb-16">
      
      {/* Category Hero Banner */}
      <section className="bg-gradient-to-b from-[#E8F5EE] to-[#F7F8F6] border-b border-[#E5E8E3] py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="text-xs text-[#5E695E] mb-4 flex items-center gap-2">
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
              Shop All
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[#087A42] font-semibold">{meta.title}</span>
          </nav>

          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#087A42]/20 rounded-full text-xs font-semibold text-[#087A42] shadow-xs">
              <span className="text-base">{meta.highlightIcon}</span>
              <span>{meta.badge}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#202720] tracking-tight">
              {meta.title}
            </h1>

            <p className="text-base sm:text-lg text-[#087A42] font-medium">
              {meta.tagline}
            </p>

            <p className="text-sm text-[#5E695E] leading-relaxed">
              {meta.description}
            </p>

            {/* Key Value Props Pill Row */}
            <div className="pt-2 flex flex-wrap gap-2 sm:gap-3">
              {meta.benefits.map((benefit, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/80 rounded-lg text-xs font-medium text-[#202720] border border-[#E5E8E3]"
                >
                  <Check className="w-3.5 h-3.5 text-[#087A42]" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* Main Content Area: Filters Bar & Products Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Sort & Filter Controls Header */}
        <div className="bg-white p-4 rounded-xl border border-[#E5E8E3] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-[#5E695E]">
              Showing <strong className="text-[#202720]">{categoryProducts.length}</strong> items in {meta.title}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* In-Stock Toggle */}
            <label className="flex items-center gap-2 text-xs font-medium text-[#202720] cursor-pointer bg-[#F7F8F6] px-3 py-2 rounded-lg border border-[#E5E8E3]">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 accent-[#087A42] rounded"
              />
              <span>In-Stock Only</span>
            </label>

            {/* Sort Select */}
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#5E695E]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs bg-[#F7F8F6] border border-[#E5E8E3] rounded-lg px-3 py-2 text-[#202720] focus:outline-none focus:border-[#087A42] cursor-pointer"
              >
                <option value="featured">Featured / Recommended</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="newest">New Arrivals</option>
                <option value="rating">Highest Customer Rating</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Cards Grid */}
        {categoryProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {categoryProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={(slug) => onNavigate('product', slug)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E5E8E3] p-12 text-center space-y-4 max-w-lg mx-auto">
            <div className="w-16 h-16 bg-[#E8F5EE] text-[#087A42] rounded-full flex items-center justify-center mx-auto text-2xl">
              {meta.highlightIcon}
            </div>
            <h3 className="text-base font-bold text-[#202720]">No Products Found</h3>
            <p className="text-xs text-[#5E695E]">
              We are constantly adding new inventory to {meta.title}. Explore all products or other categories.
            </p>
            <button
              onClick={() => onNavigate('shop')}
              className="px-5 py-2.5 bg-[#087A42] hover:bg-[#066336] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Browse Shop All
            </button>
          </div>
        )}

        {/* Explore Other Departments */}
        <div className="pt-10 border-t border-[#E5E8E3]">
          <div className="text-center max-w-xl mx-auto space-y-2 mb-6">
            <h3 className="text-lg font-bold text-[#202720]">Explore Other Departments</h3>
            <p className="text-xs text-[#5E695E]">Find more smart organizers and daily essentials for your home</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {[
              { name: 'Kitchen Essentials', slug: 'kitchen-essentials', icon: '🍳', view: 'kitchen' },
              { name: 'Home Organization', slug: 'home-organization', icon: '✨', view: 'organization' },
              { name: 'Storage Solutions', slug: 'storage-solutions', icon: '📦', view: 'storage' },
              { name: 'Cleaning Accessories', slug: 'cleaning-accessories', icon: '🧼', view: 'cleaning' },
              { name: 'Bathroom Organizers', slug: 'bathroom-organizers', icon: '🚿', view: 'bathroom' },
            ]
              .filter((cat) => cat.slug !== meta.slug)
              .map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => onNavigate(cat.view)}
                  className="bg-white p-4 rounded-xl border border-[#E5E8E3] hover:border-[#087A42] hover:shadow-sm text-center transition-all group cursor-pointer"
                >
                  <span className="text-2xl block mb-1 group-hover:scale-110 transition-transform">
                    {cat.icon}
                  </span>
                  <span className="text-xs font-bold text-[#202720] group-hover:text-[#087A42] line-clamp-1">
                    {cat.name}
                  </span>
                </button>
              ))}
          </div>
        </div>

        {/* Trust Guarantees */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
          <div className="bg-white p-4 rounded-xl border border-[#E5E8E3] flex items-center gap-3">
            <div className="w-10 h-10 bg-[#E8F5EE] text-[#087A42] rounded-lg flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#202720]">Pan-India Shipping</p>
              <p className="text-[11px] text-[#5E695E]">Free delivery on orders above ₹499</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#E5E8E3] flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FFF3E6] text-[#FF7900] rounded-lg flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#202720]">Razorpay & COD</p>
              <p className="text-[11px] text-[#5E695E]">UPI, Cards, NetBanking or doorstep cash</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#E5E8E3] flex items-center gap-3">
            <div className="w-10 h-10 bg-[#E8F5EE] text-[#087A42] rounded-lg flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#202720]">7 Days Replacement</p>
              <p className="text-[11px] text-[#5E695E]">Hassle-free support for transit damages</p>
            </div>
          </div>
        </div>

      </section>

    </div>
  );
};
