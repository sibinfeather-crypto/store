import React, { useState, useMemo } from 'react';
import { Filter, SlidersHorizontal, Search, X, RefreshCw } from 'lucide-react';
import type { Product, ProductCategory } from '../types/index.ts';
import { ProductCard } from '../components/ProductCard.tsx';

interface ShopViewProps {
  products: Product[];
  initialCategory?: string;
  initialSearch?: string;
  onNavigate: (view: string, param?: string) => void;
}

export const ShopView: React.FC<ShopViewProps> = ({
  products,
  initialCategory,
  initialSearch = '',
  onNavigate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'All');
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [showFiltersMobile, setShowFiltersMobile] = useState<boolean>(false);

  const categories: (ProductCategory | 'All')[] = [
    'All',
    'Kitchen Essentials',
    'Home Organization',
    'Storage Solutions',
    'Cleaning Accessories',
    'Bathroom Organizers',
    'Daily-use Products',
  ];

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCategory !== 'All') {
        const matchesCat =
          p.category.toLowerCase() === selectedCategory.toLowerCase() ||
          p.category.toLowerCase().replace(/\s+/g, '-') === selectedCategory.toLowerCase();
        if (!matchesCat) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matches =
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query);
        if (!matches) return false;
      }

      // In stock filter
      if (inStockOnly && (p.stock <= 0 || p.status === 'out_of_stock')) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') {
        return (a.salePrice ?? a.price) - (b.salePrice ?? b.price);
      }
      if (sortBy === 'price_desc') {
        return (b.salePrice ?? b.price) - (a.salePrice ?? a.price);
      }
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'rating') {
        return b.rating - a.rating;
      }
      return 0; // default / featured
    });
  }, [products, selectedCategory, searchQuery, inStockOnly, sortBy]);

  const hasActiveFilters = selectedCategory !== 'All' || searchQuery !== '' || inStockOnly || sortBy !== 'featured';

  const resetFilters = () => {
    setSelectedCategory('All');
    setSearchQuery('');
    setSortBy('featured');
    setInStockOnly(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Page Title & Breadcrumb */}
      <div>
        <div className="text-xs text-[#5E695E] mb-2 flex items-center gap-1.5">
          <button onClick={() => onNavigate('home')} className="hover:text-[#087A42]">Home</button>
          <span>/</span>
          <span className="text-[#202720] font-semibold">Shop All</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#202720]">
              All Products
            </h1>
            <p className="text-xs sm:text-sm text-[#5E695E] mt-1">
              Showing <strong className="text-[#202720]">{filteredProducts.length}</strong> smart essentials for your home & kitchen
            </p>
          </div>

          {/* Mobile Filter Toggle */}
          <div className="flex items-center gap-2 sm:hidden">
            <button
              onClick={() => setShowFiltersMobile(!showFiltersMobile)}
              className="flex-1 py-2 px-3 bg-white border border-[#E5E8E3] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <Filter className="w-3.5 h-3.5 text-[#087A42]" />
              <span>Filters {hasActiveFilters && '•'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout: Sidebar Filters + Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Desktop Filters Sidebar */}
        <div className={`space-y-6 ${showFiltersMobile ? 'block' : 'hidden lg:block'}`}>
          <div className="bg-white rounded-2xl border border-[#E5E8E3] p-5 space-y-6 shadow-xs">
            
            {/* Header & Reset */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E8E3]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#202720] uppercase tracking-wider">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#087A42]" />
                <span>Filters</span>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-[#FF7900] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Search Input */}
            <div>
              <label className="text-xs font-bold text-[#202720] block mb-2">
                Search Catalog
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Keyword, product, SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-7 py-2 bg-[#F7F8F6] border border-[#E5E8E3] rounded-lg text-xs focus:outline-none focus:border-[#087A42] focus:bg-white"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Categories */}
            <div>
              <label className="text-xs font-bold text-[#202720] block mb-2">
                Category
              </label>
              <div className="space-y-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left text-xs py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer flex items-center justify-between ${
                      selectedCategory === cat
                        ? 'bg-[#E8F5EE] text-[#087A42] font-bold'
                        : 'text-[#5E695E] hover:bg-[#F7F8F6] hover:text-[#202720]'
                    }`}
                  >
                    <span>{cat}</span>
                    {cat !== 'All' && (
                      <span className="text-[10px] text-slate-400">
                        {products.filter((p) => p.category === cat).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Stock Filter */}
            <div className="pt-3 border-t border-[#E5E8E3]">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-[#202720]">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded text-[#087A42] focus:ring-[#087A42]"
                />
                <span className="font-medium">In Stock Items Only</span>
              </label>
            </div>

          </div>
        </div>

        {/* Products Grid Area */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Top Sorting Bar */}
          <div className="bg-white rounded-xl border border-[#E5E8E3] p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="text-[#5E695E]">
              Showing <span className="font-bold text-[#202720]">{filteredProducts.length}</span> results
              {selectedCategory !== 'All' && (
                <span> in <strong className="text-[#087A42]">{selectedCategory}</strong></span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[#5E695E] font-medium">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-[#F7F8F6] border border-[#E5E8E3] rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#202720] focus:outline-none focus:border-[#087A42]"
              >
                <option value="featured">Featured</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="newest">New Arrivals</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          {/* Product Cards */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((prod) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  onSelect={(slug) => onNavigate('product', slug)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E5E8E3] p-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#F7F8F6] flex items-center justify-center mx-auto text-slate-400">
                <Search className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-[#202720]">No matching products found</h3>
              <p className="text-xs text-[#5E695E] max-w-sm mx-auto">
                We couldn't find any items matching your selected filters. Try resetting the filters or searching with different keywords.
              </p>
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-[#087A42] text-white text-xs font-semibold rounded-lg hover:bg-[#066336] transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
