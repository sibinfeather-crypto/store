import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Product, CartItem } from '../types/index.ts';
import { api } from '../services/api.ts';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  couponCode: string;
  couponDiscount: number;
  couponError: string | null;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
  subtotal: number;
  shippingFee: number;
  total: number;
  itemCount: number;
  freeShippingThreshold: number;
  amountNeededForFreeShipping: number;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('fanko_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [couponCode, setCouponCode] = useState<string>(() => {
    try {
      return localStorage.getItem('fanko_coupon') || '';
    } catch {
      return '';
    }
  });
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number>(499);
  const [standardShippingFee, setStandardShippingFee] = useState<number>(49);
  const [isLoading, setIsLoading] = useState(false);

  // Sync with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('fanko_cart', JSON.stringify(items));
    } catch (e) {
      console.error('Error saving cart:', e);
    }
  }, [items]);

  // Load store settings for threshold
  useEffect(() => {
    api.getSettings().then((s) => {
      if (s.freeShippingThreshold) setFreeShippingThreshold(s.freeShippingThreshold);
      if (s.standardShippingFee) setStandardShippingFee(s.standardShippingFee);
    }).catch(() => {});
  }, []);

  // Compute subtotal
  const subtotal = items.reduce(
    (sum, item) => sum + (item.product.salePrice ?? item.product.price) * item.quantity,
    0
  );

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Re-verify coupon discount if subtotal changes
  useEffect(() => {
    if (!couponCode || subtotal === 0) {
      setCouponDiscount(0);
      return;
    }
    api.validateCoupon(couponCode, subtotal)
      .then((res) => {
        setCouponDiscount(res.discountAmount);
        setCouponError(null);
      })
      .catch((err) => {
        setCouponDiscount(0);
        setCouponError(err.message || 'Coupon expired or no longer applicable');
      });
  }, [couponCode, subtotal]);

  // Compute shipping fee
  const shippingFee = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : standardShippingFee;
  const amountNeededForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const total = Math.max(0, subtotal - couponDiscount + shippingFee);

  const addToCart = (product: Product, quantity = 1) => {
    if (product.stock <= 0) return;

    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, product.stock);
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: newQty } : i
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          product,
          quantity: Math.min(quantity, product.stock),
          selectedPrice: product.salePrice ?? product.price,
        },
      ];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => {
        if (i.productId === productId) {
          const max = i.product.stock;
          return { ...i, quantity: Math.min(quantity, max) };
        }
        return i;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
    setCouponCode('');
    setCouponDiscount(0);
    setCouponError(null);
    localStorage.removeItem('fanko_cart');
    localStorage.removeItem('fanko_coupon');
  };

  const applyCoupon = async (code: string): Promise<boolean> => {
    setIsLoading(true);
    setCouponError(null);
    try {
      const res = await api.validateCoupon(code, subtotal);
      setCouponCode(res.code);
      setCouponDiscount(res.discountAmount);
      localStorage.setItem('fanko_coupon', res.code);
      setIsLoading(false);
      return true;
    } catch (err: any) {
      setCouponError(err.message || 'Invalid coupon code');
      setIsLoading(false);
      return false;
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setCouponDiscount(0);
    setCouponError(null);
    localStorage.removeItem('fanko_coupon');
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        couponCode,
        couponDiscount,
        couponError,
        applyCoupon,
        removeCoupon,
        subtotal,
        shippingFee,
        total,
        itemCount,
        freeShippingThreshold,
        amountNeededForFreeShipping,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
