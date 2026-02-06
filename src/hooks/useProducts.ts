import { useQuery } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL || 'https://xeriaco-backend-production.up.railway.app';

export interface Product {
    id: string;
    title: string;
    description: string;
    price: number;
    comparePrice: number | null;
    image: string;
    images: string[];
    category: string;
    slug: string;
    tags: string[];
}

interface ApiProduct {
    _id: string;
    title: string;
    slug: string;
    description: string;
    featuredImage?: string;
    images?: any[];
    sellingPriceAud: number;
    comparePriceAud: number | null;
    category: string;
    tags?: string[];
    aiContent?: { description?: string; shortDescription?: string };
}

function mapProduct(p: ApiProduct): Product {
    const imageUrl = p.featuredImage || (Array.isArray(p.images) && p.images.length > 0
        ? (typeof p.images[0] === 'string' ? p.images[0] : p.images[0]?.url || '')
        : '');

    const imagesList = Array.isArray(p.images)
        ? p.images.map((img: any) => typeof img === 'string' ? img : img?.url || '').filter(Boolean)
        : [];

    return {
        id: p._id,
        title: p.title,
        description: p.aiContent?.description || p.description || '',
        price: p.sellingPriceAud || 0,
        comparePrice: p.comparePriceAud || null,
        image: imageUrl,
        images: imagesList,
        category: p.category || '',
        slug: p.slug || '',
        tags: p.tags || [],
    };
}

async function fetchProducts(limit: number = 50, query?: string): Promise<Product[]> {
    const params = new URLSearchParams();
    params.set('limit', String(limit));
    if (query) params.set('search', query);

    const response = await fetch(`${API_URL}/api/store/products?${params.toString()}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
    }
    const data = await response.json();
    return (data.products || []).map(mapProduct);
}

async function fetchProductBySlug(slug: string): Promise<Product | null> {
    const response = await fetch(`${API_URL}/api/store/products/${slug}`);
    if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Failed to fetch product: ${response.status}`);
    }
    const data = await response.json();
    return data.product ? mapProduct(data.product) : null;
}

export function useProducts(limit: number = 50, query?: string) {
    return useQuery({
        queryKey: ['store-products', limit, query],
        queryFn: () => fetchProducts(limit, query),
    });
}

export function useProductBySlug(slug: string) {
    return useQuery({
        queryKey: ['store-product', slug],
        queryFn: () => fetchProductBySlug(slug),
        enabled: !!slug,
    });
}
