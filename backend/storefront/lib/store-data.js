// XeriaCO Store Configuration
export const STORE_CONFIG = {
  name: 'XeriaCO',
  tagline: 'Curated Premium Lifestyle',
  description: 'Discover curated products tailored to your taste — premium lifestyle essentials with AI-powered personalization.',
  currency: 'AUD',
  currencySymbol: '$',
  shopifyDomain: 'xeria-378.myshopify.com',
  // When both frontend and backend are on the same Railway instance,
  // we use relative URLs (same origin) — no CORS needed
  apiUrl: process.env.NEXT_PUBLIC_API_URL || '',
};

// ─── API Client ───────────────────────────────────────
const API_BASE = STORE_CONFIG.apiUrl;

export async function fetchLiveProducts({ limit = 50 } = {}) {
  // Try same-origin API first (both on Railway), then NEXT_PUBLIC_API_URL
  const base = API_BASE || '';
  try {
    const res = await fetch(`${base}/api/store/products?limit=${limit}`, {
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = await res.json();
    const products = (Array.isArray(data) ? data : data.products || []).map(transformProduct);
    return products.length > 0 ? products : FALLBACK_PRODUCTS;
  } catch (err) {
    console.warn('[XeriaCO] Backend unavailable:', err.message);
    return FALLBACK_PRODUCTS;
  }
}

export function getCheckoutUrl(cartItems) {
  const domain = STORE_CONFIG.shopifyDomain;
  const withIds = cartItems.filter(i => i.shopifyVariantId);
  if (withIds.length > 0 && domain) {
    const lines = withIds.map(i => `${i.shopifyVariantId}:${i.qty}`).join(',');
    return `https://${domain}/cart/${lines}`;
  }
  return domain ? `https://${domain}` : '#';
}

function transformProduct(p) {
  return {
    id: p._id || p.id || p.slug,
    slug: p.slug || p.shopifyHandle || '',
    title: p.title || 'Untitled',
    description: p.description || '',
    price: p.sellingPriceAud || p.price || 0,
    compareAt: p.comparePriceAud || null,
    image: p.featuredImage || p.images?.[0]?.src || p.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=90',
    category: p.category || 'General',
    tags: p.tags || [],
    rating: p.analytics?.avgRating || 4.5,
    reviews: p.analytics?.reviewCount || 0,
    stock: p.inventory?.quantity || 100,
    trending: (p.pipeline?.trendScore || 0) > 70,
    shopifyHandle: p.shopifyHandle || null,
    shopifyVariantId: p.shopifyVariantId || p.variants?.[0]?.shopifyVariantId || null,
  };
}

// ─── Fallback catalog (shows when backend has no products) ────
export const FALLBACK_PRODUCTS = [
  { id: 'xco-001', title: 'Noir Wireless Over-Ear Headphones', description: 'Studio-grade wireless headphones with adaptive noise cancellation, 40-hour battery, and buttery soft memory foam cushions.', price: 249.99, compareAt: 329.99, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=90', category: 'Electronics', tags: ['Bestseller', 'Premium Audio'], rating: 4.8, reviews: 2341, stock: 24, trending: true },
  { id: 'xco-002', title: 'Titanium Chrono Smartwatch', description: 'Precision-crafted titanium smartwatch with sapphire crystal display, heart rate monitoring, GPS, and 14-day battery life.', price: 399.99, compareAt: 499.99, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=90', category: 'Electronics', tags: ['New Arrival', 'Limited Edition'], rating: 4.9, reviews: 876, stock: 12, trending: true },
  { id: 'xco-003', title: 'Heritage Organic Cotton Tee', description: 'Luxuriously soft 100% organic Pima cotton t-shirt with a relaxed, contemporary fit.', price: 59.99, compareAt: null, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=90', category: 'Apparel', tags: ['Sustainable', 'Everyday'], rating: 4.7, reviews: 4521, stock: 150, trending: false },
  { id: 'xco-004', title: 'Artisan Leather Bifold Wallet', description: 'Hand-stitched full-grain Italian leather wallet with RFID protection.', price: 89.99, compareAt: 119.99, image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=90', category: 'Accessories', tags: ['Handcrafted', 'RFID Shield'], rating: 4.9, reviews: 1287, stock: 45, trending: true },
  { id: 'xco-005', title: 'Summit 360° Bluetooth Speaker', description: 'IP67 waterproof speaker with 360-degree spatial audio and 18-hour play.', price: 129.99, compareAt: 169.99, image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=90', category: 'Electronics', tags: ['Waterproof', 'Outdoor'], rating: 4.6, reviews: 3102, stock: 67, trending: false },
  { id: 'xco-006', title: 'Glacier Insulated Bottle — 750ml', description: 'Triple-wall vacuum insulated stainless steel bottle. Cold 36h, hot 18h.', price: 54.99, compareAt: null, image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=90', category: 'Home & Garden', tags: ['Eco-Friendly', 'Daily Essential'], rating: 4.8, reviews: 5678, stock: 200, trending: false },
  { id: 'xco-007', title: 'Voyager Weekender Duffel', description: 'Water-resistant waxed canvas duffel with vegetable-tanned leather trim.', price: 189.99, compareAt: 249.99, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=90', category: 'Accessories', tags: ['Travel', 'Premium Materials'], rating: 4.7, reviews: 891, stock: 33, trending: true },
  { id: 'xco-008', title: 'Studio Minimalist Desk Lamp', description: 'Architectural aluminum desk lamp with touch-dimming and wireless charging base.', price: 119.99, compareAt: null, image: 'https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=800&q=90', category: 'Home & Garden', tags: ['Wireless Charging', 'Design Award'], rating: 4.5, reviews: 654, stock: 78, trending: false },
  { id: 'xco-009', title: 'Onyx Running Trainers', description: 'Engineered knit upper with responsive carbon-plate midsole. Ultra-light at 198g.', price: 219.99, compareAt: 279.99, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=90', category: 'Apparel', tags: ['Performance', 'Carbon Plate'], rating: 4.8, reviews: 1543, stock: 19, trending: true },
  { id: 'xco-010', title: 'Terra Ceramic Pour-Over Set', description: 'Handmade ceramic dripper and server set with reusable stainless steel filter.', price: 74.99, compareAt: null, image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=90', category: 'Home & Garden', tags: ['Handmade', 'Coffee Ritual'], rating: 4.9, reviews: 432, stock: 55, trending: false },
  { id: 'xco-011', title: 'Eclipse Polarized Sunglasses', description: 'Plant-based acetate frames with premium polarized lenses. UV400 protection.', price: 159.99, compareAt: 199.99, image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=90', category: 'Accessories', tags: ['Polarized', 'Sustainable'], rating: 4.6, reviews: 2100, stock: 42, trending: false },
  { id: 'xco-012', title: 'Horizon Canvas Backpack', description: 'Heritage waxed canvas backpack with full-grain leather straps and lifetime warranty.', price: 169.99, compareAt: null, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=90', category: 'Accessories', tags: ['Lifetime Warranty', 'Anti-Theft'], rating: 4.8, reviews: 1876, stock: 56, trending: false },
];

// ─── Exports (backwards compatible) ──────────────────────────
export const PRODUCTS = FALLBACK_PRODUCTS;
export const CATEGORIES = [...new Set(FALLBACK_PRODUCTS.map(p => p.category))];
export const COLLECTIONS = [
  { name: 'New Arrivals', slug: 'new-arrivals', description: 'The latest additions to our curated collection', filter: (p) => p.tags.includes('New Arrival') },
  { name: 'Trending Now', slug: 'trending', description: 'What everyone is talking about', filter: (p) => p.trending },
  { name: 'Electronics', slug: 'electronics', description: 'Precision-engineered tech essentials', filter: (p) => p.category === 'Electronics' },
  { name: 'Apparel', slug: 'apparel', description: 'Elevated everyday wear', filter: (p) => p.category === 'Apparel' },
  { name: 'Accessories', slug: 'accessories', description: 'The finishing touches', filter: (p) => p.category === 'Accessories' },
  { name: 'Home & Garden', slug: 'home-garden', description: 'Designed for how you live', filter: (p) => p.category === 'Home & Garden' },
];
