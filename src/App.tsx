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
import { ProductDetailView } from './views/ProductDetailView.tsx';
import { CheckoutView } from './views/CheckoutView.tsx';
import { OrderConfirmationView } from './views/OrderConfirmationView.tsx';
import { TrackOrderView } from './views/TrackOrderView.tsx';
import { WishlistView } from './views/WishlistView.tsx';
import { AccountView } from './views/AccountView.tsx';
import { AdminDashboardView } from './views/AdminDashboardView.tsx';
import { StaticPages } from './views/StaticPages.tsx';

import { api } from './services/api.ts';
import type { Product, CategoryInfo, Order } from './types/index.ts';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [viewParam, setViewParam] = useState<string>('');
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

  // Listen to popstate / hash for back-forward navigation
  const navigateTo = (view: string, param = '') => {
    setCurrentView(view);
    setViewParam(param);
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
            <Header currentView={currentView} onNavigate={navigateTo} />

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

                  {currentView === 'category' && (
                    <ShopView
                      products={products}
                      initialCategory={viewParam.startsWith('category=') ? viewParam.replace('category=', '') : viewParam}
                      onNavigate={navigateTo}
                    />
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
