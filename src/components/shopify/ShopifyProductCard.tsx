import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ShopifyProduct } from "@/lib/shopify/types";
import { useShopifyCartStore } from "@/stores/shopifyCartStore";
import { toast } from "sonner";

interface ShopifyProductCardProps {
  product: ShopifyProduct;
  index?: number;
}

// Generate a compelling selling point based on product data
function getSellingPoint(title: string, description: string | null): string {
  const titleLower = title.toLowerCase();
  const descLower = (description || "").toLowerCase();
  
  // Context-aware selling points
  if (titleLower.includes("premium") || descLower.includes("premium")) {
    return "✨ Premium quality guaranteed";
  }
  if (titleLower.includes("limited") || descLower.includes("limited")) {
    return "🔥 Limited edition - Don't miss out!";
  }
  if (titleLower.includes("new") || descLower.includes("new")) {
    return "🆕 Fresh arrival - Be the first!";
  }
  if (titleLower.includes("exclusive") || descLower.includes("exclusive")) {
    return "💎 Exclusive to our store";
  }
  if (titleLower.includes("best") || descLower.includes("bestseller")) {
    return "⭐ Customer favorite";
  }
  
  // Default rotating selling points
  const defaults = [
    "🚀 Fast & secure delivery",
    "💯 100% authentic product",
    "🎯 Top-rated by customers",
    "✅ Instant digital delivery",
    "🔒 Secure checkout"
  ];
  
  // Use title length as a simple hash for consistency
  return defaults[title.length % defaults.length];
}

export function ShopifyProductCard({ product, index = 0 }: ShopifyProductCardProps) {
  const navigate = useNavigate();
  const addItem = useShopifyCartStore(state => state.addItem);
  const isLoading = useShopifyCartStore(state => state.isLoading);
  const [isAdding, setIsAdding] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const { node } = product;
  const price = node.priceRange.minVariantPrice;
  const image = node.images.edges[0]?.node;
  const firstVariant = node.variants.edges[0]?.node;
  const sellingPoint = getSellingPoint(node.title, node.description);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!firstVariant) return;
    
    setIsAdding(true);
    try {
      await addItem({
        product,
        variantId: firstVariant.id,
        variantTitle: firstVariant.title,
        price: firstVariant.price,
        quantity: 1,
        selectedOptions: firstVariant.selectedOptions || []
      });
      toast.success("Added to cart!", {
        description: node.title,
        position: "top-center"
      });
    } catch (error) {
      toast.error("Failed to add to cart");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="group cursor-pointer"
      onClick={() => navigate(`/shop/${node.handle}`)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image */}
      <div className="relative mb-6 aspect-square overflow-hidden rounded-2xl bg-muted/20">
        {image ? (
          <img
            src={image.url}
            alt={image.altText || node.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingCart className="h-8 w-8 text-muted-foreground/30" />
          </div>
        )}

        {/* Selling Point Tooltip */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="absolute top-3 left-3 right-3 z-10"
            >
              <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-background/95 backdrop-blur-md border border-border/50 shadow-lg">
                <Sparkles className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                <span className="text-xs font-medium text-foreground truncate">
                  {sellingPoint}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Add Button */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          whileHover={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        >
          <Button
            onClick={handleAddToCart}
            disabled={isLoading || isAdding || !firstVariant}
            className="w-full h-10 rounded-full bg-white/90 text-background hover:bg-white backdrop-blur-sm"
          >
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </>
            )}
          </Button>
        </motion.div>
      </div>

      {/* Product Info */}
      <div className="text-center">
        <h3 className="font-medium text-sm mb-1 group-hover:text-primary transition-colors line-clamp-2">
          {node.title}
        </h3>
        <p className="text-lg font-light text-primary">
          {price.currencyCode} {parseFloat(price.amount).toFixed(2)}
        </p>
      </div>
    </motion.div>
  );
}
