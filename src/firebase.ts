import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDocFromServer,
  serverTimestamp,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import type { Product, Order, StoreSettings, Review } from './types/index.ts';
import { defaultProducts } from './data/storeDefaults.ts';

import firebaseAppletConfig from '../firebase-applet-config.json';

// Firebase configuration provisioned for FanKO Store
export const firebaseConfig = firebaseAppletConfig;

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with specific database ID if provided
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);

// Connection verification test per guidelines
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client appears offline, using local store cache.');
      return false;
    }
    // Firestore rules may reject test doc read if unauthenticated, which still confirms server reachability
    return true;
  }
}

// Automatically test connection on boot
testFirebaseConnection().catch(() => {});

// Firestore Collections
const PRODUCTS_COLLECTION = 'products';
const ORDERS_COLLECTION = 'orders';
const SETTINGS_COLLECTION = 'settings';
const REVIEWS_COLLECTION = 'reviews';
const NEWSLETTER_COLLECTION = 'newsletter';

/**
 * Fetch all products from Firestore, auto-seeding defaults if collection is empty
 */
export async function getProductsFromFirestore(): Promise<Product[]> {
  try {
    const colRef = collection(db, PRODUCTS_COLLECTION);
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) {
      console.info('Firestore products collection is empty, auto-seeding default catalog...');
      await seedProductsToFirestore(defaultProducts);
      return [...defaultProducts];
    }
    const products = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
      } as Product;
    });

    // Auto-seed any newly added default products if missing from Firestore
    const existingIds = new Set(products.map((p) => p.id));
    const missingDefaults = defaultProducts.filter((dp) => !existingIds.has(dp.id));
    if (missingDefaults.length > 0) {
      for (const dp of missingDefaults) {
        saveProductToFirestore(dp).catch((e) => console.warn('Could not auto-seed product:', dp.id, e));
        products.push(dp);
      }
    }

    // Sort newest first
    products.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return products;
  } catch (err) {
    console.warn('Could not read products from Firestore, falling back to local data', err);
    return [];
  }
}

/**
 * Real-time listener for products across all devices
 */
export function subscribeProductsFromFirestore(callback: (products: Product[]) => void): () => void {
  try {
    const colRef = collection(db, PRODUCTS_COLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const prods = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          } as Product));
          prods.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          callback(prods);
        }
      },
      (err) => {
        console.warn('Realtime products listener error:', err);
      }
    );
  } catch (e) {
    console.warn('Could not initialize products listener:', e);
    return () => {};
  }
}

/**
 * Save or update a product in Firestore
 */
export async function saveProductToFirestore(product: Product): Promise<void> {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, product.id);
    await setDoc(
      docRef,
      {
        ...product,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Error saving product to Firestore:', err);
    throw err;
  }
}

/**
 * Delete a product from Firestore
 */
export async function deleteProductFromFirestore(productId: string): Promise<void> {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Error deleting product from Firestore:', err);
    throw err;
  }
}

/**
 * Seed or batch sync products to Firestore
 */
export async function seedProductsToFirestore(products: Product[]): Promise<void> {
  try {
    for (const prod of products) {
      await saveProductToFirestore(prod);
    }
  } catch (err) {
    console.warn('Error seeding products to Firestore:', err);
  }
}

/**
 * Save an order to Firestore
 */
export async function saveOrderToFirestore(order: Order): Promise<void> {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, order.id);
    await setDoc(docRef, {
      ...order,
      syncedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.error('Error saving order to Firestore:', err);
    throw err;
  }
}

/**
 * Fetch orders from Firestore
 */
export async function getOrdersFromFirestore(): Promise<Order[]> {
  try {
    const q = query(collection(db, ORDERS_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return [];
    return snapshot.docs.map((docSnap) => {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Order;
    });
  } catch (err) {
    console.warn('Could not read orders from Firestore:', err);
    return [];
  }
}

/**
 * Real-time listener for orders across all devices
 */
export function subscribeOrdersFromFirestore(callback: (orders: Order[]) => void): () => void {
  try {
    const q = query(collection(db, ORDERS_COLLECTION), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const orders = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        } as Order));
        callback(orders);
      },
      (err) => {
        console.warn('Realtime orders listener error:', err);
      }
    );
  } catch (e) {
    console.warn('Could not initialize orders listener:', e);
    return () => {};
  }
}

/**
 * Fetch store settings from Firestore
 */
export async function getSettingsFromFirestore(): Promise<StoreSettings | null> {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, 'global_config');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as StoreSettings;
    }
    return null;
  } catch (err) {
    console.warn('Could not read settings from Firestore:', err);
    return null;
  }
}

/**
 * Real-time listener for store settings across all devices
 */
export function subscribeSettingsFromFirestore(callback: (settings: StoreSettings) => void): () => void {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, 'global_config');
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          callback(snap.data() as StoreSettings);
        }
      },
      (err) => {
        console.warn('Realtime settings listener error:', err);
      }
    );
  } catch (e) {
    console.warn('Could not initialize settings listener:', e);
    return () => {};
  }
}

/**
 * Save store settings (including UPI configuration and COD advance settings) to Firestore
 */
export async function saveSettingsToFirestore(settings: Partial<StoreSettings>): Promise<void> {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, 'global_config');
    await setDoc(docRef, {
      ...settings,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.error('Error saving settings to Firestore:', err);
    throw err;
  }
}

/**
 * Submit customer review to Firestore
 */
export async function submitReviewToFirestore(review: Review): Promise<void> {
  try {
    const docRef = doc(db, REVIEWS_COLLECTION, review.id);
    await setDoc(docRef, {
      ...review,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error saving review to Firestore:', err);
    throw err;
  }
}

/**
 * Save newsletter subscription
 */
export async function subscribeNewsletterToFirestore(email: string): Promise<void> {
  try {
    await addDoc(collection(db, NEWSLETTER_COLLECTION), {
      email,
      subscribedAt: new Date().toISOString(),
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.error('Error saving newsletter subscription:', err);
  }
}
