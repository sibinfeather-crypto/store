import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type {
  Product,
  CategoryInfo,
  Order,
  Coupon,
  Review,
  StoreSettings,
  AdminUser
} from '../src/types/index.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export interface DatabaseSchema {
  products: Product[];
  categories: CategoryInfo[];
  orders: Order[];
  coupons: Coupon[];
  reviews: Review[];
  settings: StoreSettings;
  adminUsers: {
    id: string;
    username: string;
    passwordHash: string;
    salt: string;
    role: 'admin';
    createdAt: string;
  }[];
  contactMessages: {
    id: string;
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
    createdAt: string;
  }[];
  newsletterSubscribers: {
    email: string;
    consent: boolean;
    subscribedAt: string;
  }[];
}

const initialCategories: CategoryInfo[] = [
  {
    id: 'cat-kitchen',
    name: 'Kitchen Essentials',
    slug: 'kitchen-essentials',
    description: 'Smart dispensers, scrubbers, and food storage tools designed to streamline your daily cooking and sink routine.',
    image: '/assets/aistudio/WhatsApp_Image_2026-09-13_at_7.38.0_7cad6069.jpeg',
    itemCount: 3,
  },
  {
    id: 'cat-home-org',
    name: 'Home Organization',
    slug: 'home-organization',
    description: 'Minimalist organizers that bring calm, elegance, and structured order to desks, vanities, and shelves.',
    image: '/assets/aistudio/Ribbed_White_Vanity_Organizer_0347519c.png',
    itemCount: 2,
  },
  {
    id: 'cat-storage',
    name: 'Storage Solutions',
    slug: 'storage-solutions',
    description: 'Smart drawer units, herb preservers, and space-saving modular containers for modern living.',
    image: '/assets/aistudio/White_Plastic_Makeup_Drawer_Organizer_2efdbdc8.png',
    itemCount: 2,
  },
  {
    id: 'cat-cleaning',
    name: 'Cleaning Accessories',
    slug: 'cleaning-accessories',
    description: 'Durable, ergonomic brushes and crevice cleaners that make kitchen and home hygiene effortless.',
    image: '/assets/aistudio/WhatsApp_Image_2026-09-_cf40f01d.jpeg',
    itemCount: 2,
  },
  {
    id: 'cat-bathroom',
    name: 'Bathroom Organizers',
    slug: 'bathroom-organizers',
    description: 'Moisture-resistant caddies, vanity trays, and dispenser units to keep bathrooms neat and fresh.',
    image: '/assets/aistudio/ChatGPT_Image_Sep_13__2026__07_47_42_PM_670f2782.png',
    itemCount: 2,
  },
  {
    id: 'cat-daily',
    name: 'Daily-use Products',
    slug: 'daily-use-products',
    description: 'Everyday lifestyle utilities and ergonomic comfort essentials that solve practical daily problems.',
    image: '/assets/aistudio/ChatGPT_Image_Sep_13__2026__08_10_58_PM_027bc622.png',
    itemCount: 1,
  },
];

const initialProducts: Product[] = [
  {
    id: 'prod-001',
    slug: 'fanko-ribbed-multi-slot-vanity-countertop-organizer',
    name: 'FanKO Ribbed Multi-Slot Vanity & Countertop Organizer',
    sku: 'FKO-ORG-001',
    category: 'Home Organization',
    subCategory: 'Countertop Caddies',
    shortDescription: 'Elegant ribbed-texture multi-slot organizer with elevated brush compartment and raised footed base.',
    description: 'Bring structured calm to your dressing table or bathroom counter with this fluted vanity organizer. Designed with multiple stepped compartments to hold makeup brushes, skin serums, eyeliners, and grooming accessories upright and within arm’s reach. Sturdy footed design keeps the base elevated off wet surfaces.',
    price: 699,
    salePrice: 499,
    stock: 45,
    status: 'in_stock',
    images: ['/assets/aistudio/Ribbed_White_Vanity_Organizer_0347519c.png'],
    specifications: {
      material: 'BPA-Free Durable ABS',
      dimensions: '24.5 cm (L) x 11.5 cm (W) x 11 cm (H)',
      weight: '320 g',
      color: 'Matte White',
      careInstructions: 'Wipe with damp cloth or rinse with mild soapy water.',
      countryOfOrigin: 'India',
    },
    dimensions: '24.5 x 11.5 x 11 cm',
    material: 'BPA-Free ABS Plastic',
    shippingInfo: 'Dispatched within 24 hours. Estimated delivery: 3-5 business days across India.',
    seoTitle: 'FanKO Ribbed Multi-Slot Vanity & Countertop Organizer | Home Organizers India',
    seoDescription: 'Buy FanKO Ribbed Multi-Slot Vanity Organizer online in India. Perfect for makeup brushes, vanity accessories, and desk supplies.',
    isIncomplete: false,
    featured: true,
    isNewArrival: false,
    rating: 4.8,
    reviewCount: 38,
    createdAt: new Date('2026-09-15').toISOString(),
  },
  {
    id: 'prod-002',
    slug: 'fanko-3-tier-desktop-makeup-storage-drawer-system',
    name: 'FanKO 3-Tier Desktop & Makeup Storage Drawer System',
    sku: 'FKO-STG-002',
    category: 'Storage Solutions',
    subCategory: 'Drawer Towers',
    shortDescription: 'Space-saving 3-tier drawer unit with clear pull-out compartments and divided open top tray.',
    description: 'A versatile modular desktop storage solution featuring three see-through sliding drawers paired with a segmented top organizer tray. Ideal for cosmetics, jewelry, office supplies, sewing kits, or bathroom medicines. The transparent drawers allow quick item identification while keeping contents dust-free.',
    price: 899,
    salePrice: 649,
    stock: 28,
    status: 'in_stock',
    images: ['/assets/aistudio/White_Plastic_Makeup_Drawer_Organizer_2efdbdc8.png'],
    specifications: {
      material: 'Polypropylene Frame with Clear Acrylic Drawers',
      dimensions: '23 cm (L) x 17 cm (W) x 27 cm (H)',
      weight: '620 g',
      color: 'Clean White Frame / Clear Drawers',
      careInstructions: 'Clean with soft cloth and warm water.',
      countryOfOrigin: 'India',
    },
    dimensions: '23 x 17 x 27 cm',
    material: 'PP Frame + Acrylic Drawers',
    shippingInfo: 'Secure box packaging. Dispatched within 24-48 hours.',
    seoTitle: 'FanKO 3-Tier Desktop Drawer Organizer | Storage Solutions India',
    seoDescription: 'Shop FanKO 3-Tier Desktop & Makeup Storage Drawer System. Clear sliding drawers with partitioned top organizer.',
    isIncomplete: false,
    featured: true,
    isNewArrival: true,
    rating: 4.9,
    reviewCount: 52,
    createdAt: new Date('2026-09-18').toISOString(),
  },
  {
    id: 'prod-003',
    slug: 'fanko-dual-drawer-curve-vanity-dressing-table-organizer',
    name: 'FanKO Dual-Drawer Curve Vanity & Dressing Table Organizer',
    sku: 'FKO-ORG-003',
    category: 'Home Organization',
    subCategory: 'Vanity Organizers',
    shortDescription: 'Curved streamlined caddy with two transparent pull-out mini drawers and deep open sections.',
    description: 'Compact yet generous, this curved countertop organizer blends dual dust-proof clear drawers on one side with open tiers on the other. Seamlessly holds foundation bottles, perfumes, brushes, palettes, and jewelry in one neat footprint.',
    price: 799,
    salePrice: 579,
    stock: 19,
    status: 'in_stock',
    images: ['/assets/aistudio/ChatGPT_Image_Sep_13__2026__07_47_42_PM_670f2782.png'],
    specifications: {
      material: 'Impact-Resistant ABS Plastic & Acrylic',
      dimensions: '26 cm (L) x 13 cm (W) x 10 cm (H)',
      weight: '410 g',
      color: 'Smooth White & Transparent',
      careInstructions: 'Hand wash with mild detergent; avoid abrasive pads.',
      countryOfOrigin: 'India',
    },
    dimensions: '26 x 13 x 10 cm',
    material: 'ABS Plastic & Acrylic',
    shippingInfo: 'Dispatched within 24 hours. Pan-India courier delivery.',
    seoTitle: 'FanKO Dual-Drawer Curve Vanity Organizer | FanKO Store',
    seoDescription: 'Keep your dressing vanity neat with FanKO Curved Dual-Drawer Organizer. Fast Pan-India shipping.',
    isIncomplete: false,
    featured: true,
    isNewArrival: false,
    rating: 4.7,
    reviewCount: 29,
    createdAt: new Date('2026-09-20').toISOString(),
  },
  {
    id: 'prod-004',
    slug: 'fanko-window-groove-crevice-cleaning-scrubber-squeegee',
    name: 'FanKO Window Groove & Crevice Cleaning Scrubber with Squeegee',
    sku: 'FKO-CLN-004',
    category: 'Cleaning Accessories',
    subCategory: 'Specialty Cleaners',
    shortDescription: 'Ergonomic 2-in-1 crevice cleaning tool with washable scouring pad and built-in scraper/squeegee.',
    description: 'Designed specifically for hard-to-reach sliding window tracks, balcony door channels, bathroom tiles, and kitchen sink rims. Features a shaped grip that protects fingers while applying firm pressure, along with a removable, washable microfiber scrub cloth that traps fine dirt and grime.',
    price: 399,
    salePrice: 249,
    stock: 80,
    status: 'in_stock',
    images: ['/assets/aistudio/WhatsApp_Image_2026-09-_cf40f01d.jpeg'],
    specifications: {
      material: 'Ergonomic PP Handle + Microfiber Scrub Cloth',
      dimensions: '14 cm (L) x 8.5 cm (W) x 4.5 cm (H)',
      weight: '85 g',
      color: 'White & Red / Grey Pad',
      careInstructions: 'Rinse pad under running water or machine wash.',
      countryOfOrigin: 'India',
    },
    dimensions: '14 x 8.5 x 4.5 cm',
    material: 'PP Handle & Microfiber Pad',
    shippingInfo: 'Pan-India delivery in 3-5 days. Safe bubble-wrapped packing.',
    seoTitle: 'FanKO Window Track & Crevice Cleaning Brush Tool with Scraper',
    seoDescription: 'Clean sliding window grooves, tile tracks, and tight corners effortlessly with FanKO 2-in-1 Crevice Scrubber.',
    isIncomplete: false,
    featured: false,
    isNewArrival: true,
    rating: 4.6,
    reviewCount: 44,
    createdAt: new Date('2026-09-22').toISOString(),
  },
  {
    id: 'prod-005',
    slug: 'fanko-long-handle-kitchen-dish-pot-cleaning-scrubber-brush',
    name: 'FanKO Long-Handle Kitchen Dish & Pot Cleaning Scrubber Brush',
    sku: 'FKO-CLN-005',
    category: 'Cleaning Accessories',
    subCategory: 'Dish Brushes',
    shortDescription: 'Comfortable long handle dish scrubber with dense, non-scratch bristles and integrated hanging loop.',
    description: 'Make post-cooking dishwashing effortless. The angled head and durable bristles effectively cut through dried gravy, grease, and pot stains without scratching non-stick coatings or glassware. Long cylindrical handle keeps hands away from harsh detergents and oily water.',
    price: 349,
    salePrice: 199,
    stock: 95,
    status: 'in_stock',
    images: ['/assets/aistudio/ChatGPT_Image_Sep_13__2026__08_12_34_PM_f4538541.png'],
    specifications: {
      material: 'Food-Safe Polypropylene & Durable Nylon Bristles',
      dimensions: '25 cm (L) x 6.5 cm (Brush Head) x 5 cm',
      weight: '110 g',
      color: 'White Handle with Slate Gray Bristles',
      careInstructions: 'Rinse after use and hang to air-dry via top hook.',
      countryOfOrigin: 'India',
    },
    dimensions: '25 x 6.5 cm',
    material: 'Polypropylene & Nylon',
    shippingInfo: 'Quick pan-India dispatch within 24 hours.',
    seoTitle: 'FanKO Long Handle Dish Washing Brush | Kitchen Accessories India',
    seoDescription: 'Buy FanKO Long Handle Kitchen Scrubber Brush online in India. Non-scratch bristles safe for non-stick cookware.',
    isIncomplete: false,
    featured: false,
    isNewArrival: false,
    rating: 4.8,
    reviewCount: 31,
    createdAt: new Date('2026-09-24').toISOString(),
  },
  {
    id: 'prod-006',
    slug: 'fanko-3-in-1-dual-soap-dispenser-with-drainage-sponge-caddy',
    name: 'FanKO 3-in-1 Dual Soap Dispenser with Drainage Sponge Caddy',
    sku: 'FKO-KIT-006',
    category: 'Kitchen Essentials',
    subCategory: 'Sink Organizers',
    shortDescription: 'Dual-chamber soap and lotion dispenser with ventilated drainage sponge holder to keep kitchen counters dry.',
    description: 'Transform your kitchen sink area into an organized, hygienic hub. Features a one-touch press pump for liquid dish soap, an auxiliary compartment for hand soap or lotion, and a raised drainage rack for wet sponges so they dry quickly without mildew odor.',
    price: 699,
    salePrice: 499,
    stock: 35,
    status: 'in_stock',
    images: ['/assets/aistudio/WhatsApp_Image_2026-09-13_at_7.38._d592a183.jpeg'],
    specifications: {
      material: 'Heavy-Duty AS Plastic with Anti-Rust Spring Pump',
      dimensions: '22 cm (L) x 10 cm (W) x 16 cm (H)',
      weight: '380 g',
      capacity: '600 ml Soap Chamber + 300 ml Lotion Chamber',
      color: 'Deep Teal & Clear Chamber with Black Pump',
      careInstructions: 'Detachable base for easy rinsing and cleaning.',
      countryOfOrigin: 'India',
    },
    dimensions: '22 x 10 x 16 cm',
    material: 'High-Density AS & PP Plastic',
    shippingInfo: 'Dispatched within 24 hours. Includes free starter sponge.',
    seoTitle: 'FanKO 3-in-1 Kitchen Soap Dispenser with Sponge Holder India',
    seoDescription: 'Clean hands, clean dishes, smarter kitchen. FanKO 3-in-1 dual soap dispenser with self-draining sponge caddy.',
    isIncomplete: false,
    featured: true,
    isNewArrival: false,
    rating: 4.9,
    reviewCount: 67,
    createdAt: new Date('2026-09-25').toISOString(),
  },
  {
    id: 'prod-007',
    slug: 'fanko-precision-pour-glass-oil-vinegar-dispenser-jug',
    name: 'FanKO Precision Pour Glass Oil & Vinegar Dispenser Jug (600ml)',
    sku: 'FKO-KIT-007',
    category: 'Kitchen Essentials',
    subCategory: 'Oil Dispensers',
    shortDescription: 'Heat-resistant borosilicate glass oil cruet with automatic gravity flip lid and drip-free spout.',
    description: 'Upgrade your daily cooking experience with this premium borosilicate glass oil dispenser. The lid opens automatically when tilted and seals shut when set upright, eliminating messy oily caps. Wide neck makes refilling quick without funnels, and the ergonomic handle ensures a steady, comfortable grip.',
    price: 749,
    salePrice: 529,
    stock: 50,
    status: 'in_stock',
    images: ['/assets/aistudio/WhatsApp_Image_2026-09-13_at_7.38.0_7cad6069.jpeg'],
    specifications: {
      material: 'High Borosilicate Glass, BPA-Free PP Cap & Food Silicone',
      dimensions: '21.5 cm (H) x 11.5 cm (Base Diameter)',
      weight: '430 g',
      capacity: '600 ml',
      color: 'Clear Glass with Warm Cream Handle & Cap',
      careInstructions: 'Glass body is dishwasher safe. Rinse lid by hand.',
      countryOfOrigin: 'India',
    },
    dimensions: '21.5 x 11.5 cm (600ml)',
    material: 'Borosilicate Glass & PP',
    shippingInfo: 'Double thermocol protective packaging. Pan-India shipping.',
    seoTitle: 'FanKO Glass Oil Dispenser Bottle 600ml Auto Flip | Kitchen Essentials',
    seoDescription: 'Buy FanKO Precision Pour Borosilicate Glass Oil Bottle. Auto-flip spout, non-drip, ergonomic handle for Indian kitchens.',
    isIncomplete: false,
    featured: true,
    isNewArrival: true,
    rating: 4.9,
    reviewCount: 84,
    createdAt: new Date('2026-09-28').toISOString(),
  },
  {
    id: 'prod-008',
    slug: 'fanko-hydro-lock-fresh-herb-coriander-preserver-capsule',
    name: 'FanKO Hydro-Lock Fresh Herb & Coriander Preserver Capsule',
    sku: 'FKO-STG-008',
    category: 'Storage Solutions',
    subCategory: 'Produce Storage',
    shortDescription: 'Upright hydroponic herb preserver pod that keeps fresh coriander, mint, and asparagus crisp up to 3x longer.',
    description: 'Stop throwing away wilted coriander (dhaniya) and slimy mint (pudina). This tall transparent preserver capsule immerses herb stems in fresh water while allowing foliage to breathe. Fits easily into refrigerator side door compartments. Simply refill water through the base plug every 3-5 days.',
    price: 599,
    salePrice: 399,
    stock: 62,
    status: 'in_stock',
    images: ['/assets/aistudio/ChatGPT_Image_Sep_13__2026__08_08_46_PM_7a07ca46.png'],
    specifications: {
      material: 'BPA-Free Shatterproof Polycarbonate & ABS Base',
      dimensions: '25.5 cm (H) x 8.5 cm (Diameter)',
      weight: '210 g',
      color: 'Clear Pod with Clean White Base',
      careInstructions: 'Hand wash with cool water. Change base water twice weekly.',
      countryOfOrigin: 'India',
    },
    dimensions: '25.5 x 8.5 cm',
    material: 'Food-Safe Polycarbonate',
    shippingInfo: 'Dispatched within 24 hours. Safe pan-India transit.',
    seoTitle: 'FanKO Fresh Herb Keeper Capsule | Refrigerator Storage India',
    seoDescription: 'Keep fresh coriander, mint, and herbs fresh for weeks. FanKO Hydro-Lock Herb Capsule available online.',
    isIncomplete: false,
    featured: true,
    isNewArrival: false,
    rating: 4.8,
    reviewCount: 47,
    createdAt: new Date('2026-09-30').toISOString(),
  },
  {
    id: 'prod-009',
    slug: 'fanko-ergonomic-arch-cushion-no-show-comfort-socks',
    name: 'FanKO Ergonomic Arch Cushion No-Show Comfort Socks (Pair)',
    sku: 'FKO-DAY-009',
    category: 'Daily-use Products',
    subCategory: 'Comfort Accessories',
    shortDescription: 'Low-profile breathable cotton socks with built-in memory arch support cushion to prevent foot strain.',
    description: 'Designed for daily comfort on your feet. These premium no-show socks feature a built-in ergonomic arch pad and padded heel contour that absorbs shock, prevents blisters, and supports flat or fatigued feet inside sneakers, loafers, and daily footwear.',
    price: 499,
    salePrice: 299,
    stock: 120,
    status: 'in_stock',
    images: ['/assets/aistudio/ChatGPT_Image_Sep_13__2026__08_10_58_PM_027bc622.png'],
    specifications: {
      material: 'Combed Cotton, Spandex & High-Density Cushion Foam',
      dimensions: 'Free Size (Fits UK/India Shoe Size 5-10)',
      weight: '60 g',
      color: 'Neutral Beige',
      careInstructions: 'Machine wash delicate cycle in cold water. Air dry.',
      countryOfOrigin: 'India',
    },
    dimensions: 'Free Size (UK 5-10)',
    material: 'Combed Cotton & Cushion Pad',
    shippingInfo: 'Quick Pan-India courier delivery in 3-5 days.',
    seoTitle: 'FanKO Ergonomic Arch Cushion No-Show Socks | Daily Comfort India',
    seoDescription: 'Relieve foot fatigue and prevent shoe bite with FanKO Ergonomic Arch Support Cushion No-Show Socks.',
    isIncomplete: false,
    featured: false,
    isNewArrival: true,
    rating: 4.7,
    reviewCount: 39,
    createdAt: new Date('2026-10-02').toISOString(),
  },
  // Sample catalog entry marked as incomplete per user's instruction:
  // "The organizer products I shared should be sample catalog entries. Use accurate product photos and editable placeholder product details. Do not invent actual prices, dimensions, material specifications, stock, or product claims. Mark incomplete product information clearly in admin."
  {
    id: 'prod-010',
    slug: 'fanko-under-sink-expandable-storage-rack-placeholder',
    name: 'FanKO Modular Under-Sink Expandable Storage Rack (Pending Specs)',
    sku: 'FKO-STG-010',
    category: 'Storage Solutions',
    subCategory: 'Under-Sink Storage',
    shortDescription: 'Upcoming customizable under-sink storage organizer designed around kitchen and bathroom pipework.',
    description: 'Placeholder catalog entry awaiting manufacturer dimensions, material verification, and verified weight limits. Please update details in Admin Dashboard before publishing to store live.',
    price: 999,
    salePrice: 799,
    stock: 10,
    status: 'low_stock',
    images: ['/assets/aistudio/White_Plastic_Makeup_Drawer_Organizer_2efdbdc8.png'],
    specifications: {
      material: 'TBD - Stainless Steel / Plastic',
      dimensions: 'TBD - Expandable',
      countryOfOrigin: 'India',
    },
    shippingInfo: 'Standard 3-5 business days across India.',
    isIncomplete: true,
    incompleteNotes: 'Awaiting exact measurements, load capacity testing, and final product packaging photos.',
    featured: false,
    isNewArrival: false,
    rating: 0,
    reviewCount: 0,
    createdAt: new Date('2026-10-15').toISOString(),
  }
];

const initialCoupons: Coupon[] = [
  {
    code: 'WELCOME10',
    description: '10% off on your first order with FanKO Store',
    discountType: 'percentage',
    discountValue: 10,
    minOrderValue: 499,
    maxDiscount: 150,
    isActive: true,
    usageCount: 142,
  },
  {
    code: 'FREESHIP',
    description: 'Free pan-India delivery on any order above ₹299',
    discountType: 'free_shipping',
    discountValue: 49,
    minOrderValue: 299,
    isActive: true,
    usageCount: 89,
  },
  {
    code: 'FANKO50',
    description: 'Flat ₹50 instant discount on orders above ₹699',
    discountType: 'fixed',
    discountValue: 50,
    minOrderValue: 699,
    isActive: true,
    usageCount: 63,
  },
];

const initialReviews: Review[] = [
  {
    id: 'rev-001',
    productId: 'prod-007',
    productName: 'FanKO Precision Pour Glass Oil & Vinegar Dispenser Jug (600ml)',
    customerName: 'Ananya Sharma',
    city: 'Bengaluru, Karnataka',
    rating: 5,
    title: 'Zero oil drips, totally transformed my cooking counter!',
    comment: 'The auto-flip mechanism works smoothly every single time without dripping oil on the counter or bottle sides. The glass feels sturdy and thick. Highly recommended for daily tadka and cooking.',
    verifiedPurchase: true,
    createdAt: new Date('2026-10-12').toISOString(),
  },
  {
    id: 'rev-002',
    productId: 'prod-006',
    productName: 'FanKO 3-in-1 Dual Soap Dispenser with Drainage Sponge Caddy',
    customerName: 'Rohit Kulkarni',
    city: 'Pune, Maharashtra',
    rating: 5,
    title: 'Very practical sink organizer',
    comment: 'Having the sponge drainage tray together with the pump dispenser saves a lot of sink space. No more smelly wet sponges sitting in water puddles. Looks neat and premium.',
    verifiedPurchase: true,
    createdAt: new Date('2026-10-18').toISOString(),
  },
  {
    id: 'rev-003',
    productId: 'prod-001',
    productName: 'FanKO Ribbed Multi-Slot Vanity & Countertop Organizer',
    customerName: 'Pooja Nair',
    city: 'Kochi, Kerala',
    rating: 5,
    title: 'Super chic ribbed design',
    comment: 'Exactly as shown in pictures. The fluted texture looks like high-end ceramic but it is lightweight and durable. Holds all my daily makeup brushes, lipsticks, and serums in place.',
    verifiedPurchase: true,
    createdAt: new Date('2026-10-21').toISOString(),
  },
  {
    id: 'rev-004',
    productId: 'prod-008',
    productName: 'FanKO Hydro-Lock Fresh Herb & Coriander Preserver Capsule',
    customerName: 'Meera Iyer',
    city: 'Chennai, Tamil Nadu',
    rating: 5,
    title: 'Dhaniya stays green and fresh for almost two weeks',
    comment: 'Before this, my coriander would turn black and rot in plastic bags within 3 days. With this herb capsule, just adding a little water in the bottom kept it fresh and crisp for 12 days. Absolute lifesaver.',
    verifiedPurchase: true,
    createdAt: new Date('2026-10-24').toISOString(),
  },
];

const initialSettings: StoreSettings = {
  storeName: 'FanKO Store',
  tagline: 'Smart Products. Better Living.',
  announcementText: 'Free Pan-India Delivery on Orders Above ₹499 | Cash on Delivery (COD) Available',
  announcementActive: true,
  whatsappNumber: process.env.VITE_WHATSAPP_NUMBER || '919876543210',
  supportEmail: process.env.VITE_SUPPORT_EMAIL || 'support@fankostore.in',
  supportPhone: '+91 98765 43210',
  businessAddress: 'FanKO Store Fulfillment Center, Sector 18, Gurugram, Haryana 122015, India',
  freeShippingThreshold: 499,
  standardShippingFee: 49,
  codEnabled: true,
  codAdvanceAmount: 99,
  upiEnabled: true,
  upiId: 'fankostore@okhdfcbank',
  upiPayeeName: 'FanKO Store',
  customUpiQrUrl: '',
  upiQrMode: 'dynamic',
  currency: 'INR',
};

// Helper for secure password hashing using Node crypto
export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

// Database Manager
class JsonDatabase {
  private data: DatabaseSchema;
  private isWriting = false;

  constructor() {
    this.ensureDataDir();
    this.data = this.load();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        return {
          products: parsed.products || initialProducts,
          categories: parsed.categories || initialCategories,
          orders: parsed.orders || [],
          coupons: parsed.coupons || initialCoupons,
          reviews: parsed.reviews || initialReviews,
          settings: { ...initialSettings, ...(parsed.settings || {}) },
          adminUsers: parsed.adminUsers || [],
          contactMessages: parsed.contactMessages || [],
          newsletterSubscribers: parsed.newsletterSubscribers || [],
        };
      }
    } catch (err) {
      console.error('Error reading db.json, initializing fresh store:', err);
    }

    const fresh: DatabaseSchema = {
      products: initialProducts,
      categories: initialCategories,
      orders: [],
      coupons: initialCoupons,
      reviews: initialReviews,
      settings: initialSettings,
      adminUsers: [],
      contactMessages: [],
      newsletterSubscribers: [],
    };
    this.saveDirect(fresh);
    return fresh;
  }

  private saveDirect(dataToSave: DatabaseSchema) {
    try {
      const tempPath = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(dataToSave, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (e) {
      console.error('Failed to write database file:', e);
    }
  }

  public save() {
    this.saveDirect(this.data);
  }

  // Getters & Setters
  public getProducts(): Product[] {
    return this.data.products;
  }

  public getProductById(id: string): Product | undefined {
    return this.data.products.find((p) => p.id === id || p.slug === id);
  }

  public saveProduct(product: Product): Product {
    const idx = this.data.products.findIndex((p) => p.id === product.id);
    if (idx >= 0) {
      this.data.products[idx] = product;
    } else {
      this.data.products.unshift(product);
    }
    this.save();
    return product;
  }

  public deleteProduct(id: string): boolean {
    const prevLen = this.data.products.length;
    this.data.products = this.data.products.filter((p) => p.id !== id);
    if (this.data.products.length !== prevLen) {
      this.save();
      return true;
    }
    return false;
  }

  public getCategories(): CategoryInfo[] {
    return this.data.categories;
  }

  public getOrders(): Order[] {
    return this.data.orders;
  }

  public getOrderById(id: string): Order | undefined {
    return this.data.orders.find(
      (o) => o.id === id || o.orderNumber.toLowerCase() === id.toLowerCase()
    );
  }

  public saveOrder(order: Order): Order {
    const idx = this.data.orders.findIndex((o) => o.id === order.id);
    if (idx >= 0) {
      this.data.orders[idx] = order;
    } else {
      this.data.orders.unshift(order);
    }
    this.save();
    return order;
  }

  public getCoupons(): Coupon[] {
    return this.data.coupons;
  }

  public getCouponByCode(code: string): Coupon | undefined {
    return this.data.coupons.find(
      (c) => c.code.toUpperCase() === code.trim().toUpperCase() && c.isActive
    );
  }

  public saveCoupon(coupon: Coupon): Coupon {
    const idx = this.data.coupons.findIndex((c) => c.code === coupon.code);
    if (idx >= 0) {
      this.data.coupons[idx] = coupon;
    } else {
      this.data.coupons.push(coupon);
    }
    this.save();
    return coupon;
  }

  public deleteCoupon(code: string): boolean {
    const initialLen = this.data.coupons.length;
    this.data.coupons = this.data.coupons.filter(
      (c) => c.code.toUpperCase() !== code.toUpperCase()
    );
    if (this.data.coupons.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  public getReviews(productId?: string): Review[] {
    if (productId) {
      return this.data.reviews.filter((r) => r.productId === productId);
    }
    return this.data.reviews;
  }

  public addReview(review: Review): Review {
    this.data.reviews.unshift(review);
    // Update product rating and review count
    const prod = this.getProductById(review.productId);
    if (prod) {
      const prodReviews = this.data.reviews.filter((r) => r.productId === prod.id);
      const totalScore = prodReviews.reduce((sum, r) => sum + r.rating, 0);
      prod.rating = Number((totalScore / prodReviews.length).toFixed(1));
      prod.reviewCount = prodReviews.length;
      this.saveProduct(prod);
    }
    this.save();
    return review;
  }

  public getSettings(): StoreSettings {
    return {
      ...initialSettings,
      ...this.data.settings,
      codAdvanceAmount: this.data.settings.codAdvanceAmount ?? 99,
      upiEnabled: this.data.settings.upiEnabled ?? true,
      upiId: this.data.settings.upiId || 'fankostore@okhdfcbank',
      upiPayeeName: this.data.settings.upiPayeeName || 'FanKO Store',
      customUpiQrUrl: this.data.settings.customUpiQrUrl || '',
      upiQrMode: this.data.settings.upiQrMode || 'dynamic',
    };
  }

  public updateSettings(partial: Partial<StoreSettings>): StoreSettings {
    this.data.settings = { ...this.data.settings, ...partial };
    this.save();
    return this.getSettings();
  }

  public getAdminUsers() {
    return this.data.adminUsers;
  }

  public addAdminUser(username: string, passwordHash: string, salt: string) {
    const user = {
      id: `admin-${Date.now()}`,
      username,
      passwordHash,
      salt,
      role: 'admin' as const,
      createdAt: new Date().toISOString(),
    };
    this.data.adminUsers.push(user);
    this.save();
    return user;
  }

  public addContactMessage(msg: {
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
  }) {
    const entry = {
      id: `msg-${Date.now()}`,
      ...msg,
      createdAt: new Date().toISOString(),
    };
    this.data.contactMessages.unshift(entry);
    this.save();
    return entry;
  }

  public addNewsletterSubscriber(email: string, consent: boolean) {
    const existing = this.data.newsletterSubscribers.find((s) => s.email === email);
    if (!existing) {
      this.data.newsletterSubscribers.push({
        email,
        consent,
        subscribedAt: new Date().toISOString(),
      });
      this.save();
    }
    return true;
  }

  // Decrement inventory securely on order placement
  public decrementStock(items: { productId: string; quantity: number }[]): boolean {
    for (const item of items) {
      const product = this.data.products.find((p) => p.id === item.productId);
      if (product) {
        product.stock = Math.max(0, product.stock - item.quantity);
        if (product.stock === 0) {
          product.status = 'out_of_stock';
        } else if (product.stock <= 5) {
          product.status = 'low_stock';
        } else {
          product.status = 'in_stock';
        }
      }
    }
    this.save();
    return true;
  }
}

export const db = new JsonDatabase();
