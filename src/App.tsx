/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CartProvider } from './context/CartContext.tsx';
import { WishlistProvider } from './context/WishlistContext.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { AnnouncementBar } from './components/AnnouncementBar.tsx';
import { Header } from './components/Header.tsx';
import { Footer } from './components/Footer.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { WhatsAppButton } from './components/WhatsAppButton.tsx';

import { HomeView } from './views/HomeView.tsx';
import { ShopView } from './views/ShopView.tsx';
import { CategoryView } from './views/CategoryView.tsx';
import { ProductDetailView } from './views/ProductDetailView.tsx';
import { CartView } from './views/CartView.tsx';
import { CheckoutView } from './views/CheckoutView.tsx';
import { OrderConfirmationView } from './views/OrderConfirmationView.tsx';
import { TrackOrderView } from './views/TrackOrderView.tsx';
import { WishlistView } from './views/WishlistView.tsx';
import { AccountView } from './views/AccountView.tsx';
import { AdminDashboardView } from './views/AdminDashboardView.tsx';
import { StaticPages } from './views/StaticPages.tsx';

import { api } from './services/api.ts';
import type { Product, CategoryInfo, Order } from './types/index.ts';

function parseUrlToRoute(pathname: string, search: string): { view: string; param: string } {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';

  if (cleanPath === '/' || cleanPath === '') {
    return { view: 'home', param: '' };
  }
  if (cleanPath === '/shop') {
    const params = new URLSearchParams(search);
    const cat = params.get('category');
    const q = params.get('search');
    if (cat) return { view: 'shop', param: `category=${cat}` };
    if (q) return { view: 'shop', param: `search=${encodeURIComponent(q)}` };
    return { view: 'shop', param: '' };
  }
  if (cleanPath === '/kitchen') {
    return { view: 'category', param: 'kitchen-essentials' };
  }
  if (cleanPath === '/organization') {
    return { view: 'category', param: 'home-organization' };
  }
  if (cleanPath === '/storage') {
    return { view: 'category', param: 'storage-solutions' };
  }
  if (cleanPath === '/cleaning') {
    return { view: 'category', param: 'cleaning-accessories' };
  }
  if (cleanPath === '/bathroom') {
    return { view: 'category', param: 'bathroom-organizers' };
  }
  if (cleanPath === '/daily-use') {
    return { view: 'category', param: 'daily-use-products' };
  }
  if (cleanPath.startsWith('/category/')) {
    const slug = cleanPath.replace('/category/', '');
    return { view: 'category', param: slug };
  }
  if (cleanPath.startsWith('/product/')) {
    const slug = cleanPath.replace('/product/', '');
    return { view: 'product', param: slug };
  }
  if (cleanPath === '/cart') {
    return { view: 'cart', param: '' };
  }
  if (cleanPath === '/checkout') {
    return { view: 'checkout', param: '' };
  }
  if (cleanPath.startsWith('/order-confirmation')) {
    const num = cleanPath.replace(/^\/order-confirmation\/?/, '');
    return { view: 'order-confirmation', param: num };
  }
  if (cleanPath.startsWith('/track-order')) {
    const num = cleanPath.replace(/^\/track-order\/?/, '');
    return { view: 'track-order', param: num };
  }
  if (cleanPath === '/wishlist') return { view: 'wishlist', param: '' };
  if (cleanPath === '/account') return { view: 'account', param: '' };
  if (cleanPath === '/admin') return { view: 'admin', param: '' };
  if (cleanPath === '/about') return { view: 'about', param: '' };
  if (cleanPath === '/contact') return { view: 'contact', param: '' };
  if (cleanPath === '/faqs') return { view: 'faqs', param: '' };
  if (cleanPath === '/shipping-policy') return { view: 'shipping-policy', param: '' };
  if (cleanPath === '/return-refund-policy') return { view: 'return-refund-policy', param: '' };
  if (cleanPath === '/privacy-policy') return { view: 'privacy-policy', param: '' };
  if (cleanPath === '/terms-and-conditions') return { view: 'terms-and-conditions', param: '' };

  return { view: 'home', param: '' };
}

function getUrlForRoute(view: string, param = ''): { path: string; title: string } {
  switch (view) {
    case 'home':
      return { path: '/', title: 'FanKO Store | Smart Products. Better Living.' };
    case 'shop':
      if (param.startsWith('search=')) {
        const q = decodeURIComponent(param.replace('search=', ''));
        return { path: `/shop?search=${encodeURIComponent(q)}`, title: `Search "${q}" | FanKO Store` };
      }
      if (param.startsWith('category=')) {
        const cat = param.replace('category=', '');
        return { path: `/shop?category=${encodeURIComponent(cat)}`, title: `${cat} | FanKO Store` };
      }
      return { path: '/shop', title: 'Shop All Products | FanKO Store' };
    case 'kitchen':
      return { path: '/kitchen', title: 'Kitchen Essentials | FanKO Store' };
    case 'organization':
      return { path: '/organization', title: 'Home Organization | FanKO Store' };
    case 'storage':
      return { path: '/storage', title: 'Storage Solutions | FanKO Store' };
    case 'cleaning':
      return { path: '/cleaning', title: 'Cleaning Accessories | FanKO Store' };
    case 'bathroom':
      return { path: '/bathroom', title: 'Bathroom Organizers | FanKO Store' };
    case 'daily-use':
      return { path: '/daily-use', title: 'Daily-use Products | FanKO Store' };
    case 'category': {
      const cleanSlug = param.toLowerCase().replace(/\s+/g, '-');
      if (cleanSlug.includes('kitchen')) return { path: '/kitchen', title: 'Kitchen Essentials | FanKO Store' };
      if (cleanSlug.includes('organ')) return { path: '/organization', title: 'Home Organization | FanKO Store' };
      if (cleanSlug.includes('storage')) return { path: '/storage', title: 'Storage Solutions | FanKO Store' };
      if (cleanSlug.includes('clean')) return { path: '/cleaning', title: 'Cleaning Accessories | FanKO Store' };
      if (cleanSlug.includes('bath')) return { path: '/bathroom', title: 'Bathroom Organizers | FanKO Store' };
      if (cleanSlug.includes('daily')) return { path: '/daily-use', title: 'Daily-use Products | FanKO Store' };
      return { path: `/category/${param}`, title: `${param} | FanKO Store` };
    }
    case 'product':
      return { path: `/product/${param}`, title: 'Product Details | FanKO Store' };
    case 'cart':
      return { path: '/cart', title: 'Shopping Cart | FanKO Store' };
    case 'checkout':
      return { path: '/checkout', title: 'Checkout & Delivery | FanKO Store' };
    case 'order-confirmation':
      return { path: param ? `/order-confirmation/${param}` : '/order-confirmation', title: 'Order Confirmed | FanKO Store' };
    case 'track-order':
      return { path: param ? `/track-order/${param}` : '/track-order', title: 'Track Order | FanKO Store' };
    case 'wishlist':
      return { path: '/wishlist', title: 'My Wishlist | FanKO Store' };
    case 'account':
      return { path: '/account', title: 'My Account & Orders | FanKO Store' };
    case 'admin':
      return { path: '/admin', title: 'Admin Dashboard | FanKO Store' };
    case 'about':
      return { path: '/about', title: 'About Us | FanKO Store' };
    case 'contact':
      return { path: '/contact', title: 'Contact Support | FanKO Store' };
    case 'faqs':
      return { path: '/faqs', title: 'FAQs | FanKO Store' };
    case 'shipping-policy':
      return { path: '/shipping-policy', title: 'Shipping Policy | FanKO Store' };
    case 'return-refund-policy':
      return { path: '/return-refund-policy', title: 'Return & Refund Policy | FanKO Store' };
    case 'privacy-policy':
      return { path: '/privacy-policy', title: 'Privacy Policy | FanKO Store' };
    case 'terms-and-conditions':
      return { path: '/terms-and-conditions', title: 'Terms & Conditions | FanKO Store' };
    default:
      return { path: '/', title: 'FanKO Store | Smart Products. Better Living.' };
  }
}

export default function App() {
  const initialRoute = parseUrlToRoute(window.location.pathname, window.location.search);
  const [currentView, setCurrentView] = useState<string>(initialRoute.view);
  const [viewParam, setViewParam] = useState<string>(initialRoute.param);
  const [cachedOrder, setCachedOrder] = useState<Order | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [whatsappNumber, setWhatsappNumber] = useState<string>('919876543210');
  const [supportEmail, setSupportEmail] = useState<string>('support@fankostore.in');

  // Load products, categories, and settings
  useEffect(() => {
    Promise.all([
      api.getProducts(),
      api.getCategories(),
      api.getSettings(),
    ])
      .then(([prods, cats, settings]) => {
        setProducts(prods);
        setCategories(cats);
        if (settings.whatsappNumber) setWhatsappNumber(settings.whatsappNumber);
        if (settings.supportEmail) setSupportEmail(settings.supportEmail);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load initial store data:', err);
        setLoading(false);
      });
  }, []);

  // Listen to browser Back and Forward history buttons
  useEffect(() => {
    const handlePopState = () => {
      const route = parseUrlToRoute(window.location.pathname, window.location.search);
      setCurrentView(route.view);
      setViewParam(route.param);
      const { title } = getUrlForRoute(route.view, route.param);
      document.title = title;
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Core navigation function syncing state and browser address bar
  const navigateTo = (view: string, param = '') => {
    setCurrentView(view);
    setViewParam(param);

    const { path, title } = getUrlForRoute(view, param);
    document.title = title;

    if (window.location.pathname + window.location.search !== path) {
      window.history.pushState(null, '', path);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOrderCompleted = (order: Order) => {
    setCachedOrder(order);
  };

  // Resolve selected product if on product detail view
  const activeProduct =
    currentView === 'product'
      ? products.find((p) => p.slug === viewParam || p.id === viewParam)
      : null;

  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <div className="min-h-screen flex flex-col bg-[#F7F8F6] text-[#202720]">
            
            {/* Announcement Banner */}
            <AnnouncementBar />

            {/* Header Navigation Bar */}
            <Header currentView={currentView} currentParam={viewParam} onNavigate={navigateTo} />

            {/* Main Content View Router */}
            <main className="flex-1">
              {loading ? (
                <div className="py-24 text-center space-y-3">
                  <div className="w-10 h-10 border-4 border-[#087A42] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-[#5E695E]">Loading FanKO Store...</p>
                </div>
              ) : (
                <>
                  {currentView === 'home' && (
                    <HomeView
                      products={products}
                      categories={categories}
                      onNavigate={navigateTo}
                    />
                  )}

                  {currentView === 'shop' && (
                    <ShopView
                      products={products}
                      initialCategory={viewParam.startsWith('category=') ? viewParam.replace('category=', '') : undefined}
                      initialSearch={viewParam.startsWith('search=') ? decodeURIComponent(viewParam.replace('search=', '')) : ''}
                      onNavigate={navigateTo}
                    />
                  )}

                  {/* Dedicated Separate Category Pages */}
                  {(currentView === 'category' ||
                    currentView === 'kitchen' ||
                    currentView === 'organization' ||
                    currentView === 'storage' ||
                    currentView === 'cleaning' ||
                    currentView === 'bathroom' ||
                    currentView === 'daily-use') && (
                    <CategoryView
                      categorySlug={viewParam || currentView}
                      products={products}
                      onNavigate={navigateTo}
                    />
                  )}

                  {/* Dedicated Separate Cart Page */}
                  {currentView === 'cart' && (
                    <CartView onNavigate={navigateTo} />
                  )}

                  {currentView === 'product' && (
                    activeProduct ? (
                      <ProductDetailView
                        product={activeProduct}
                        onNavigate={navigateTo}
                      />
                    ) : (
                      <div className="py-20 text-center space-y-4">
                        <h2 className="text-xl font-bold">Product Not Found</h2>
                        <button
                          onClick={() => navigateTo('shop')}
                          className="px-4 py-2 bg-[#087A42] text-white text-xs font-semibold rounded-lg"
                        >
                          View All Products
                        </button>
                      </div>
                    )
                  )}

                  {currentView === 'checkout' && (
                    <CheckoutView
                      onNavigate={navigateTo}
                      onOrderCompleted={handleOrderCompleted}
                    />
                  )}

                  {currentView === 'order-confirmation' && (
                    <OrderConfirmationView
                      orderNumber={viewParam}
                      cachedOrder={cachedOrder}
                      onNavigate={navigateTo}
                    />
                  )}

                  {currentView === 'track-order' && (
                    <TrackOrderView
                      initialOrderNumber={viewParam}
                      onNavigate={navigateTo}
                    />
                  )}

                  {currentView === 'wishlist' && (
                    <WishlistView onNavigate={navigateTo} />
                  )}

                  {currentView === 'account' && (
                    <AccountView onNavigate={navigateTo} />
                  )}

                  {currentView === 'admin' && (
                    <AdminDashboardView onNavigate={navigateTo} />
                  )}

                  {(currentView === 'about' ||
                    currentView === 'contact' ||
                    currentView === 'faqs' ||
                    currentView === 'shipping-policy' ||
                    currentView === 'return-refund-policy' ||
                    currentView === 'privacy-policy' ||
                    currentView === 'terms-and-conditions') && (
                    <StaticPages
                      page={
                        currentView === 'shipping-policy'
                          ? 'shipping'
                          : currentView === 'return-refund-policy'
                          ? 'returns'
                          : currentView === 'privacy-policy'
                          ? 'privacy'
                          : currentView === 'terms-and-conditions'
                          ? 'terms'
                          : (currentView as any)
                      }
                      onNavigate={navigateTo}
                      whatsappNumber={whatsappNumber}
                      supportEmail={supportEmail}
                    />
                  )}
                </>
              )}
            </main>

            {/* Slide-over Cart Drawer */}
            <CartDrawer onNavigate={navigateTo} />

            {/* Floating WhatsApp Contact Button */}
            <WhatsAppButton phoneNumber={whatsappNumber} />

            {/* Storefront Footer */}
            <Footer
              onNavigate={navigateTo}
              whatsappNumber={whatsappNumber}
              supportEmail={supportEmail}
            />

          </div>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}
