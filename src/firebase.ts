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
  query,
  orderBy,
  getDocFromServer,
  serverTimestamp,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import type { Product, Order, StoreSettings, Review } from './types/index.ts';

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
 * Fetch all products from Firestore
 */
export async function getProductsFromFirestore(): Promise<Product[]> {
  try {
    const q = query(collection(db, PRODUCTS_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return [];
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
      } as Product;
    });
  } catch (err) {
    console.warn('Could not read products from Firestore, falling back to local data', err);
    return [];
  }
}

/**
 * Save or update a product in Firestore
 */
export async function saveProductToFirestore(product: Product): Promise<void> {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, product.id);
    await setDoc(docRef, {
      ...product,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.error('Error saving product to Firestore:', err);
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
