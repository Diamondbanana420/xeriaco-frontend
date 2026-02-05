import { useQuery } from '@tanstack/react-query';
import { storefrontApiRequest, PRODUCTS_QUERY, PRODUCT_BY_HANDLE_QUERY } from '@/lib/shopify/api';
import { ShopifyProduct } from '@/lib/shopify/types';

export function useShopifyProducts(first: number = 20, query?: string) {
  return useQuery({
    queryKey: ['shopify-products', first, query],
    queryFn: async () => {
      const data = await storefrontApiRequest(PRODUCTS_QUERY, { first, query });
      return (data?.data?.products?.edges || []) as ShopifyProduct[];
    },
  });
}

export function useShopifyProductByHandle(handle: string) {
  return useQuery({
    queryKey: ['shopify-product', handle],
    queryFn: async () => {
      const data = await storefrontApiRequest(PRODUCT_BY_HANDLE_QUERY, { handle });
      if (!data?.data?.productByHandle) return null;
      return { node: data.data.productByHandle } as ShopifyProduct;
    },
    enabled: !!handle,
  });
}
