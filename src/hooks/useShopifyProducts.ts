import { useQuery } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL || 'https://xeriaco-backend-production.up.railway.app';

export interface StoreProduct {
    _id: string;
    title: string;
    slug: string;
    description: string;
    descriptionHtml: string;
    category: string;
    tags: string[];
    vendor: string;
    sellingPriceAud: number;
    comparePriceAud: number | null;
    images: { url: string; alt: string; position: number }[];
    variants: { title: string; option1: string; sellingPriceAud: number }[];
    isActive: boolean;
}

async function fetchProducts(limit: number = 20, query?: string): Promise<StoreProduct[]> {
    const params = new URLSearchParams();
    params.set('limit', String(limit));
    if (query) params.set('search', query);

  const response = await fetch(`${API_URL}/api/store/products?${params.toString()}`);
    if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.status}`);
    }
    const data = await response.json();
    return data.products || [];
}

async function fetchProductBySlug(slug: string): Promise<StoreProduct | null> {
    const response = await fetch(`${API_URL}/api/store/products/${slug}`);
    if (!response.ok) {
          if (response.status === 404) return null;
          throw new Error(`Failed to fetch product: ${response.status}`);
    }
    const data = await response.json();
    return data.product || null;
}

export function useShopifyProducts(first: number = 20, query?: string) {
    return useQuery({
          queryKey: ['store-products', first, query],
          queryFn: async () => {
                  return await fetchProducts(first, query);
          },
    });
}

export function useShopifyProductByHandle(handle: string) {
    return useQuery({
          queryKey: ['store-product', handle],
          queryFn: async () => {
                  return await fetchProductBySlug(handle);
          },
          enabled: !!handle,
    });
}
